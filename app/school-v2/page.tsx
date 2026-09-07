import { SchoolV2OverviewScreen } from "@/components/school-v2/overview-screen";
import { getRepository } from "@/lib/data";
import { computeSchoolV2Overview } from "@/lib/school-v2/overview";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function SchoolV2OverviewPage() {
  const viewer = await getViewer();
  const repo = getRepository();
  const data = await computeSchoolV2Overview(repo, viewer);
  return <SchoolV2OverviewScreen data={data} />;
}
