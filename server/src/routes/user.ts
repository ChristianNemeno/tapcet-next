import { Router } from "express";
import { db } from "../db/index.js";
import { users, quizzes, questions, collections, collectionQuizzes, leaderboard, quizRatings } from "../db/schema.js";
import { eq, and, count, avg, asc } from "drizzle-orm";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/user/:id/profile — public creator profile
router.get("/user/:id/profile", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_RE.test(id)) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [user] = await db
      .select({ id: users.id, name: users.name, joinedAt: users.createdAt })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userQuizzes = await db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        description: quizzes.description,
        timeLimitSeconds: quizzes.timeLimitSeconds,
        examTags: quizzes.examTags,
        subject: quizzes.subject,
        topic: quizzes.topic,
        isOfficial: quizzes.isOfficial,
        scoringMode: quizzes.scoringMode,
        penaltyFraction: quizzes.penaltyFraction,
        quizType: quizzes.quizType,
        createdBy: quizzes.createdBy,
        creatorName: users.name,
        questionCount: count(questions.id),
      })
      .from(quizzes)
      .leftJoin(questions, eq(questions.quizId, quizzes.id))
      .leftJoin(users, eq(users.id, quizzes.createdBy))
      .where(and(eq(quizzes.createdBy, id), eq(quizzes.visibility, "public")))
      .groupBy(quizzes.id, quizzes.examTags, quizzes.subject, quizzes.topic, users.name, quizzes.createdBy)
      .orderBy(asc(quizzes.title));

    const userCollections = await db
      .select({
        id: collections.id,
        title: collections.title,
        description: collections.description,
        examTag: collections.examTag,
        isOfficial: collections.isOfficial,
        quizCount: count(collectionQuizzes.quizId),
      })
      .from(collections)
      .leftJoin(collectionQuizzes, eq(collectionQuizzes.collectionId, collections.id))
      .where(and(eq(collections.createdBy, id), eq(collections.visibility, "public")))
      .groupBy(collections.id)
      .orderBy(asc(collections.title));

    const [attemptsRow] = await db
      .select({ total: count(leaderboard.id) })
      .from(leaderboard)
      .innerJoin(quizzes, eq(quizzes.id, leaderboard.quizId))
      .where(eq(quizzes.createdBy, id));

    const [ratingRow] = await db
      .select({ avg: avg(quizRatings.rating) })
      .from(quizRatings)
      .innerJoin(quizzes, eq(quizzes.id, quizRatings.quizId))
      .where(eq(quizzes.createdBy, id));

    const averageRating = ratingRow.avg
      ? parseFloat(parseFloat(ratingRow.avg).toFixed(1))
      : null;

    res.json({
      id: user.id,
      name: user.name,
      joinedAt: user.joinedAt,
      quizCount: userQuizzes.length,
      collectionCount: userCollections.length,
      totalAttempts: attemptsRow.total ?? 0,
      averageRating,
      quizzes: userQuizzes,
      collections: userCollections,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
