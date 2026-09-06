import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeCfiV2Today } from "@/lib/cfi-v2/today";
import { CfiV2TodayScreen } from "@/components/cfi-v2/today-screen";

export const dynamic = "force-dynamic";

export default async function CfiV2TodayPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const data = await computeCfiV2Today(repo, viewer);
  return <CfiV2TodayScreen data={data} />;
}
