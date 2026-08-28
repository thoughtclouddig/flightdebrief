import Link from "next/link";
import { Plus } from "lucide-react";
import { FlightsList } from "@/components/flights-list";
import { buttonVariants } from "@/components/ui/button";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const [flights, reservations] = await Promise.all([
    repo.listFlights({ studentId: viewer.user.id }),
    repo.listReservations({ studentId: viewer.user.id }),
  ]);
  const nextToDebrief = flights.find((f) => f.debriefStatus !== "complete");

  // Read once, outside the filter, so "upcoming" is evaluated against a single
  // instant rather than a clock that could tick mid-list.
  const nowMs = new Date().getTime();
  const upcomingReservations = reservations
    .filter((r) => r.status === "scheduled" && new Date(r.scheduledStart).getTime() >= nowMs)
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  const upcoming = await Promise.all(
    upcomingReservations.map(async (reservation) => ({
      reservation,
      instructor: await repo.getUser(reservation.instructorId),
      aircraft: await repo.getAircraft(reservation.aircraftId),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Flights</h1>
          <p className="mt-1 text-sm text-foreground-soft">
            Fly, debrief out loud, and AfterFlight remembers where you left off.
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

      {flights.length === 0 && upcoming.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline p-10 text-center text-foreground-soft">
          No flights yet. Add your first training flight to get started.
        </div>
      ) : (
        <FlightsList flights={flights} upcoming={upcoming} />
      )}
    </div>
  );
}
