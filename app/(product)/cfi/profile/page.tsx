import { Building2, Mail, Users } from "lucide-react";
import { AvatarUpload } from "@/components/avatar-upload";
import { ChangeEmailForm } from "@/components/change-email-form";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

const NOTICE_MESSAGES: Record<string, string> = {
  "email-updated": "Your email has been updated.",
  "email-change-expired": "That confirmation link is invalid or has expired.",
  "email-change-taken": "That email was claimed by another account before you confirmed.",
  "email-change-failed": "Something went wrong confirming your new email. Try again.",
};

export default async function CfiProfilePage(props: PageProps<"/cfi/profile">) {
  const searchParams = await props.searchParams;
  const notice =
    (typeof searchParams.error === "string" && NOTICE_MESSAGES[searchParams.error]) ||
    (searchParams["email-updated"] ? NOTICE_MESSAGES["email-updated"] : null);
  const noticeIsError = typeof searchParams.error === "string";

  const repo = getRepository();
  const viewer = await getViewer();
  const links = await repo.listStudentLinksForInstructor(viewer.user.id, viewer.organization.id);
  const activeCount = links.filter((l) => l.status === "active").length;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Profile</h1>

      {notice ? (
        <p
          className={
            noticeIsError
              ? "rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger"
              : "rounded-lg border border-hairline bg-surface-sunken px-4 py-2.5 text-sm text-foreground"
          }
        >
          {notice}
        </p>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          <div className="flex items-center gap-3">
            <AvatarUpload name={viewer.user.name} avatarUrl={viewer.user.avatarUrl} />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{viewer.user.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Certified Flight Instructor</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm dark:border-white/10">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="size-4 text-slate-400" />
                {viewer.user.email}
              </p>
              <ChangeEmailForm />
            </div>
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Building2 className="size-4 text-slate-400" />
              {viewer.organization.name}
            </p>
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Users className="size-4 text-slate-400" />
              {activeCount} active student{activeCount === 1 ? "" : "s"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
