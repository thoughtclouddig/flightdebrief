import { FlightCard } from "@/components/flight-card";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function CfiFlightsPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const flights = await repo.listFlights({ instructorId: viewer.user.id });
  const students = await Promise.all(flights.map((f) => repo.getUser(f.userId)));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Your flights</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Across all of your students.</p>
      </div>

      {flights.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-white/15 dark:text-slate-400">
          No flights yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {flights.map((flight, i) => (
            <FlightCard key={flight.id} flight={flight} studentName={students[i]?.name} />
          ))}
        </div>
      )}
    </div>
  );
}
