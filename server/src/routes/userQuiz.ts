import { Router } from "express";
import { db } from "../db/index.js";
import { quizzes, questions, sections } from "../db/schema.js";
import { eq, count, asc } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";
import type { JwtPayload } from "../middleware/auth.js";

const router = Router();

function canMutate(
  quiz: { createdBy: string | null },
  user: JwtPayload
): boolean {
  return user.role === "admin" || quiz.createdBy === user.userId;
}

// POST /api/quiz — authenticated user creates a quiz with questions
router.post("/quiz", authenticateToken, async (req, res, next) => {
  try {
    const {
      title, description, timeLimitSeconds, visibility, examTags, subject, topic, isOfficial,
      scoringMode, penaltyFraction,
      questions: qs, sections: secs,
    } = req.body as {
      title?: string;
      description?: string;
      timeLimitSeconds?: number;
      visibility?: "public" | "draft";
      examTags?: string[];
      subject?: string | null;
      topic?: string | null;
      isOfficial?: boolean;
      scoringMode?: "standard" | "penalized";
      penaltyFraction?: number;
      questions?: Array<{ text: string; options: string[]; answer: number }>;
      sections?: Array<{
        title: string;
        timeLimitSeconds?: number | null;
        questions: Array<{ text: string; options: string[]; answer: number }>;
      }>;
    };

    const hasQuestions = (qs && qs.length > 0) || (secs && secs.length > 0);
    if (!title || !hasQuestions) {
      res.status(400).json({ error: "title and questions (or sections with questions) are required" });
      return;
    }

    const [quiz] = await db
      .insert(quizzes)
      .values({
        title,
        description: description ?? "",
        timeLimitSeconds: secs && secs.length > 0 ? null : (timeLimitSeconds ?? null),
        createdBy: req.user!.userId,
        visibility: visibility ?? "public",
        examTags: examTags ?? [],
        subject: subject ?? null,
        topic: topic ?? null,
        isOfficial: req.user!.role === "admin" ? (isOfficial ?? false) : false,
        scoringMode: scoringMode ?? "standard",
        penaltyFraction: penaltyFraction ?? 0.25,
      })
      .returning();

    if (secs && secs.length > 0) {
      let totalQuestions = 0;
      for (const [si, sec] of secs.entries()) {
        const [section] = await db.insert(sections).values({
          quizId: quiz.id,
          title: sec.title || `Section ${si + 1}`,
          timeLimitSeconds: sec.timeLimitSeconds ?? null,
          orderIndex: si,
        }).returning();
        if (sec.questions && sec.questions.length > 0) {
          await db.insert(questions).values(
            sec.questions.map((q, i) => ({
              quizId: quiz.id,
              sectionId: section.id,
              text: q.text,
              options: q.options,
              answer: q.answer,
              orderIndex: i,
            }))
          );
          totalQuestions += sec.questions.length;
        }
      }
      res.status(201).json({ ...quiz, questionCount: totalQuestions });
    } else {
      await db.insert(questions).values(
        qs!.map((q, i) => ({
          quizId: quiz.id,
          text: q.text,
          options: q.options,
          answer: q.answer,
          orderIndex: i,
        }))
      );
      res.status(201).json({ ...quiz, questionCount: qs!.length });
    }
  } catch (err) {
    next(err);
  }
});

// PUT /api/quiz/:id — creator or admin updates quiz (replaces questions wholesale)
router.put("/quiz/:id", authenticateToken, async (req, res, next) => {
  try {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, req.params.id))
      .limit(1);

    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    if (!canMutate(quiz, req.user!)) {
      res.status(403).json({ error: "Not authorized to edit this quiz" });
      return;
    }

    const {
      title, description, timeLimitSeconds, visibility, examTags, subject, topic, isOfficial,
      scoringMode, penaltyFraction,
      questions: qs, sections: secs,
    } = req.body as {
      title?: string;
      description?: string;
      timeLimitSeconds?: number | null;
      visibility?: "public" | "draft";
      examTags?: string[];
      subject?: string | null;
      topic?: string | null;
      isOfficial?: boolean;
      scoringMode?: "standard" | "penalized";
      penaltyFraction?: number;
      questions?: Array<{ text: string; options: string[]; answer: number }>;
      sections?: Array<{
        title: string;
        timeLimitSeconds?: number | null;
        questions: Array<{ text: string; options: string[]; answer: number }>;
      }>;
    };

    const [updated] = await db
      .update(quizzes)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(timeLimitSeconds !== undefined && { timeLimitSeconds }),
        ...(visibility !== undefined && { visibility }),
        ...(examTags !== undefined && { examTags }),
        ...(subject !== undefined && { subject }),
        ...(topic !== undefined && { topic }),
        ...(isOfficial !== undefined && req.user!.role === "admin" && { isOfficial }),
        ...(scoringMode !== undefined && { scoringMode }),
        ...(penaltyFraction !== undefined && { penaltyFraction }),
      })
      .where(eq(quizzes.id, req.params.id))
      .returning();

    if (secs && secs.length > 0) {
      // Full replace: delete questions first (so we can safely delete sections)
      await db.delete(questions).where(eq(questions.quizId, req.params.id));
      await db.delete(sections).where(eq(sections.quizId, req.params.id));
      for (const [si, sec] of secs.entries()) {
        const [section] = await db.insert(sections).values({
          quizId: req.params.id,
          title: sec.title || `Section ${si + 1}`,
          timeLimitSeconds: sec.timeLimitSeconds ?? null,
          orderIndex: si,
        }).returning();
        if (sec.questions && sec.questions.length > 0) {
          await db.insert(questions).values(
            sec.questions.map((q, i) => ({
              quizId: req.params.id,
              sectionId: section.id,
              text: q.text,
              options: q.options,
              answer: q.answer,
              orderIndex: i,
            }))
          );
        }
      }
    } else if (qs && qs.length > 0) {
      await db.delete(questions).where(eq(questions.quizId, req.params.id));
      await db.insert(questions).values(
        qs.map((q, i) => ({
          quizId: req.params.id,
          text: q.text,
          options: q.options,
          answer: q.answer,
          orderIndex: i,
        }))
      );
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/quiz/:id — creator or admin deletes quiz
router.delete("/quiz/:id", authenticateToken, async (req, res, next) => {
  try {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, req.params.id))
      .limit(1);

    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    if (!canMutate(quiz, req.user!)) {
      res.status(403).json({ error: "Not authorized to delete this quiz" });
      return;
    }

    await db.delete(quizzes).where(eq(quizzes.id, req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /api/my-quizzes — all quizzes created by the authenticated user
router.get("/my-quizzes", authenticateToken, async (req, res, next) => {
  try {
    const rows = await db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        description: quizzes.description,
        timeLimitSeconds: quizzes.timeLimitSeconds,
        visibility: quizzes.visibility,
        examTags: quizzes.examTags,
        subject: quizzes.subject,
        topic: quizzes.topic,
        questionCount: count(questions.id),
      })
      .from(quizzes)
      .leftJoin(questions, eq(questions.quizId, quizzes.id))
      .where(eq(quizzes.createdBy, req.user!.userId))
      .groupBy(quizzes.id, quizzes.examTags, quizzes.subject, quizzes.topic)
      .orderBy(asc(quizzes.title));

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
