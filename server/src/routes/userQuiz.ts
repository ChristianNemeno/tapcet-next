import { Router } from "express";
import { db } from "../db/index.js";
import { quizzes, questions, sections } from "../db/schema.js";
import { eq, count, asc } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateRequest.js";
import { requireOwnership } from "../middleware/authorize.js";
import {
  createQuizSchema,
  updateQuizSchema,
  type CreateQuizInput,
  type UpdateQuizInput,
} from "../schemas/quiz.js";
import { createQuizWithContent, updateQuizContent } from "../services/quizService.js";

const router = Router();

async function loadQuiz(req: { params: Record<string, string> }) {
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, req.params.id))
    .limit(1);
  return quiz ?? null;
}

// POST /api/quiz — authenticated user creates a quiz with questions
router.post("/quiz", authenticateToken, validateBody(createQuizSchema), async (req, res, next) => {
  try {
    const { quiz, questionCount } = await createQuizWithContent(
      req.body as CreateQuizInput,
      { userId: req.user!.userId, role: req.user!.role }
    );
    res.status(201).json({ ...quiz, questionCount });
  } catch (err) {
    next(err);
  }
});

// PUT /api/quiz/:id — creator or admin updates quiz (replaces questions wholesale)
router.put(
  "/quiz/:id",
  authenticateToken,
  validateBody(updateQuizSchema),
  requireOwnership(loadQuiz, "quiz"),
  async (req, res, next) => {
    try {
      const updated = await updateQuizContent(
        req.params.id,
        req.body as UpdateQuizInput,
        { userId: req.user!.userId, role: req.user!.role }
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/quiz/:id — creator or admin deletes quiz
router.delete(
  "/quiz/:id",
  authenticateToken,
  requireOwnership(loadQuiz, "quiz"),
  async (req, res, next) => {
    try {
      await db.delete(quizzes).where(eq(quizzes.id, req.params.id));
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/quiz/:id/edit — creator or admin fetches a quiz with answers for editing
router.get(
  "/quiz/:id/edit",
  authenticateToken,
  requireOwnership(loadQuiz, "quiz"),
  async (req, res, next) => {
    try {
      const secs = await db
        .select({
          id: sections.id,
          title: sections.title,
          timeLimitSeconds: sections.timeLimitSeconds,
          orderIndex: sections.orderIndex,
        })
        .from(sections)
        .where(eq(sections.quizId, req.params.id))
        .orderBy(asc(sections.orderIndex));

      const qs = await db
        .select({
          id: questions.id,
          text: questions.text,
          options: questions.options,
          answer: questions.answer,
          orderIndex: questions.orderIndex,
          sectionId: questions.sectionId,
        })
        .from(questions)
        .where(eq(questions.quizId, req.params.id))
        .orderBy(asc(questions.orderIndex));

      const sectionsWithQuestions = secs.map((s) => ({
        ...s,
        questions: qs.filter((q) => q.sectionId === s.id),
      }));

      const quiz = (req as typeof req & { quiz: typeof quizzes.$inferSelect }).quiz;
      res.json({ ...quiz, sections: sectionsWithQuestions, questions: qs });
    } catch (err) {
      next(err);
    }
  }
);

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
