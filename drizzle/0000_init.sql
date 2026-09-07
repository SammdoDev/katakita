CREATE TABLE "concept_definitions" (
	"concept_id" text PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"simple_definition" text NOT NULL,
	"example" text NOT NULL,
	"companion_url" text NOT NULL,
	"usage_level" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_checkpoints" (
	"day_number" integer PRIMARY KEY NOT NULL,
	"focus" text NOT NULL,
	"next_step" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid,
	"action" text NOT NULL,
	"duration_minutes" integer,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"phase_number" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"start_day" integer NOT NULL,
	"end_day" integer NOT NULL,
	CONSTRAINT "learning_phases_phase_number_unique" UNIQUE("phase_number")
);
--> statement-breakpoint
CREATE TABLE "learning_sources" (
	"source_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"publisher" text NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"checked_at" date,
	"access_notes" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_vocabularies" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" uuid NOT NULL,
	"term" text NOT NULL,
	"meaning" text,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_number" integer NOT NULL,
	"phase_id" integer NOT NULL,
	"planned_date" date,
	"session_type" text NOT NULL,
	"topic" text NOT NULL,
	"learning_target" text NOT NULL,
	"concept_id" text NOT NULL,
	"definition" text NOT NULL,
	"examples" text NOT NULL,
	"vocabulary_review" text NOT NULL,
	"reading_title" text NOT NULL,
	"reading_url" text NOT NULL,
	"reading_task" text NOT NULL,
	"video_title" text NOT NULL,
	"video_url" text NOT NULL,
	"video_task" text NOT NULL,
	"speaking_task" text NOT NULL,
	"writing_task" text NOT NULL,
	"completion_criteria" text NOT NULL,
	"target_minutes" integer NOT NULL,
	"review_task" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"vocabulary_done" boolean DEFAULT false NOT NULL,
	"reading_done" boolean DEFAULT false NOT NULL,
	"video_done" boolean DEFAULT false NOT NULL,
	"speaking_done" boolean DEFAULT false NOT NULL,
	"writing_done" boolean DEFAULT false NOT NULL,
	"notes" text,
	"evidence" text,
	"actual_minutes" integer,
	"understanding" integer,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT 'Pembelajar KataKita' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "learning_activity_logs" ADD CONSTRAINT "learning_activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_activity_logs" ADD CONSTRAINT "learning_activity_logs_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_vocabularies" ADD CONSTRAINT "lesson_vocabularies_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_phase_id_learning_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."learning_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learning_activity_logs_user_created_idx" ON "learning_activity_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_vocabularies_lesson_position_unique" ON "lesson_vocabularies" USING btree ("lesson_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_day_number_unique" ON "lessons" USING btree ("day_number");--> statement-breakpoint
CREATE INDEX "lessons_phase_id_idx" ON "lessons" USING btree ("phase_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_lesson_progress_user_lesson_unique" ON "user_lesson_progress" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "user_lesson_progress_user_idx" ON "user_lesson_progress" USING btree ("user_id");