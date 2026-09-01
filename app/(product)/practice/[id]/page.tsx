import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { RadioPracticeSession } from "@/components/radio-practice-session";

export const dynamic = "force-dynamic";

export default async function PracticeSessionPage(props: PageProps<"/practice/[id]">) {
  const { id } = await props.params;
  const viewer = await getViewer();
  const repo = getRepository();

  const assignment = await repo.getRadioPracticeAssignment(id);
  if (!assignment || assignment.studentId !== viewer.user.id) notFound();

  const scenario = RADIO_PRACTICE_SCENARIOS.find((s) => s.id === assignment.scenarioId);
  if (!scenario) notFound();

  // The next thing waiting for them. Finishing one assignment used to offer
  // only "Back to Home", so a student with three assigned calls had to
  // navigate back and find the next one each time -- friction on exactly the
  // behavior the feature wants (do several in a sitting).
  const assignments = await repo.listRadioPracticeAssignments(viewer.user.id);
  const next =
    assignments.find((a) => a.id !== assignment.id && a.status !== "completed") ?? null;
  const nextScenario = next
    ? RADIO_PRACTICE_SCENARIOS.find((s) => s.id === next.scenarioId) ?? null
    : null;

  return (
    <RadioPracticeSession
      assignment={assignment}
      scenario={scenario}
      next={next && nextScenario ? { id: next.id, title: nextScenario.title } : null}
    />
  );
}
