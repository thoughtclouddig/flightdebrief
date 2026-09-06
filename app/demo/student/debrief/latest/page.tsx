import { DebriefLatestDemo } from "@/components/student/debrief/debrief-latest-demo";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Debrief Detail -- the same DebriefLatestDemo component app/v2/debrief/latest/page.tsx renders, hrefs built from /demo/student instead of /v2. */
export default function DemoStudentDebriefLatest() {
  return (
    <DebriefLatestDemo
      backHref={HREFS.debriefHub}
      momentHrefBase={HREFS.flightMomentsBase("aug-29")}
      chairFlyHref={HREFS.chairFly}
    />
  );
}
