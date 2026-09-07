import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseCurriculumWorkbook } from "../lib/excel";
import { importCurriculum } from "../lib/import-curriculum";

async function main() {
  const workbookPath = path.join(process.cwd(), "Rencana_Belajar_Inggris_120_Hari.xlsx");
  const file = await readFile(workbookPath);
  const parsed = parseCurriculumWorkbook(file);
  if (!parsed.success) throw new Error(parsed.errors.join("\n"));
  const result = await importCurriculum(parsed.data);
  console.log(`Import selesai: ${result.imported} Day, ${result.vocabularies} kosakata, ${result.sources} sumber.`);
  parsed.warnings.forEach((warning) => console.warn(`Peringatan: ${warning}`));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

