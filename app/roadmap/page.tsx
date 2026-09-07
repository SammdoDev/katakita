import { DataState } from "@/components/data-state";
import { RoadmapGrid } from "@/components/roadmap-grid";
import { getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const data = await getAppData();
  if (!data.lessons.length) return <DataState configured={data.configured} error={data.error} />;
  return <RoadmapGrid lessons={data.lessons} />;
}

