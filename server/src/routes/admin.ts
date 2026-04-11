import { Router } from "express";
import { db } from "../db/index.js";
import { quizzes, questions } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken, requireAdmin);

// POST /api/admin/quizzes — create quiz with questions
router.post("/quizzes", async (req, res, next) => {
  try {
    const { title, description, timeLimitSeconds, examTags, subject, topic, isOfficial, questions: qs } = req.body as {
      title?: string;
      description?: string;
      timeLimitSeconds?: number;
      examTags?: string[];
      subject?: string | null;
      topic?: string | null;
      isOfficial?: boolean;
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
        examTags: examTags ?? [],
        subject: subject ?? null,
        topic: topic ?? null,
        isOfficial: isOfficial ?? false,
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

    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/quizzes/:id — update quiz metadata
router.put("/quizzes/:id", async (req, res, next) => {
  try {
    const { title, description, timeLimitSeconds, examTags, subject, topic, isOfficial } = req.body as {
      title?: string;
      description?: string;
      timeLimitSeconds?: number | null;
      examTags?: string[];
      subject?: string | null;
      topic?: string | null;
      isOfficial?: boolean;
    };

    const [updated] = await db
      .update(quizzes)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(timeLimitSeconds !== undefined && { timeLimitSeconds }),
        ...(examTags !== undefined && { examTags }),
        ...(subject !== undefined && { subject }),
        ...(topic !== undefined && { topic }),
        ...(isOfficial !== undefined && { isOfficial }),
      })
      .where(eq(quizzes.id, req.params.id))
      .returning();

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
