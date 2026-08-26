import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SuperAdminSchoolsPage() {
  const repo = getRepository();
  const organizations = await repo.listOrganizations();
  const memberCounts = await Promise.all(organizations.map((org) => repo.listMembers(org.id)));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Organizations</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{organizations.length} total</p>
      </div>

      <div className="flex flex-col gap-2">
        {organizations.map((org, i) => (
          <Card key={org.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{org.name}</p>
                <p className="text-sm capitalize text-slate-500 dark:text-slate-400">
                  {org.kind.replace("_", " ")} · {memberCounts[i].length} member{memberCounts[i].length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant={org.subscriptionStatus === "active" ? "success" : "neutral"}>
                  {org.subscriptionStatus ?? "no billing"}
                </Badge>
                {org.subscriptionPlan ? (
                  <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{org.subscriptionPlan.replace("_", " ")}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
