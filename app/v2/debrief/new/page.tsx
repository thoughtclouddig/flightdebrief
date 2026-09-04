import { GuidedDebriefDemo } from "@/components/student/debrief/guided-debrief-demo";

/** Milestone 1B fixture-parity guided debrief -- mechanically the same as app/prototype/vector/debrief/new/page.tsx, hrefs repointed at /v2/**. */
export default function V2NewDebrief() {
  return <GuidedDebriefDemo hubHref="/v2/debrief" addFlightHref="/v2/flights/new" resultHref="/v2/debrief/latest" />;
}
