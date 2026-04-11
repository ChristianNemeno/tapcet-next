CREATE TYPE "public"."scoring_mode" AS ENUM('standard', 'penalized');
--> statement-breakpoint
ALTER TABLE "quizzes"
  ADD COLUMN "scoring_mode" "scoring_mode" NOT NULL DEFAULT 'standard';
--> statement-breakpoint
ALTER TABLE "quizzes"
  ADD COLUMN "penalty_fraction" real NOT NULL DEFAULT 0.25;
--> statement-breakpoint
ALTER TABLE "leaderboard"
  ADD COLUMN "penalty_points" real NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE "sections" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "quiz_id"            uuid NOT NULL,
  "title"              text NOT NULL,
  "time_limit_seconds" integer,
  "order_index"        integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "sections"
  ADD CONSTRAINT "sections_quiz_id_quizzes_id_fk"
  FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "questions"
  ADD COLUMN "section_id" uuid;
--> statement-breakpoint
ALTER TABLE "questions"
  ADD CONSTRAINT "questions_section_id_sections_id_fk"
  FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
