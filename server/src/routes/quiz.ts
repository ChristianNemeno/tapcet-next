import { Router } from "express";
import { db } from "../db/index.js";
import { quizzes, questions, leaderboard, users, reviewQueue } from "../db/schema.js";
import { eq, count, sum, desc, asc, and, arrayContains, isNotNull, sql } from "drizzle-orm";
import { optionalAuth, authenticateToken } from "../middleware/auth.js";

const router = Router();

// GET /api/quizzes — list public quizzes with question count and creator name
router.get("/quizzes", async (req, res, next) => {
  try {
    const { exam, subject, official } = req.query as { exam?: string; subject?: string; official?: string };
    const conditions = [eq(quizzes.visibility, "public")];
    if (exam) conditions.push(arrayContains(quizzes.examTags, [exam]));
    if (subject) conditions.push(eq(quizzes.subject, subject));
    if (official === "true") conditions.push(eq(quizzes.isOfficial, true));

    const rows = await db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        description: quizzes.description,
        timeLimitSeconds: quizzes.timeLimitSeconds,
        examTags: quizzes.examTags,
        subject: quizzes.subject,
        topic: quizzes.topic,
        isOfficial: quizzes.isOfficial,
        questionCount: count(questions.id),
        creatorName: users.name,
      })
      .from(quizzes)
      .leftJoin(questions, eq(questions.quizId, quizzes.id))
      .leftJoin(users, eq(users.id, quizzes.createdBy))
      .where(and(...conditions))
      .groupBy(quizzes.id, quizzes.examTags, quizzes.subject, quizzes.topic, users.name)
      .orderBy(desc(quizzes.isOfficial), asc(quizzes.title));

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/quiz/:id — single quiz with questions (no answer column)
router.get("/quiz/:id", async (req, res, next) => {
  try {
    const [quiz] = await db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        description: quizzes.description,
        timeLimitSeconds: quizzes.timeLimitSeconds,
        examTags: quizzes.examTags,
        subject: quizzes.subject,
        topic: quizzes.topic,
        isOfficial: quizzes.isOfficial,
        createdBy: quizzes.createdBy,
        visibility: quizzes.visibility,
        creatorName: users.name,
      })
      .from(quizzes)
      .leftJoin(users, eq(users.id, quizzes.createdBy))
      .where(eq(quizzes.id, req.params.id))
      .limit(1);

    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    const qs = await db
      .select({
        id: questions.id,
        text: questions.text,
        options: questions.options,
        orderIndex: questions.orderIndex,
      })
      .from(questions)
      .where(eq(questions.quizId, quiz.id))
      .orderBy(asc(questions.orderIndex));

    res.json({ ...quiz, questions: qs });
  } catch (err) {
    next(err);
  }
});

// POST /api/quiz/:id/submit — grade answers server-side
router.post("/quiz/:id/submit", optionalAuth, async (req, res, next) => {
  try {
    const { answers, nickname } = req.body as {
      answers?: Record<string, number>;
      nickname?: string;
    };

    if (!answers || typeof answers !== "object") {
      res.status(400).json({ error: "answers object is required" });
      return;
    }

    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, req.params.id))
      .limit(1);

    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    const qs = await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quiz.id))
      .orderBy(asc(questions.orderIndex));

    const results = qs.map((q) => {
      const selected = answers[q.id] ?? -1;
      return {
        questionId: q.id,
        correct: selected === q.answer,
        selectedAnswer: selected,
        correctAnswer: q.answer,
      };
    });

    const score = results.filter((r) => r.correct).length;
    const total = qs.length;
    const percentage = total > 0 ? (score / total) * 100 : 0;

    // Upsert missed questions into review queue (authenticated users only)
    if (req.user?.userId) {
      const wrongIds = results.filter((r) => !r.correct).map((r) => r.questionId);
      if (wrongIds.length > 0) {
        const now = new Date();
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + 1);
        await db
          .insert(reviewQueue)
          .values(
            wrongIds.map((questionId) => ({
              userId: req.user!.userId,
              questionId,
              nextReviewAt: nextReview,
              intervalDays: 1,
              missCount: 1,
              updatedAt: now,
            }))
          )
          .onConflictDoUpdate({
            target: [reviewQueue.userId, reviewQueue.questionId],
            set: {
              intervalDays: 1,
              nextReviewAt: nextReview,
              missCount: sql`${reviewQueue.missCount} + 1`,
              updatedAt: now,
            },
          });
      }
    }

    const displayNickname =
      nickname?.trim().slice(0, 20) || "Anonymous";

    await db.insert(leaderboard).values({
      quizId: quiz.id,
      userId: req.user?.userId ?? null,
      nickname: displayNickname,
      score,
      total,
      percentage,
    });

    res.json({ score, total, percentage, results, quizId: quiz.id, nickname: displayNickname });
  } catch (err) {
    next(err);
  }
});

// GET /api/quiz/:id/leaderboard — top 10
router.get("/quiz/:id/leaderboard", async (req, res, next) => {
  try {
    const entries = await db
      .select({
        id: leaderboard.id,
        nickname: leaderboard.nickname,
        score: leaderboard.score,
        total: leaderboard.total,
        percentage: leaderboard.percentage,
        completedAt: leaderboard.completedAt,
      })
      .from(leaderboard)
      .where(eq(leaderboard.quizId, req.params.id))
      .orderBy(
        desc(leaderboard.percentage),
        desc(leaderboard.score),
        asc(leaderboard.completedAt)
      )
      .limit(10);

    res.json(entries);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard — user's attempt history (auth required)
router.get("/dashboard", authenticateToken, async (req, res, next) => {
  try {
    const entries = await db
      .select({
        id: leaderboard.id,
        quizId: leaderboard.quizId,
        quizTitle: quizzes.title,
        score: leaderboard.score,
        total: leaderboard.total,
        percentage: leaderboard.percentage,
        completedAt: leaderboard.completedAt,
      })
      .from(leaderboard)
      .innerJoin(quizzes, eq(quizzes.id, leaderboard.quizId))
      .where(eq(leaderboard.userId, req.user!.userId))
      .orderBy(desc(leaderboard.completedAt));

    res.json(entries);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/weakness — per-subject accuracy aggregated from attempts (auth required)
router.get("/dashboard/weakness", authenticateToken, async (req, res, next) => {
  try {
    const rows = await db
      .select({
        subject: quizzes.subject,
        totalCorrect: sum(leaderboard.score),
        totalQuestions: sum(leaderboard.total),
        attempts: count(leaderboard.id),
      })
      .from(leaderboard)
      .innerJoin(quizzes, eq(quizzes.id, leaderboard.quizId))
      .where(
        and(
          eq(leaderboard.userId, req.user!.userId),
          isNotNull(quizzes.subject)
        )
      )
      .groupBy(quizzes.subject);

    const result = rows
      .filter((r) => r.subject !== null)
      .map((r) => {
        const correct = parseInt(r.totalCorrect ?? "0", 10);
        const total = parseInt(r.totalQuestions ?? "0", 10);
        const percentage = total > 0 ? (correct / total) * 100 : 0;
        return {
          subject: r.subject as string,
          totalCorrect: correct,
          totalQuestions: total,
          attempts: r.attempts,
          percentage,
        };
      })
      .sort((a, b) => a.percentage - b.percentage);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
