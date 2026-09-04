import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Map, Plus } from "lucide-react";
import {
  BackLink,
  InfoTip,
  PageTitle,
  PrimaryButton,
  Screen,
  Section,
} from "@/components/student/ui";
import { cn } from "@/lib/utils";
import {
  FLIGHTS,
  TRACKED_HOURS_DISCLAIMER,
  formatHours,
  statusLabel,
  trackedHours,
  type Flight,
} from "@/lib/prototype-fixtures/flights";

export const metadata: Metadata = { title: "My flights — AfterFlight", robots: { index: false, follow: false } };

/**
 * Flight history.
 *
 * Deliberately not a logbook. There are no category totals, no PIC/SIC split,
 * no currency, no endorsements -- AfterFlight is not trying to replace
 * ForeFlight or LogTen, and a screen that looks like a logbook invites exactly
 * that comparison. What each row carries is training context: what the lesson
 * was, who was in the right seat, and whether the flight has been debriefed
 * yet, because an undebriefed flight is the one thing here that needs action.
 */
export default function MyFlightsPage() {
  const flown = FLIGHTS.length;
  return (
    <Screen>
      <BackLink href="/prototype/vector/profile">Profile</BackLink>
      <PageTitle>My flights</PageTitle>

      <div className="flex gap-2.5">
        <div className="flex-1 rounded-2xl border border-hairline bg-surface px-4 py-4">
          <div className="flex items-start justify-between">
            <p className="text-[26px] font-semibold leading-none tabular-nums tracking-tight text-foreground">
              {trackedHours()}
            </p>
            {/* The number is honest only if the qualification travels with it. */}
            <InfoTip label="Tracked hours">{TRACKED_HOURS_DISCLAIMER}</InfoTip>
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-foreground-faint">Tracked hours</p>
        </div>
        <div className="flex-1 rounded-2xl border border-hairline bg-surface px-4 py-4">
          <p className="text-[26px] font-semibold leading-none tabular-nums tracking-tight text-foreground">{flown}</p>
          <p className="mt-1.5 text-[13px] leading-snug text-foreground-faint">Flights</p>
        </div>
      </div>

      <PrimaryButton href="/prototype/vector/flights/new">
        <Plus className="size-[18px]" aria-hidden />
        Add flight
      </PrimaryButton>

      {FLIGHTS.length === 0 ? (
        <Section title={<>Flights</>}>
          <p className="py-2 text-[17px] leading-relaxed text-foreground-soft">
            No flights yet. Add your first flight to start building your training record.
          </p>
        </Section>
      ) : (
        <Section title={<>All flights</>}>
          <div className="flex flex-col">
            {FLIGHTS.map((f) => (
              <FlightRow key={f.id} flight={f} />
            ))}
          </div>
        </Section>
      )}
    </Screen>
  );
}

function FlightRow({ flight }: { flight: Flight }) {
  const needsAction = flight.status === "NEEDS_DEBRIEF" || flight.status === "DEBRIEF_STARTED";
  return (
    <Link
      href={`/prototype/vector/flights/${flight.id}`}
      className="flex items-start gap-3 border-b border-hairline py-4 last:border-b-0"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-medium leading-tight text-foreground">{flight.lesson}</p>
        <p className="mt-1 text-[15px] text-foreground-soft">
          {flight.dateLabel} · {flight.departureAirport} → {flight.arrivalAirport} ·{" "}
          {formatHours(flight.durationMinutes)} hr
        </p>
        <p className="mt-0.5 text-[14px] text-foreground-faint">
          {flight.aircraftType} · {flight.tailNumber} ·{" "}
          {/* Solo is stated, never left as an absence the reader has to notice. */}
          {flight.instructor ?? "Solo"}
        </p>
        <p className="mt-2 flex items-center gap-2.5">
          <span
            className={cn(
              "text-[14px] font-medium",
              needsAction ? "text-state-attention" : "text-foreground-faint",
            )}
          >
            {statusLabel(flight.status)}
          </span>
          {flight.track ? (
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
