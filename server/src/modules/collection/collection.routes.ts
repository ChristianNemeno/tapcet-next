import { Router } from "express";
import { db } from "../../core/db/index.js";
import {
  collections,
  collectionQuizzes,
  collectionFollows,
  quizzes,
  questions,
  users,
} from "../../core/db/schema.js";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";
import { authenticateToken, optionalAuth } from "../../core/middleware/auth.middleware.js";
import type { JwtPayload } from "../../core/middleware/auth.middleware.js";
import { validateBody } from "../../core/middleware/validate-request.middleware.js";
import {
  createCollectionSchema,
  updateCollectionSchema,
  type CreateCollectionInput,
  type UpdateCollectionInput,
} from "./collection.schema.js";

const router = Router();

function canMutate(
  col: { createdBy: string },
  user: JwtPayload
): boolean {
  return user.role === "admin" || col.createdBy === user.userId;
}

router.get("/collections", async (req, res, next) => {
  try {
    const { exam, official } = req.query as { exam?: string; official?: string };

    const rows = await db
      .select({
        id:           collections.id,
        title:        collections.title,
        description:  collections.description,
        examTag:      collections.examTag,
        isOfficial:   collections.isOfficial,
        visibility:   collections.visibility,
        createdAt:    collections.createdAt,
        creatorName:  users.name,
        quizCount:    sql<number>`count(distinct ${collectionQuizzes.id})::int`,
        followerCount: sql<number>`count(distinct ${collectionFollows.id})::int`,
      })
      .from(collections)
      .leftJoin(users,              eq(users.id,              collections.createdBy))
      .leftJoin(collectionQuizzes,  eq(collectionQuizzes.collectionId, collections.id))
      .leftJoin(collectionFollows,  eq(collectionFollows.collectionId, collections.id))
      .where(
        and(
          eq(collections.visibility, "public"),
          exam     ? eq(collections.examTag, exam)        : undefined,
          official === "true" ? eq(collections.isOfficial, true) : undefined,
        )
      )
      .groupBy(collections.id, users.name)
      .orderBy(desc(collections.isOfficial), asc(collections.title));

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/collection/:id", optionalAuth, async (req, res, next) => {
  try {
    const [row] = await db
      .select({
        id:           collections.id,
        title:        collections.title,
        description:  collections.description,
        examTag:      collections.examTag,
        isOfficial:   collections.isOfficial,
        visibility:   collections.visibility,
        createdBy:    collections.createdBy,
        createdAt:    collections.createdAt,
        creatorName:  users.name,
        followerCount: sql<number>`count(distinct ${collectionFollows.id})::int`,
      })
      .from(collections)
      .leftJoin(users,             eq(users.id,              collections.createdBy))
      .leftJoin(collectionFollows, eq(collectionFollows.collectionId, collections.id))
      .where(eq(collections.id, req.params.id))
      .groupBy(collections.id, users.name)
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }

    let isFollowing = false;
    if (req.user?.userId) {
      const [follow] = await db
        .select({ id: collectionFollows.id })
        .from(collectionFollows)
        .where(
          and(
            eq(collectionFollows.userId,       req.user.userId),
            eq(collectionFollows.collectionId, req.params.id)
          )
        )
        .limit(1);
      isFollowing = !!follow;
    }

    const quizRows = await db
      .select({
        orderIndex:       collectionQuizzes.orderIndex,
        id:               quizzes.id,
        title:            quizzes.title,
        description:      quizzes.description,
        timeLimitSeconds: quizzes.timeLimitSeconds,
        examTags:         quizzes.examTags,
        subject:          quizzes.subject,
        topic:            quizzes.topic,
        isOfficial:       quizzes.isOfficial,
        questionCount:    count(questions.id),
        creatorName:      users.name,
      })
      .from(collectionQuizzes)
      .innerJoin(quizzes,    eq(quizzes.id,       collectionQuizzes.quizId))
      .leftJoin(questions,   eq(questions.quizId, quizzes.id))
      .leftJoin(users,       eq(users.id,         quizzes.createdBy))
      .where(eq(collectionQuizzes.collectionId, req.params.id))
      .groupBy(
        collectionQuizzes.orderIndex,
        quizzes.id,
        quizzes.examTags,
        quizzes.subject,
        quizzes.topic,
        users.name
      )
      .orderBy(asc(collectionQuizzes.orderIndex));

    res.json({ ...row, isFollowing, quizzes: quizRows });
  } catch (err) {
    next(err);
  }
});

router.post("/collection", authenticateToken, validateBody(createCollectionSchema), async (req, res, next) => {
  try {
    const { title, description, examTag, visibility, isOfficial } = req.body as CreateCollectionInput;

    const [col] = await db
      .insert(collections)
      .values({
        title,
        description: description ?? "",
        examTag:     examTag ?? null,
        visibility:  visibility ?? "public",
        isOfficial:  req.user!.role === "admin" ? (isOfficial ?? false) : false,
        createdBy:   req.user!.userId,
      })
      .returning();

    res.status(201).json({ ...col, quizCount: 0, followerCount: 0 });
  } catch (err) {
    next(err);
  }
});

router.put("/collection/:id", authenticateToken, validateBody(updateCollectionSchema), async (req, res, next) => {
  try {
    const [col] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, req.params.id))
      .limit(1);

    if (!col) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    if (!canMutate(col, req.user!)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const { title, description, examTag, visibility, isOfficial } = req.body as UpdateCollectionInput;

    const [updated] = await db
      .update(collections)
      .set({
        ...(title       !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(examTag     !== undefined && { examTag }),
        ...(visibility  !== undefined && { visibility }),
        ...(isOfficial  !== undefined && req.user!.role === "admin" && { isOfficial }),
      })
      .where(eq(collections.id, req.params.id))
      .returning();

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/collection/:id", authenticateToken, async (req, res, next) => {
  try {
    const [col] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, req.params.id))
      .limit(1);

    if (!col) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    if (!canMutate(col, req.user!)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    await db.delete(collections).where(eq(collections.id, req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.get("/my-collections", authenticateToken, async (req, res, next) => {
  try {
    const rows = await db
      .select({
        id:          collections.id,
        title:       collections.title,
        description: collections.description,
        examTag:     collections.examTag,
        isOfficial:  collections.isOfficial,
        visibility:  collections.visibility,
        createdAt:   collections.createdAt,
        quizCount:   sql<number>`count(distinct ${collectionQuizzes.id})::int`,
      })
      .from(collections)
      .leftJoin(collectionQuizzes, eq(collectionQuizzes.collectionId, collections.id))
      .where(eq(collections.createdBy, req.user!.userId))
      .groupBy(collections.id)
      .orderBy(asc(collections.title));

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/collection/:id/follow", authenticateToken, async (req, res, next) => {
  try {
    const [col] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.id, req.params.id))
      .limit(1);

    if (!col) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }

    const [existing] = await db
      .select()
      .from(collectionFollows)
      .where(
        and(
          eq(collectionFollows.userId,       req.user!.userId),
          eq(collectionFollows.collectionId, req.params.id)
        )
      )
      .limit(1);

    if (existing) {
      await db.delete(collectionFollows).where(eq(collectionFollows.id, existing.id));
    } else {
      await db.insert(collectionFollows).values({
        userId:       req.user!.userId,
        collectionId: req.params.id,
      });
    }

    const [countRow] = await db
      .select({ c: count() })
      .from(collectionFollows)
      .where(eq(collectionFollows.collectionId, req.params.id));

    res.json({ following: !existing, followerCount: countRow?.c ?? 0 });
  } catch (err) {
    next(err);
  }
});

router.post("/collection/:id/quizzes/:quizId", authenticateToken, async (req, res, next) => {
  try {
    const [col] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, req.params.id))
      .limit(1);

    if (!col) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    if (!canMutate(col, req.user!)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const [quiz] = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.id, req.params.quizId))
      .limit(1);

    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    const [countRow] = await db
      .select({ c: count() })
      .from(collectionQuizzes)
      .where(eq(collectionQuizzes.collectionId, req.params.id));

    await db
      .insert(collectionQuizzes)
      .values({
        collectionId: req.params.id,
        quizId:       req.params.quizId,
        orderIndex:   countRow?.c ?? 0,
      })
      .onConflictDoNothing();

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/collection/:id/quizzes/:quizId", authenticateToken, async (req, res, next) => {
  try {
    const [col] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, req.params.id))
      .limit(1);

    if (!col) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    if (!canMutate(col, req.user!)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    await db
      .delete(collectionQuizzes)
      .where(
        and(
          eq(collectionQuizzes.collectionId, req.params.id),
          eq(collectionQuizzes.quizId,       req.params.quizId)
        )
      );

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
