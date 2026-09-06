import type { StudentHomePanel, StudentHomeProps } from "@/components/student/student-home";
import { INSTRUCTOR, NEXT_LESSON, PENDING_FLIGHT, STRUCTURED, STUDENT } from "@/lib/prototype-fixtures/vector-data";
import type { FixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

/**
 * The fixture adapter for Mia's Home -- shared between app/v2/page.tsx's
 * fixture branch and app/demo/student/page.tsx, which is the whole reason
 * hrefs come in as a parameter rather than being hardcoded here: one caller
 * needs /v2/**, the other /demo/student/**, and this function has to
 * produce identical content either way. Covers the `state=flown` and
 * default ("nextFlight") cases; `state=landed` stays a page-level concern,
 * since JustLanded has no StudentHomeProps shape at all (no production
 * counterpart -- see its own doc comment in app/v2/page.tsx).
 */
export function buildFixtureHomeProps(state: string | undefined, hrefs: FixtureStudentHrefs): StudentHomeProps {
  if (state === "flown") {
    const panel: StudentHomePanel = {
      kind: "justFlew",
      flightContext: PENDING_FLIGHT.lesson,
      bodyText: "Capture what mattered while it's fresh.",
      primaryLabel: "Start debrief",
      primaryHref: hrefs.debriefNew,
      secondaryHref: hrefs.flightDetail("aug-29"),
      showAutoRefresh: false,
    };
    return {
      firstName: STUDENT.firstName,
      panel,
      justFlewRows: {
        myFlightsHref: hrefs.flights,
        myFlightsCount: 5,
        pastDebriefsHref: hrefs.debriefHub,
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
    trainCta: { instructorFirstName: INSTRUCTOR.firstName, href: hrefs.train },
    startFlight: { href: hrefs.fly },
    addFlightHref: hrefs.flightsNew,
    bottomRows: {
      myFlightsHref: hrefs.flights,
      myFlightsCount: 5,
      lastDebrief: { href: hrefs.debriefLatest, dateLabel: "Aug 29" },
      progressHref: hrefs.progress,
    },
  };
}
