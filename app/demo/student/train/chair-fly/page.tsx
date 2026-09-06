import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink, Screen } from "@/components/student/ui";
import { ChairFlySession } from "@/components/student/chair-fly-session";
import { recommendedDrill } from "@/lib/prototype/chair-fly";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { title: "Chair fly — AfterFlight", robots: { index: false, follow: false } };

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Chair Fly -- the same ChairFlySession component and recommendedDrill() fixture app/v2/train/chair-fly/page.tsx's fixture branch renders, hrefs built from /demo/student instead of /v2. */
export default function DemoStudentChairFly() {
  const drill = recommendedDrill();
  if (!drill) notFound();

  return (
    <Screen>
      <BackLink href={HREFS.train}>Train</BackLink>
      <ChairFlySession drill={drill} homeHref={HREFS.home} />
    </Screen>
  );
}
