import { Mail } from "lucide-react";
import { ChangeEmailForm } from "@/components/change-email-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

const NOTICE_MESSAGES: Record<string, string> = {
  "email-updated": "Your email has been updated.",
  "email-change-expired": "That confirmation link is invalid or has expired.",
  "email-change-taken": "That email was claimed by another account before you confirmed.",
  "email-change-failed": "Something went wrong confirming your new email. Try again.",
};

export default async function AdminSettingsPage(props: PageProps<"/admin/settings">) {
  const searchParams = await props.searchParams;
  const notice =
    (typeof searchParams.error === "string" && NOTICE_MESSAGES[searchParams.error]) ||
    (searchParams["email-updated"] ? NOTICE_MESSAGES["email-updated"] : null);
  const noticeIsError = typeof searchParams.error === "string";

  const viewer = await getViewer();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h1>

      {notice ? (
        <p
          className={
            noticeIsError
              ? "rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger"
              : "rounded-lg border border-brand/30 bg-brand/10 px-4 py-2.5 text-sm text-brand-dark dark:text-brand-light"
          }
        >
          {notice}
        </p>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your account</p>
            <p className="mt-1 text-lg font-medium text-slate-900 dark:text-white">{viewer.user.name}</p>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Mail className="size-4 text-slate-400" />
              {viewer.user.email}
            </p>
            <ChangeEmailForm />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Organization</p>
            <p className="mt-1 text-lg font-medium text-slate-900 dark:text-white">{viewer.organization.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Workspace type</p>
            <Badge variant="brand" className="mt-1.5 capitalize">
              {viewer.organization.kind.replace("_", " ")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-400">
        Individual, independent-CFI, and school workspaces all use this same underlying structure -- only the label
        changes.
      </p>
    </div>
  );
}
