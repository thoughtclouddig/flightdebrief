import type { StudentHomePanel, StudentHomeProps } from "@/components/student/student-home";
import { INSTRUCTOR, NEXT_LESSON, PENDING_FLIGHT, STRUCTURED, STUDENT } from "@/lib/prototype-fixtures/vector-data";

/**
 * The fixture adapter for /v2 Home -- Milestone 2A's formalization of what
 * app/v2/page.tsx already did inline, preserving Milestone 1B's approved
 * rendering exactly (mechanical extraction, no behavior change). Covers the
 * `state=flown` and default ("nextFlight") cases; `state=landed` stays a
 * page-level concern, since JustLanded has no StudentHomeProps shape at all
 * (no production counterpart -- see its own doc comment in app/v2/page.tsx).
 */
export function buildFixtureHomeProps(state: string | undefined): StudentHomeProps {
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
    return {
      firstName: STUDENT.firstName,
      panel,
      justFlewRows: {
        myFlightsHref: "/v2/flights",
        myFlightsCount: 5,
        pastDebriefsHref: "/v2/debrief",
        pastDebriefsCount: 3,
      },
    };
  }

  const panel: StudentHomePanel = {
    kind: "nextFlight",
    dateTimeLabel: `${NEXT_LESSON.date} · ${NEXT_LESSON.time}`,
    instructorName: `${INSTRUCTOR.firstName} · Crosswind + Short Field`,
    focusItems: STRUCTURED.nextFlightFocus,
  };
  return {
    firstName: STUDENT.firstName,
    panel,
    keyReminder: { instructorFirstName: INSTRUCTOR.firstName, quote: STRUCTURED.instructorEmphasis[0]!.quote },
    trainCta: { instructorFirstName: INSTRUCTOR.firstName, href: "/v2/train" },
    startFlight: { href: "/v2/fly" },
    addFlightHref: "/v2/flights/new",
    bottomRows: {
      myFlightsHref: "/v2/flights",
      myFlightsCount: 5,
      lastDebrief: { href: "/v2/debrief/latest", dateLabel: "Aug 29" },
      progressHref: "/v2/progress",
    },
  };
}
