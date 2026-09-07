import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  learningActivityLogs,
  learningPhases,
  lessons,
  userLessonProgress,
  users,
} from "@/lib/db/schema";

const DEFAULT_USER_EMAIL = "learner@katakita.local";

export async function ensureDefaultUser() {
  const db = getDb();
  const [user] = await db
    .insert(users)
    .values({ email: DEFAULT_USER_EMAIL, name: "Pembelajar KataKita" })
    .onConflictDoUpdate({
      target: users.email,
      set: { updatedAt: new Date() },
    })
    .returning();
  return user;
}

export type LessonView = {
  id: string;
  dayNumber: number;
  phaseNumber: number;
  phaseTitle: string;
  plannedDate: string | null;
  sessionType: string;
  topic: string;
  learningTarget: string;
  conceptId: string;
  definition: string;
  examples: string;
  vocabularyReview: string;
  readingTitle: string;
  readingUrl: string;
  readingTask: string;
  videoTitle: string;
  videoUrl: string;
  videoTask: string;
  speakingTask: string;
  writingTask: string;
  completionCriteria: string;
  targetMinutes: number;
  reviewTask: string;
  progress: {
    vocabularyDone: boolean;
    readingDone: boolean;
    videoDone: boolean;
    speakingDone: boolean;
    writingDone: boolean;
    notes: string;
    evidence: string;
    actualMinutes: number | null;
    understanding: number | null;
    completedAt: string | null;
    updatedAt: string | null;
  };
  percent: number;
  status: "Belum mulai" | "Berjalan" | "Selesai";
};

export type AppData = {
  configured: boolean;
  error: string | null;
  lessons: LessonView[];
  phases: Array<{
    id: number;
    phaseNumber: number;
    title: string;
    summary: string;
    startDay: number;
    endDay: number;
  }>;
  logs: Array<{
    id: number;
    dayNumber: number | null;
    topic: string | null;
    action: string;
    durationMinutes: number | null;
    createdAt: string;
  }>;
};

export async function getAppData(): Promise<AppData> {
  if (!process.env.DATABASE_URL) {
    return { configured: false, error: null, lessons: [], phases: [], logs: [] };
  }
  try {
    const db = getDb();
    const user = await ensureDefaultUser();
    const phaseRows = await db.select().from(learningPhases).orderBy(asc(learningPhases.phaseNumber));
    const rows = await db
      .select({
        lesson: lessons,
        phase: learningPhases,
        progress: userLessonProgress,
      })
      .from(lessons)
      .innerJoin(learningPhases, eq(lessons.phaseId, learningPhases.id))
      .leftJoin(
        userLessonProgress,
        eq(userLessonProgress.lessonId, lessons.id),
      )
      .orderBy(asc(lessons.dayNumber));

    const logRows = await db
      .select({
        id: learningActivityLogs.id,
        dayNumber: lessons.dayNumber,
        topic: lessons.topic,
        action: learningActivityLogs.action,
        durationMinutes: learningActivityLogs.durationMinutes,
        createdAt: learningActivityLogs.createdAt,
      })
      .from(learningActivityLogs)
      .leftJoin(lessons, eq(learningActivityLogs.lessonId, lessons.id))
      .where(eq(learningActivityLogs.userId, user.id))
      .orderBy(desc(learningActivityLogs.createdAt))
      .limit(30);

    const lessonViews: LessonView[] = rows.map(({ lesson, phase, progress }) => {
      const checks = [
        progress?.vocabularyDone,
        progress?.readingDone,
        progress?.videoDone,
        progress?.speakingDone,
        progress?.writingDone,
      ].filter(Boolean).length;
      const percent = checks * 20;
      return {
        id: lesson.id,
        dayNumber: lesson.dayNumber,
        phaseNumber: phase.phaseNumber,
        phaseTitle: phase.title,
        plannedDate: lesson.plannedDate,
        sessionType: lesson.sessionType,
        topic: lesson.topic,
        learningTarget: lesson.learningTarget,
        conceptId: lesson.conceptId,
        definition: lesson.definition,
        examples: lesson.examples,
        vocabularyReview: lesson.vocabularyReview,
        readingTitle: lesson.readingTitle,
        readingUrl: lesson.readingUrl,
        readingTask: lesson.readingTask,
        videoTitle: lesson.videoTitle,
        videoUrl: lesson.videoUrl,
        videoTask: lesson.videoTask,
        speakingTask: lesson.speakingTask,
        writingTask: lesson.writingTask,
        completionCriteria: lesson.completionCriteria,
        targetMinutes: lesson.targetMinutes,
        reviewTask: lesson.reviewTask,
        progress: {
          vocabularyDone: progress?.vocabularyDone ?? false,
          readingDone: progress?.readingDone ?? false,
          videoDone: progress?.videoDone ?? false,
          speakingDone: progress?.speakingDone ?? false,
          writingDone: progress?.writingDone ?? false,
          notes: progress?.notes ?? "",
          evidence: progress?.evidence ?? "",
          actualMinutes: progress?.actualMinutes ?? null,
          understanding: progress?.understanding ?? null,
          completedAt: progress?.completedAt?.toISOString() ?? null,
          updatedAt: progress?.updatedAt?.toISOString() ?? null,
        },
        percent,
        status: percent === 100 ? "Selesai" : percent > 0 ? "Berjalan" : "Belum mulai",
      };
    });

    return {
      configured: true,
      error: null,
      lessons: lessonViews,
      phases: phaseRows,
      logs: logRows.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : "Database tidak dapat diakses.",
      lessons: [],
      phases: [],
      logs: [],
    };
  }
}

export function getStreak(lessons: LessonView[]) {
  const dates = new Set(
    lessons
      .map((lesson) => lesson.progress.completedAt?.slice(0, 10))
      .filter((date): date is string => Boolean(date)),
  );
  if (!dates.size) return 0;
  const cursor = new Date();
  const today = cursor.toISOString().slice(0, 10);
  if (!dates.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

