import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  real,
  timestamp,
  pgEnum,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const visibilityEnum = pgEnum("visibility", ["public", "draft"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  timeLimitSeconds: integer("time_limit_seconds"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  visibility: visibilityEnum("visibility").notNull().default("public"),
  examTags: text("exam_tags").array().notNull().default([]),
  subject: text("subject"),
  topic: text("topic"),
  isOfficial: boolean("is_official").notNull().default(false),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  options: jsonb("options").notNull().$type<string[]>(),
  answer: integer("answer").notNull(),
  orderIndex: integer("order_index").notNull(),
});

export const leaderboard = pgTable("leaderboard", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  nickname: text("nickname").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  percentage: real("percentage").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const collections = pgTable("collections", {
  id:          uuid("id").primaryKey().defaultRandom(),
  title:       text("title").notNull(),
  description: text("description").notNull().default(""),
  examTag:     text("exam_tag"),
  visibility:  visibilityEnum("visibility").notNull().default("public"),
  isOfficial:  boolean("is_official").notNull().default(false),
  createdBy:   uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

export const collectionQuizzes = pgTable(
  "collection_quizzes",
  {
    id:           uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
    quizId:       uuid("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    orderIndex:   integer("order_index").notNull().default(0),
  },
  (t) => [uniqueIndex("collection_quizzes_unique_idx").on(t.collectionId, t.quizId)]
);

export const collectionFollows = pgTable(
  "collection_follows",
  {
    id:           uuid("id").primaryKey().defaultRandom(),
    userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
    createdAt:    timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("collection_follows_unique_idx").on(t.userId, t.collectionId)]
);

export const reviewQueue = pgTable(
  "review_queue",
  {
    id:           uuid("id").primaryKey().defaultRandom(),
    userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    questionId:   uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    nextReviewAt: timestamp("next_review_at").notNull(),
    intervalDays: integer("interval_days").notNull().default(1),
    missCount:    integer("miss_count").notNull().default(1),
    createdAt:    timestamp("created_at").notNull().defaultNow(),
    updatedAt:    timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("review_queue_user_question_idx").on(t.userId, t.questionId)]
);
