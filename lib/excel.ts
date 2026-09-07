import * as XLSX from "xlsx";
import { z } from "zod";

export const PLAN_SHEET = "Rencana 120 Hari";

export const PLAN_HEADERS = [
  "Day",
  "Bulan",
  "Jenis sesi",
  "Topik",
  "Target hari ini",
  "ID konsep",
  "Pengertian (Indonesia)",
  "Contoh + arti",
  "Kosakata / review",
  "Judul bacaan",
  "URL bacaan",
  "Tugas baca · 10 menit",
  "Judul video",
  "URL video",
  "Tugas video · 15 menit",
  "Speaking · 10 menit",
  "Writing · 10 menit",
  "Kriteria selesai",
  "Target menit",
  "Pengulangan · 10 menit",
] as const;

const WORKBOOK_HEADERS = {
  Tracker: [
    "Day",
    "Tanggal rencana",
    "Topik",
    "Kata / review",
    "Baca",
    "Video",
    "Speaking",
    "Writing",
    "Progres",
    "Status otomatis",
    "Target menit",
    "Menit aktual",
    "Paham 1–5",
    "Tanggal selesai",
    "Catatan / kata sulit",
    "Bukti / lokasi rekaman",
    "Perlu diulang?",
  ],
  [PLAN_SHEET]: [...PLAN_HEADERS],
  "Kamus Materi": [
    "ID konsep",
    "Istilah / pola",
    "Pengertian sederhana",
    "Contoh dan arti",
    "URL pendamping",
    "Level pemakaian",
  ],
  Sumber: [
    "ID",
    "Judul halaman",
    "Penerbit",
    "Jenis",
    "URL langsung",
    "Tanggal cek",
    "Cara akses / batasan",
  ],
  Evaluasi: [
    "Day",
    "Fokus checkpoint",
    "Reading 0–5",
    "Listening 0–5",
    "Writing 0–5",
    "Speaking 0–5",
    "Recall 0–5",
    "Total",
    "Langkah berikutnya",
    "Catatan / bukti",
  ],
} as const;

const lessonRowSchema = z.object({
  dayNumber: z.number().int().min(1).max(120),
  phaseNumber: z.number().int().min(1).max(4),
  sessionType: z.string().min(1),
  topic: z.string().min(1),
  learningTarget: z.string().min(1),
  conceptId: z.string().min(1),
  definition: z.string().min(1),
  examples: z.string().min(1),
  vocabularyReview: z.string().min(1),
  readingTitle: z.string().min(1),
  readingUrl: z.url(),
  readingTask: z.string().min(1),
  videoTitle: z.string().min(1),
  videoUrl: z.url(),
  videoTask: z.string().min(1),
  speakingTask: z.string().min(1),
  writingTask: z.string().min(1),
  completionCriteria: z.string().min(1),
  targetMinutes: z.number().int().positive(),
  reviewTask: z.string().min(1),
  plannedDate: z.string().nullable(),
});

export type WorkbookLesson = z.infer<typeof lessonRowSchema>;

export type WorkbookData = {
  lessons: WorkbookLesson[];
  phases: Array<{
    phaseNumber: number;
    title: string;
    summary: string;
    startDay: number;
    endDay: number;
  }>;
  concepts: Array<{
    conceptId: string;
    term: string;
    simpleDefinition: string;
    example: string;
    companionUrl: string;
    usageLevel: string;
  }>;
  sources: Array<{
    sourceId: string;
    title: string;
    publisher: string;
    type: string;
    url: string;
    checkedAt: string | null;
    accessNotes: string;
  }>;
  checkpoints: Array<{ dayNumber: number; focus: string; nextStep: string }>;
};

export type WorkbookParseResult =
  | { success: true; data: WorkbookData; warnings: string[] }
  | { success: false; errors: string[] };

function rowsOf(workbook: XLSX.WorkBook, sheetName: string) {
  return XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: null,
    raw: true,
  });
}

function value(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function validateHeaders(
  rows: unknown[][],
  sheet: string,
  expected: readonly string[],
  rowIndex: number,
) {
  const actual = (rows[rowIndex] || []).slice(0, expected.length).map(value);
  const differences = expected.flatMap((header, index) =>
    actual[index] === header
      ? []
      : [`${sheet}: kolom ${index + 1} harus “${header}”, ditemukan “${actual[index] || "kosong"}”.`],
  );
  return differences;
}

function toIsoDate(input: unknown): string | null {
  if (!input) return null;
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return input.toISOString().slice(0, 10);
  }
  if (typeof input === "number") {
    const parsed = XLSX.SSF.parse_date_code(input);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }
  const normalized = value(input).replace(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/,
    (month) => month,
  );
  const date = new Date(`${normalized} UTC`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export function parseCurriculumWorkbook(buffer: ArrayBuffer | Buffer): WorkbookParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const requiredSheets = ["Mulai", ...Object.keys(WORKBOOK_HEADERS)];
    const missingSheets = requiredSheets.filter((sheet) => !workbook.SheetNames.includes(sheet));
    if (missingSheets.length) {
      return { success: false, errors: missingSheets.map((sheet) => `Sheet “${sheet}” tidak ditemukan.`) };
    }

    const trackerRows = rowsOf(workbook, "Tracker");
    const planRows = rowsOf(workbook, PLAN_SHEET);
    const conceptRows = rowsOf(workbook, "Kamus Materi");
    const sourceRows = rowsOf(workbook, "Sumber");
    const evaluationRows = rowsOf(workbook, "Evaluasi");

    const headerErrors = [
      ...validateHeaders(trackerRows, "Tracker", WORKBOOK_HEADERS.Tracker, 4),
      ...validateHeaders(planRows, PLAN_SHEET, WORKBOOK_HEADERS[PLAN_SHEET], 4),
      ...validateHeaders(conceptRows, "Kamus Materi", WORKBOOK_HEADERS["Kamus Materi"], 4),
      ...validateHeaders(sourceRows, "Sumber", WORKBOOK_HEADERS.Sumber, 4),
      ...validateHeaders(evaluationRows, "Evaluasi", WORKBOOK_HEADERS.Evaluasi, 14),
    ];
    if (headerErrors.length) return { success: false, errors: headerErrors };

    const plannedDates = new Map<number, string | null>();
    trackerRows.slice(5).forEach((row) => {
      const day = Number(row[0]);
      if (Number.isInteger(day)) plannedDates.set(day, toIsoDate(row[1]));
    });

    const errors: string[] = [];
    const lessons = planRows
      .slice(5)
      .filter((row) => row[0] !== null && row[0] !== "")
      .flatMap((row, index) => {
        const candidate = {
          dayNumber: Number(row[0]),
          phaseNumber: Number(row[1]),
          sessionType: value(row[2]),
          topic: value(row[3]),
          learningTarget: value(row[4]),
          conceptId: value(row[5]),
          definition: value(row[6]),
          examples: value(row[7]),
          vocabularyReview: value(row[8]),
          readingTitle: value(row[9]),
          readingUrl: value(row[10]),
          readingTask: value(row[11]),
          videoTitle: value(row[12]),
          videoUrl: value(row[13]),
          videoTask: value(row[14]),
          speakingTask: value(row[15]),
          writingTask: value(row[16]),
          completionCriteria: value(row[17]),
          targetMinutes: Number(row[18]),
          reviewTask: value(row[19]),
          plannedDate: plannedDates.get(Number(row[0])) ?? null,
        };
        const result = lessonRowSchema.safeParse(candidate);
        if (!result.success) {
          const detail = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
          errors.push(`Baris ${index + 6} (Day ${value(row[0]) || "?"}): ${detail}`);
          return [];
        }
        return [result.data];
      });

    const days = lessons.map((lesson) => lesson.dayNumber);
    const duplicates = days.filter((day, index) => days.indexOf(day) !== index);
    const missingDays = Array.from({ length: 120 }, (_, index) => index + 1).filter(
      (day) => !days.includes(day),
    );
    if (duplicates.length) errors.push(`Day duplikat: ${[...new Set(duplicates)].join(", ")}.`);
    if (missingDays.length) errors.push(`Day tidak lengkap: ${missingDays.join(", ")}.`);
    if (lessons.length !== 120) errors.push(`Kurikulum harus berisi 120 Day; ditemukan ${lessons.length}.`);
    if (errors.length) return { success: false, errors };

    const mulaiRows = rowsOf(workbook, "Mulai");
    const summaries = mulaiRows
      .flat()
      .map(value)
      .filter((text) => /^Day \d+–\d+:/.test(text));
    const phases = Array.from({ length: 4 }, (_, index) => ({
      phaseNumber: index + 1,
      title: `Fase ${index + 1}`,
      summary: summaries[index] || `Day ${index * 30 + 1}–${(index + 1) * 30}`,
      startDay: index * 30 + 1,
      endDay: (index + 1) * 30,
    }));

    const concepts = conceptRows.slice(5).filter((row) => value(row[0])).map((row) => ({
      conceptId: value(row[0]),
      term: value(row[1]),
      simpleDefinition: value(row[2]),
      example: value(row[3]),
      companionUrl: value(row[4]),
      usageLevel: value(row[5]),
    }));

    const sources = sourceRows.slice(5).filter((row) => value(row[0])).map((row) => ({
      sourceId: value(row[0]),
      title: value(row[1]),
      publisher: value(row[2]),
      type: value(row[3]),
      url: value(row[4]),
      checkedAt: toIsoDate(row[5]),
      accessNotes: value(row[6]),
    }));

    const checkpoints = evaluationRows.slice(15).filter((row) => value(row[0])).map((row) => ({
      dayNumber: Number(row[0]),
      focus: value(row[1]),
      nextStep: value(row[8]),
    }));

    const warnings: string[] = [];
    if (concepts.length !== 58) warnings.push(`Workbook memuat ${concepts.length} konsep (file awal memuat 58).`);
    if (sources.length !== 88) warnings.push(`Workbook memuat ${sources.length} sumber (file awal memuat 88).`);
    if (checkpoints.length !== 20) warnings.push(`Workbook memuat ${checkpoints.length} checkpoint (file awal memuat 20).`);

    return { success: true, data: { lessons, phases, concepts, sources, checkpoints }, warnings };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Workbook tidak dapat dibaca."],
    };
  }
}
