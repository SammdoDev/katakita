"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, LoaderCircle, UploadCloud, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Preview = {
  summary: { lessons: number; concepts: number; sources: number; checkpoints: number };
  preview: Array<{ dayNumber: number; phaseNumber: number; topic: string; sessionType: string; targetMinutes: number }>;
  warnings: string[];
};

type ImportResult = {
  imported: number;
  failed: number;
  concepts: number;
  sources: number;
  vocabularies: number;
};

export function ExcelImporter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState<"preview" | "import" | null>(null);
  const [dragging, setDragging] = useState(false);

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    setPreview(null);
    setResult(null);
    setErrors([]);
  }

  async function send(mode: "preview" | "import") {
    if (!file) return toast.error("Pilih file .xlsx terlebih dahulu.");
    setLoading(mode);
    setErrors([]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);
      const response = await fetch("/api/import", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        setErrors(payload.errors || ["File tidak dapat diproses."]);
        return toast.error("Validasi workbook gagal.");
      }
      if (mode === "preview") {
        setPreview(payload);
        toast.success("Struktur workbook valid.");
      } else {
        setResult(payload.result);
        toast.success(`${payload.result.imported} Day berhasil diimpor.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tidak dapat menghubungi server.";
      setErrors([message]);
      toast.error(message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-5 sm:p-7">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }}
          className={cn("grid min-h-60 cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 text-center outline-none transition-colors hover:border-teal-400 focus:border-teal-400 dark:border-white/10 dark:bg-white/3", dragging && "border-teal-400 bg-teal-50 dark:bg-teal-300/5")}
        >
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-300/10 dark:text-teal-300"><UploadCloud className="size-6" /></span>
            <h2 className="mt-4 font-extrabold text-slate-900 dark:text-white">{file ? file.name : "Tarik workbook ke sini"}</h2>
            <p className="mt-1 text-sm text-slate-500">{file ? `${(file.size / 1024).toFixed(1)} KB · klik untuk mengganti` : "atau klik untuk memilih file .xlsx · maks. 8 MB"}</p>
          </div>
          <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" disabled={!file || Boolean(loading)} onClick={() => send("preview")}>
            {loading === "preview" ? <LoaderCircle className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />} Preview & validasi
          </Button>
          <Button variant="outline" asChild><a href="/api/template"><Download className="size-4" /> Download template awal</a></Button>
        </div>

        {errors.length > 0 && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-300/10 dark:bg-rose-300/5 dark:text-rose-300">
            <div className="flex items-center gap-2 text-sm font-extrabold"><XCircle className="size-4" /> {errors.length} error ditemukan</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          </div>
        )}
      </div>

      {preview && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-5 dark:border-white/8 dark:bg-white/2 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="flex items-center gap-2 text-sm font-extrabold text-teal-700 dark:text-teal-300"><CheckCircle2 className="size-4" /> Struktur valid</p><p className="mt-1 text-xs text-slate-500">{preview.summary.lessons} Day · {preview.summary.concepts} konsep · {preview.summary.sources} sumber · {preview.summary.checkpoints} checkpoint</p></div>
            <Button type="button" disabled={Boolean(loading) || Boolean(result)} onClick={() => send("import")}>
              {loading === "import" ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />} {loading === "import" ? "Mengimpor…" : "Import ke Neon"}
            </Button>
          </div>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 dark:bg-white/5"><tr><th className="p-3">Day</th><th className="p-3">Fase</th><th className="p-3">Topik</th><th className="p-3">Jenis sesi</th><th className="p-3">Menit</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/8">{preview.preview.map((row) => <tr key={row.dayNumber}><td className="p-3 font-black text-teal-600">{row.dayNumber}</td><td className="p-3">{row.phaseNumber}</td><td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{row.topic}</td><td className="p-3 text-slate-500">{row.sessionType}</td><td className="p-3">{row.targetMinutes}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Menampilkan 8 Day pertama dari workbook.</p>
        </div>
      )}

      {result && (
        <div className="border-t border-teal-200 bg-teal-50 p-5 dark:border-teal-300/10 dark:bg-teal-300/5 sm:p-7">
          <p className="flex items-center gap-2 font-extrabold text-teal-800 dark:text-teal-200"><CheckCircle2 className="size-5" /> Import selesai</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ResultStat label="Day berhasil" value={result.imported} /><ResultStat label="Day gagal" value={result.failed} /><ResultStat label="Kosakata" value={result.vocabularies} /><ResultStat label="Sumber" value={result.sources} />
          </div>
        </div>
      )}
    </Card>
  );
}

function ResultStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5"><p className="text-xl font-black text-slate-950 dark:text-white">{value}</p><p className="text-[11px] text-slate-500">{label}</p></div>;
}

