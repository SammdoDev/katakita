import { notFound } from "next/navigation";
import { DataState } from "@/components/data-state";
import { LearningPage } from "@/components/learning-page";
import { getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LearnDayPage({ params }: { params: Promise<{ day: string }> }) {
  const day = Number((await params).day);
  if (!Number.isInteger(day) || day < 1 || day > 120) notFound();
  const data = await getAppData();
  if (!data.lessons.length) return <DataState configured={data.configured} error={data.error} />;
  const lesson = data.lessons.find((item) => item.dayNumber === day);
  if (!lesson) notFound();
  return <LearningPage lesson={lesson} />;
}

