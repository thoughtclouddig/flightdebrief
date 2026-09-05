import type { Metadata } from "next";
import { SupportScreen } from "@/components/student/profile/support-screen";

export const metadata: Metadata = { title: "Support — AfterFlight" };

/**
 * Real Support -- the same components/student/profile/support-screen.tsx
 * `/v2` renders. The real support email (mailto:support@getafterflight.com)
 * is already hardcoded inside SupportScreen itself, not a prop -- so nothing
 * about the working support contact changes here, only the presentation
 * wrapping it (previously a bare mailto link straight off Profile, with no
 * FAQ or cross-links).
 */
export default function SupportPage() {
  return <SupportScreen backHref="/profile" guideHref="/profile/guide" trainHref="/train" />;
}
