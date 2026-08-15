import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeInstructorRoster } from "@/lib/training-memory";
import { StudentRosterList } from "@/components/student-roster-list";
import { InviteStudentForm } from "@/components/cfi/invite-student-form";

export const dynamic = "force-dynamic";

export default async function CfiStudentsPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const roster = await computeInstructorRoster(repo, viewer.user.id, viewer.organization.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Students</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{roster.length} on your roster</p>
        </div>
        <InviteStudentForm />
      </div>
      <StudentRosterList roster={roster} />
    </div>
  );
}
