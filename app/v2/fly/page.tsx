import type { Metadata } from "next";
import { BackLink, Screen } from "@/components/student/ui";
import { FlightRecorder } from "@/components/prototype/flight-recorder";

export const metadata: Metadata = { title: "Start flight — AfterFlight", robots: { index: false, follow: false } };

/** Milestone 1B fixture-parity Start Flight -- mechanically the same as app/prototype/vector/fly/page.tsx, hrefs repointed at /v2/**. Still fixture/prototype recording behavior, not real production persistence -- see FlightRecorder's own doc comment. */
export default function V2FlyPage() {
  return (
    <Screen>
      <BackLink href="/v2">Home</BackLink>
      <FlightRecorder addFlightHref="/v2/flights/new" debriefNewHref="/v2/debrief/new" flightsHref="/v2/flights" />
    </Screen>
  );
}
