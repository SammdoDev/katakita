"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, LoaderCircle, LockKeyhole, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatDate } from "@/lib/utils";
import type { PublicAttempt } from "@/lib/tests/contracts";

type History = Array<{ id: string; score: number; createdAt: string }>;
type Lesson = { dayNumber: number; topic: string; completed: boolean };

export function TestCenter({ lessons, initialDay, configured, databaseReady }: {
  lessons: Lesson[]; initialDay: number; configured: boolean; databaseReady: boolean;
}) {
  const [day, setDay] = useState(initialDay);
  const [attempt, setAttempt] = useState<PublicAttempt | null>(null);
  const [answers, setAnswers] = useState<Array<number | null>>(Array(6).fill(null));
  const [writing, setWriting] = useState("");
  const [history, setHistory] = useState<History>([]);
  const [busy, setBusy] = useState<"loading" | "generate" | "submit" | null>(databaseReady ? "loading" : null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const lesson = lessons.find((item) => item.dayNumber === day);
  const answered = answers.filter((answer) => answer !== null).length;

  useEffect(() => {
    if (!databaseReady) return;
    const controller = new AbortController();
    fetch(`/api/tests?day=${day}`, { signal: controller.signal }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      const saved = payload.attempt as PublicAttempt | null;
      setAttempt(saved);
      setHistory(payload.history);
      let draft: { answers?: Array<number | null>; writing?: string } | null = null;
      if (saved && !saved.result) {
        try { draft = JSON.parse(sessionStorage.getItem(`test-${saved.id}`) || "null"); } catch { /* Storage may be unavailable. */ }
      }
      setAnswers(saved?.answers || (draft?.answers?.length === 6 ? draft.answers : Array(6).fill(null)));
      setWriting(saved?.writing || draft?.writing || "");
    }).catch((cause) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Tes belum dapat dimuat.");
    }).finally(() => { if (!controller.signal.aborted) setBusy(null); });
    return () => controller.abort();
  }, [day, databaseReady, reload]);

  useEffect(() => {
    if (!attempt || attempt.result || busy === "loading") return;
    try { sessionStorage.setItem(`test-${attempt.id}`, JSON.stringify({ answers, writing })); } catch { /* Keep editing when storage is blocked. */ }
  }, [attempt, answers, writing, busy]);

  function selectDay(value: number) {
    setBusy("loading"); setAttempt(null); setHistory([]); setError("");
    setAnswers(Array(6).fill(null)); setWriting(""); setDay(value);
  }

  async function request(action: "generate" | "submit") {
    if (busy) return;
    if (action === "submit" && (answered < 6 || !writing.trim())) {
      toast.error("Jawab keenam soal dan isi latihan writing sebelum mengirim."); return;
    }
    setBusy(action); setError("");
    try {
      const response = await fetch("/api/tests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "generate" ? { action, dayNumber: day } : { action, attemptId: attempt?.id, answers, writing }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      const saved = payload.attempt as PublicAttempt;
      setAttempt(saved);
      if (action === "generate") { setAnswers(saved.answers || Array(6).fill(null)); setWriting(saved.writing || ""); }
      if (saved.result) {
        setHistory((old) => [{ id: saved.id, score: saved.result!.score, createdAt: saved.createdAt }, ...old.filter((item) => item.id !== saved.id)].slice(0, 10));
        try { sessionStorage.removeItem(`test-${saved.id}`); } catch { /* Optional local draft. */ }
        toast.success("Hasil tes dan pembahasan tersimpan.");
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Tes gagal diproses. Coba lagi.";
      setError(message); toast.error(message);
    } finally { setBusy(null); }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#0c2233] p-6 text-white sm:p-9">
        <div className="pointer-events-none absolute -right-10 -top-16 size-72 rounded-full bg-teal-300/10 blur-3xl" />
        <Badge className="border-teal-200/20 text-teal-200">AFTER-LEARNING LAB</Badge>
        <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Sudah belajar.<br /><span className="text-teal-300">Sekarang, uji dirimu.</span></h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">Latihan persiapan TOEFL dengan soal AI dari materi Day kamu. Kerjakan reading, grammar, dan writing, lalu pelajari pembahasannya.</p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-teal-100">
          {["6 soal pilihan ganda", "1 writing singkat", "Pembahasan Indonesia"].map((label) => <span key={label} className="rounded-full border border-white/10 bg-white/5 px-3 py-2">{label}</span>)}
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-400">Skor latihan 0–100, bukan skor TOEFL resmi. Sesi singkat ini belum menguji listening atau speaking.</p>
      </section>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="min-w-0 flex-1">
            <span className="eyebrow">Pilih materi tes</span>
            <select aria-label="Day untuk tes" value={day} disabled={Boolean(busy) || !databaseReady} onChange={(event) => selectDay(Number(event.target.value))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-teal-400 disabled:opacity-60 dark:border-white/10 dark:bg-[#101e2d]">
              {!lessons.length && <option value={1}>Kurikulum belum tersedia</option>}
              {lessons.map((item) => <option key={item.dayNumber} value={item.dayNumber}>Day {item.dayNumber} · {item.topic}{item.completed ? " ✓" : " · belum selesai"}</option>)}
            </select>
          </label>
          <Button variant="outline" asChild><Link href={`/learn/${day}`}><BookOpen className="size-4" /> Buka materi</Link></Button>
        </div>
      </Card>

      {!databaseReady ? <Notice title="Materi belum tersedia" text="Hubungkan database dan import kurikulum agar tes bisa mengikuti materi belajarmu." />
        : !configured ? <Notice title="Tes AI segera hadir" text="Koneksi AI belum diaktifkan oleh pemilik aplikasi. Kamu tetap bisa melanjutkan pembelajaran harian." />
        : !lesson?.completed ? <Notice title="Selesaikan Day ini terlebih dahulu" text="Centang dan simpan kelima aktivitas pembelajaran. Setelah itu, tes Day ini akan terbuka." /> : null}

      {error && <div role="alert" className="rounded-2xl border border-amber-300/40 bg-amber-100/40 p-4 text-sm dark:bg-amber-300/5"><p>{error}</p><Button type="button" size="sm" variant="ghost" className="mt-2" disabled={Boolean(busy)} onClick={() => { setError(""); setBusy("loading"); setReload((value) => value + 1); }}>Muat ulang tes tersimpan</Button></div>}

      {busy === "loading" && <Card className="p-10 text-center" role="status"><LoaderCircle className="mx-auto size-6 animate-spin text-teal-500" /><p className="mt-3 text-sm text-slate-500">Memuat sesi dan riwayat tes…</p></Card>}

      {!attempt && busy !== "loading" && databaseReady && configured && lesson?.completed && <Card className="p-7 text-center sm:p-10">
        <Sparkles className="mx-auto size-9 text-teal-500" /><h2 className="mt-4 text-2xl font-black">Siap mengukur pemahamanmu?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">AI akan menyiapkan latihan baru berdasarkan topik “{lesson.topic}”. Hasil dan pembahasan muncul setelah kamu mengirim jawaban.</p>
        <Button className="mt-6" size="lg" disabled={Boolean(busy)} onClick={() => request("generate")}>{busy === "generate" ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{busy === "generate" ? "AI sedang membuat soal…" : "Mulai tes AI"}</Button>
      </Card>}

      {attempt && busy !== "loading" && (attempt.result ? <>
        <TestReview attempt={attempt} />
        <div className="flex flex-wrap gap-3"><Button disabled={Boolean(busy) || !configured || !lesson?.completed} onClick={() => request("generate")}>{busy === "generate" ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Latihan soal baru</Button><Button variant="outline" asChild><Link href={`/learn/${Math.min(day + 1, 120)}`}>Lanjut belajar <ArrowRight className="size-4" /></Link></Button></div>
      </> : <form onSubmit={(event) => { event.preventDefault(); request("submit"); }} className="space-y-5">
        <Card className="p-5 sm:p-7"><p className="eyebrow">Reading passage · Teks latihan AI</p><h2 className="mt-2 text-2xl font-black">{attempt.quiz.title}</h2><p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600 dark:text-slate-300">{attempt.quiz.passage}</p></Card>
        <div className="flex items-center gap-4"><Progress value={answered / 6 * 100} /><span className="shrink-0 text-sm font-semibold">{answered} / 6 dijawab</span></div>
        {attempt.quiz.questions.map((question, index) => <Card key={`${attempt.id}-${index}`} className="p-5 sm:p-6"><fieldset disabled={Boolean(busy)}><legend className="w-full"><span className="eyebrow">{question.section} · Soal {index + 1}</span><span className="mb-4 mt-2 block text-lg font-bold">{question.prompt}</span></legend><div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, choice) => <label key={choice} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors", answers[index] === choice ? "border-teal-400 bg-teal-50 dark:bg-teal-300/10" : "border-slate-200 hover:border-teal-300 dark:border-white/10")}><input required type="radio" name={`question-${index}`} value={choice} checked={answers[index] === choice} onChange={() => setAnswers((old) => old.map((value, i) => i === index ? choice : value))} className="mt-0.5 accent-teal-600" /><span><strong className="mr-2 text-teal-600">{String.fromCharCode(65 + choice)}.</strong>{option}</span></label>)}</div></fieldset></Card>)}
        <Card className="p-5 sm:p-6"><label htmlFor="writing-answer" className="block"><span className="eyebrow">Writing · 3–5 kalimat</span><span className="mt-2 block text-lg font-bold">{attempt.quiz.writingPrompt}</span></label><textarea id="writing-answer" required maxLength={4000} rows={7} value={writing} disabled={Boolean(busy)} onChange={(event) => setWriting(event.target.value)} placeholder="Write your answer in English…" className="mt-4 w-full rounded-xl border border-slate-200 bg-transparent p-4 leading-7 outline-none focus:border-teal-400 dark:border-white/10" /><p className="mt-2 text-xs text-slate-400">{writing.trim() ? writing.trim().split(/\s+/).length : 0} kata · {writing.length}/4000 karakter</p></Card>
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-md text-xs leading-5 text-slate-500">Jawaban writing dikirim ke layanan AI untuk dinilai. Draf disimpan di tab browser ini sampai tes dikirim.</p><Button type="submit" size="lg" disabled={Boolean(busy) || !configured || answered < 6 || !writing.trim()}>{busy === "submit" ? <LoaderCircle className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}{busy === "submit" ? "AI sedang menilai…" : "Kirim & lihat hasil"}</Button></div>
      </form>)}

      <Card className="p-5 sm:p-6"><p className="eyebrow">Riwayat Day {day}</p><h2 className="mt-2 text-xl font-black">Lihat perkembangan nilaimu</h2>{history.length ? <div className="mt-4 divide-y divide-slate-100 dark:divide-white/10">{history.map((item) => <div key={item.id} className="flex items-center justify-between py-3"><span className="text-sm text-slate-500">{formatDate(item.createdAt)}</span><strong className="text-teal-600 dark:text-teal-300">{item.score} / 100</strong></div>)}</div> : <p className="mt-3 text-sm text-slate-500">Belum ada tes selesai untuk Day ini.</p>}<p className="mt-4 text-xs text-slate-400">Riwayat tes mengikuti sesi browser ini. Menghapus cookie atau berpindah browser akan membuat sesi baru.</p></Card>
    </div>
  );
}

function Notice({ title, text }: { title: string; text: string }) {
  return <Card className="flex items-start gap-4 p-5"><LockKeyhole className="mt-1 size-5 shrink-0 text-teal-500" /><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></Card>;
}

function TestReview({ attempt }: { attempt: PublicAttempt }) {
  const result = attempt.result!;
  return <div className="space-y-5">
    <Card className="border-teal-300/30 bg-teal-50/60 p-6 dark:bg-teal-300/5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-5"><div><p className="eyebrow">Hasil latihan · Day {attempt.dayNumber}</p><h2 className="mt-2 text-2xl font-black">{result.score >= 70 ? "Pemahamanmu mulai terbentuk." : "Kita tahu apa yang perlu dilatih."}</h2><p className="mt-2 text-sm text-slate-500">Baca pembahasan dan coba terapkan koreksinya.</p></div><p className="text-5xl font-black text-teal-600 dark:text-teal-300">{result.score}<span className="text-lg text-slate-400"> / 100</span></p></div><div className="mt-6 grid grid-cols-3 gap-3">{[["Reading", result.readingScore, 30], ["Grammar", result.grammarScore, 30], ["Writing", result.writingScore, 40]].map(([label, score, max]) => <div key={label} className="rounded-xl bg-white/60 p-3 dark:bg-white/5"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-black">{score}<span className="text-xs text-slate-400"> / {max}</span></p></div>)}</div></Card>
    <Card className="p-5 sm:p-7"><p className="eyebrow">Teks bacaan</p><p className="mt-3 whitespace-pre-line leading-8">{attempt.quiz.passage}</p></Card>
    {result.questions.map((question, i) => <Card key={i} className="p-5 sm:p-6"><div className="flex items-center gap-2"><Badge>{question.section} · {i + 1}</Badge><span className={cn("text-xs font-bold", question.correct ? "text-teal-600" : "text-amber-600")}>{question.correct ? "Benar" : "Perlu dipelajari"}</span></div><h3 className="mt-3 font-bold">{question.prompt}</h3><p className="mt-3 text-sm text-slate-500">Jawabanmu: {question.options[question.selected]}</p><p className="mt-2 flex items-start gap-2 text-sm font-semibold text-teal-700 dark:text-teal-300"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{question.options[question.answer]}</p><p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-7 text-slate-600 dark:border-white/10 dark:text-slate-300">{question.explanation}</p></Card>)}
    <Card className="p-5 sm:p-7"><p className="eyebrow">Writing feedback · AI</p><h3 className="mt-2 font-bold">{attempt.quiz.writingPrompt}</h3><p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-7 dark:bg-white/5">{attempt.writing}</p><div className="mt-4 flex flex-wrap gap-2">{([['Isi', 'content'], ['Grammar', 'grammar'], ['Kosakata', 'vocabulary'], ['Susunan', 'organization']] as const).map(([label, key]) => <Badge key={key}>{label}: {result.feedback[key]}/5</Badge>)}</div><p className="mt-4 leading-7">{result.feedback.feedback}</p><h4 className="mt-5 text-sm font-bold">Contoh perbaikan</h4><p className="mt-2 whitespace-pre-wrap rounded-xl bg-teal-50 p-4 leading-7 dark:bg-teal-300/10">{result.feedback.improvedAnswer}</p><h4 className="mt-5 text-sm font-bold">Latihan berikutnya</h4><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-500">{result.feedback.nextSteps.map((step, i) => <li key={i}>{step}</li>)}</ul></Card>
  </div>;
}
