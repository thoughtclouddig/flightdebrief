import { notFound } from "next/navigation";
import { SchoolV2StudentDetailScreen } from "@/components/school-v2/student-detail-screen";
import { getRepository } from "@/lib/data";
import { computeCfiV2StudentDetail } from "@/lib/cfi-v2/student-detail";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * View-only -- reuses CFI V2's own computeCfiV2StudentDetail verbatim (the
 * layout above already gates this to an org admin, and that function
 * already branches admin-safe fields behind isCfiOrAdmin), rendered by a
 * School-specific screen component that never imports an editing control.
 */
export default async function SchoolV2StudentDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const viewer = await getViewer();
  const repo = getRepository();

  const detail = await computeCfiV2StudentDetail(repo, viewer, id);
  if (!detail) notFound();

  return <SchoolV2StudentDetailScreen detail={detail} />;
}
