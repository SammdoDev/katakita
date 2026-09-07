import { z } from "zod";
import { submissionSchema } from "@/lib/tests/contracts";
import { TestError } from "@/lib/tests/ai";
import { readTests, startTest, submitTest } from "@/lib/tests/service";

export const runtime = "nodejs";
export const maxDuration = 60;

function failure(error: unknown) {
  if (error instanceof TestError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "Isian tes belum lengkap atau formatnya tidak valid." }, { status: 400 });
  return Response.json({ error: "Tes belum dapat diakses. Periksa koneksi database dan jalankan migration terbaru." }, { status: 503 });
}

export async function GET(request: Request) {
  try {
    const day = z.coerce.number().int().min(1).max(120).parse(new URL(request.url).searchParams.get("day"));
    return Response.json(await readTests(day), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) throw new TestError("Permintaan harus berasal dari aplikasi KataKita.", 403);
    if (!request.headers.get("content-type")?.includes("application/json")) throw new TestError("Gunakan format JSON.", 415);
    const body = await request.text();
    if (body.length > 16000) throw new TestError("Jawaban terlalu panjang.", 413);
    const input = JSON.parse(body);
    if (input.action === "generate") {
      const day = z.number().int().min(1).max(120).parse(input.dayNumber);
      return Response.json({ attempt: await startTest(day) });
    }
    if (input.action === "submit") return Response.json({ attempt: await submitTest(submissionSchema.parse(input)) });
    throw new TestError("Aksi tes tidak dikenali.");
  } catch (error) { return failure(error); }
}
