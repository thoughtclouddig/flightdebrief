import type { Metadata } from "next";
import { SupportScreen } from "@/components/student/profile/support-screen";

export const metadata: Metadata = { title: "Support — AfterFlight", robots: { index: false, follow: false } };

/** Fixture adapter for components/student/profile/support-screen.tsx. */
export default function SupportPage() {
  return <SupportScreen backHref="/prototype/vector/profile" guideHref="/prototype/vector/profile/guide" trainHref="/prototype/vector/train" />;
}
