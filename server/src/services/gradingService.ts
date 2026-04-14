import { db } from "../db/index.js";
import { questions, reviewQueue } from "../db/schema.js";
import { eq, asc, sql } from "drizzle-orm";
import { intervalAfterMiss } from "../config/spacedRepetition.js";

export interface GradedResult {
  questionId: string;
  correct: boolean;
  selectedAnswer: number;
  correctAnswer: number;
}

export interface GradingOutcome {
  results: GradedResult[];
  score: number;
  total: number;
  percentage: number;
  penaltyPoints: number;
}

export async function gradeQuizAttempt(
  quizId: string,
  answers: Record<string, number>,
  scoringMode: "standard" | "penalized",
  penaltyFraction: number
): Promise<GradingOutcome> {
  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.quizId, quizId))
    .orderBy(asc(questions.orderIndex));

  const results: GradedResult[] = qs.map((q) => {
    const selected = answers[q.id] ?? -1;
    return {
      questionId: q.id,
      correct: selected === q.answer,
      selectedAnswer: selected,
      correctAnswer: q.answer,
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const wrongCount = results.filter((r) => !r.correct && r.selectedAnswer !== -1).length;
  const penaltyPoints = scoringMode === "penalized" ? wrongCount * penaltyFraction : 0;
  const score = correctCount;
  const total = qs.length;
  const percentage = total > 0 ? ((score - penaltyPoints) / total) * 100 : 0;

  return { results, score, total, percentage, penaltyPoints };
}

export async function enqueueMissedForReview(
  userId: string,
  missedQuestionIds: string[]
): Promise<void> {
  if (missedQuestionIds.length === 0) return;
  const now = new Date();
  const interval = intervalAfterMiss();
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  await db
    .insert(reviewQueue)
    .values(
      missedQuestionIds.map((questionId) => ({
        userId,
        questionId,
        nextReviewAt: nextReview,
        intervalDays: interval,
        missCount: 1,
        updatedAt: now,
      }))
    )
    .onConflictDoUpdate({
      target: [reviewQueue.userId, reviewQueue.questionId],
      set: {
        intervalDays: interval,
        nextReviewAt: nextReview,
        missCount: sql`${reviewQueue.missCount} + 1`,
        updatedAt: now,
      },
    });
}
