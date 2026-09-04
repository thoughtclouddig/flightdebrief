import { ChevronRight, Map, Plus } from "lucide-react";
import Link from "next/link";
import { PageTitle, PrimaryButton, Screen, Section } from "@/components/student/ui";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { cn, formatDurationShort } from "@/lib/utils";
import type { DebriefStatus, FlightWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<DebriefStatus, string> = {
  not_started: "Needs debrief",
  in_progress: "Debrief started",
  complete: "Debriefed",
};

/**
 * "Deliberately not a logbook" (app/prototype/vector/flights/page.tsx's own
 * words) -- no category totals, no PIC/SIC split, no currency, no
 * endorsements. Not shared with CFI/admin (no nav path leads them here and
 * this query is scoped to viewer.user.id as a student), so this is a direct
 * in-place rewrite rather than a role branch. Tracked hours is a real sum
 * over the same repo.listFlights() rows Home/Debrief/Progress all read --
 * not lib/prototype/flights.ts's fixture trackedHours().
 */
export default async function DashboardPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const flights = await repo.listFlights({ studentId: viewer.user.id });
  const sorted = [...flights].sort((a, b) => b.flightDate.localeCompare(a.flightDate));
  const trackedHours = flights.reduce((sum, f) => sum + f.durationMinutes, 0) / 60;

  return (
    <Screen>
      <PageTitle>My flights</PageTitle>

      <div className="flex gap-2.5">
        <div className="flex-1 rounded-2xl border border-hairline bg-surface px-4 py-4">
          <p className="text-[26px] font-semibold leading-none tabular-nums tracking-tight text-foreground">
            {trackedHours.toFixed(1)}
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-foreground-faint">Tracked hours</p>
        </div>
        <div className="flex-1 rounded-2xl border border-hairline bg-surface px-4 py-4">
          <p className="text-[26px] font-semibold leading-none tabular-nums tracking-tight text-foreground">{flights.length}</p>
          <p className="mt-1.5 text-[13px] leading-snug text-foreground-faint">Flights</p>
        </div>
      </div>

      <PrimaryButton href="/flights/new">
        <Plus className="size-[18px]" aria-hidden />
        Add flight
      </PrimaryButton>

      {sorted.length === 0 ? (
        <Section title="Flights">
          <p className="py-2 text-[17px] leading-relaxed text-foreground-soft">
            No flights yet. Add your first flight to start building your training record.
          </p>
        </Section>
      ) : (
        <Section title="All flights">
          <div className="flex flex-col">
            {sorted.map((flight) => (
              <FlightRow key={flight.id} flight={flight} />
            ))}
          </div>
        </Section>
      )}
    </Screen>
  );
}

function FlightRow({ flight }: { flight: FlightWithRelations }) {
  const needsAction = flight.debriefStatus !== "complete";
  const href = flight.debriefStatus === "complete" ? `/flights/${flight.id}/debrief/results` : `/flights/${flight.id}`;
  return (
    <Link href={href} className="flex items-start gap-3 border-b border-hairline py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-medium leading-tight text-foreground">
          {flight.departureAirport} → {flight.arrivalAirport}
        </p>
        <p className="mt-1 text-[15px] text-foreground-soft">
          {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
          {formatDurationShort(flight.durationMinutes)}
        </p>
        <p className="mt-0.5 text-[14px] text-foreground-faint">
          {flight.aircraft.type} · {flight.aircraft.tailNumber} · {flight.instructor?.name ?? "Solo"}
        </p>
        <p className="mt-2 flex items-center gap-2.5">
          <span className={cn("text-[14px] font-medium", needsAction ? "text-state-attention" : "text-foreground-faint")}>
            {STATUS_LABEL[flight.debriefStatus]}
          </span>
          {flight.track && flight.track.length > 0 ? (
            <span className="flex items-center gap-1 text-[14px] text-foreground-faint">
              <Map className="size-3.5" aria-hidden />
              Track
            </span>
          ) : null}
        </p>
      </div>
      <ChevronRight className="mt-1 size-4 shrink-0 text-foreground-faint" aria-hidden />
    </Link>
  );
}
