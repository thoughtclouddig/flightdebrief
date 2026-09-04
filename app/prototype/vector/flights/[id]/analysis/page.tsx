import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Play } from "lucide-react";
import { FlightMap } from "@/components/flight-map";
import {
  AcsBadge,
  BackLink,
  Evidence,
  PageTitle,
  PrimaryButton,
  Screen,
  Section,
  SecondaryButton,
} from "@/components/student/ui";
import { cn } from "@/lib/utils";
import { FLIGHTS, flightById, formatHours } from "@/lib/prototype-fixtures/flights";
import { analysisFor } from "@/lib/prototype/moments";
import { momentTone, formatElapsed } from "@/lib/student/telemetry";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.filter((f) => f.track).map((f) => ({ id: f.id }));
}

/**
 * Flight Analysis: the flight as evidence.
 *
 * The visualization is not the product. What a student needs from this screen
 * is which attempts happened, what was said about each, and what the data
 * shows -- so the map is a single glance at the top and the rest of the screen
 * is moments. Replay is where the same material becomes interrogable.
 */
export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flight = flightById(id);
  const analysis = analysisFor(id);
  if (!flight || !analysis) notFound();

  const approaches = analysis.segments.filter((s) => s.type === "APPROACH");

  return (
    <Screen>
      <BackLink href={`/prototype/vector/flights/${id}`}>Flight</BackLink>
      <PageTitle kicker={`${flight.dateLabel} · ${flight.departureAirport} → ${flight.arrivalAirport}`}>
        Flight analysis
      </PageTitle>
      <p className="-mt-4 px-1.5 text-[17px] text-foreground-soft">
        {flight.aircraftType} · {flight.tailNumber} · {flight.instructor ?? "Solo"} ·{" "}
        {formatHours(flight.durationMinutes)} hr tracked
      </p>

      <Section title={<>Flight path</>} flush>
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <FlightMap track={flight.track} hasAdsbLookup={flight.fr24FlightId !== null} />
        </div>
      </Section>

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href={`/prototype/vector/flights/${id}/replay`}>
          <Play className="size-[18px] fill-current" aria-hidden />
          Replay this flight
        </PrimaryButton>
        {approaches.length > 1 ? (
          <SecondaryButton href={`/prototype/vector/flights/${id}/compare`}>Compare attempts</SecondaryButton>
        ) : null}
      </div>

      <Section title={<>{approaches.length} approaches detected</>}>
        <div className="flex flex-col">
          {analysis.segments.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 border-b border-hairline py-3.5 last:border-b-0"
            >
              <span className="min-w-0 flex-1 text-[17px] text-foreground">{s.label}</span>
              <span className="text-[15px] tabular-nums text-foreground-faint">
                {formatElapsed(s.startT)}
              </span>
            </div>
          ))}
        </div>
        {/* Confidence is disclosed rather than hidden: this is inferred from
            altitude structure, not read off a flight-data recorder. */}
        <p className="pt-3 text-[14px] leading-relaxed text-foreground-faint">
          Segments are inferred from the altitude and position record, not reported by the aircraft.
        </p>
      </Section>

      {analysis.moments.length > 0 ? (
        <Section title={<>Flight moments</>} flush>
          <div className="flex flex-col gap-3">
            {analysis.moments.map((m) => {
              const tone = momentTone(m.type);
              return (
                <Link
                  key={m.id}
                  href={`/prototype/vector/flights/${id}/moments/${m.id}`}
                  className="flex items-start gap-3 rounded-2xl border border-hairline bg-surface p-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2.5">
                      <span className="text-[17px] font-semibold text-foreground">{m.title}</span>
                      <span
                        className={cn(
                          "text-[14px] font-medium",
                          tone === "attention"
                            ? "text-state-attention"
                            : tone === "good"
                              ? "text-state-good"
                              : "text-foreground-faint",
                        )}
                      >
                        {m.type === "NEEDS_ATTENTION"
                          ? "Needs attention"
                          : m.type === "BEST_ATTEMPT"
                            ? "Best attempt"
                            : m.type === "IMPROVED"
                              ? "Improved"
                              : ""}
                      </span>
                    </span>
                    {m.instructorEvidence ? (
                      <span className="mt-3 block">
                        <Evidence
                          label={m.instructorEvidence.who}
                          tone="instructor"
                          text={m.instructorEvidence.quote}
                        />
                      </span>
                    ) : null}
                    {m.flightData[0] ? (
                      <span className="mt-3 block text-[15px] leading-relaxed text-foreground-soft">
                        <span className="font-medium text-foreground">Flight data:</span>{" "}
                        {m.flightData[0].value}
                      </span>
                    ) : null}
                    {m.acsArea ? (
                      <span className="mt-3 block">
                        <AcsBadge area={m.acsArea} />
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-foreground-faint" aria-hidden />
                </Link>
              );
            })}
          </div>
        </Section>
      ) : null}
    </Screen>
  );
}
