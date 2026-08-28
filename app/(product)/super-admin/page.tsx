import { organizationKindLabel, type OrganizationKind } from "@/lib/types";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SuperAdminOverviewPage() {
  const repo = getRepository();
  const [organizations, users] = await Promise.all([repo.listOrganizations(), repo.listUsers()]);

  const byKind = new Map<OrganizationKind, number>();
  const byPlan = new Map<string, number>();
  for (const org of organizations) {
    byKind.set(org.kind, (byKind.get(org.kind) ?? 0) + 1);
    const plan = org.subscriptionPlan ?? "no plan";
    byPlan.set(plan, (byPlan.get(plan) ?? 0) + 1);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">AfterFlight Overview</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Platform-wide, across every school and subscriber.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="py-4">
            <p className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">{organizations.length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Organizations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">{users.length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Users</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">By Organization Kind</h2>
        <div className="flex flex-col gap-2">
          {[...byKind.entries()].map(([kind, count]) => (
            <Card key={kind}>
              <CardContent className="flex items-center justify-between py-3">
                <p className="text-slate-900 dark:text-white">{organizationKindLabel(kind)}</p>
                <p className="tabular-nums text-slate-500 dark:text-slate-400">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">By Subscription Plan</h2>
        <div className="flex flex-col gap-2">
          {[...byPlan.entries()].map(([plan, count]) => (
            <Card key={plan}>
              <CardContent className="flex items-center justify-between py-3">
                <p className="capitalize text-slate-900 dark:text-white">{plan.replace("_", " ")}</p>
                <p className="tabular-nums text-slate-500 dark:text-slate-400">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <Link href="/super-admin/schools" className="text-brand hover:underline">All Schools &rarr;</Link>
        <Link href="/super-admin/subscribers" className="text-brand hover:underline">All Subscribers &rarr;</Link>
        <Link href="/super-admin/articles" className="text-brand hover:underline">Content &rarr;</Link>
      </div>
    </div>
  );
}
