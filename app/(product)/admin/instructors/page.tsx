import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { InviteCfiForm } from "@/components/admin/invite-cfi-form";
import { MemberStatusButton } from "@/components/admin/member-status-button";

export const dynamic = "force-dynamic";

export default async function AdminInstructorsPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const orgId = viewer.organization.id;

  const instructorMembers = await repo.listMembers(orgId, "instructor");
  const rows = await Promise.all(
    instructorMembers.map(async (member) => {
      const [user, links, flights] = await Promise.all([
        repo.getUser(member.userId),
        repo.listStudentLinksForInstructor(member.userId, orgId),
        repo.listFlights({ instructorId: member.userId, organizationId: orgId }),
      ]);
      if (!user) return null;
      const activeStudents = links.filter((l) => l.status === "active").length;
      const recentFlight = [...flights].sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;
      return { member, user, activeStudents, recentFlight };
    }),
  );
  const validRows = rows.filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Instructors</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{validRows.length} total</p>
        </div>
        <InviteCfiForm />
      </div>

      <div className="flex flex-col gap-3">
        {validRows.map(({ member, user, activeStudents, recentFlight }) => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <Link href={`/admin/students?instructor=${user.id}`} className="group">
                <p className="flex items-center gap-2 font-medium text-slate-900 group-hover:text-brand dark:text-white">
                  {user.name}
                  {member.status === "inactive" ? <Badge variant="outline">Inactive</Badge> : null}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {activeStudents} active student{activeStudents === 1 ? "" : "s"}
                  {recentFlight
                    ? ` · Last flight ${new Date(recentFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : " · No recent activity"}
                </p>
              </Link>
              <MemberStatusButton memberId={member.id} status={member.status} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
