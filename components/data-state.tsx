import { CircleAlert, Database, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";

export function DataState({ configured, error }: { configured: boolean; error: string | null }) {
  return (
    <Card className="mx-auto max-w-2xl p-7 sm:p-10">
      <div className="mb-5 grid size-13 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300">
        {error ? <CircleAlert className="size-6" /> : configured ? <FileSpreadsheet className="size-6" /> : <Database className="size-6" />}
      </div>
      <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
        {error ? "Database belum siap" : configured ? "Materi belum dipasang" : "Hubungkan Neon lebih dulu"}
      </h2>
      <p className="mt-2 max-w-xl leading-7 text-slate-600 dark:text-slate-400">
        {error || (configured
          ? "Pengelola aplikasi perlu menjalankan seed kurikulum bawaan satu kali agar Day 1–120 tersedia untuk semua akun."
          : "Pengelola aplikasi perlu menghubungkan database dan memasang kurikulum bawaan.")}
      </p>
      <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">Pengguna tidak perlu mengunggah file apa pun.</p>
    </Card>
  );
}
