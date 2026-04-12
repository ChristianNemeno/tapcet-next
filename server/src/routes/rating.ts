import { Router } from "express";
import { db } from "../db/index.js";
import { quizRatings } from "../db/schema.js";
import { eq, avg, count, and } from "drizzle-orm";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = Router();

async function getRatingData(quizId: string, userId?: string) {
  const [agg] = await db
    .select({ average: avg(quizRatings.rating), total: count(quizRatings.id) })
    .from(quizRatings)
    .where(eq(quizRatings.quizId, quizId));

  let userRating: number | null = null;
  if (userId) {
    const [row] = await db
      .select({ rating: quizRatings.rating })
      .from(quizRatings)
      .where(and(eq(quizRatings.quizId, quizId), eq(quizRatings.userId, userId)))
      .limit(1);
    userRating = row?.rating ?? null;
  }

  return {
    averageRating: agg?.average != null ? Math.round(parseFloat(agg.average as unknown as string) * 10) / 10 : null,
    totalRatings: agg?.total ?? 0,
    userRating,
  };
}

// GET /api/quiz/:id/rating
router.get("/quiz/:id/rating", optionalAuth, async (req, res, next) => {
  try {
    const data = await getRatingData(req.params.id, req.user?.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/quiz/:id/rate
router.post("/quiz/:id/rate", authenticateToken, async (req, res, next) => {
  try {
    const { rating } = req.body as { rating?: number };
    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: "rating must be an integer between 1 and 5" });
      return;
    }

    await db
      .insert(quizRatings)
      .values({
        userId: req.user!.userId,
        quizId: req.params.id,
        rating,
        ratedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [quizRatings.userId, quizRatings.quizId],
        set: { rating, ratedAt: new Date() },
      });

    const data = await getRatingData(req.params.id, req.user!.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
