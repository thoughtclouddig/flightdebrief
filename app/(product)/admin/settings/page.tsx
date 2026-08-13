import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const viewer = await getViewer();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h1>

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
