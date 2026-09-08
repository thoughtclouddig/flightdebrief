import { GuidedDebriefDemo } from "@/components/student/debrief/guided-debrief-demo";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's guided debrief -- the same GuidedDebriefDemo component app/v2/debrief/new/page.tsx's fixture branch renders, hrefs built from /demo/student instead of /v2. */
export default function DemoStudentNewDebrief() {
  return <GuidedDebriefDemo hubHref={HREFS.debriefHub} resultHref={HREFS.debriefLatest} />;
}
