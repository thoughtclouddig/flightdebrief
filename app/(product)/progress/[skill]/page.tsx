import { notFound } from "next/navigation";
import { SkillDetailScreen } from "@/components/student/progress/skill-detail";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { buildProductionSkillDetailProps } from "@/lib/student/skill-detail-production-adapter";

export const dynamic = "force-dynamic";

/**
 * Thin data-fetching wrapper -- real logic lives in
 * lib/student/skill-detail-production-adapter.tsx, shared verbatim with
 * app/v2/progress/[skill]/page.tsx's own real-data branch.
 */
export default async function SkillDetailPage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill: skillParam } = await params;
  const repo = getRepository();
  const viewer = await getViewer();

  const props = await buildProductionSkillDetailProps(repo, viewer, skillParam, {
    trainHref: "/train",
    chairFlyHref: "/train/chair-fly",
    radioPracticeHref: "/train/radio-practice",
  });
  if (!props) notFound();

  return <SkillDetailScreen {...props} backHref="/progress" lessonHistoryHref="/debrief" />;
}
