import { Database, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { ExcelImporter } from "@/components/excel-importer";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Import Excel" };

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="max-w-2xl">
        <p className="eyebrow">Admin kurikulum</p>
        <h1 className="section-title mt-2">Import workbook, tanpa data ganda.</h1>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">File divalidasi terhadap struktur workbook awal. Preview dulu, lalu upsert berdasarkan nomor Day.</p>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <ExcelImporter />
        <aside className="space-y-4">
          <InfoCard icon={FileSpreadsheet} title="Format ketat" text="Menerima .xlsx dengan 7 sheet dan header yang sama seperti file awal." />
          <InfoCard icon={Database} title="Neon sebagai sumber" text="Excel hanya dipakai saat seed/import. Setelah itu aplikasi membaca PostgreSQL." />
          <InfoCard icon={ShieldCheck} title="Upsert aman" text="Day yang ada diperbarui; nomor Day yang sama tidak membuat duplikat." />
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }: { icon: typeof Database; title: string; text: string }) {
  return (
    <Card className="p-5">
      <Icon className="size-5 text-teal-600 dark:text-teal-300" />
      <h2 className="mt-4 text-sm font-extrabold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </Card>
  );
}

