import { DebriefLatestDemo } from "@/components/student/debrief/debrief-latest-demo";

/** Fixture adapter for components/student/debrief/debrief-latest-demo.tsx. */
export default function DebriefLatestPage() {
  return (
    <DebriefLatestDemo
      backHref="/prototype/vector/debrief"
      momentHrefBase="/prototype/vector/flights/aug-29/moments"
      chairFlyHref="/prototype/vector/train/chair-fly"
    />
  );
}
