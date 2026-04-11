CREATE TABLE "collections" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title"       text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "exam_tag"    text,
  "visibility"  "visibility" NOT NULL DEFAULT 'public',
  "is_official" boolean NOT NULL DEFAULT false,
  "created_by"  uuid NOT NULL,
  "created_at"  timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "collection_quizzes" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "collection_id" uuid NOT NULL,
  "quiz_id"       uuid NOT NULL,
  "order_index"   integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "collection_follows" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"       uuid NOT NULL,
  "collection_id" uuid NOT NULL,
  "created_at"    timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "collections"
  ADD CONSTRAINT "collections_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "collection_quizzes"
  ADD CONSTRAINT "collection_quizzes_collection_id_fk"
  FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "collection_quizzes"
  ADD CONSTRAINT "collection_quizzes_quiz_id_fk"
  FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "collection_follows"
  ADD CONSTRAINT "collection_follows_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "collection_follows"
  ADD CONSTRAINT "collection_follows_collection_id_fk"
  FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "collection_quizzes_unique_idx" ON "collection_quizzes" ("collection_id", "quiz_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "collection_follows_unique_idx" ON "collection_follows" ("user_id", "collection_id");
