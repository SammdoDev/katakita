"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Headphones,
  MessageCircleMore,
  NotebookPen,
  RotateCcw,
  Save,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { saveLessonProgress } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LessonView } from "@/lib/data";
import { splitVocabulary } from "@/lib/curriculum";
import { cn, formatDate } from "@/lib/utils";

const formSchema = z.object({
  vocabularyDone: z.boolean(),
  readingDone: z.boolean(),
  videoDone: z.boolean(),
  speakingDone: z.boolean(),
  writingDone: z.boolean(),
  notes: z.string().max(4000),
  evidence: z.string().max(1000),
  actualMinutes: z.union([z.number().int().min(0).max(1440), z.nan()]).transform((value) => Number.isNaN(value) ? null : value).nullable(),
  understanding: z.number().int().min(1).max(5).nullable(),
});

type FormValues = z.input<typeof formSchema>;
type CheckName = "vocabularyDone" | "readingDone" | "videoDone" | "speakingDone" | "writingDone";

const checklist: Array<{ name: CheckName; label: string; detail: string; icon: typeof BookOpen }> = [
  { name: "vocabularyDone", label: "Kosakata / review", detail: "10 menit", icon: RotateCcw },
  { name: "readingDone", label: "Reading", detail: "10 menit", icon: BookOpen },
  { name: "videoDone", label: "Video / listening", detail: "15 menit", icon: Headphones },
  { name: "speakingDone", label: "Speaking", detail: "10 menit", icon: MessageCircleMore },
  { name: "writingDone", label: "Writing", detail: "10 menit", icon: NotebookPen },
];

export function LearningPage({ lesson }: { lesson: LessonView }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vocabularyDone: lesson.progress.vocabularyDone,
      readingDone: lesson.progress.readingDone,
      videoDone: lesson.progress.videoDone,
      speakingDone: lesson.progress.speakingDone,
      writingDone: lesson.progress.writingDone,
      notes: lesson.progress.notes,
      evidence: lesson.progress.evidence,
      actualMinutes: lesson.progress.actualMinutes,
      understanding: lesson.progress.understanding,
    },
  });
  const watched = useWatch({ control: form.control });
  const done = checklist.filter((item) => watched[item.name]).length;
  const percent = done * 20;
  const vocabulary = useMemo(() => splitVocabulary(lesson.vocabularyReview), [lesson.vocabularyReview]);

  useEffect(() => {
    form.reset({
      vocabularyDone: lesson.progress.vocabularyDone,
      readingDone: lesson.progress.readingDone,
      videoDone: lesson.progress.videoDone,
      speakingDone: lesson.progress.speakingDone,
      writingDone: lesson.progress.writingDone,
      notes: lesson.progress.notes,
      evidence: lesson.progress.evidence,
      actualMinutes: lesson.progress.actualMinutes,
      understanding: lesson.progress.understanding,
    });
  }, [lesson, form]);

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      const parsed = formSchema.safeParse(values);
      if (!parsed.success) {
        toast.error("Periksa kembali isian progres.");
        return;
      }
      const result = await saveLessonProgress({ dayNumber: lesson.dayNumber, ...parsed.data });
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className={cn(lesson.dayNumber === 1 && "invisible")}>
          <Link href={`/learn/${Math.max(1, lesson.dayNumber - 1)}`}><ArrowLeft className="size-4" /> Day sebelumnya</Link>
        </Button>
        <span className="text-xs font-bold text-slate-400">{formatDate(lesson.plannedDate)}</span>
        <Button variant="ghost" size="sm" asChild className={cn(lesson.dayNumber === 120 && "invisible")}>
          <Link href={`/learn/${Math.min(120, lesson.dayNumber + 1)}`}>Berikutnya <ArrowRight className="size-4" /></Link>
        </Button>
      </div>

      <section className="relative overflow-hidden rounded-[2rem] bg-[#0c2233] p-6 text-white sm:p-9">
        <div className="absolute -right-10 -top-14 size-56 rounded-full bg-teal-300/10 blur-2xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/10 bg-white/8 text-teal-200">DAY {lesson.dayNumber}</Badge>
            <span className="text-xs font-semibold text-slate-400">Fase {lesson.phaseNumber} · {lesson.sessionType}</span>
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-[-.045em] sm:text-5xl">{lesson.topic}</h1>
          <div className="mt-6 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-300">Target hari ini</p>
              <p className="mt-2 max-w-2xl leading-7 text-slate-300">{lesson.learningTarget}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300"><Clock3 className="size-4 text-teal-300" /> {lesson.targetMinutes} menit</div>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Checklist sesi</p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{done} dari 5 aktivitas</h2>
            </div>
            <strong className="text-3xl font-black text-teal-600 dark:text-teal-300">{percent}%</strong>
          </div>
          <Progress value={percent} className="mt-4" />
          <div className="mt-5 grid gap-2.5 sm:grid-cols-5">
            {checklist.map(({ name, label, detail, icon: Icon }) => {
              const checked = Boolean(watched[name]);
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => form.setValue(name, !checked, { shouldDirty: true })}
                  className={cn(
                    "relative rounded-2xl border p-4 text-left transition-all",
                    checked
                      ? "border-teal-400 bg-teal-50 text-teal-900 dark:bg-teal-300/10 dark:text-teal-200"
                      : "border-slate-200 hover:border-teal-300 dark:border-white/10",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="size-5" />
                    <span className={cn("grid size-5 place-items-center rounded-full border", checked ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300 dark:border-white/20")}>{checked && <Check className="size-3" />}</span>
                  </div>
                  <p className="mt-4 text-xs font-extrabold leading-4">{label}</p>
                  <p className="mt-1 text-[11px] opacity-60">{detail}</p>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-6">
            <ContentCard icon={Sparkles} eyebrow="Pahami materi" title="Pengertian">
              <p className="leading-8 text-slate-600 dark:text-slate-300">{lesson.definition}</p>
              <div className="mt-5 rounded-2xl border-l-4 border-teal-400 bg-slate-50 p-4 dark:bg-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Contoh + arti</p>
                <p className="mt-2 font-semibold leading-7 text-slate-800 dark:text-slate-100">{lesson.examples}</p>
              </div>
            </ContentCard>

            <ContentCard icon={RotateCcw} eyebrow="10 menit" title="Kosakata & review">
              <div className="flex flex-wrap gap-2">
                {vocabulary.map((item) => (
                  <span key={`${item.term}-${item.position}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                    <strong className="text-slate-900 dark:text-white">{item.term}</strong>{item.meaning && <span className="text-slate-500"> · {item.meaning}</span>}
                  </span>
                ))}
              </div>
              <p className="mt-5 rounded-2xl bg-teal-50 p-4 text-sm leading-6 text-teal-900 dark:bg-teal-300/10 dark:text-teal-100">{lesson.reviewTask}</p>
            </ContentCard>

            <ResourceCard type="reading" title={lesson.readingTitle} url={lesson.readingUrl} task={lesson.readingTask} />
            <ResourceCard type="video" title={lesson.videoTitle} url={lesson.videoUrl} task={lesson.videoTask} />
          </div>

          <div className="space-y-6">
            <TaskCard icon={MessageCircleMore} eyebrow="Speaking · 10 menit" task={lesson.speakingTask} />
            <TaskCard icon={NotebookPen} eyebrow="Writing · 10 menit" task={lesson.writingTask} />

            <ContentCard icon={CheckCircle2} eyebrow="Bukti berhasil" title="Kriteria selesai">
              <p className="leading-7 text-slate-600 dark:text-slate-300">{lesson.completionCriteria}</p>
            </ContentCard>

            <Card className="p-5 sm:p-6">
              <p className="eyebrow">Refleksi singkat</p>
              <div className="mt-5 space-y-5">
                <label className="block">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Pemahaman diri</span>
                  <span className="mt-1 block text-xs text-slate-500">1 = belum paham · 5 = bisa menjelaskan</span>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button type="button" key={score} onClick={() => form.setValue("understanding", score, { shouldDirty: true })} className={cn("h-10 rounded-xl border text-sm font-black", watched.understanding === score ? "border-teal-500 bg-teal-500 text-white" : "border-slate-200 text-slate-500 dark:border-white/10")}>{score}</button>
                    ))}
                  </div>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Durasi aktual (menit)</span>
                  <input type="number" min={0} max={1440} {...form.register("actualMinutes", { valueAsNumber: true })} placeholder="Contoh: 55" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 outline-none focus:border-teal-400 dark:border-white/10" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Catatan / kata sulit</span>
                  <textarea rows={4} {...form.register("notes")} placeholder="Apa yang masih terasa sulit?" className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-transparent p-3 text-sm outline-none focus:border-teal-400 dark:border-white/10" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Bukti / lokasi rekaman</span>
                  <input {...form.register("evidence")} placeholder="Link atau nama file (opsional)" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-teal-400 dark:border-white/10" />
                </label>
              </div>
            </Card>
          </div>
        </div>

        <div className="sticky bottom-22 z-20 flex justify-end md:bottom-5">
          <Button type="submit" size="lg" disabled={pending} className="shadow-2xl">
            <Save className="size-4" /> {pending ? "Menyimpan…" : percent === 100 ? "Simpan & selesaikan Day" : "Simpan progres"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ContentCard({ icon: Icon, eyebrow, title, children }: { icon: typeof Target; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-300/10 dark:text-teal-300"><Icon className="size-5" /></span>
        <div><p className="eyebrow">{eyebrow}</p><h2 className="mt-0.5 text-xl font-black text-slate-950 dark:text-white">{title}</h2></div>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function ResourceCard({ type, title, url, task }: { type: "reading" | "video"; title: string; url: string; task: string }) {
  const Icon = type === "reading" ? BookOpen : Headphones;
  return (
    <ContentCard icon={Icon} eyebrow={type === "reading" ? "Reading · 10 menit" : "Listening · 15 menit"} title={title}>
      <p className="leading-7 text-slate-600 dark:text-slate-300">{task}</p>
      <Button variant="outline" className="mt-5" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer">Buka sumber <ExternalLink className="size-4" /></a>
      </Button>
    </ContentCard>
  );
}

function TaskCard({ icon: Icon, eyebrow, task }: { icon: typeof Target; eyebrow: string; task: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-[#dff9ef] p-5 text-[#12382f] dark:bg-teal-300/10 dark:text-teal-100">
        <div className="flex items-center gap-3"><Icon className="size-5" /><p className="text-xs font-black uppercase tracking-widest">{eyebrow}</p></div>
        <p className="mt-4 text-lg font-bold leading-7">{task}</p>
      </div>
    </Card>
  );
}
