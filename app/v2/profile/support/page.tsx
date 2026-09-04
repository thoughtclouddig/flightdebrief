import type { Metadata } from "next";
import { SupportScreen } from "@/components/student/profile/support-screen";

export const metadata: Metadata = { title: "Support — AfterFlight", robots: { index: false, follow: false } };

/** Milestone 1B fixture-parity Support -- mechanically the same as app/prototype/vector/profile/support/page.tsx, hrefs repointed at /v2/**. */
export default function V2SupportPage() {
  return <SupportScreen backHref="/v2/profile" guideHref="/v2/profile/guide" trainHref="/v2/train" />;
}
