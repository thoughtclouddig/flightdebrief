import Link from "next/link";
import { ChevronRight, Map, Plus } from "lucide-react";
import { BackLink, InfoTip, PageTitle, PrimaryButton, Screen, Section } from "@/components/student/ui";
import { cn } from "@/lib/utils";

export interface FlightListRow {
  id: string;
  href: string;
  lesson: string;
  dateLabel: string;
  departureAirport: string;
  arrivalAirport: string;
  durationLabel: string;
  aircraftType: string;
  tailNumber: string;
  instructorName: string | null;
  statusLabel: string;
  needsAction: boolean;
  hasTrack: boolean;
}

/**
 * Flight history -- shared between app/prototype/vector/flights/page.tsx
 * (fixture props) and app/v2/flights/page.tsx.
 *
 * Deliberately not a logbook. There are no category totals, no PIC/SIC split,
 * no currency, no endorsements -- AfterFlight is not trying to replace
 * ForeFlight or LogTen, and a screen that looks like a logbook invites exactly
 * that comparison. What each row carries is training context: what the lesson
 * was, who was in the right seat, and whether the flight has been debriefed
 * yet, because an undebriefed flight is the one thing here that needs action.
 */
export function FlightsList({
  backHref,
  addFlightHref,
  trackedHoursLabel,
  trackedHoursDisclaimer,
  flights,
}: {
  backHref: string;
  addFlightHref: string;
  trackedHoursLabel: string;
  trackedHoursDisclaimer: string;
  flights: FlightListRow[];
}) {
  return (
    <Screen>
      <BackLink href={backHref}>Profile</BackLink>
      <PageTitle>My flights</PageTitle>

      <div className="flex gap-2.5">
        <div className="flex-1 rounded-2xl border border-hairline bg-surface px-4 py-4">
          <div className="flex items-start justify-between">
            <p className="text-[26px] font-semibold leading-none tabular-nums tracking-tight text-foreground">
              {trackedHoursLabel}
            </p>
            <InfoTip label="Tracked hours">{trackedHoursDisclaimer}</InfoTip>
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-foreground-faint">Tracked hours</p>
        </div>
        <div className="flex-1 rounded-2xl border border-hairline bg-surface px-4 py-4">
          <p className="text-[26px] font-semibold leading-none tabular-nums tracking-tight text-foreground">
            {flights.length}
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-foreground-faint">Flights</p>
        </div>
      </div>

      <PrimaryButton href={addFlightHref}>
        <Plus className="size-[18px]" aria-hidden />
        Add flight
      </PrimaryButton>

      {flights.length === 0 ? (
        <Section title={<>Flights</>}>
          <p className="py-2 text-[17px] leading-relaxed text-foreground-soft">
            No flights yet. Add your first flight to start building your training record.
          </p>
        </Section>
      ) : (
        <Section title={<>All flights</>}>
          <div className="flex flex-col">
            {flights.map((f) => (
              <FlightRow key={f.id} flight={f} />
            ))}
          </div>
        </Section>
      )}
    </Screen>
  );
}

function FlightRow({ flight }: { flight: FlightListRow }) {
  return (
    <Link href={flight.href} className="flex items-start gap-3 border-b border-hairline py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-medium leading-tight text-foreground">{flight.lesson}</p>
        <p className="mt-1 text-[15px] text-foreground-soft">
          {flight.dateLabel} · {flight.departureAirport} → {flight.arrivalAirport} · {flight.durationLabel} hr
        </p>
        <p className="mt-0.5 text-[14px] text-foreground-faint">
          {flight.aircraftType} · {flight.tailNumber} · {flight.instructorName ?? "Solo"}
        </p>
        <p className="mt-2 flex items-center gap-2.5">
          <span className={cn("text-[14px] font-medium", flight.needsAction ? "text-state-attention" : "text-foreground-faint")}>
            {flight.statusLabel}
          </span>
          {flight.hasTrack ? (
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
