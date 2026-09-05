import { redirect } from "next/navigation";
import { StudentTrain } from "@/components/student/student-train";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";
import { getViewer } from "@/lib/viewer";
import { getRepository } from "@/lib/data";
import { buildProductionTrainProps } from "@/lib/student/train-production-adapter";
import { V2TrainFixture } from "./fixture-train";

/**
 * Development real-data milestone: real branch mirrors app/v2/page.tsx's own
 * shape -- same adapter app/(product)/train/page.tsx uses, hrefs repointed
 * at /v2/**. Review/Quiz/Ask stay disabled in both branches (see the
 * adapter's own doc comment -- no production version exists at all, not a
 * per-mode decision).
 */
export default async function V2TrainPage() {
  if (v2RealDataMode(await hasV2RealDataCookie())) {
    let viewer;
    try {
      viewer = await getViewer();
    } catch {
      redirect("/login?from=%2Fv2%2Ftrain&reason=no-session");
    }
    const props = await buildProductionTrainProps(getRepository(), viewer, {
      chairFlyHref: "/v2/train/chair-fly",
      skillHref: (skill) => `/progress/${skill}`,
    });
    return <StudentTrain {...props} />;
  }

  return <V2TrainFixture />;
}
