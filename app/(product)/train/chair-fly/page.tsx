import { notFound } from "next/navigation";
import { BackLink, Screen } from "@/components/student/ui";
import { ChairFlySession } from "@/components/student/chair-fly-session";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { buildProductionChairFlyDrill } from "@/lib/student/chair-fly-production-adapter";

export const dynamic = "force-dynamic";

/**
 * Real Chair Flying -- wired to the approved V2 presentation
 * (components/student/chair-fly-session.tsx) via
 * lib/student/chair-fly-production-adapter.ts, shared verbatim with
 * app/v2/train/chair-fly/page.tsx's own real-data branch. See that
 * adapter's own doc comment for why a null drill is a real, correct failure.
 */
export default async function TrainChairFlyPage() {
  const viewer = await getViewer();
  const drill = await buildProductionChairFlyDrill(getRepository(), viewer);
  if (!drill) notFound();

  return (
    <Screen>
      <BackLink href="/train">Train</BackLink>
      <ChairFlySession drill={drill} homeHref="/home" />
    </Screen>
  );
}
