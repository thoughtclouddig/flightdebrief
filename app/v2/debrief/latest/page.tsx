import { DebriefLatestDemo } from "@/components/student/debrief/debrief-latest-demo";

/** Milestone 1B fixture-parity Debrief Detail -- mechanically the same as app/prototype/vector/debrief/latest/page.tsx, hrefs repointed at /v2/**. */
export default function V2DebriefLatest() {
  return (
    <DebriefLatestDemo
      backHref="/v2/debrief"
      momentHrefBase="/v2/flights/aug-29/moments"
      chairFlyHref="/v2/train/chair-fly"
    />
  );
}
