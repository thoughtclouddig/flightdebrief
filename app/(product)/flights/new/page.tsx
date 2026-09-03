import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { NewFlightClient } from "./new-flight-client";
import { StudentNewFlightClient } from "./student-new-flight-client";

export const dynamic = "force-dynamic";

/** Instructor/admin viewers pick a student on this page instead of entering an instructor name -- they ARE the instructor of record, see app/api/flights/route.ts's studentId handling. */
export default async function NewFlightPage(props: PageProps<"/flights/new">) {
  const repo = getRepository();
  const viewer = await getViewer();
  const searchParams = await props.searchParams;
  const isCfiOrAdmin = viewer.role === "instructor" || viewer.role === "admin";

  const instructorMembers = await repo.listMembers(viewer.organization.id, "instructor");
  const instructors = await Promise.all(instructorMembers.map((m) => repo.getUser(m.userId)));
  const instructorNames = instructors
    .filter((i): i is NonNullable<typeof i> => i !== null)
    .map((i) => i.name)
    .sort((a, b) => a.localeCompare(b));

  let students: { id: string; name: string }[] | undefined;
  if (isCfiOrAdmin) {
    const studentUserIds =
      viewer.role === "instructor"
        ? (await repo.listStudentLinksForInstructor(viewer.user.id, viewer.organization.id)).map((l) => l.studentId)
        : (await repo.listMembers(viewer.organization.id, "student")).map((m) => m.userId);
    const studentUsers = await Promise.all(studentUserIds.map((id) => repo.getUser(id)));
    students = studentUsers
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => ({ id: s.id, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const initialStudentId = typeof searchParams.studentId === "string" ? searchParams.studentId : undefined;

  if (!isCfiOrAdmin) {
    return (
      <StudentNewFlightClient
        instructorNames={instructorNames}
        allowInviteCfi={viewer.organization.kind === "individual"}
      />
    );
  }

  return (
    <NewFlightClient
      instructorNames={instructorNames}
      allowInviteCfi={viewer.role === "student" && viewer.organization.kind === "individual"}
      students={students}
      initialStudentId={initialStudentId}
    />
  );
}
