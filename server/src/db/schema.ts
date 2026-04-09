import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  real,
  timestamp,
  pgEnum,
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
