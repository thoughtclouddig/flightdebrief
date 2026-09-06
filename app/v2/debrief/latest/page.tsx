import { notFound } from "next/navigation";
import { DebriefLatestDemo } from "@/components/student/debrief/debrief-latest-demo";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";

/**
 * Milestone 1B fixture-parity Debrief Detail -- mechanically the same as app/prototype/vector/debrief/latest/page.tsx, hrefs repointed at /v2/**.
 *
 * Real-data guard: the real Debrief hub always points its results links at
 * /v2/flights/[id]/debrief/results, never here -- nothing in the real-data
 * graph reaches this route. notFound() rather than fixture content.
 */
export default async function V2DebriefLatest() {
  if (v2RealDataMode(await hasV2RealDataCookie())) notFound();
  return (
    <DebriefLatestDemo
      backHref="/v2/debrief"
      momentHrefBase="/v2/flights/aug-29/moments"
      chairFlyHref="/v2/train/chair-fly"
    />
  );
}
