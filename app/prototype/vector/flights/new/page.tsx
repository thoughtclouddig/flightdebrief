"use client";

import { useState } from "react";
import { Check, Mic, Plane, Search } from "lucide-react";
import {
  BackLink,
  Card,
  InfoTip,
  PageTitle,
  Panel,
  PanelEyebrow,
  PanelHeadline,
  PrimaryButton,
  Screen,
  Section,
  SecondaryButton,
} from "@/components/student/ui";
import { cn } from "@/lib/utils";
import {
  FLIGHT_DEFAULTS,
  candidatesForTail,
  formatHours,
  type FlightCandidate,
} from "@/lib/prototype-fixtures/flights";

type Stage = "tail" | "pick" | "manual" | "who" | "saved";

/**
 * Add Flight — the V1 flow, restored.
 *
 * The sequence matters and an earlier version of this screen got it wrong. It
 * opened with "we found your flight", which is a claim AfterFlight cannot
 * make: ADS-B tracks an AIRPLANE, not a person, and a club trainer flies three
 * or four students between breakfast and sunset. Presenting one of those as
 * "yours" would seed tracked hours, recurrence and Vector's context from a
 * guess.
 *
 * So: give us the tail number, here is what that aircraft actually did today,
 * tell us which one was you. The lookup does the typing; the student does the
 * identifying. Nobody but them can do the second part.
 *
 * Everything below the pick is what ADS-B can never know -- who was in the
 * right seat, and what the lesson was about.
 */
export default function AddFlightPage() {
  const [stage, setStage] = useState<Stage>("tail");
  const [tail, setTail] = useState<string>(FLIGHT_DEFAULTS.recentAircraft[0]!.tailNumber);
  const [picked, setPicked] = useState<FlightCandidate | null>(null);
  const [solo, setSolo] = useState(false);

  return (
    <Screen>
      {stage === "saved" ? null : <BackLink href="/prototype/vector/flights">My flights</BackLink>}

      {stage === "tail" ? (
        <TailStep tail={tail} setTail={setTail} onSearch={() => setStage("pick")} onManual={() => setStage("manual")} />
      ) : null}
      {stage === "pick" ? (
        <PickStep
          tail={tail}
          onPick={(c) => {
            setPicked(c);
            setStage("who");
          }}
          onManual={() => setStage("manual")}
        />
      ) : null}
      {stage === "manual" ? <Manual onSave={() => setStage("who")} /> : null}
      {stage === "who" ? <WhoFlew solo={solo} setSolo={setSolo} onDone={() => setStage("saved")} /> : null}
      {stage === "saved" ? <Saved picked={picked} solo={solo} /> : null}
    </Screen>
  );
}

/* --------------------------------------------------------- 1. tail number */

function TailStep({
  tail,
  setTail,
  onSearch,
  onManual,
}: {
  tail: string;
  setTail: (v: string) => void;
  onSearch: () => void;
  onManual: () => void;
}) {
  return (
    <>
      <PageTitle>Add flight</PageTitle>
      <p className="-mt-4 px-1.5 text-[17px] leading-relaxed text-foreground-soft">
        Give us the tail number and we&rsquo;ll look up what that aircraft flew today. You pick which one was yours.
      </p>

      <Section title={<>Tail number</>}>
        <label className="sr-only" htmlFor="tail">
          Tail number
        </label>
        <input
          id="tail"
          value={tail}
          onChange={(e) => setTail(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="N4521P"
          className="min-h-[52px] w-full rounded-xl border border-hairline bg-surface-sunken px-4 text-[22px] font-semibold tracking-wide text-foreground placeholder:font-normal placeholder:text-foreground-faint"
        />
        {/* Recent aircraft, so the common case is one tap and no typing. */}
        <div className="flex flex-wrap gap-2 pt-3">
          {FLIGHT_DEFAULTS.recentAircraft.map((a) => (
            <button
              key={a.tailNumber}
              onClick={() => setTail(a.tailNumber)}
              className={cn(
                "min-h-[40px] cursor-pointer rounded-full border px-4 text-[15px] font-medium transition-colors",
                tail === a.tailNumber
                  ? "border-brand text-brand"
                  : "border-hairline text-foreground-soft hover:border-foreground-faint/40",
              )}
            >
              {a.tailNumber}
            </button>
          ))}
        </div>
      </Section>

      <PrimaryButton onClick={onSearch}>
        <Search className="size-[18px]" aria-hidden />
        Find flights
      </PrimaryButton>

      <Card onClick={onManual} className="flex items-center gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-foreground-soft">
          <Plane className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-medium text-foreground">Add manually instead</span>
          <span className="mt-0.5 block text-[15px] leading-relaxed text-foreground-soft">
            For an aircraft without ADS-B, or a simulator session.
          </span>
        </span>
      </Card>
    </>
  );
}

/* ------------------------------------------------------- 2. pick yours */

function PickStep({
  tail,
  onPick,
  onManual,
}: {
  tail: string;
  onPick: (c: FlightCandidate) => void;
  onManual: () => void;
}) {
  const candidates = candidatesForTail(tail);

  if (candidates.length === 0) {
    return (
      <>
        <PageTitle kicker={tail}>No flights found</PageTitle>
        <p className="-mt-4 px-1.5 text-[17px] leading-relaxed text-foreground-soft">
          We didn&rsquo;t see {tail} on ADS-B today. Plenty of training aircraft aren&rsquo;t equipped, or the flight
          may not have been picked up &mdash; you can still add it by hand, and everything else works the same.
        </p>
        <PrimaryButton onClick={onManual}>Add manually</PrimaryButton>
      </>
    );
  }

  return (
    <>
      <PageTitle kicker={`${tail} · Today`}>Which one was yours?</PageTitle>
      {/* The honest framing, stated once and not repeated on every card. */}
      <p className="-mt-4 px-1.5 text-[17px] leading-relaxed text-foreground-soft">
        This is everything {tail} flew today. We can see the aircraft &mdash; we can&rsquo;t see who was in it.
      </p>

      <div className="flex flex-col gap-3">
        {candidates.map((c) => (
          <Card key={c.providerFlightId} onClick={() => onPick(c)} className="flex items-start gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[19px] font-semibold text-foreground">
                {c.departedAt} &ndash; {c.landedAt}
              </span>
              <span className="mt-1 block text-[15px] text-foreground-soft">
                {c.departureAirport} &rarr; {c.arrivalAirport} · {formatHours(c.durationMinutes)} hr
              </span>
              <span className="mt-1 block text-[14px] text-foreground-faint">Track available</span>
            </span>
          </Card>
        ))}
      </div>

      <SecondaryButton onClick={onManual}>None of these are mine</SecondaryButton>
    </>
  );
}

/* -------------------------------------------------------------- 3. manual */

/**
 * Pre-filled from the last flight. A student flying the same airplane out of
 * the same airport every week should be able to accept all of it and move on;
 * retyping six identical values is what makes people stop logging flights.
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
          <Field label="Flight time" value="1.3 hr" last />
        </div>
      </Section>

      <PrimaryButton onClick={onSave}>Continue</PrimaryButton>
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

/* --------------------------------------------------------- 4. who flew it */

/**
 * The two things no lookup can answer.
 *
 * Asked explicitly rather than defaulted: a solo flight with an instructor's
 * name attached would put words in someone's mouth, and the perception-gap
 * feature depends on knowing whether a second perspective exists at all.
 */
function WhoFlew({ solo, setSolo, onDone }: { solo: boolean; setSolo: (v: boolean) => void; onDone: () => void }) {
  const [instructor, setInstructor] = useState<string>(FLIGHT_DEFAULTS.recentInstructors[0]!);
  const [lesson, setLesson] = useState<string>(FLIGHT_DEFAULTS.recentLessons[0]!);

  return (
    <>
      <PageTitle kicker="Two things we can't look up">Who and what</PageTitle>

      <Section title={<>Who flew with you</>}>
        <div className="flex flex-col">
          {FLIGHT_DEFAULTS.recentInstructors.map((name) => (
            <Choice
              key={name}
              label={name}
              selected={!solo && instructor === name}
              onClick={() => {
                setSolo(false);
                setInstructor(name);
              }}
            />
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
      aria-pressed={selected}
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

/* ---------------------------------------------------------------- 5. done */

function Saved({ picked, solo }: { picked: FlightCandidate | null; solo: boolean }) {
  return (
    <>
      <Panel>
        <PanelEyebrow icon={<Check className="size-3.5" aria-hidden />}>Flight added</PanelEyebrow>
        <PanelHeadline>
          {picked ? `${picked.departureAirport} → ${picked.arrivalAirport}` : "Today's flight"}
        </PanelHeadline>
        <p className="mt-1 flex items-center gap-1.5 text-[15px] text-panel-foreground-soft">
          Today · {formatHours(picked?.durationMinutes ?? 78)} hr tracked
          <InfoTip label="Tracked hours" onPanel>
            Tracked hours are based on flights detected or confirmed in AfterFlight. They are not a substitute for
            your official pilot logbook.
          </InfoTip>
        </p>
      </Panel>

      {/* The flight exists in order to be debriefed. Say so now rather than
          returning to a list and hoping they find their way back. */}
      <div className="flex flex-col gap-2.5">
        <PrimaryButton href="/prototype/vector/debrief/new">
          <Mic className="size-[18px]" aria-hidden />
          {solo ? "Add my reflection" : "Start debrief"}
        </PrimaryButton>
        <div className="flex gap-2.5">
          <SecondaryButton href="/prototype/vector/flights">My flights</SecondaryButton>
          <SecondaryButton href="/prototype/vector">Do it later</SecondaryButton>
        </div>
      </div>
    </>
  );
}
