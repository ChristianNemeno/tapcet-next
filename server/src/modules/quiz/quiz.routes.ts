import { Router } from "express";
import { db } from "../../core/db/index.js";
import { quizzes, questions, leaderboard, users, sections } from "../../core/db/schema.js";
import { eq, count, desc, asc, and, arrayContains } from "drizzle-orm";
import { optionalAuth, authenticateToken } from "../../core/middleware/auth.middleware.js";
import { MAX_NICKNAME_LENGTH } from "../../core/constants/limits.js";
import { validateBody } from "../../core/middleware/validate-request.middleware.js";
import { submitQuizSchema, csvImportSchema, type SubmitQuizInput, type CsvImportRow } from "./quiz.schema.js";
import { gradeQuizAttempt, enqueueMissedForReview } from "./quiz.service.js";

const router = Router();

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
        createdBy: quizzes.createdBy,
      })
      .from(quizzes)
      .leftJoin(questions, eq(questions.quizId, quizzes.id))
      .leftJoin(users, eq(users.id, quizzes.createdBy))
      .where(and(...conditions))
      .groupBy(quizzes.id, quizzes.examTags, quizzes.subject, quizzes.topic, users.name, quizzes.createdBy)
      .orderBy(desc(quizzes.isOfficial), asc(quizzes.title));

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

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
