import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { InviteStudentForm } from "@/components/admin/invite-student-form";
import { MemberStatusButton } from "@/components/admin/member-status-button";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage(props: PageProps<"/admin/students">) {
  const repo = getRepository();
  const viewer = await getViewer();
  const orgId = viewer.organization.id;

  const [studentMembers, instructorMembers] = await Promise.all([
    repo.listMembers(orgId, "student"),
    repo.listMembers(orgId, "instructor"),
  ]);

  const [students, instructors] = await Promise.all([
    Promise.all(studentMembers.map((m) => repo.getUser(m.userId))),
    Promise.all(instructorMembers.map((m) => repo.getUser(m.userId))),
  ]);

  const rows = await Promise.all(
    studentMembers.map(async (member, i) => {
      const student = students[i];
      if (!student) return null;
      const [flights, links, brief] = await Promise.all([
        repo.listFlights({ studentId: student.id }),
        repo.listInstructorLinksForStudent(student.id),
        computeNextLessonBrief(repo, student.id),
      ]);
      const mostRecentFlight = [...flights].sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;
      const lastDebriefedFlight = [...flights]
        .filter((f) => f.debriefStatus === "complete")
        .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0];
      const primaryLink = links.find((l) => l.isPrimary && l.status === "active");
      const primaryInstructor = primaryLink
        ? instructors.find((i) => i?.id === primaryLink.instructorId)
        : null;
      return { member, student, mostRecentFlight, lastDebriefedFlight, primaryInstructor, brief };
    }),
  );
  const allRows = rows.filter((r): r is NonNullable<typeof r> => r !== null);

  // ?instructor=<id> gives a CFI's name somewhere to lead. Filtered on the
  // primary instructor link, which is the same relationship the row already
  // displays -- an unknown or stale id simply matches nothing rather than
  // erroring.
  const { instructor: instructorFilter } = await props.searchParams;
  const filterId = typeof instructorFilter === "string" ? instructorFilter : null;
  const filteredInstructor = filterId ? instructors.find((i) => i?.id === filterId) ?? null : null;
  const validRows = filterId ? allRows.filter((r) => r.primaryInstructor?.id === filterId) : allRows;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Students</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {validRows.length} {filterId ? `with ${filteredInstructor?.name ?? "this instructor"}` : "total"}
          </p>
          {filterId ? (
            <Link href="/admin/students" className="mt-1 inline-block text-sm font-medium text-brand hover:underline">
              Show all students
            </Link>
          ) : null}
        </div>
        <InviteStudentForm
          instructors={instructors.filter((i): i is NonNullable<typeof i> => i !== null).map((i) => ({ id: i.id, name: i.name }))}
        />
      </div>

      <div className="flex flex-col gap-3">
        {validRows.map(({ member, student, mostRecentFlight, lastDebriefedFlight, primaryInstructor, brief }) => {
          const debriefComplete = mostRecentFlight?.debriefStatus === "complete";
          const debriefPending = mostRecentFlight && !debriefComplete;
          return (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <Link href={`/admin/students/${student.id}`} className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900 dark:text-white">
                    {student.name}
                    {member.certificateType === "PRIVATE" ? <Badge variant="neutral">Private Pilot</Badge> : null}
                    {member.status === "inactive" ? <Badge variant="outline">Inactive</Badge> : null}
                    {debriefComplete ? <Badge variant="success">Debrief Complete</Badge> : null}
                    {debriefPending ? <Badge variant="warning">Debrief Pending</Badge> : null}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {primaryInstructor ? `CFI: ${primaryInstructor.name}` : "No primary CFI"}
                    {mostRecentFlight
                      ? ` · Last flew ${new Date(mostRecentFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : " · No flights yet"}
                    {lastDebriefedFlight
                      ? ` · Last debrief ${new Date(lastDebriefedFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : ""}
                  </p>
                  {brief.focusAreas.length > 0 ? (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Focus: {brief.focusAreas.slice(0, 2).join(", ")}
                    </p>
                  ) : null}
                </Link>
                <MemberStatusButton memberId={member.id} status={member.status} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
