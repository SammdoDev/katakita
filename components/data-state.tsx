import Link from "next/link";
import { CircleAlert, Database, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DataState({ configured, error }: { configured: boolean; error: string | null }) {
  return (
    <Card className="mx-auto max-w-2xl p-7 sm:p-10">
      <div className="mb-5 grid size-13 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300">
        {error ? <CircleAlert className="size-6" /> : configured ? <FileSpreadsheet className="size-6" /> : <Database className="size-6" />}
      </div>
      <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
        {error ? "Database belum siap" : configured ? "Kurikulum belum diimpor" : "Hubungkan Neon lebih dulu"}
      </h2>
      <p className="mt-2 max-w-xl leading-7 text-slate-600 dark:text-slate-400">
        {error || (configured
          ? "Koneksi berhasil, tetapi tabel lessons masih kosong. Import workbook awal agar Day 1–120 muncul."
          : "Isi DATABASE_URL di .env.local, jalankan migrasi, lalu import workbook kurikulum yang tersedia.")}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild><Link href="/admin/import">Buka import Excel</Link></Button>
        <Button variant="outline" asChild><a href="/api/template">Download template</a></Button>
      </div>
    </Card>
  );
}

