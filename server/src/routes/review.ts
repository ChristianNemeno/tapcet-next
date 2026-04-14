import { Router } from "express";
import { db } from "../db/index.js";
import { reviewQueue, questions, quizzes } from "../db/schema.js";
import { eq, and, lte, count } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";
import { nextIntervalAfterCorrect, intervalAfterMiss } from "../config/spacedRepetition.js";
import { validateBody } from "../middleware/validateRequest.js";
import { answerReviewSchema, type AnswerReviewInput } from "../schemas/review.js";

const router = Router();

// GET /api/review-queue — due items with full question data (answer field excluded)
router.get("/review-queue", authenticateToken, async (req, res, next) => {
  try {
    const now = new Date();

    const rows = await db
      .select({
        queueId:         reviewQueue.id,
        questionId:      reviewQueue.questionId,
        intervalDays:    reviewQueue.intervalDays,
        missCount:       reviewQueue.missCount,
        nextReviewAt:    reviewQueue.nextReviewAt,
        questionText:    questions.text,
        questionOptions: questions.options,
        quizId:          quizzes.id,
        quizTitle:       quizzes.title,
        subject:         quizzes.subject,
      })
      .from(reviewQueue)
      .innerJoin(questions, eq(questions.id, reviewQueue.questionId))
      .innerJoin(quizzes,   eq(quizzes.id,   questions.quizId))
      .where(
        and(
          eq(reviewQueue.userId, req.user!.userId),
          lte(reviewQueue.nextReviewAt, now)
        )
      )
      .orderBy(reviewQueue.nextReviewAt);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/review-queue/stats — { dueToday, total } for dashboard badge
router.get("/review-queue/stats", authenticateToken, async (req, res, next) => {
  try {
    const now = new Date();

    const [dueRow] = await db
      .select({ due: count(reviewQueue.id) })
      .from(reviewQueue)
      .where(
        and(
          eq(reviewQueue.userId, req.user!.userId),
          lte(reviewQueue.nextReviewAt, now)
        )
      );

    const [totalRow] = await db
      .select({ total: count(reviewQueue.id) })
      .from(reviewQueue)
      .where(eq(reviewQueue.userId, req.user!.userId));

    res.json({
      dueToday: dueRow?.due ?? 0,
      total:    totalRow?.total ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/review-queue/answer — grade answer, advance or reset interval
router.post("/review-queue/answer", authenticateToken, validateBody(answerReviewSchema), async (req, res, next) => {
  try {
    const { questionId, selectedAnswer } = req.body as AnswerReviewInput;

    const [entry] = await db
      .select()
      .from(reviewQueue)
      .where(
        and(
          eq(reviewQueue.userId, req.user!.userId),
          eq(reviewQueue.questionId, questionId)
        )
      )
      .limit(1);

    if (!entry) {
      res.status(404).json({ error: "Review queue entry not found" });
      return;
    }

    const [question] = await db
      .select({ answer: questions.answer })
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    const correct = selectedAnswer === question.answer;
    const now = new Date();

    const newIntervalDays = correct ? nextIntervalAfterCorrect(entry.intervalDays) : intervalAfterMiss();
    const newMissCount    = correct ? entry.missCount : entry.missCount + 1;

    const nextReviewAt = new Date(now);
    nextReviewAt.setDate(nextReviewAt.getDate() + newIntervalDays);

    await db
      .update(reviewQueue)
      .set({
        intervalDays: newIntervalDays,
        missCount:    newMissCount,
        nextReviewAt,
        updatedAt:    now,
      })
      .where(
        and(
          eq(reviewQueue.userId, req.user!.userId),
          eq(reviewQueue.questionId, questionId)
        )
      );

    res.json({
      correct,
      correctAnswer:   question.answer,
      newIntervalDays,
      nextReviewAt:    nextReviewAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
