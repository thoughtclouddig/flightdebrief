import Link from "next/link";
import { Plus } from "lucide-react";
import { FlightCard } from "@/components/flight-card";
import { buttonVariants } from "@/components/ui/button";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const flights = await repo.listFlights({ studentId: viewer.user.id });
  const nextToDebrief = flights.find((f) => f.debriefStatus !== "complete");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Your training flights</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Fly, debrief out loud, and FlightBrief remembers where you left off.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/flights/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Plus className="size-4" />
            Add Flight Manually
          </Link>
          {nextToDebrief ? (
            <Link href={`/flights/${nextToDebrief.id}`} className={buttonVariants({ size: "sm" })}>
              Debrief Flight
            </Link>
          ) : null}
        </div>
      </div>

      {flights.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-white/15 dark:text-slate-400">
          No flights yet. Add your first training flight to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {flights.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
}
