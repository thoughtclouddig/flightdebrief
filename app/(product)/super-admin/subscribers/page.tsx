import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SuperAdminSubscribersPage() {
  const repo = getRepository();
  const users = await repo.listUsers();
  const orgsByUser = await Promise.all(users.map((u) => repo.listOrganizationsForUser(u.id)));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Subscribers</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{users.length} total</p>
      </div>

      <div className="flex flex-col gap-2">
        {users.map((user, i) => (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
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
