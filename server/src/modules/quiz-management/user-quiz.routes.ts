import { Router } from "express";
import { db } from "../../core/db/index.js";
import { quizzes, questions, sections } from "../../core/db/schema.js";
import { eq, count, asc } from "drizzle-orm";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { validateBody } from "../../core/middleware/validate-request.middleware.js";
import { requireOwnership } from "../../core/middleware/authorize.middleware.js";
import {
  createQuizSchema,
  updateQuizSchema,
  type CreateQuizInput,
  type UpdateQuizInput,
} from "./quiz-management.schema.js";
import { createQuizWithContent, updateQuizContent } from "./quiz-content.service.js";

const router = Router();

async function loadQuiz(req: { params: Record<string, string> }) {
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, req.params.id))
    .limit(1);
  return quiz ?? null;
}

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
