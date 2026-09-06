import { AddFlightDemo } from "@/components/student/flights/add-flight-demo";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Add Flight -- the same AddFlightDemo component app/v2/flights/new/page.tsx's fixture branch renders, hrefs built from /demo/student instead of /v2. */
export default function DemoStudentAddFlight() {
  return <AddFlightDemo myFlightsHref={HREFS.flights} debriefNewHref={HREFS.debriefNew} homeHref={HREFS.home} />;
}
