import type { Metadata } from "next";
import { BackLink, Screen } from "@/components/prototype/ui";
import { FlightRecorder } from "@/components/prototype/flight-recorder";

export const metadata: Metadata = { title: "Start flight — AfterFlight", robots: { index: false, follow: false } };

/**
 * The third way a Flight gets into AfterFlight, and the only one that owns
 * its own clock: START FLIGHT records directly, DETECT FLIGHT matches an
 * ADS-B track after the fact, ADD FLIGHT is the manual fallback. All three
 * normalize into the same telemetry model.
 */
export default function FlyPage() {
  return (
    <Screen>
      <BackLink href="/prototype/vector">Home</BackLink>
      <FlightRecorder />
    </Screen>
  );
}
