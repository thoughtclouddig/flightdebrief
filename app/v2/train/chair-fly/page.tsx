import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink, Screen } from "@/components/student/ui";
import { ChairFlySession } from "@/components/student/chair-fly-session";
import { recommendedDrill } from "@/lib/prototype/chair-fly";

export const metadata: Metadata = { title: "Chair fly — AfterFlight", robots: { index: false, follow: false } };

/** Milestone 1A fixture-parity Chair Fly -- mechanically the same as app/prototype/vector/train/chair-fly/page.tsx, hrefs repointed at /v2/**. */
export default function V2ChairFly() {
  const drill = recommendedDrill();
  if (!drill) notFound();

  return (
    <Screen>
      <BackLink href="/v2/train">Train</BackLink>
      <ChairFlySession drill={drill} homeHref="/v2" />
    </Screen>
  );
}
