import type { Metadata } from "next";
import { GuideScreen } from "@/components/student/profile/guide-screen";
import { ACS_AREAS } from "@/lib/prototype-fixtures/vector-data";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";

export const metadata: Metadata = { title: "How AfterFlight works — AfterFlight", robots: { index: false, follow: false } };

/**
 * Milestone 1B fixture-parity Guide -- mechanically the same as
 * app/prototype/vector/profile/guide/page.tsx, hrefs repointed at /v2/**.
 *
 * GuideScreen's score card is illustrative in every caller (score/max/code
 * are hardcoded inside the component itself, not passed in) -- real mode
 * only needs a real, generic ACS area name, same as
 * app/(product)/profile/guide/page.tsx.
 */
export default async function V2GuidePage() {
  if (v2RealDataMode(await hasV2RealDataCookie())) {
    return <GuideScreen backHref="/v2/profile" acsArea="Takeoffs, Landings, and Go-Arounds" />;
  }
  return <GuideScreen backHref="/v2/profile" acsArea={ACS_AREAS.landings} />;
}
