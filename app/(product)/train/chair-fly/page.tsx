import { notFound } from "next/navigation";
import { BackLink, Screen } from "@/components/student/ui";
import { ChairFlySession } from "@/components/student/chair-fly-session";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { skillLabel } from "@/lib/topics";
import { buildChairFlyDrillForUnit, buildProductionChairFlyDrill } from "@/lib/student/chair-fly-production-adapter";
import { resolveOwnedTrainingItem } from "@/lib/student/train-units";

export const dynamic = "force-dynamic";

/**
 * Real Chair Flying -- wired to the approved V2 presentation
 * (components/student/chair-fly-session.tsx). With ?item=<TrainingItem id>
 * (how every Vector training unit hands off to Chair Fly -- see
 * lib/student/vector-session-adapter.ts), the drill is framed from that
 * exact unit's own evidence. Without it (a bare visit to /train/chair-fly),
 * falls back to the last debrief's own contested objective, unchanged.
 */
export default async function TrainChairFlyPage({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  const { item: itemId } = await searchParams;
  const repo = getRepository();
  const viewer = await getViewer();

  if (itemId) {
    const owned = await resolveOwnedTrainingItem(repo, viewer.user.id, itemId);
    if (!owned) notFound();
    const drill = await buildChairFlyDrillForUnit(repo, viewer, {
      skill: owned.skill,
      skillLabel: skillLabel(owned.skill),
      evidence: { label: "", text: owned.item.description },
    });
    if (!drill) notFound();
    return (
      <Screen>
        <BackLink href="/train">Train</BackLink>
        <ChairFlySession drill={drill} homeHref="/home" />
      </Screen>
    );
  }

  const drill = await buildProductionChairFlyDrill(repo, viewer);
  if (!drill) notFound();

  return (
    <Screen>
      <BackLink href="/train">Train</BackLink>
      <ChairFlySession drill={drill} homeHref="/home" />
    </Screen>
  );
}
