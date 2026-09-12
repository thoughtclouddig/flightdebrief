import { VectorTrainingSession } from "@/components/student/vector-training-session";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { buildVectorSessionProps } from "@/lib/student/vector-session-adapter";

export const dynamic = "force-dynamic";

/**
 * The one destination "Train with Vector" always links to (see
 * lib/student/vector-coaching.ts's buildVectorSession). What happens once
 * the student is here -- hand off to Chair Fly, hand off to Radio Practice,
 * or run Vector's own bounded knowledge-check interaction -- is decided by
 * lib/student/vector-session-adapter.ts, independently of what Train's own
 * top panel showed, from this student's own real signals.
 */
export default async function TrainVectorPage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  const repo = getRepository();
  const viewer = await getViewer();

  const props = await buildVectorSessionProps(repo, viewer, skill, {
    chairFlyHref: "/train/chair-fly",
    radioPracticeHref: "/train/radio-practice",
  });

  return <VectorTrainingSession {...props} evaluateHref={`/api/train/vector/${skill}/evaluate`} trainHref="/train" />;
}
