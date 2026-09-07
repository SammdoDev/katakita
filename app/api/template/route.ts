import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const file = await readFile(path.join(process.cwd(), "Rencana_Belajar_Inggris_120_Hari.xlsx"));
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Rencana_Belajar_Inggris_120_Hari.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Template workbook tidak ditemukan." }, { status: 404 });
  }
}

