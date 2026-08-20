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

  return <RadioPracticeSession assignment={assignment} scenario={scenario} />;
}
