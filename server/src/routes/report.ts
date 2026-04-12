import { Router } from "express";
import { db } from "../db/index.js";
import { questionReports, questions, quizzes, users } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = Router();

// POST /api/question/:id/report — flag a question (auth required)
router.post("/question/:id/report", authenticateToken, async (req, res, next) => {
  try {
    const { quizId, reportType, comment } = req.body as {
      quizId?: string;
      reportType?: "incorrect" | "ambiguous" | "duplicate";
      comment?: string;
    };

    if (!quizId || !reportType) {
      res.status(400).json({ error: "quizId and reportType are required" });
      return;
    }
    if (!["incorrect", "ambiguous", "duplicate"].includes(reportType)) {
      res.status(400).json({ error: "reportType must be incorrect, ambiguous, or duplicate" });
      return;
    }

    // Verify the question belongs to the given quiz
    const [q] = await db
      .select({ id: questions.id })
      .from(questions)
      .where(and(eq(questions.id, req.params.id), eq(questions.quizId, quizId)))
      .limit(1);

    if (!q) {
      res.status(404).json({ error: "Question not found for this quiz" });
      return;
    }

    const [report] = await db
      .insert(questionReports)
      .values({
        userId: req.user!.userId,
        questionId: req.params.id,
        quizId,
        reportType,
        comment: comment?.trim().slice(0, 500) ?? "",
      })
      .returning();

    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports — list reports (admin only)
router.get("/admin/reports", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { status, reportType, page } = req.query as {
      status?: string;
      reportType?: string;
      page?: string;
    };

    const pageNum = Math.max(1, parseInt(page ?? "1", 10));
    const limit = 25;
    const offset = (pageNum - 1) * limit;

    const conditions = [];
    if (status && ["open", "reviewing", "resolved"].includes(status)) {
      conditions.push(eq(questionReports.status, status as "open" | "reviewing" | "resolved"));
    }
    if (reportType && ["incorrect", "ambiguous", "duplicate"].includes(reportType)) {
      conditions.push(eq(questionReports.reportType, reportType as "incorrect" | "ambiguous" | "duplicate"));
    }

    const rows = await db
      .select({
        id: questionReports.id,
        reportType: questionReports.reportType,
        status: questionReports.status,
        comment: questionReports.comment,
        createdAt: questionReports.createdAt,
        resolvedAt: questionReports.resolvedAt,
        questionId: questionReports.questionId,
        questionText: questions.text,
        quizId: questionReports.quizId,
        quizTitle: quizzes.title,
        reporterName: users.name,
        resolvedBy: questionReports.resolvedBy,
      })
      .from(questionReports)
      .innerJoin(questions, eq(questions.id, questionReports.questionId))
      .innerJoin(quizzes, eq(quizzes.id, questionReports.quizId))
      .innerJoin(users, eq(users.id, questionReports.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(questionReports.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/report/:id — update report status (admin only)
router.put("/admin/report/:id", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body as { status?: "open" | "reviewing" | "resolved" };

    if (!status || !["open", "reviewing", "resolved"].includes(status)) {
      res.status(400).json({ error: "status must be open, reviewing, or resolved" });
      return;
    }

    const [updated] = await db
      .update(questionReports)
      .set({
        status,
        ...(status === "resolved" && {
          resolvedAt: new Date(),
          resolvedBy: req.user!.userId,
        }),
      })
      .where(eq(questionReports.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
