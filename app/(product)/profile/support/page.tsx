import { SupportScreen } from "@/components/student/profile/support-screen";

/**
 * Production's real Support screen -- previously only reachable under the
 * gated /v2/** and /prototype/vector/** trees (see
 * app/v2/profile/support/page.tsx), while the actual authenticated header
 * and Profile Support actions pointed at a bare mailto: link that opened
 * nothing when no local mail client was configured. Mounts the same shared
 * SupportScreen those trees already use, mechanically the same as
 * app/v2/profile/support/page.tsx, hrefs repointed at the real (product)
 * routes rather than /v2/**.
 */
export default function SupportPage() {
  return <SupportScreen backHref="/profile" guideHref="/profile/guide" trainHref="/train" />;
}
