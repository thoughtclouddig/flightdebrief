"use client";

import { useState } from "react";
import { Check, Mic, Plane, Radar } from "lucide-react";
import {
  BackLink,
  Card,
  PageTitle,
  Panel,
  PanelButton,
  PanelEyebrow,
  PanelHeadline,
  PrimaryButton,
  Screen,
  Section,
  SecondaryButton,
} from "@/components/prototype/ui";
import { cn } from "@/lib/utils";
import { DETECTED_FLIGHT, FLIGHT_DEFAULTS, formatHours } from "@/lib/prototype/flights";

type Stage = "detect" | "manual" | "who" | "saved";

/**
 * Add Flight.
 *
 * The design target is confirmation, not data entry. ADS-B already knows the
 * date, both airports, the times, the aircraft and the duration -- everything
 * except the two things it cannot know, which are who was in the right seat
 * and what the lesson was about. So the detected path asks for exactly those
 * two and nothing else, and the manual path pre-fills from the last flight.
 *
 * This mirrors the shipped app's /flights/new, which already has both a tail
 * -number ADS-B search and a manual form (app/(product)/flights/new). The
 * prototype's contribution is the ordering: detected first, manual as the
 * fallback, rather than a mode switch that makes the student choose.
 */
export default function AddFlightPage() {
  const [stage, setStage] = useState<Stage>("detect");
  const [solo, setSolo] = useState(false);

  return (
    <Screen>
      {stage === "saved" ? null : <BackLink href="/prototype/vector/flights">My flights</BackLink>}

      {stage === "detect" ? <Detect onUse={() => setStage("who")} onManual={() => setStage("manual")} /> : null}
      {stage === "manual" ? <Manual onSave={() => setStage("who")} /> : null}
      {stage === "who" ? <WhoFlew solo={solo} setSolo={setSolo} onDone={() => setStage("saved")} /> : null}
      {stage === "saved" ? <Saved solo={solo} /> : null}
    </Screen>
  );
}

/* ------------------------------------------------------------ 1. detected */

function Detect({ onUse, onManual }: { onUse: () => void; onManual: () => void }) {
  const d = DETECTED_FLIGHT;
  return (
    <>
      <PageTitle>Add flight</PageTitle>

      <Panel>
        <PanelEyebrow icon={<Radar className="size-3.5" aria-hidden />}>We found a recent flight</PanelEyebrow>
        <PanelHeadline>
          {d.departureAirport} &rarr; {d.arrivalAirport}
        </PanelHeadline>
        <p className="mt-1 text-[15px] text-panel-foreground-soft">
          {d.dateLabel} · {d.departedAt} &ndash; {d.landedAt}
        </p>

        <dl className="mt-6 flex flex-col gap-2.5 border-t border-panel-hairline pt-5 text-[15px]">
          <Row label="Aircraft" value={`${d.aircraftType} · ${d.tailNumber}`} />
          <Row label="Duration" value={`${formatHours(d.durationMinutes)} hr detected`} />
          <Row label="Track" value="Available" />
        </dl>

        <div className="mt-6 flex flex-col gap-2.5">
          <PanelButton onClick={onUse}>Use this flight</PanelButton>
          <SecondaryButton onClick={onManual} onPanel>
            Not my flight
          </SecondaryButton>
        </div>
      </Panel>

      <Card onClick={onManual} className="flex items-center gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-foreground-soft">
          <Plane className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-medium text-foreground">Add manually</span>
          <span className="mt-0.5 block text-[15px] text-foreground-soft">
            For a flight we didn&rsquo;t pick up, or a simulator session.
          </span>
        </span>
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-panel-foreground-soft">{label}</dt>
      <dd className="text-right font-medium text-panel-foreground">{value}</dd>
    </div>
  );
}

/* -------------------------------------------------------------- 2. manual */

/**
 * Every field is pre-filled from the last flight. A student flying the same
 * airplane out of the same airport with the same instructor should be able to
 * accept all of it and move on -- typing the same six values every week is
 * what makes people stop logging flights.
 */
function Manual({ onSave }: { onSave: () => void }) {
  const a = FLIGHT_DEFAULTS.recentAircraft[0]!;
  return (
    <>
      <PageTitle kicker="Pre-filled from your last flight">Add flight</PageTitle>

      <Section title={<>Flight</>}>
        <div className="flex flex-col">
          <Field label="Date" value="Today" />
          <Field label="From" value={FLIGHT_DEFAULTS.homeAirport} />
          <Field label="To" value={FLIGHT_DEFAULTS.homeAirport} />
          <Field label="Aircraft" value={`${a.type} · ${a.tailNumber}`} />
          <Field label="Flight time" value="1.3 hr" />
          <Field label="Training" value={FLIGHT_DEFAULTS.recentLessons[0]!} last />
        </div>
      </Section>

      <PrimaryButton onClick={onSave}>Save flight</PrimaryButton>
    </>
  );
}

function Field({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-[52px] items-center justify-between gap-4 py-2.5",
        !last && "border-b border-hairline",
      )}
    >
      <span className="text-[15px] text-foreground-faint">{label}</span>
      <span className="text-[17px] font-medium text-foreground">{value}</span>
    </div>
  );
}

/* --------------------------------------------------------- 3. who flew it */

/**
 * The one thing ADS-B can never answer.
 *
 * Asked after the flight is confirmed rather than before, because it is the
 * only remaining unknown -- and asked explicitly rather than defaulted,
 * because a solo flight with an instructor's name attached would put words in
 * someone's mouth, and the perception-gap feature depends on knowing whether a
 * second perspective exists at all.
 */
function WhoFlew({ solo, setSolo, onDone }: { solo: boolean; setSolo: (v: boolean) => void; onDone: () => void }) {
  const [lesson, setLesson] = useState<string>(FLIGHT_DEFAULTS.recentLessons[0]!);
  return (
    <>
      <PageTitle kicker={`${DETECTED_FLIGHT.dateLabel} · ${DETECTED_FLIGHT.departureAirport}`}>
        Two more things
      </PageTitle>

      <Section title={<>Flight type</>}>
        <div className="flex flex-col">
          {FLIGHT_DEFAULTS.recentInstructors.map((name, i) => (
            <Choice key={name} label={name} selected={!solo && i === 0} onClick={() => setSolo(false)} />
          ))}
          <Choice label="Solo — no instructor" selected={solo} onClick={() => setSolo(true)} last />
        </div>
      </Section>

      <Section title={<>Training</>}>
        <div className="flex flex-col">
          {FLIGHT_DEFAULTS.recentLessons.map((l, i) => (
            <Choice
              key={l}
              label={l}
              selected={lesson === l}
              onClick={() => setLesson(l)}
              last={i === FLIGHT_DEFAULTS.recentLessons.length - 1}
            />
          ))}
        </div>
      </Section>

      <PrimaryButton onClick={onDone}>Save flight</PrimaryButton>
    </>
  );
}

function Choice({
  label,
  selected,
  onClick,
  last = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex min-h-[56px] cursor-pointer items-center justify-between gap-4 py-2.5 text-left",
        !last && "border-b border-hairline",
      )}
    >
      <span className="text-[17px] text-foreground">{label}</span>
      {selected ? <Check className="size-[18px] shrink-0 text-brand" strokeWidth={2.5} aria-hidden /> : null}
    </button>
  );
}

/* ---------------------------------------------------------------- 4. done */

function Saved({ solo }: { solo: boolean }) {
  return (
    <>
      <Panel>
        <PanelEyebrow icon={<Check className="size-3.5" aria-hidden />}>Flight added</PanelEyebrow>
        <PanelHeadline>
          {DETECTED_FLIGHT.departureAirport} &rarr; {DETECTED_FLIGHT.arrivalAirport}
        </PanelHeadline>
        <p className="mt-1 text-[15px] text-panel-foreground-soft">
          {DETECTED_FLIGHT.dateLabel} · {formatHours(DETECTED_FLIGHT.durationMinutes)} hr tracked
        </p>
      </Panel>

      {/* The flight exists to be debriefed. Say so immediately rather than
          returning to a list and hoping they find their way back. */}
      <div className="flex flex-col gap-2.5">
        <PrimaryButton href="/prototype/vector/debrief/new">
          <Mic className="size-[18px]" aria-hidden />
          {solo ? "Add my reflection" : "Start debrief"}
        </PrimaryButton>
        <div className="flex gap-2.5">
          <SecondaryButton href="/prototype/vector/flights">View flight</SecondaryButton>
          <SecondaryButton href="/prototype/vector">Do it later</SecondaryButton>
        </div>
      </div>
    </>
  );
}
