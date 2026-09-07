import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, Clock3, Flame, RotateCcw } from "lucide-react";
import { DataState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getAppData, getStreak } from "@/lib/data";
import { formatDate, formatMinutes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const data = await getAppData();
  if (!data.lessons.length) return <DataState configured={data.configured} error={data.error} />;
  const completed = data.lessons.filter((lesson) => lesson.status === "Selesai").length;
  const totalMinutes = data.lessons.reduce((sum, lesson) => sum + (lesson.progress.actualMinutes || 0), 0);
  const repeat = data.lessons.filter((lesson) => lesson.progress.understanding !== null && lesson.progress.understanding <= 2);
  const overall = Math.round((completed / 120) * 100);
  const streak = getStreak(data.lessons);

  return (
    <div className="space-y-8">
      <section className="max-w-2xl">
        <p className="eyebrow">Progres belajar</p>
        <h1 className="section-title mt-2">Kemajuan kecil yang bisa dilihat.</h1>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">Gunakan data ini untuk menjaga ritme dan memilih materi yang perlu disentuh lagi.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="relative overflow-hidden bg-[#0c2233] p-6 text-white sm:col-span-2">
          <div className="absolute -right-10 -top-10 size-44 rounded-full bg-teal-300/10 blur-2xl" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="flex items-center gap-2 text-sm font-bold text-teal-200"><BookOpenCheck className="size-4" /> Progress total</div>
            <div>
              <div className="flex items-end justify-between"><p className="text-5xl font-black tracking-tight">{overall}%</p><p className="text-sm text-slate-400">{completed} / 120 Day</p></div>
              <Progress value={overall} className="mt-5 bg-white/10" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
          <Card className="p-5"><Clock3 className="size-5 text-sky-500" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Waktu belajar</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{formatMinutes(totalMinutes)}</p></Card>
          <Card className="p-5"><Flame className="size-5 text-amber-500" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Streak</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{streak} hari</p></Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5 sm:p-7">
          <p className="eyebrow">Per fase</p>
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Fondasi yang sedang dibangun</h2>
          <div className="mt-7 space-y-6">
            {data.phases.map((phase) => {
              const phaseLessons = data.lessons.filter((lesson) => lesson.phaseNumber === phase.phaseNumber);
              const done = phaseLessons.filter((lesson) => lesson.status === "Selesai").length;
              const percent = Math.round((done / 30) * 100);
              return (
                <div key={phase.id}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-xs font-black dark:bg-white/8">{phase.phaseNumber}</span><div><p className="text-sm font-extrabold text-slate-900 dark:text-white">Day {phase.startDay}–{phase.endDay}</p><p className="text-xs text-slate-400">{done} selesai</p></div></div>
                    <span className="text-sm font-black text-teal-600 dark:text-teal-300">{percent}%</span>
                  </div>
                  <Progress value={percent} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 sm:p-7">
          <div className="flex items-start justify-between">
            <div><p className="eyebrow">Perlu diulang</p><h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Pemahaman ≤ 2</h2></div>
            <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300"><RotateCcw className="size-5" /></span>
          </div>
          <div className="mt-5 space-y-2">
            {repeat.length ? repeat.slice(0, 6).map((lesson) => (
              <Link key={lesson.id} href={`/learn/${lesson.dayNumber}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition-colors hover:border-amber-300 dark:border-white/8">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-xs font-black text-amber-700 dark:bg-amber-300/10 dark:text-amber-300">{lesson.dayNumber}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-slate-200">{lesson.topic}</span>
                <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/10 dark:bg-amber-300/10 dark:text-amber-300">{lesson.progress.understanding}/5</Badge>
              </Link>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center dark:border-white/10">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada Day untuk diulang.</p>
                <p className="mt-1 text-xs text-slate-400">Nilai pemahaman 1–2 akan muncul di sini.</p>
              </div>
            )}
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4"><p className="eyebrow">Aktivitas terbaru</p><h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Riwayat belajar</h2></div>
        <Card className="divide-y divide-slate-100 overflow-hidden dark:divide-white/8">
          {data.logs.length ? data.logs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 p-4 sm:p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-300/10 dark:text-teal-300"><BookOpenCheck className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{log.action === "day_completed" ? `Day ${log.dayNumber} diselesaikan` : `Progres Day ${log.dayNumber} diperbarui`}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{log.topic} · {formatDate(log.createdAt)}</p>
              </div>
              {log.durationMinutes !== null && <span className="text-xs font-bold text-slate-400">{log.durationMinutes} mnt</span>}
              {log.dayNumber && <Link href={`/learn/${log.dayNumber}`} aria-label={`Buka Day ${log.dayNumber}`}><ArrowUpRight className="size-4 text-slate-400" /></Link>}
            </div>
          )) : (
            <div className="p-10 text-center text-sm text-slate-500">Belum ada aktivitas. Mulai Day pertama untuk membuat jejak belajar.</div>
          )}
        </Card>
      </section>
    </div>
  );
}

