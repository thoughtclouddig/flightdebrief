import { AddFlightDemo } from "@/components/student/flights/add-flight-demo";

/** Milestone 1B fixture-parity Add Flight -- mechanically the same as app/prototype/vector/flights/new/page.tsx, hrefs repointed at /v2/**. */
export default function V2AddFlight() {
  return <AddFlightDemo myFlightsHref="/v2/flights" debriefNewHref="/v2/debrief/new" homeHref="/v2" />;
}
