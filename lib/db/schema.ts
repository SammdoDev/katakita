import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Quiz, TestResult } from "../tests/contracts";

export const aiTestAttempts = pgTable("ai_test_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerHash: text("owner_hash").notNull(),
  dayNumber: integer("day_number").notNull(),
  quiz: jsonb("quiz").$type<Quiz>().notNull(),
  answers: jsonb("answers").$type<number[]>(),
  writing: text("writing"),
  result: jsonb("result").$type<TestResult>(),
  gradingAt: timestamp("grading_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
}, (table) => [index("ai_test_attempts_owner_day_idx").on(table.ownerHash, table.dayNumber)]);

export const aiRequestUsage = pgTable("ai_request_usage", {
  date: date("date").primaryKey(),
  count: integer("count").notNull().default(0),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default("Pembelajar KataKita"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const learningPhases = pgTable("learning_phases", {
  id: serial("id").primaryKey(),
  phaseNumber: integer("phase_number").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  startDay: integer("start_day").notNull(),
  endDay: integer("end_day").notNull(),
});

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dayNumber: integer("day_number").notNull(),
    phaseId: integer("phase_id")
      .notNull()
      .references(() => learningPhases.id),
    plannedDate: date("planned_date"),
    sessionType: text("session_type").notNull(),
    topic: text("topic").notNull(),
    learningTarget: text("learning_target").notNull(),
    conceptId: text("concept_id").notNull(),
    definition: text("definition").notNull(),
    examples: text("examples").notNull(),
    vocabularyReview: text("vocabulary_review").notNull(),
    readingTitle: text("reading_title").notNull(),
    readingUrl: text("reading_url").notNull(),
    readingTask: text("reading_task").notNull(),
    videoTitle: text("video_title").notNull(),
    videoUrl: text("video_url").notNull(),
    videoTask: text("video_task").notNull(),
    speakingTask: text("speaking_task").notNull(),
    writingTask: text("writing_task").notNull(),
    completionCriteria: text("completion_criteria").notNull(),
    targetMinutes: integer("target_minutes").notNull(),
    reviewTask: text("review_task").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("lessons_day_number_unique").on(table.dayNumber),
    index("lessons_phase_id_idx").on(table.phaseId),
  ],
);

export const lessonVocabularies = pgTable(
  "lesson_vocabularies",
  {
    id: serial("id").primaryKey(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    term: text("term").notNull(),
    meaning: text("meaning"),
    position: integer("position").notNull(),
  },
  (table) => [
    uniqueIndex("lesson_vocabularies_lesson_position_unique").on(
      table.lessonId,
      table.position,
    ),
  ],
);

export const conceptDefinitions = pgTable("concept_definitions", {
  conceptId: text("concept_id").primaryKey(),
  term: text("term").notNull(),
  simpleDefinition: text("simple_definition").notNull(),
  example: text("example").notNull(),
  companionUrl: text("companion_url").notNull(),
  usageLevel: text("usage_level").notNull(),
});

export const learningSources = pgTable("learning_sources", {
  sourceId: text("source_id").primaryKey(),
  title: text("title").notNull(),
  publisher: text("publisher").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  checkedAt: date("checked_at"),
  accessNotes: text("access_notes").notNull(),
});

export const evaluationCheckpoints = pgTable("evaluation_checkpoints", {
  dayNumber: integer("day_number").primaryKey(),
  focus: text("focus").notNull(),
  nextStep: text("next_step").notNull(),
});

export const userLessonProgress = pgTable(
  "user_lesson_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    vocabularyDone: boolean("vocabulary_done").notNull().default(false),
    readingDone: boolean("reading_done").notNull().default(false),
    videoDone: boolean("video_done").notNull().default(false),
    speakingDone: boolean("speaking_done").notNull().default(false),
    writingDone: boolean("writing_done").notNull().default(false),
    notes: text("notes"),
    evidence: text("evidence"),
    actualMinutes: integer("actual_minutes"),
    understanding: integer("understanding"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_lesson_progress_user_lesson_unique").on(
      table.userId,
      table.lessonId,
    ),
    index("user_lesson_progress_user_idx").on(table.userId),
  ],
);

export const learningActivityLogs = pgTable(
  "learning_activity_logs",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").references(() => lessons.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    durationMinutes: integer("duration_minutes"),
    detail: jsonb("detail").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("learning_activity_logs_user_created_idx").on(table.userId, table.createdAt)],
);
