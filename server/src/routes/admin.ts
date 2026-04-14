import { Router } from "express";
import { db } from "../db/index.js";
import { quizzes } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateRequest.js";
import {
  createQuizSchema,
  updateQuizSchema,
  type CreateQuizInput,
  type UpdateQuizInput,
} from "../schemas/quiz.js";
import { createQuizWithContent, updateQuizContent } from "../services/quizService.js";

const router = Router();
router.use(authenticateToken, requireAdmin);

// POST /api/admin/quizzes — create quiz with questions (or sections)
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

// PUT /api/admin/quizzes/:id — update quiz metadata
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

// DELETE /api/admin/quizzes/:id — delete quiz (cascades to questions + leaderboard)
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
