import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink, Screen } from "@/components/student/ui";
import { FlightRecorder } from "@/components/prototype/flight-recorder";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Start flight — AfterFlight", robots: { index: false, follow: false } };

/**
 * Milestone 1B fixture-parity Start Flight -- mechanically the same as app/prototype/vector/fly/page.tsx, hrefs repointed at /v2/**. Still fixture/prototype recording behavior, not real production persistence -- see FlightRecorder's own doc comment.
 *
 * Real-data guard: no real web recording-save endpoint exists at all (see
 * lib/student/home-production-adapter.tsx's own doc comment) -- the header's
 * Start Flight icon is already disabled in real-data mode
 * (app/v2/_components/header-actions.tsx), this closes the same gap for
 * direct URL access. notFound() rather than fixture content.
 */
export default async function V2FlyPage() {
  if (v2RealDataMode(await hasV2RealDataCookie())) notFound();
  return (
    <Screen>
      <BackLink href="/v2">Home</BackLink>
      <FlightRecorder addFlightHref="/v2/flights/new" debriefNewHref="/v2/debrief/new" flightsHref="/v2/flights" />
    </Screen>
  );
}
