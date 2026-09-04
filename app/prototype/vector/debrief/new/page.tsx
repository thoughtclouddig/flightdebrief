import { GuidedDebriefDemo } from "@/components/student/debrief/guided-debrief-demo";

/** Fixture adapter for components/student/debrief/guided-debrief-demo.tsx -- see that file's doc comment for the shared 9-stage flow. */
export default function NewDebriefPage() {
  return (
    <GuidedDebriefDemo
      hubHref="/prototype/vector/debrief"
      addFlightHref="/prototype/vector/flights/new"
      resultHref="/prototype/vector/debrief/latest"
    />
  );
}
