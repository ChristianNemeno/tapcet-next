CREATE TYPE "public"."visibility" AS ENUM('public', 'draft');--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "visibility" "visibility" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;