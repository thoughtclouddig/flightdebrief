import { SchoolV2StudentsScreen } from "@/components/school-v2/students-screen";
import { getRepository } from "@/lib/data";
import { schoolAttentionFromRoster } from "@/lib/school-v2/overview";
import { computeSchoolV2Roster } from "@/lib/school-v2/roster";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function SchoolV2StudentsPage() {
  const viewer = await getViewer();
  const repo = getRepository();
  const organizationId = viewer.organization.id;

  const roster = await computeSchoolV2Roster(repo, organizationId);
  const attentionItems = await schoolAttentionFromRoster(repo, roster);
  const attentionByStudentId = new Map(attentionItems.map((item) => [item.studentId, item]));

  const instructors = [...new Map(roster.map((e) => [e.primaryInstructorId, e.primaryInstructorName])).entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <SchoolV2StudentsScreen roster={roster} instructors={instructors} attentionByStudentId={attentionByStudentId} />;
}
