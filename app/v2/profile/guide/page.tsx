import type { Metadata } from "next";
import { GuideScreen } from "@/components/student/profile/guide-screen";
import { ACS_AREAS } from "@/lib/prototype-fixtures/vector-data";

export const metadata: Metadata = { title: "How AfterFlight works — AfterFlight", robots: { index: false, follow: false } };

/** Milestone 1B fixture-parity Guide -- mechanically the same as app/prototype/vector/profile/guide/page.tsx, hrefs repointed at /v2/**. */
export default function V2GuidePage() {
  return <GuideScreen backHref="/v2/profile" acsArea={ACS_AREAS.landings} />;
}
