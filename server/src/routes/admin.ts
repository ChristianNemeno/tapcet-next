import { Router } from "express";
import { db } from "../db/index.js";
import { quizzes, questions, sections } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken, requireAdmin);

// POST /api/admin/quizzes — create quiz with questions (or sections)
router.post("/quizzes", async (req, res, next) => {
  try {
    const {
      title, description, timeLimitSeconds, examTags, subject, topic, isOfficial,
      quizType, scoringMode, penaltyFraction,
      questions: qs, sections: secs,
    } = req.body as {
      title?: string;
      description?: string;
      timeLimitSeconds?: number;
      examTags?: string[];
      subject?: string | null;
      topic?: string | null;
      isOfficial?: boolean;
      quizType?: "standard" | "mock_exam";
      scoringMode?: "standard" | "penalized";
      penaltyFraction?: number;
      questions?: Array<{ text: string; options: string[]; answer: number }>;
      sections?: Array<{
        title: string;
        timeLimitSeconds?: number | null;
        questions: Array<{ text: string; options: string[]; answer: number }>;
      }>;
    };

    const hasSections = secs && secs.length > 0;
    const hasQuestions = qs && qs.length > 0;
    if (!title || (!hasSections && !hasQuestions)) {
      res.status(400).json({ error: "title and questions (or sections with questions) are required" });
      return;
    }

    const [quiz] = await db
      .insert(quizzes)
      .values({
        title,
        description: description ?? "",
        timeLimitSeconds: hasSections ? null : (timeLimitSeconds ?? null),
        examTags: examTags ?? [],
        subject: subject ?? null,
        topic: topic ?? null,
        isOfficial: isOfficial ?? false,
        quizType: quizType ?? "standard",
        scoringMode: scoringMode ?? "standard",
        penaltyFraction: penaltyFraction ?? 0.25,
      })
      .returning();

    if (hasSections) {
      let totalQuestions = 0;
      for (const [si, sec] of secs!.entries()) {
        const [section] = await db.insert(sections).values({
          quizId: quiz.id,
          title: sec.title || `Section ${si + 1}`,
          timeLimitSeconds: sec.timeLimitSeconds ?? null,
          orderIndex: si,
        }).returning();
        if (sec.questions && sec.questions.length > 0) {
          await db.insert(questions).values(
            sec.questions.map((q, i) => ({
              quizId: quiz.id,
              sectionId: section.id,
              text: q.text,
              options: q.options,
              answer: q.answer,
              orderIndex: i,
            }))
          );
          totalQuestions += sec.questions.length;
        }
      }
      res.status(201).json({ ...quiz, questionCount: totalQuestions });
    } else {
      await db.insert(questions).values(
        qs!.map((q, i) => ({
          quizId: quiz.id,
          text: q.text,
          options: q.options,
          answer: q.answer,
          orderIndex: i,
        }))
      );
      res.status(201).json({ ...quiz, questionCount: qs!.length });
    }
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/quizzes/:id — update quiz metadata
router.put("/quizzes/:id", async (req, res, next) => {
  try {
    const {
      title, description, timeLimitSeconds, examTags, subject, topic, isOfficial,
      quizType, scoringMode, penaltyFraction,
    } = req.body as {
      title?: string;
      description?: string;
      timeLimitSeconds?: number | null;
      examTags?: string[];
      subject?: string | null;
      topic?: string | null;
      isOfficial?: boolean;
      quizType?: "standard" | "mock_exam";
      scoringMode?: "standard" | "penalized";
      penaltyFraction?: number;
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
        ...(quizType !== undefined && { quizType }),
        ...(scoringMode !== undefined && { scoringMode }),
        ...(penaltyFraction !== undefined && { penaltyFraction }),
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
