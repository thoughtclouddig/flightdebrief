import { SchoolV2InsightsScreen } from "@/components/school-v2/insights-screen";
import { getRepository } from "@/lib/data";
import { computeSchoolV2Insights } from "@/lib/school-v2/insights";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function SchoolV2InsightsPage() {
  const viewer = await getViewer();
  const repo = getRepository();
  const data = await computeSchoolV2Insights(repo, viewer);
  return <SchoolV2InsightsScreen data={data} />;
}
