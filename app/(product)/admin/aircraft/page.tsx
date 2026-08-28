import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { AddAircraftForm } from "@/components/admin/add-aircraft-form";
import { AircraftCard } from "@/components/admin/aircraft-card";

export const dynamic = "force-dynamic";

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
          <AircraftCard key={a.id} aircraft={a} />
        ))}
      </div>
    </div>
  );
}
