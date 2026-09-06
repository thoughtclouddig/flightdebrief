import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeCfiV2StudentDetail } from "@/lib/cfi-v2/student-detail";
import { CfiV2StudentDetailScreen } from "@/components/cfi-v2/student-detail-screen";

export const dynamic = "force-dynamic";

export default async function CfiV2StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepository();
  const viewer = await getViewer();
  const detail = await computeCfiV2StudentDetail(repo, viewer, id);
  if (!detail) notFound();

  // Marks the CFI's "Review student training history" Guide step (lib/guide.ts) --
  // same step canonical /cfi/students/[id] marks, since this is the same capability.
  if (!viewer.user.guideProgress?.progress) {
    void repo.markGuideStepViewed(viewer.user.id, "progress").catch(() => {});
  }

  return <CfiV2StudentDetailScreen detail={detail} />;
}
