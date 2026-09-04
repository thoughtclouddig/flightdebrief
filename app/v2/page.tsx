import type { Metadata } from "next";
import { Plus, Radar } from "lucide-react";
import { PageTitle, Panel, PanelButton, PanelEyebrow, PanelHeadline, QuietRow, Screen } from "@/components/student/ui";
import { StudentHome, type StudentHomePanel } from "@/components/student/student-home";
import { INSTRUCTOR, NEXT_LESSON, PENDING_FLIGHT, STRUCTURED, STUDENT } from "@/lib/prototype-fixtures/vector-data";
import { FLIGHT_DEFAULTS } from "@/lib/prototype-fixtures/flights";

export const metadata: Metadata = { title: "Home — AfterFlight", robots: { index: false, follow: false } };

/**
 * Milestone 1B fixture-parity Home -- mechanically the same as
 * app/prototype/vector/page.tsx, hrefs repointed at /v2/**. Every destination
 * this screen offers now exists under /v2 (Flights, Debrief lifecycle/Detail,
 * Fly), so nothing here is disabled anymore -- see Milestone 1A's version of
 * this file for the interim state.
 */
export default async function V2Home({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  if (state === "landed") return <JustLanded />;

  if (state === "flown") {
    const panel: StudentHomePanel = {
      kind: "justFlew",
      flightContext: PENDING_FLIGHT.lesson,
      bodyText: "Capture what mattered while it's fresh.",
      primaryLabel: "Start debrief",
      primaryHref: "/v2/debrief/new",
      secondaryHref: "/v2/flights/aug-29",
      showAutoRefresh: false,
    };
    return (
      <StudentHome
        firstName={STUDENT.firstName}
        panel={panel}
        justFlewRows={{
          myFlightsHref: "/v2/flights",
          myFlightsCount: 5,
          pastDebriefsHref: "/v2/debrief",
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
      trainCta={{ instructorFirstName: INSTRUCTOR.firstName, href: "/v2/train" }}
      startFlight={{ href: "/v2/fly" }}
      addFlightHref="/v2/flights/new"
      bottomRows={{
        myFlightsHref: "/v2/flights",
        myFlightsCount: 5,
        lastDebrief: { href: "/v2/debrief/latest", dateLabel: "Aug 29" },
        progressHref: "/v2/progress",
      }}
    />
  );
}

/* --------------------------------------------- STATE B: flew, not added yet */

/** Mirrors app/prototype/vector/page.tsx's own JustLanded exactly -- local, not shared, same as its prototype counterpart. */
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
          <PanelButton href="/v2/flights/new">
            <Plus className="size-[18px]" aria-hidden />
            Add flight
          </PanelButton>
        </div>
      </Panel>

      <div className="flex flex-col">
        <QuietRow href="/v2/flights" label="My flights" meta="5" />
        <QuietRow href="/v2/progress" label="See progress" meta="4 skills" />
      </div>
    </Screen>
  );
}
