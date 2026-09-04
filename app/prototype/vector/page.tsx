import type { Metadata } from "next";
import { Plus, Radar } from "lucide-react";
import { PageTitle, Panel, PanelButton, PanelEyebrow, PanelHeadline, QuietRow, Screen } from "@/components/student/ui";
import { StudentHome, type StudentHomePanel } from "@/components/student/student-home";
import { INSTRUCTOR, NEXT_LESSON, PENDING_FLIGHT, STRUCTURED, STUDENT } from "@/lib/prototype-fixtures/vector-data";
import { FLIGHT_DEFAULTS } from "@/lib/prototype-fixtures/flights";

export const metadata: Metadata = { title: "Home — AfterFlight", robots: { index: false, follow: false } };

/**
 * Home is state-aware, and that is the point of this screen.
 *
 * The previous version assumed a debrief had already happened, which meant it
 * had nothing to say in the twenty minutes that matter most -- the ones right
 * after shutdown, when the details are still in the student's head and the
 * debrief is the only thing worth doing. Two states:
 *
 *   A. flown, not debriefed  -> START DEBRIEF is the single obvious action
 *   B. between flights       -> TRAIN WITH VECTOR against Thursday's focus
 *
 * Both answer the same question: what should I do now?
 *
 * JustFlew and BetweenFlights render through components/prototype/
 * student-home.tsx -- the same component app/(product)/home/page.tsx
 * renders with real repository data, fed fixture values here instead. Only
 * JustLanded stays local: it depends on proactive ADS-B "did you fly today"
 * detection that has no production counterpart at all, so there is nothing
 * for a production caller to ever pass into it.
 */
export default async function PrototypeHome({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  if (state === "landed") return <JustLanded />;

  if (state === "flown") {
    const panel: StudentHomePanel = {
      kind: "justFlew",
      flightContext: PENDING_FLIGHT.lesson,
      bodyText: "Capture what mattered while it's fresh.",
      primaryLabel: "Start debrief",
      primaryHref: "/prototype/vector/debrief/new",
      secondaryHref: "/prototype/vector/flights/aug-29",
      showAutoRefresh: false,
    };
    return (
      <StudentHome
        firstName={STUDENT.firstName}
        panel={panel}
        justFlewRows={{
          myFlightsHref: "/prototype/vector/flights",
          myFlightsCount: 5,
          pastDebriefsHref: "/prototype/vector/debrief",
          pastDebriefsCount: 3,
        }}
      />
    );
  }

  const panel: StudentHomePanel = {
    kind: "nextFlight",
    dateTimeLabel: `${NEXT_LESSON.date} · ${NEXT_LESSON.time}`,
    instructorName: `${INSTRUCTOR.firstName} · Crosswind + Short Field`,
    focusItems: STRUCTURED.nextFlightFocus,
  };
  return (
    <StudentHome
      firstName={STUDENT.firstName}
      panel={panel}
      keyReminder={{ instructorFirstName: INSTRUCTOR.firstName, quote: STRUCTURED.instructorEmphasis[0]!.quote }}
      trainCta={{ instructorFirstName: INSTRUCTOR.firstName, href: "/prototype/vector/train" }}
      startFlight={{ href: "/prototype/vector/fly" }}
      addFlightHref="/prototype/vector/flights/new"
      bottomRows={{
        myFlightsHref: "/prototype/vector/flights",
        myFlightsCount: 5,
        lastDebrief: { href: "/prototype/vector/debrief/latest", dateLabel: "Aug 29" },
        progressHref: "/prototype/vector/progress",
      }}
    />
  );
}

/* --------------------------------------------- STATE B: flew, not added yet */

/**
 * The student flew and AfterFlight has no record of it.
 *
 * Note what this screen does NOT say. An earlier version said "we found your
 * flight" and showed one ADS-B match -- but ADS-B tracks an AIRPLANE, not a
 * person, and a club trainer flies three or four students a day. AfterFlight
 * cannot know which of those was Mia, so it does not claim to. It offers to do
 * the typing, and asks her to do the identifying, which is the only part
 * nobody else can do.
 *
 * Stays local, not part of student-home.tsx: there is no production
 * equivalent of "we detected you might have flown" to hand this component,
 * so there is nothing to genuinely share.
 */
function JustLanded() {
  return (
    <Screen>
      <PageTitle kicker="Good afternoon">{STUDENT.firstName}</PageTitle>

      <Panel>
        <PanelEyebrow icon={<Radar className="size-3.5" aria-hidden />}>Flew today?</PanelEyebrow>
        <PanelHeadline>Add it while it&rsquo;s fresh</PanelHeadline>
        <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">
          Give us the tail number and we&rsquo;ll pull up what {FLIGHT_DEFAULTS.recentAircraft[0]!.tailNumber} and
          your other aircraft flew today. You pick which one was yours.
        </p>
        <div className="mt-6">
          <PanelButton href="/prototype/vector/flights/new">
            <Plus className="size-[18px]" aria-hidden />
            Add flight
          </PanelButton>
        </div>
      </Panel>

      <div className="flex flex-col">
        <QuietRow href="/prototype/vector/flights" label="My flights" meta="5" />
        <QuietRow href="/prototype/vector/progress" label="See progress" meta="4 skills" />
      </div>
    </Screen>
  );
}
