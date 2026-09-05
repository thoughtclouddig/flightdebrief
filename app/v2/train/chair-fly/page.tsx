import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BackLink, Screen } from "@/components/student/ui";
import { ChairFlySession } from "@/components/student/chair-fly-session";
import { recommendedDrill } from "@/lib/prototype/chair-fly";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";
import { getViewer } from "@/lib/viewer";
import { getRepository } from "@/lib/data";
import { buildProductionChairFlyDrill } from "@/lib/student/chair-fly-production-adapter";

export const metadata: Metadata = { title: "Chair fly — AfterFlight", robots: { index: false, follow: false } };

/** Milestone 1A fixture-parity Chair Fly -- mechanically the same as app/prototype/vector/train/chair-fly/page.tsx, hrefs repointed at /v2/**. Development real-data milestone adds the real branch alongside it, sharing the adapter app/(product)/train/chair-fly/page.tsx uses. */
export default async function V2ChairFly() {
  if (v2RealDataMode(await hasV2RealDataCookie())) {
    let viewer;
    try {
      viewer = await getViewer();
    } catch {
      redirect("/login?from=%2Fv2%2Ftrain%2Fchair-fly&reason=no-session");
    }
    const drill = await buildProductionChairFlyDrill(getRepository(), viewer);
    if (!drill) notFound();
    return (
      <Screen>
        <BackLink href="/v2/train">Train</BackLink>
        <ChairFlySession drill={drill} homeHref="/v2" />
      </Screen>
    );
  }

  const drill = recommendedDrill();
  if (!drill) notFound();

  return (
    <Screen>
      <BackLink href="/v2/train">Train</BackLink>
      <ChairFlySession drill={drill} homeHref="/v2" />
    </Screen>
  );
}
