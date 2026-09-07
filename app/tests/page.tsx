import { TestCenter } from "@/components/test-center";
import { getAppData } from "@/lib/data";
import { aiConfigured } from "@/lib/tests/ai";

export const dynamic = "force-dynamic";
export const metadata = { title: "Latihan TOEFL & Tes AI" };

export default async function TestsPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const data = await getAppData();
  const requestedDay = Number((await searchParams).day);
  const available = data.lessons.map(({ dayNumber, topic, status }) => ({ dayNumber, topic, completed: status === "Selesai" }));
  const day = available.some((lesson) => lesson.dayNumber === requestedDay) ? requestedDay : available.find((lesson) => lesson.completed)?.dayNumber || 1;
  return <TestCenter key={day} lessons={available} initialDay={day} configured={aiConfigured()} databaseReady={data.configured && !data.error && available.length > 0} />;
}
