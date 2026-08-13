import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { AddAircraftForm } from "@/components/admin/add-aircraft-form";

export const dynamic = "force-dynamic";

const STATUS_VARIANT = {
  active: "success",
  inactive: "neutral",
  maintenance: "warning",
} as const;

export default async function AdminAircraftPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const aircraft = await repo.listAircraft(viewer.organization.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Aircraft</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{aircraft.length} total</p>
        </div>
        <AddAircraftForm />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {aircraft.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{a.tailNumber}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {a.type} · {a.homeAirport || "No home base set"}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
