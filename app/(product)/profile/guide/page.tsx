import { GuideScreen } from "@/components/student/profile/guide-screen";

/**
 * Production's real "How AfterFlight works" screen -- previously only
 * reachable under the gated /v2/** and /prototype/vector/** trees, while
 * Profile's own "How AfterFlight works" row linked out to the public
 * /how-it-works marketing page, dropping a signed-in student into marketing
 * chrome mid-session. Mounts the same shared GuideScreen those trees already
 * use. GuideScreen's score card is illustrative in every caller (score/max/
 * code are hardcoded inside the component itself, not passed in), so this
 * only needs a real, generic ACS area name -- same literal string
 * app/v2/profile/guide/page.tsx's own real-data branch already uses, rather
 * than importing a name from lib/prototype-fixtures/**.
 */
export default function GuidePage() {
  return <GuideScreen backHref="/profile" acsArea="Takeoffs, Landings, and Go-Arounds" />;
}
