import { SchoolV2InstructorsScreen } from "@/components/school-v2/instructors-screen";
import { getRepository } from "@/lib/data";
import { computeSchoolV2Instructors } from "@/lib/school-v2/instructors";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function SchoolV2InstructorsPage() {
  const viewer = await getViewer();
  const repo = getRepository();
  const instructors = await computeSchoolV2Instructors(repo, viewer.organization.id);
  return <SchoolV2InstructorsScreen instructors={instructors} />;
}
