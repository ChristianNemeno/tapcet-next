import { Router } from "express";
import { db } from "../db/index.js";
import { quizzes, questions, leaderboard, users } from "../db/schema.js";
import { eq, count, desc, asc } from "drizzle-orm";
import { optionalAuth, authenticateToken } from "../middleware/auth.js";

const router = Router();

// GET /api/quizzes — list public quizzes with question count and creator name
router.get("/quizzes", async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        description: quizzes.description,
        timeLimitSeconds: quizzes.timeLimitSeconds,
        questionCount: count(questions.id),
        creatorName: users.name,
      })
      .from(quizzes)
      .leftJoin(questions, eq(questions.quizId, quizzes.id))
      .leftJoin(users, eq(users.id, quizzes.createdBy))
      .where(eq(quizzes.visibility, "public"))
      .groupBy(quizzes.id, users.name)
      .orderBy(asc(quizzes.title));

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

export default router;
