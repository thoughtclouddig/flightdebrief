import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink, Screen } from "@/components/student/ui";
import { ChairFlySession } from "@/components/student/chair-fly-session";
import { recommendedDrill } from "@/lib/prototype/chair-fly";

export const metadata: Metadata = { title: "Chair fly — AfterFlight", robots: { index: false, follow: false } };

/**
 * The one route Chair Flying adds.
 *
 * It could have been another mode inside Train's page state, and the quiz and
 * ask surfaces still are. This one is not, for two reasons: the rehearsal
 * needs the whole screen (Train's recommendation panel above it would be a
 * second claim competing with the situation the student is supposed to be
 * picturing), and every screen in this product is deep-linkable -- Vector
 * recommending a specific drill has to be a thing you can send someone to.
 *
 * The drill is resolved on the server from the seeded debrief, so what the
 * page renders is the derivation, not a client-side guess at it.
 */
export default function ChairFlyPage() {
  const drill = recommendedDrill();
  // No contested objective on the last flight means no drill. Saying so with
  // a 404 is better than inventing a generic crosswind lesson, which is the
  // exact thing this feature is not.
  if (!drill) notFound();

  return (
    <Screen>
      <BackLink href="/prototype/vector/train">Train</BackLink>
      <ChairFlySession drill={drill} />
    </Screen>
  );
}
