import { db } from "../../core/db/index.js";
import { quizzes, questions, sections } from "../../core/db/schema.js";
import type { CreateQuizInput, UpdateQuizInput } from "./quiz-management.schema.js";
import { eq } from "drizzle-orm";

export interface AuthorContext {
  userId: string | null;
  role: "user" | "admin";
}

type QuizRow = typeof quizzes.$inferSelect;

function buildInsertValues(input: CreateQuizInput, author: AuthorContext) {
  const hasSections = !!(input.sections && input.sections.length > 0);
  return {
    title: input.title,
    description: input.description ?? "",
    timeLimitSeconds: hasSections ? null : (input.timeLimitSeconds ?? null),
    createdBy: author.userId,
    visibility: input.visibility ?? "public",
    examTags: input.examTags ?? [],
    subject: input.subject ?? null,
    topic: input.topic ?? null,
    isOfficial: author.role === "admin" ? (input.isOfficial ?? false) : false,
    quizType: input.quizType ?? "standard",
    scoringMode: input.scoringMode ?? "standard",
    penaltyFraction: input.penaltyFraction ?? 0.25,
  };
}

async function insertQuestionsAndSections(
  quizId: string,
  input: Pick<CreateQuizInput, "questions" | "sections">
): Promise<number> {
  if (input.sections && input.sections.length > 0) {
    let total = 0;
    for (const [si, sec] of input.sections.entries()) {
      const [section] = await db
        .insert(sections)
        .values({
          quizId,
          title: sec.title || `Section ${si + 1}`,
          timeLimitSeconds: sec.timeLimitSeconds ?? null,
          orderIndex: si,
        })
        .returning();
      if (sec.questions.length > 0) {
        await db.insert(questions).values(
          sec.questions.map((q, i) => ({
            quizId,
            sectionId: section.id,
            text: q.text,
            options: q.options,
            answer: q.answer,
            orderIndex: i,
          }))
        );
        total += sec.questions.length;
      }
    }
    return total;
  }
  if (input.questions && input.questions.length > 0) {
    await db.insert(questions).values(
      input.questions.map((q, i) => ({
        quizId,
        text: q.text,
        options: q.options,
        answer: q.answer,
        orderIndex: i,
      }))
    );
    return input.questions.length;
  }
  return 0;
}

export async function createQuizWithContent(
  input: CreateQuizInput,
  author: AuthorContext
): Promise<{ quiz: QuizRow; questionCount: number }> {
  const [quiz] = await db
    .insert(quizzes)
    .values(buildInsertValues(input, author))
    .returning();
  const questionCount = await insertQuestionsAndSections(quiz.id, input);
  return { quiz, questionCount };
}

export async function updateQuizContent(
  quizId: string,
  input: UpdateQuizInput,
  author: AuthorContext
): Promise<QuizRow> {
  const [updated] = await db
    .update(quizzes)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.timeLimitSeconds !== undefined && { timeLimitSeconds: input.timeLimitSeconds }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      ...(input.examTags !== undefined && { examTags: input.examTags }),
      ...(input.subject !== undefined && { subject: input.subject }),
      ...(input.topic !== undefined && { topic: input.topic }),
      ...(input.isOfficial !== undefined && author.role === "admin" && { isOfficial: input.isOfficial }),
      ...(input.quizType !== undefined && { quizType: input.quizType }),
      ...(input.scoringMode !== undefined && { scoringMode: input.scoringMode }),
      ...(input.penaltyFraction !== undefined && { penaltyFraction: input.penaltyFraction }),
    })
    .where(eq(quizzes.id, quizId))
    .returning();

  if (input.sections && input.sections.length > 0) {
    await db.delete(questions).where(eq(questions.quizId, quizId));
    await db.delete(sections).where(eq(sections.quizId, quizId));
    await insertQuestionsAndSections(quizId, input);
  } else if (input.questions && input.questions.length > 0) {
    await db.delete(questions).where(eq(questions.quizId, quizId));
    await insertQuestionsAndSections(quizId, input);
  }

  return updated;
}
