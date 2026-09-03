import { organizationKindLabel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SuperAdminSchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ demos?: string }>;
}) {
  const repo = getRepository();
  // A listing, not a metric: seeing demo orgs here is useful, so it opts in
  // explicitly and labels what comes back. ?demos=0 hides them again.
  const includeDemo = (await searchParams).demos !== "0";
  const organizations = await repo.listOrganizations({ includeDemo });
  const memberCounts = await Promise.all(organizations.map((org) => repo.listMembers(org.id)));
  const demoCount = organizations.filter((o) => o.demoExpiresAt).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Organizations</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {organizations.length - demoCount} real
          {includeDemo ? ` · ${demoCount} demo` : ""}{" "}
          <Link
            href={includeDemo ? "?demos=0" : "?demos=1"}
            className="underline underline-offset-2 hover:text-slate-900 dark:hover:text-white"
          >
            {includeDemo ? "hide demos" : "include demos"}
          </Link>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {organizations.map((org, i) => (
          <Card key={org.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                  {org.name}
                  {org.demoExpiresAt ? <Badge variant="warning">Demo</Badge> : null}
                </p>
                <p className="text-sm capitalize text-slate-500 dark:text-slate-400">
                  {organizationKindLabel(org.kind)} · {memberCounts[i].length} member{memberCounts[i].length === 1 ? "" : "s"}
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
