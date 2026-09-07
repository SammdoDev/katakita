import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { aiRequestUsage, aiTestAttempts, lessons, userLessonProgress } from "@/lib/db/schema";
import { ensureDefaultUser } from "@/lib/data";
import { aiConfigured, evaluateWriting, generateQuiz, TestError } from "./ai";
import { gradeQuiz, publicQuiz, type PublicAttempt } from "./contracts";

export async function testOwner(create = false) {
  const store = await cookies();
  let token = store.get("katakita_tests")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    if (!create) return null;
    token = randomBytes(32).toString("hex");
    store.set("katakita_tests", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 365 * 86400 });
  }
  return createHash("sha256").update(token).digest("hex");
}

function present(row: typeof aiTestAttempts.$inferSelect): PublicAttempt {
  return {
    id: row.id, dayNumber: row.dayNumber, createdAt: row.createdAt.toISOString(),
    quiz: publicQuiz(row.quiz), answers: row.answers, writing: row.writing, result: row.result,
  };
}

export async function readTests(day: number) {
  const ownerHash = await testOwner();
  if (!ownerHash) return { attempt: null, history: [] };
  const rows = await getDb().select().from(aiTestAttempts)
    .where(and(eq(aiTestAttempts.ownerHash, ownerHash), eq(aiTestAttempts.dayNumber, day)))
    .orderBy(desc(aiTestAttempts.createdAt)).limit(10);
  return { attempt: rows[0] ? present(rows[0]) : null, history: rows.filter((row) => row.result).map((row) => ({ id: row.id, score: row.result!.score, createdAt: row.createdAt.toISOString() })) };
}

async function reserveRequest() {
  const configuredLimit = Number(process.env.AI_DAILY_LIMIT || 10);
  const limit = Number.isInteger(configuredLimit) && configuredLimit >= 1 && configuredLimit <= 1000 ? configuredLimit : 10;
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
  const user = await ensureDefaultUser();
  const [row] = await db.select({ lesson: lessons, progress: userLessonProgress }).from(lessons)
    .leftJoin(userLessonProgress, and(eq(userLessonProgress.lessonId, lessons.id), eq(userLessonProgress.userId, user.id)))
    .where(eq(lessons.dayNumber, day)).limit(1);
  if (!row) throw new TestError("Materi Day tidak ditemukan.", 404);
  const p = row.progress;
  if (!p || ![p.vocabularyDone, p.readingDone, p.videoDone, p.speakingDone, p.writingDone].every(Boolean)) {
    throw new TestError("Selesaikan dan simpan kelima aktivitas Day ini sebelum mengikuti tes.", 403);
  }
  const ownerHash = (await testOwner(true))!;
  const [existing] = await db.select().from(aiTestAttempts)
    .where(and(eq(aiTestAttempts.ownerHash, ownerHash), eq(aiTestAttempts.dayNumber, day), isNull(aiTestAttempts.submittedAt)))
    .orderBy(desc(aiTestAttempts.createdAt)).limit(1);
  if (existing) return present(existing);
  await reserveRequest();
  const { dayNumber, topic, learningTarget, definition, examples, vocabularyReview, writingTask } = row.lesson;
  const quiz = await generateQuiz({ dayNumber, topic, learningTarget, definition, examples, vocabularyReview, writingTask });
  const [attempt] = await db.insert(aiTestAttempts).values({ ownerHash, dayNumber: day, quiz }).returning();
  return present(attempt);
}

export async function submitTest(input: { attemptId: string; answers: number[]; writing: string }) {
  const owner = await testOwner();
  if (!owner) throw new TestError("Sesi tes tidak ditemukan. Buka tes dari browser yang sama.", 403);
  const db = getDb();
  const filter = and(eq(aiTestAttempts.id, input.attemptId), eq(aiTestAttempts.ownerHash, owner));
  const [existing] = await db.select().from(aiTestAttempts).where(filter).limit(1);
  if (!existing) throw new TestError("Tes tidak ditemukan dalam sesi ini.", 404);
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
