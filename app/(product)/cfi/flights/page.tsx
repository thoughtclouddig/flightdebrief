import Link from "next/link";
import { Plus } from "lucide-react";
import { FlightCard } from "@/components/flight-card";
import { buttonVariants } from "@/components/ui/button";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Your flights</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Across all of your students.</p>
        </div>
        <Link href="/cfi/students" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Plus className="size-4" />
          Add Flight for a Student
        </Link>
      </div>

      {flights.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-white/15 dark:text-slate-400">
          <p>No flights yet.</p>
          <Link href="/cfi/students" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Log one from a student&rsquo;s page
          </Link>
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
