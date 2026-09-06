import type { Metadata } from "next";
import { BackLink, Screen } from "@/components/student/ui";
import { FlightRecorder } from "@/components/prototype/flight-recorder";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { title: "Start flight — AfterFlight", robots: { index: false, follow: false } };

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Start Flight -- the same FlightRecorder component app/v2/fly/page.tsx's fixture branch renders, hrefs built from /demo/student instead of /v2. */
export default function DemoStudentFlyPage() {
  return (
    <Screen>
      <BackLink href={HREFS.home}>Home</BackLink>
      <FlightRecorder addFlightHref={HREFS.flightsNew} debriefNewHref={HREFS.debriefNew} flightsHref={HREFS.flights} />
    </Screen>
  );
}
