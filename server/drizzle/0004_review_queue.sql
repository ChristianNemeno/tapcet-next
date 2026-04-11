CREATE TABLE "review_queue" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"         uuid NOT NULL,
  "question_id"     uuid NOT NULL,
  "next_review_at"  timestamp NOT NULL,
  "interval_days"   integer NOT NULL DEFAULT 1,
  "miss_count"      integer NOT NULL DEFAULT 1,
  "created_at"      timestamp NOT NULL DEFAULT now(),
  "updated_at"      timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "review_queue"
  ADD CONSTRAINT "review_queue_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "review_queue"
  ADD CONSTRAINT "review_queue_question_id_questions_id_fk"
  FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "review_queue_user_question_idx"
  ON "review_queue" ("user_id", "question_id");
