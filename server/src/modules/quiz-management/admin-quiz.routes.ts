import { Router } from "express";
import { db } from "../../core/db/index.js";
import { quizzes } from "../../core/db/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken, requireAdmin } from "../../core/middleware/auth.middleware.js";
import { validateBody } from "../../core/middleware/validate-request.middleware.js";
import {
  createQuizSchema,
  updateQuizSchema,
  type CreateQuizInput,
  type UpdateQuizInput,
} from "./quiz-management.schema.js";
import { createQuizWithContent, updateQuizContent } from "./quiz-content.service.js";

const router = Router();
router.use(authenticateToken, requireAdmin);

router.post("/quizzes", validateBody(createQuizSchema), async (req, res, next) => {
  try {
    const { quiz, questionCount } = await createQuizWithContent(
      req.body as CreateQuizInput,
      { userId: null, role: "admin" }
    );
    res.status(201).json({ ...quiz, questionCount });
  } catch (err) {
    next(err);
  }
});

router.put("/quizzes/:id", validateBody(updateQuizSchema), async (req, res, next) => {
  try {
    const updated = await updateQuizContent(
      req.params.id,
      req.body as UpdateQuizInput,
      { userId: null, role: "admin" }
    );
    if (!updated) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/quizzes/:id", async (req, res, next) => {
  try {
    const [deleted] = await db
      .delete(quizzes)
      .where(eq(quizzes.id, req.params.id))
      .returning({ id: quizzes.id });

    if (!deleted) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
