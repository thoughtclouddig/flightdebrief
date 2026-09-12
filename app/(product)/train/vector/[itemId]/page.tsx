import { notFound } from "next/navigation";
import { VectorTrainingSession } from "@/components/student/vector-training-session";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { buildVectorSessionProps } from "@/lib/student/vector-session-adapter";

export const dynamic = "force-dynamic";

/**
 * The one destination "Train with Vector" always links to, one per
 * Vector-training-unit (lib/student/train-units.ts), keyed by that unit's
 * own TrainingItem id. What happens once the student is here -- hand off to
 * Chair Fly, hand off to Radio Practice, or run Vector's own bounded
 * knowledge-check interaction -- is decided by
 * lib/student/vector-session-adapter.ts from this exact item's own real
 * evidence, independently of what Train's card list showed.
 */
export default async function TrainVectorPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const repo = getRepository();
  const viewer = await getViewer();

  const props = await buildVectorSessionProps(repo, viewer, itemId, {
    chairFlyHref: `/train/chair-fly?item=${itemId}`,
    radioPracticeHref: "/train/radio-practice",
  });
  if (!props) notFound();

  return <VectorTrainingSession {...props} evaluateHref={`/api/train/vector/${itemId}/evaluate`} trainHref="/train" />;
}
