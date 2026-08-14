import Link from "next/link";
import { formatDurationShort } from "@/lib/utils";
import type { FlightWithRelations } from "@/lib/types";

const STATUS_LABEL: Record<FlightWithRelations["debriefStatus"], string> = {
  not_started: "Debrief flight",
  in_progress: "Continue debrief",
  complete: "View debrief",
};

const STATUS_TONE: Record<FlightWithRelations["debriefStatus"], "open" | "done"> = {
  not_started: "open",
  in_progress: "open",
  complete: "done",
};

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return {
    day: d.toLocaleDateString("en-US", { day: "2-digit" }),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
}

/** Flight-strip card: status reads from the date block's fill color, not a badge. */
export function FlightCard({
  flight,
  studentName,
  href: hrefOverride,
}: {
  flight: FlightWithRelations;
  studentName?: string;
  /** Override the computed destination -- e.g. marketing demos that shouldn't link into a real flight record. */
  href?: string;
}) {
  const { day, month } = formatDate(flight.flightDate);
  const tone = STATUS_TONE[flight.debriefStatus];
  const href = hrefOverride ?? (flight.debriefStatus === "complete" ? `/flights/${flight.id}/debrief/results` : `/flights/${flight.id}`);

  return (
    <Link
      href={href}
      className="flex overflow-hidden border border-hairline bg-surface shadow-sm transition-transform hover:-translate-y-0.5"
      style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
    >
      <div
        className="flex w-14 shrink-0 flex-col items-center justify-center py-2.5 tabular-nums"
        style={
          tone === "open"
            ? { background: "var(--brand)", color: "white" }
            : { background: "var(--good)", color: "white" }
        }
      >
        <span className="text-xl font-semibold leading-none">{day}</span>
        <span className="mt-0.5 text-[9.5px] tracking-wide opacity-80">{month}</span>
      </div>

      <div className="flex-1 min-w-0 px-3.5 py-2.5">
        <h3 className="font-display text-lg font-bold uppercase leading-tight text-foreground">
          {flight.departureAirport} → {flight.arrivalAirport}
        </h3>

        <div className="mt-1.5 flex gap-4 text-[10.5px] text-foreground-faint">
          <div>
            <span className="uppercase tracking-wide">Tail</span>
            <p className="text-xs font-medium text-foreground">{flight.aircraft.tailNumber}</p>
          </div>
          <div>
            <span className="uppercase tracking-wide">Dur</span>
            <p className="text-xs font-medium tabular-nums text-foreground">{formatDurationShort(flight.durationMinutes)}</p>
          </div>
          <div>
            <span className="uppercase tracking-wide">{studentName ? "Student" : "CFI"}</span>
            <p className="text-xs font-medium text-foreground">{studentName ?? flight.instructor?.name ?? "—"}</p>
          </div>
        </div>

        <p className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-brand">
          {STATUS_LABEL[flight.debriefStatus]} →
        </p>
      </div>
    </Link>
  );
}
