import { db } from "../db/index.js";
import { quizRatings } from "../db/schema.js";
import { eq, avg, count, and } from "drizzle-orm";

export interface RatingSummary {
  averageRating: number | null;
  totalRatings: number;
  userRating: number | null;
}

function parseAverage(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const num = typeof raw === "number" ? raw : parseFloat(String(raw));
  if (Number.isNaN(num)) return null;
  return Math.round(num * 10) / 10;
}

export async function getRatingStats(
  quizId: string
): Promise<{ averageRating: number | null; totalRatings: number }> {
  const [agg] = await db
    .select({ average: avg(quizRatings.rating), total: count(quizRatings.id) })
    .from(quizRatings)
    .where(eq(quizRatings.quizId, quizId));

  return {
    averageRating: parseAverage(agg?.average),
    totalRatings: agg?.total ?? 0,
  };
}

export async function getUserRating(quizId: string, userId: string): Promise<number | null> {
  const [row] = await db
    .select({ rating: quizRatings.rating })
    .from(quizRatings)
    .where(and(eq(quizRatings.quizId, quizId), eq(quizRatings.userId, userId)))
    .limit(1);
  return row?.rating ?? null;
}

export async function getRatingSummary(
  quizId: string,
  userId?: string
): Promise<RatingSummary> {
  const stats = await getRatingStats(quizId);
  const userRating = userId ? await getUserRating(quizId, userId) : null;
  return { ...stats, userRating };
}

export async function upsertRating(
  quizId: string,
  userId: string,
  rating: number
): Promise<void> {
  const now = new Date();
  await db
    .insert(quizRatings)
    .values({ userId, quizId, rating, ratedAt: now })
    .onConflictDoUpdate({
      target: [quizRatings.userId, quizRatings.quizId],
      set: { rating, ratedAt: now },
    });
}
