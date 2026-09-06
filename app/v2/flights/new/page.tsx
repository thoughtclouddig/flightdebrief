import { notFound } from "next/navigation";
import { AddFlightDemo } from "@/components/student/flights/add-flight-demo";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";

/**
 * Milestone 1B fixture-parity Add Flight -- mechanically the same as app/prototype/vector/flights/new/page.tsx, hrefs repointed at /v2/**.
 *
 * Real-data guard: real Add Flight (app/(product)/flights/new/student-new-
 * flight-client.tsx) is a completely different, much larger form with no
 * shared shape with this fixture demo -- presenting it through this UI
 * would be new product design, not a wire-up (see Home/Flights list, both
 * of which now keep Add Flight consistently disabled in real-data mode
 * rather than linking here). notFound() rather than fixture content, since
 * nothing in the real-data graph points here anyway.
 */
export default async function V2AddFlight() {
  if (v2RealDataMode(await hasV2RealDataCookie())) notFound();
  return <AddFlightDemo myFlightsHref="/v2/flights" debriefNewHref="/v2/debrief/new" homeHref="/v2" />;
}
