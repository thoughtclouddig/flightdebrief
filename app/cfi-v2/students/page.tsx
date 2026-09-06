import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeCfiV2Roster } from "@/lib/cfi-v2/roster";
import { CfiV2RosterScreen } from "@/components/cfi-v2/roster-screen";

export const dynamic = "force-dynamic";

export default async function CfiV2StudentsPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const roster = await computeCfiV2Roster(repo, viewer);
  return <CfiV2RosterScreen roster={roster} />;
}
