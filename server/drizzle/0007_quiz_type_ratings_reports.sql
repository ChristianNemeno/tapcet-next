CREATE TYPE "public"."quiz_type" AS ENUM('standard', 'mock_exam');
--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "quiz_type" "quiz_type" NOT NULL DEFAULT 'standard';
--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('incorrect', 'ambiguous', 'duplicate');
--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewing', 'resolved');
--> statement-breakpoint
CREATE TABLE "quiz_ratings" (
  "id"       uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"  uuid NOT NULL,
  "quiz_id"  uuid NOT NULL,
  "rating"   integer NOT NULL,
  "rated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "quiz_ratings"
  ADD CONSTRAINT "quiz_ratings_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_ratings"
  ADD CONSTRAINT "quiz_ratings_quiz_id_quizzes_id_fk"
  FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_ratings_user_quiz_idx" ON "quiz_ratings" ("user_id", "quiz_id");
--> statement-breakpoint
CREATE TABLE "question_reports" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"     uuid NOT NULL,
  "question_id" uuid NOT NULL,
  "quiz_id"     uuid NOT NULL,
  "report_type" "report_type" NOT NULL,
  "comment"     text NOT NULL DEFAULT '',
  "status"      "report_status" NOT NULL DEFAULT 'open',
  "created_at"  timestamp NOT NULL DEFAULT now(),
  "resolved_at" timestamp,
  "resolved_by" uuid
);
--> statement-breakpoint
ALTER TABLE "question_reports"
  ADD CONSTRAINT "question_reports_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_reports"
  ADD CONSTRAINT "question_reports_question_id_questions_id_fk"
  FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_reports"
  ADD CONSTRAINT "question_reports_quiz_id_quizzes_id_fk"
  FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "question_reports"
  ADD CONSTRAINT "question_reports_resolved_by_users_id_fk"
  FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
