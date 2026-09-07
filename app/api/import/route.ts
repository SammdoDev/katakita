import { NextResponse } from "next/server";
import { parseCurriculumWorkbook } from "@/lib/excel";
import { importCurriculum } from "@/lib/import-curriculum";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const mode = formData.get("mode");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, errors: ["Pilih file Excel terlebih dahulu."] }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ success: false, errors: ["Format file harus .xlsx."] }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ success: false, errors: ["Ukuran file maksimal 8 MB."] }, { status: 400 });
    }

    const parsed = parseCurriculumWorkbook(Buffer.from(await file.arrayBuffer()));
    if (!parsed.success) return NextResponse.json(parsed, { status: 422 });

    if (mode === "preview") {
      return NextResponse.json({
        success: true,
        summary: {
          lessons: parsed.data.lessons.length,
          concepts: parsed.data.concepts.length,
          sources: parsed.data.sources.length,
          checkpoints: parsed.data.checkpoints.length,
        },
        preview: parsed.data.lessons.slice(0, 8).map((lesson) => ({
          dayNumber: lesson.dayNumber,
          phaseNumber: lesson.phaseNumber,
          topic: lesson.topic,
          sessionType: lesson.sessionType,
          targetMinutes: lesson.targetMinutes,
        })),
        warnings: parsed.warnings,
      });
    }

    if (mode !== "import") {
      return NextResponse.json({ success: false, errors: ["Mode import tidak dikenali."] }, { status: 400 });
    }
    const result = await importCurriculum(parsed.data);
    return NextResponse.json({ success: true, result, warnings: parsed.warnings });
  } catch (error) {
    return NextResponse.json(
      { success: false, errors: [error instanceof Error ? error.message : "Import gagal diproses."] },
      { status: 500 },
    );
  }
}

