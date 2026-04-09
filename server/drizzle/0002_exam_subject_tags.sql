ALTER TABLE "quizzes" ADD COLUMN "exam_tags" text[] NOT NULL DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "topic" text;
