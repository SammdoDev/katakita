import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { aiRequestUsage, aiTestAttempts, lessons, userLessonProgress } from "@/lib/db/schema";
import { aiConfigured, evaluateWriting, generateQuiz, TestError } from "./ai";
import { gradeQuiz, publicQuiz, type PublicAttempt } from "./contracts";

async function requireTestUser() {
  const user = await getCurrentUser();
  if (!user) throw new TestError("Silakan masuk untuk mengakses tes AI.", 401);
  return user;
}

function present(row: typeof aiTestAttempts.$inferSelect): PublicAttempt {
  return {
    id: row.id, dayNumber: row.dayNumber, createdAt: row.createdAt.toISOString(),
    quiz: publicQuiz(row.quiz), answers: row.answers, writing: row.writing, result: row.result,
  };
}

export async function readTests(day: number) {
  const user = await requireTestUser();
  const rows = await getDb().select().from(aiTestAttempts)
    .where(and(eq(aiTestAttempts.userId, user.id), eq(aiTestAttempts.dayNumber, day)))
    .orderBy(desc(aiTestAttempts.createdAt)).limit(10);
  return { attempt: rows[0] ? present(rows[0]) : null, history: rows.filter((row) => row.result).map((row) => ({ id: row.id, score: row.result!.score, createdAt: row.createdAt.toISOString() })) };
}

async function reserveRequest() {
  const limit = 10;
  // PostgreSQL serializes conflicting updates: the shared daily limit also holds across Vercel instances.
  const rows = await getDb().insert(aiRequestUsage)
    .values({ date: new Date().toISOString().slice(0, 10), count: 1 })
    .onConflictDoUpdate({ target: aiRequestUsage.date, set: { count: sql`${aiRequestUsage.count} + 1` }, setWhere: sql`${aiRequestUsage.count} < ${limit}` })
    .returning();
  if (!rows.length) throw new TestError("Batas permintaan AI hari ini sudah tercapai. Lanjutkan lagi besok.", 429);
}

export async function startTest(day: number) {
  if (!aiConfigured()) throw new TestError("Tes AI belum diaktifkan. Pemilik aplikasi perlu mengatur koneksi AI.", 503);
  const db = getDb();
  const user = await requireTestUser();
  const [row] = await db.select({ lesson: lessons, progress: userLessonProgress }).from(lessons)
    .leftJoin(userLessonProgress, and(eq(userLessonProgress.lessonId, lessons.id), eq(userLessonProgress.userId, user.id)))
    .where(eq(lessons.dayNumber, day)).limit(1);
  if (!row) throw new TestError("Materi Day tidak ditemukan.", 404);
  const p = row.progress;
  if (!p || ![p.vocabularyDone, p.readingDone, p.videoDone, p.speakingDone, p.writingDone].every(Boolean)) {
    throw new TestError("Selesaikan dan simpan kelima aktivitas Day ini sebelum mengikuti tes.", 403);
  }
  const [existing] = await db.select().from(aiTestAttempts)
    .where(and(eq(aiTestAttempts.userId, user.id), eq(aiTestAttempts.dayNumber, day), isNull(aiTestAttempts.submittedAt)))
    .orderBy(desc(aiTestAttempts.createdAt)).limit(1);
  if (existing) return present(existing);
  await reserveRequest();
  const { dayNumber, topic, learningTarget, definition, examples, vocabularyReview, writingTask } = row.lesson;
  const quiz = await generateQuiz({ dayNumber, topic, learningTarget, definition, examples, vocabularyReview, writingTask });
  const [attempt] = await db.insert(aiTestAttempts).values({ userId: user.id, dayNumber: day, quiz }).returning();
  return present(attempt);
}

export async function submitTest(input: { attemptId: string; answers: number[]; writing: string }) {
  const user = await requireTestUser();
  const db = getDb();
  const filter = and(eq(aiTestAttempts.id, input.attemptId), eq(aiTestAttempts.userId, user.id));
  const [existing] = await db.select().from(aiTestAttempts).where(filter).limit(1);
  if (!existing) throw new TestError("Tes tidak ditemukan untuk akun ini.", 404);
  if (existing.result) return present(existing);
  if (!aiConfigured()) throw new TestError("Layanan penilaian AI belum diaktifkan.", 503);
  const lockTime = new Date();
  const [locked] = await db.update(aiTestAttempts).set({ gradingAt: lockTime })
    .where(and(filter, isNull(aiTestAttempts.submittedAt), or(isNull(aiTestAttempts.gradingAt), lt(aiTestAttempts.gradingAt, new Date(Date.now() - 120000)))))
    .returning();
  if (!locked) throw new TestError("Jawaban sedang dinilai. Tunggu sebentar lalu muat ulang.", 409);
  try {
    await reserveRequest();
    const feedback = await evaluateWriting(locked.quiz.writingPrompt, input.writing);
    const result = gradeQuiz(locked.quiz, input.answers, feedback);
    const [saved] = await db.update(aiTestAttempts).set({ answers: input.answers, writing: input.writing, result, submittedAt: new Date(), gradingAt: null })
      .where(and(filter, eq(aiTestAttempts.gradingAt, lockTime))).returning();
    if (!saved) throw new TestError("Sesi penilaian berubah. Muat ulang hasil tes.", 409);
    return present(saved);
  } catch (error) {
    await db.update(aiTestAttempts).set({ gradingAt: null }).where(and(filter, eq(aiTestAttempts.gradingAt, lockTime)));
    throw error;
  }
}
