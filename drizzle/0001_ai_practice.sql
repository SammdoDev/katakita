CREATE TABLE "ai_request_usage" (
	"date" date PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_test_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_hash" text NOT NULL,
	"day_number" integer NOT NULL,
	"quiz" jsonb NOT NULL,
	"answers" jsonb,
	"writing" text,
	"result" jsonb,
	"grading_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "ai_test_attempts_owner_day_idx" ON "ai_test_attempts" USING btree ("owner_hash","day_number");