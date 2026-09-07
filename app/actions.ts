"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  learningActivityLogs,
  lessons,
  userLessonProgress,
} from "@/lib/db/schema";
import { ensureDefaultUser } from "@/lib/data";

const progressSchema = z.object({
  dayNumber: z.number().int().min(1).max(120),
  vocabularyDone: z.boolean(),
  readingDone: z.boolean(),
  videoDone: z.boolean(),
  speakingDone: z.boolean(),
  writingDone: z.boolean(),
  notes: z.string().max(4000),
  evidence: z.string().max(1000),
  actualMinutes: z.number().int().min(0).max(1440).nullable(),
  understanding: z.number().int().min(1).max(5).nullable(),
});

export type ProgressInput = z.infer<typeof progressSchema>;

export async function saveLessonProgress(input: ProgressInput) {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, message: "Data progres belum valid." };

  try {
    const db = getDb();
    const user = await ensureDefaultUser();
    const [lesson] = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.dayNumber, parsed.data.dayNumber))
      .limit(1);
    if (!lesson) return { success: false as const, message: "Day tidak ditemukan." };

    const completed = [
      parsed.data.vocabularyDone,
      parsed.data.readingDone,
      parsed.data.videoDone,
      parsed.data.speakingDone,
      parsed.data.writingDone,
    ].every(Boolean);
    const now = new Date();
    const progressValues = {
      vocabularyDone: parsed.data.vocabularyDone,
      readingDone: parsed.data.readingDone,
      videoDone: parsed.data.videoDone,
      speakingDone: parsed.data.speakingDone,
      writingDone: parsed.data.writingDone,
      notes: parsed.data.notes,
      evidence: parsed.data.evidence,
      actualMinutes: parsed.data.actualMinutes,
      understanding: parsed.data.understanding,
    };

    await db
      .insert(userLessonProgress)
      .values({
        userId: user.id,
        lessonId: lesson.id,
        ...progressValues,
        completedAt: completed ? now : null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [userLessonProgress.userId, userLessonProgress.lessonId],
        set: {
          vocabularyDone: parsed.data.vocabularyDone,
          readingDone: parsed.data.readingDone,
          videoDone: parsed.data.videoDone,
          speakingDone: parsed.data.speakingDone,
          writingDone: parsed.data.writingDone,
          notes: parsed.data.notes,
          evidence: parsed.data.evidence,
          actualMinutes: parsed.data.actualMinutes,
          understanding: parsed.data.understanding,
          completedAt: completed ? now : null,
          updatedAt: now,
        },
      });

    await db.insert(learningActivityLogs).values({
      userId: user.id,
      lessonId: lesson.id,
      action: completed ? "day_completed" : "progress_updated",
      durationMinutes: parsed.data.actualMinutes,
      detail: { progress: completed ? 100 : undefined, understanding: parsed.data.understanding },
    });

    revalidatePath("/");
    revalidatePath("/roadmap");
    revalidatePath("/progress");
    revalidatePath(`/learn/${parsed.data.dayNumber}`);
    return { success: true as const, message: completed ? "Day selesai. Hebat!" : "Progres tersimpan." };
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : "Gagal menyimpan progres.",
    };
  }
}
