import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeCfiV2DebriefQueue } from "@/lib/cfi-v2/debrief-queue";
import { CfiV2DebriefQueueScreen } from "@/components/cfi-v2/debrief-queue-screen";

export const dynamic = "force-dynamic";

export default async function CfiV2DebriefQueuePage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const queue = await computeCfiV2DebriefQueue(repo, viewer);
  return <CfiV2DebriefQueueScreen queue={queue} />;
}
