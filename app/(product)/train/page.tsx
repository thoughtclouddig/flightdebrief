import { StudentTrain } from "@/components/student/student-train";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { buildProductionTrainProps } from "@/lib/student/train-production-adapter";

export const dynamic = "force-dynamic";

/**
 * Thin data-fetching wrapper -- all the real panel/skill-list content lives
 * in components/student/student-train.tsx, the same component
 * app/prototype/vector/train/page.tsx renders (its "menu" state) with
 * fixture props. Real logic lives in lib/student/train-production-adapter.ts,
 * shared verbatim with app/v2/train/page.tsx's own real-data branch --
 * extracted so both trees share one data-computation path, no presentation
 * change here (same component, same props as before extraction).
 */
export default async function TrainPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const props = await buildProductionTrainProps(repo, viewer, {
    chairFlyHref: "/train/chair-fly",
    skillHref: (skill) => `/progress/${skill}`,
  });

  return <StudentTrain {...props} />;
}
