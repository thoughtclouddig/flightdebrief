import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SuperAdminSubscribersPage() {
  const repo = getRepository();
  const users = await repo.listUsers();
  /*
   * Fetched WITH demos so this page can tell the difference, then split.
   *
   * users comes from listUsers(), which has no demo concept: live-demo
   * visitors are real user rows and there is no marker on the users table to
   * filter them by. Rather than let "N total" quietly count them as
   * subscribers, the demo-only ones are identified through their org
   * membership and reported separately.
   */
  const orgsByUser = await Promise.all(
    users.map((u) => repo.listOrganizationsForUser(u.id, { includeDemo: true })),
  );
  const isDemoOnly = orgsByUser.map(
    (orgs) => orgs.length > 0 && orgs.every((o) => o.demoExpiresAt),
  );
  const demoUsers = isDemoOnly.filter(Boolean).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Subscribers</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {users.length - demoUsers} real{demoUsers ? ` · ${demoUsers} demo` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {users.map((user, i) => (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                  {user.name}
                  {isDemoOnly[i] ? <Badge variant="warning">Demo</Badge> : null}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
              <p className="shrink-0 text-sm text-slate-500 dark:text-slate-400">
                {orgsByUser[i].map((o) => o.name).join(", ") || "No organization"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
