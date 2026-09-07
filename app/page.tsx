import Link from "next/link";
import { ArrowRight, BookOpenCheck, Clock3, Flame, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DataState } from "@/components/data-state";
import { getAppData, getStreak } from "@/lib/data";
import { formatMinutes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getAppData();
  if (!data.lessons.length) return <DataState configured={data.configured} error={data.error} />;

  const completed = data.lessons.filter((lesson) => lesson.status === "Selesai").length;
  const totalMinutes = data.lessons.reduce((sum, lesson) => sum + (lesson.progress.actualMinutes || 0), 0);
  const current = data.lessons.find((lesson) => lesson.status !== "Selesai") || data.lessons.at(-1)!;
  const overall = Math.round((completed / 120) * 100);
  const streak = getStreak(data.lessons);

  return (
    <div className="space-y-9">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Ruang belajarmu</p>
          <h1 className="section-title mt-2">Pelan-pelan, jadi bisa.</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Satu sesi fokus hari ini akan membawa kamu lebih dekat ke tujuan.</p>
        </div>
        <Badge className="w-fit">Kurikulum Day 1–120</Badge>
      </section>

      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#0c2233] p-6 text-white shadow-[0_28px_80px_rgba(8,31,48,.22)] sm:p-9 lg:p-11">
        <div className="absolute -right-16 -top-20 -z-10 size-72 rounded-full bg-teal-300/12 blur-2xl" />
        <div className="absolute bottom-0 right-[16%] -z-10 h-40 w-40 rotate-12 rounded-[3rem] border border-mint-200/10 bg-white/4" />
        <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge className="border-white/10 bg-white/8 text-teal-200">Day {current.dayNumber}</Badge>
              <span className="text-xs font-semibold text-slate-400">{current.phaseTitle} · {current.sessionType}</span>
            </div>
            <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-[-.045em] sm:text-5xl">{current.topic}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{current.learningTarget}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href={`/learn/${current.dayNumber}`}>Lanjut belajar <ArrowRight className="size-4" /></Link>
              </Button>
              <span className="flex items-center gap-2 text-sm text-slate-400"><Clock3 className="size-4 text-teal-300" /> Target {current.targetMinutes} menit</span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur">
            <div className="flex items-end justify-between">
              <div><span className="text-4xl font-black">{current.percent}</span><span className="text-lg text-slate-400">%</span></div>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-300">Hari ini</span>
            </div>
            <Progress value={current.percent} className="mt-4 bg-white/10" />
            <p className="mt-3 text-xs leading-5 text-slate-400">{current.percent / 20} dari 5 aktivitas selesai</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Target} label="Progress total" value={`${overall}%`} note={`${completed} dari 120 Day`} color="teal" />
        <MetricCard icon={BookOpenCheck} label="Day selesai" value={String(completed)} note={`${120 - completed} Day tersisa`} color="mint" />
        <MetricCard icon={Clock3} label="Waktu belajar" value={formatMinutes(totalMinutes)} note="Durasi aktual" color="sky" />
        <MetricCard icon={Flame} label="Streak" value={`${streak} hari`} note={streak ? "Jaga ritmenya" : "Mulai hari ini"} color="amber" />
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Perjalanan 4 fase</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Jejak menuju fondasi A2</h2>
          </div>
          <Link href="/roadmap" className="text-sm font-bold text-teal-700 hover:text-teal-600 dark:text-teal-300">Lihat roadmap</Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.phases.map((phase) => {
            const phaseLessons = data.lessons.filter((lesson) => lesson.phaseNumber === phase.phaseNumber);
            const done = phaseLessons.filter((lesson) => lesson.status === "Selesai").length;
            const percent = Math.round((done / phaseLessons.length) * 100) || 0;
            return (
              <Card key={phase.id} className="group p-5 transition-transform hover:-translate-y-0.5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-teal-300 dark:bg-teal-300 dark:text-slate-950">0{phase.phaseNumber}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-extrabold text-slate-900 dark:text-white">Day {phase.startDay}–{phase.endDay}</h3>
                      <span className="text-sm font-black text-teal-600 dark:text-teal-300">{percent}%</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{phase.summary}</p>
                    <Progress value={percent} className="mt-4" />
                    <p className="mt-2 text-xs text-slate-400">{done} / {phaseLessons.length} Day selesai</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, color }: {
  icon: typeof Target;
  label: string;
  value: string;
  note: string;
  color: "teal" | "mint" | "sky" | "amber";
}) {
  const colors = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-300/10 dark:text-teal-300",
    mint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-300/10 dark:text-sky-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300",
  };
  return (
    <Card className="p-5">
      <div className={`grid size-10 place-items-center rounded-xl ${colors[color]}`}><Icon className="size-5" /></div>
      <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </Card>
  );
}

