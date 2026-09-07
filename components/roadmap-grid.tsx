"use client";

import Link from "next/link";
import { ArrowUpRight, Check, CircleDashed, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { LessonView } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function RoadmapGrid({ lessons }: { lessons: LessonView[] }) {
  const [phase, setPhase] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => lessons.filter((lesson) =>
      (phase === "all" || String(lesson.phaseNumber) === phase) &&
      (status === "all" || lesson.status === status) &&
      (!query || lesson.topic.toLowerCase().includes(query.toLowerCase()) || String(lesson.dayNumber) === query),
    ),
    [lessons, phase, status, query],
  );

  return (
    <div>
      <section className="max-w-2xl">
        <p className="eyebrow">Roadmap 120 hari</p>
        <h1 className="section-title mt-2">Lihat seberapa jauh kamu berjalan.</h1>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">Empat fase yang berurutan, dari mengeja nama sampai presentasi dan tulisan 120–150 kata.</p>
      </section>

      <Card className="sticky top-21 z-30 mt-7 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari topik atau nomor Day…" className="h-11 w-full rounded-xl border border-slate-200 bg-transparent pl-10 pr-4 text-sm outline-none focus:border-teal-400 dark:border-white/10" />
          </label>
          <FilterSelect icon={<SlidersHorizontal className="size-4" />} value={phase} onChange={setPhase} ariaLabel="Filter fase">
            <option value="all">Semua fase</option>
            {[1, 2, 3, 4].map((item) => <option key={item} value={item}>Fase {item}</option>)}
          </FilterSelect>
          <FilterSelect value={status} onChange={setStatus} ariaLabel="Filter status">
            <option value="all">Semua status</option>
            <option value="Belum mulai">Belum mulai</option>
            <option value="Berjalan">Berjalan</option>
            <option value="Selesai">Selesai</option>
          </FilterSelect>
        </div>
      </Card>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-slate-500"><strong className="text-slate-900 dark:text-white">{filtered.length}</strong> Day ditampilkan</p>
      </div>

      {filtered.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((lesson, index) => (
            <Link key={lesson.id} href={`/learn/${lesson.dayNumber}`} className="group animate-rise" style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
              <Card className="h-full p-5 transition-all group-hover:-translate-y-1 group-hover:border-teal-300 group-hover:shadow-[0_20px_60px_rgba(20,184,166,.12)]">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-black tracking-widest text-teal-600 dark:text-teal-300">DAY {String(lesson.dayNumber).padStart(3, "0")}</span>
                  <StatusIcon status={lesson.status} />
                </div>
                <h2 className="mt-4 min-h-12 font-extrabold leading-6 text-slate-900 dark:text-white">{lesson.topic}</h2>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <Badge>Fase {lesson.phaseNumber}</Badge>
                  <span className="font-bold text-slate-500">{lesson.percent}%</span>
                </div>
                <Progress value={lesson.percent} className="mt-3 h-2" />
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-white/8">
                  <span className="text-slate-500">{lesson.status}</span>
                  <ArrowUpRight className="size-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-500" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="mt-5 p-12 text-center">
          <CircleDashed className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-3 font-bold text-slate-900 dark:text-white">Belum ada Day yang cocok</h2>
          <p className="mt-1 text-sm text-slate-500">Coba ubah pencarian atau filter.</p>
        </Card>
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, children, icon, ariaLabel }: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <label className="relative flex items-center">
      {icon && <span className="pointer-events-none absolute left-3 text-slate-400">{icon}</span>}
      <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} className={cn("h-11 min-w-38 appearance-none rounded-xl border border-slate-200 bg-transparent pl-4 pr-9 text-sm font-semibold outline-none focus:border-teal-400 dark:border-white/10 dark:bg-[#101e2d]", icon && "pl-9")}>
        {children}
      </select>
    </label>
  );
}

function StatusIcon({ status }: { status: LessonView["status"] }) {
  if (status === "Selesai") return <span className="grid size-7 place-items-center rounded-full bg-teal-500 text-white"><Check className="size-4" /></span>;
  if (status === "Berjalan") return <span className="grid size-7 place-items-center rounded-full border-2 border-teal-400 text-[10px] font-black text-teal-600">••</span>;
  return <span className="size-7 rounded-full border-2 border-slate-200 dark:border-white/10" />;
}

