import { Router } from "express";
import { db } from "../db/index.js";
import { quizzes, questions, leaderboard, users, sections } from "../db/schema.js";
import { eq, count, sum, desc, asc, and, arrayContains, isNotNull } from "drizzle-orm";
import { optionalAuth, authenticateToken } from "../middleware/auth.js";
import { MAX_NICKNAME_LENGTH } from "../constants/limits.js";
import { validateBody } from "../middleware/validateRequest.js";
import { submitQuizSchema, csvImportSchema, type SubmitQuizInput, type CsvImportRow } from "../schemas/quiz.js";
import { gradeQuizAttempt, enqueueMissedForReview } from "../services/gradingService.js";

const router = Router();

// GET /api/quizzes — list public quizzes with question count and creator name
router.get("/quizzes", async (req, res, next) => {
  try {
    const { exam, subject, official, quizType } = req.query as { exam?: string; subject?: string; official?: string; quizType?: string };
    const conditions = [eq(quizzes.visibility, "public")];
    if (exam) conditions.push(arrayContains(quizzes.examTags, [exam]));
    if (subject) conditions.push(eq(quizzes.subject, subject));
    if (official === "true") conditions.push(eq(quizzes.isOfficial, true));
    if (quizType === "mock_exam") conditions.push(eq(quizzes.quizType, "mock_exam"));
    else if (quizType === "standard") conditions.push(eq(quizzes.quizType, "standard"));

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
        scoringMode: quizzes.scoringMode,
        penaltyFraction: quizzes.penaltyFraction,
        quizType: quizzes.quizType,
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
        scoringMode: quizzes.scoringMode,
        penaltyFraction: quizzes.penaltyFraction,
        quizType: quizzes.quizType,
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

    const secs = await db
      .select({
        id: sections.id,
        title: sections.title,
        timeLimitSeconds: sections.timeLimitSeconds,
        orderIndex: sections.orderIndex,
      })
      .from(sections)
      .where(eq(sections.quizId, quiz.id))
      .orderBy(asc(sections.orderIndex));

    const qs = await db
      .select({
        id: questions.id,
        text: questions.text,
        options: questions.options,
        orderIndex: questions.orderIndex,
        sectionId: questions.sectionId,
      })
      .from(questions)
      .where(eq(questions.quizId, quiz.id))
      .orderBy(asc(questions.orderIndex));

    const sectionsWithQuestions = secs.map((s) => ({
      ...s,
      questions: qs.filter((q) => q.sectionId === s.id),
    }));

    res.json({ ...quiz, sections: sectionsWithQuestions, questions: qs });
  } catch (err) {
    next(err);
  }
});

// POST /api/quiz/:id/submit — grade answers server-side
router.post("/quiz/:id/submit", optionalAuth, validateBody(submitQuizSchema), async (req, res, next) => {
  try {
    const { answers, nickname } = req.body as SubmitQuizInput;

    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, req.params.id))
      .limit(1);

    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    const { results, score, total, percentage, penaltyPoints } = await gradeQuizAttempt(
      quiz.id,
      answers,
      quiz.scoringMode,
      quiz.penaltyFraction
    );

    if (req.user?.userId) {
      const missedIds = results.filter((r) => !r.correct).map((r) => r.questionId);
      await enqueueMissedForReview(req.user.userId, missedIds);
    }

    const displayNickname = nickname?.trim().slice(0, MAX_NICKNAME_LENGTH) || "Anonymous";

    await db.insert(leaderboard).values({
      quizId: quiz.id,
      userId: req.user?.userId ?? null,
      nickname: displayNickname,
      score,
      total,
      percentage,
      penaltyPoints,
    });

    res.json({
      score, total, percentage, results, quizId: quiz.id, nickname: displayNickname,
      scoringMode: quiz.scoringMode,
      penaltyPoints,
      penaltyFraction: quiz.penaltyFraction,
    });
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

// POST /api/quiz/import/validate — validate parsed CSV rows, return parsed questions + per-row errors
router.post(
  "/quiz/import/validate",
  authenticateToken,
  validateBody(csvImportSchema),
  (req, res) => {
    const { rows } = req.body as { rows: CsvImportRow[] };

    const ANSWER_MAP: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

    const parsed: { text: string; options: [string, string, string, string]; answer: number }[] = [];
    const errors: { row: number; message: string }[] = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const rowErrors: string[] = [];

      if (!row.question.trim()) rowErrors.push("question is empty");
      if (!row.option_a.trim()) rowErrors.push("option_a is empty");
      if (!row.option_b.trim()) rowErrors.push("option_b is empty");
      if (!row.option_c.trim()) rowErrors.push("option_c is empty");
      if (!row.option_d.trim()) rowErrors.push("option_d is empty");

      const answerKey = row.answer.trim().toUpperCase();
      const answerIdx = ANSWER_MAP[answerKey];
      if (answerIdx === undefined) {
        rowErrors.push(`answer must be A, B, C, or D (got "${row.answer}")`);
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, message: rowErrors.join("; ") });
      } else {
        parsed.push({
          text: row.question.trim(),
          options: [
            row.option_a.trim(),
            row.option_b.trim(),
            row.option_c.trim(),
            row.option_d.trim(),
          ],
          answer: answerIdx!,
        });
      }
    });

    res.json({ parsed, errors });
  }
);

export default router;
