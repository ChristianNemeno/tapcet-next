import { Router } from "express";
import { db } from "../db/index.js";
import { quizzes, questions } from "../db/schema.js";
import { eq, count, asc } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";
import type { JwtPayload } from "../middleware/auth.js";

const router = Router();

function canMutate(
  quiz: { createdBy: string | null },
  user: JwtPayload
): boolean {
  return user.role === "admin" || quiz.createdBy === user.userId;
}

// POST /api/quiz — authenticated user creates a quiz with questions
router.post("/quiz", authenticateToken, async (req, res, next) => {
  try {
    const { title, description, timeLimitSeconds, visibility, questions: qs } =
      req.body as {
        title?: string;
        description?: string;
        timeLimitSeconds?: number;
        visibility?: "public" | "draft";
        questions?: Array<{ text: string; options: string[]; answer: number }>;
      };

    if (!title || !qs || qs.length === 0) {
      res.status(400).json({ error: "title and questions are required" });
      return;
    }

    const [quiz] = await db
      .insert(quizzes)
      .values({
        title,
        description: description ?? "",
        timeLimitSeconds: timeLimitSeconds ?? null,
        createdBy: req.user!.userId,
        visibility: visibility ?? "public",
      })
      .returning();

    await db.insert(questions).values(
      qs.map((q, i) => ({
        quizId: quiz.id,
        text: q.text,
        options: q.options,
        answer: q.answer,
        orderIndex: i,
      }))
    );

    res.status(201).json({ ...quiz, questionCount: qs.length });
  } catch (err) {
    next(err);
  }
});

// PUT /api/quiz/:id — creator or admin updates quiz (replaces questions wholesale)
router.put("/quiz/:id", authenticateToken, async (req, res, next) => {
  try {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, req.params.id))
      .limit(1);

    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    if (!canMutate(quiz, req.user!)) {
      res.status(403).json({ error: "Not authorized to edit this quiz" });
      return;
    }

    const { title, description, timeLimitSeconds, visibility, questions: qs } =
      req.body as {
        title?: string;
        description?: string;
        timeLimitSeconds?: number | null;
        visibility?: "public" | "draft";
        questions?: Array<{ text: string; options: string[]; answer: number }>;
      };

    const [updated] = await db
      .update(quizzes)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(timeLimitSeconds !== undefined && { timeLimitSeconds }),
        ...(visibility !== undefined && { visibility }),
      })
      .where(eq(quizzes.id, req.params.id))
      .returning();

    if (qs && qs.length > 0) {
      await db.delete(questions).where(eq(questions.quizId, req.params.id));
      await db.insert(questions).values(
        qs.map((q, i) => ({
          quizId: req.params.id,
          text: q.text,
          options: q.options,
          answer: q.answer,
          orderIndex: i,
        }))
      );
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/quiz/:id — creator or admin deletes quiz
router.delete("/quiz/:id", authenticateToken, async (req, res, next) => {
  try {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, req.params.id))
      .limit(1);

    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    if (!canMutate(quiz, req.user!)) {
      res.status(403).json({ error: "Not authorized to delete this quiz" });
      return;
    }

    await db.delete(quizzes).where(eq(quizzes.id, req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

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
        questionCount: count(questions.id),
      })
      .from(quizzes)
      .leftJoin(questions, eq(questions.quizId, quizzes.id))
      .where(eq(quizzes.createdBy, req.user!.userId))
      .groupBy(quizzes.id)
      .orderBy(asc(quizzes.title));

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
