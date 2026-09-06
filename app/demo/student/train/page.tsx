import { V2TrainFixture } from "@/app/v2/train/fixture-train";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Train -- the same V2TrainFixture component app/v2/train/page.tsx's fixture branch renders, hrefs built from /demo/student instead of /v2. */
export default function DemoStudentTrain() {
  return <V2TrainFixture hrefs={{ chairFlyHref: HREFS.chairFly, progressBasePath: HREFS.progress }} />;
}
