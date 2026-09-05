import { StudentHome, type StudentHomePanel } from "@/components/student/student-home";
import { LocalDateTime } from "@/components/local-date-time";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeDebriefProgress } from "@/lib/debrief-progress";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatDurationShort, formatFlightContext } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Thin data-fetching wrapper -- all the real content lives in
 * components/student/student-home.tsx, the same component
 * app/prototype/vector/page.tsx renders with fixture props. This file's
 * only job is turning real repository data into that component's prop
 * shape.
 */
export default async function StudentHomePage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const solo = viewer.organization.kind === "individual";
  const studentId = viewer.user.id;

  const [flights, brief] = await Promise.all([
    repo.listFlights({ studentId }),
    computeNextLessonBrief(repo, studentId),
  ]);

  const pendingFlight = [...flights]
    .filter((f) => f.debriefStatus !== "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;
  const pendingProgress = pendingFlight ? await computeDebriefProgress(repo, pendingFlight) : null;
  const cfi = resolveCfiFirstName(brief.lastInstructor);
  const debriefedCount = flights.filter((f) => f.debriefStatus === "complete").length;

  let panel: StudentHomePanel;
  if (pendingFlight && pendingProgress) {
    panel = {
      kind: "justFlew",
      flightContext: formatFlightContext(pendingFlight),
      bodyText: solo
        ? "Capture what mattered while it's fresh."
        : pendingProgress.stage === "awaiting_tasks"
          ? "Confirm what you worked on to start your assessment."
          : pendingProgress.stage === "awaiting_instructor_assessment"
            ? "Hand the phone to your instructor."
            : pendingProgress.stage === "awaiting_student_assessment"
              ? "Your turn to rate it."
              : pendingProgress.stage === "awaiting_finish"
                ? "Recorded -- your instructor still needs to finish reviewing it with you."
                : pendingProgress.instructorAttribution === "guest_handoff"
                  ? "Continue where you left off."
                  : "Both assessments are in -- your instructor is starting the debrief.",
      primaryLabel: solo
        ? "Start debrief"
        : pendingProgress.stage === "awaiting_tasks"
          ? "Start debrief"
          : pendingProgress.stage === "awaiting_student_assessment"
            ? "Do it now"
            : pendingProgress.stage === "awaiting_instructor_assessment"
              ? "Hand off"
              : pendingProgress.stage === "ready_to_debrief" && pendingProgress.instructorAttribution === "guest_handoff"
                ? "Continue"
                : "Open",
      primaryHref: `/flights/${pendingFlight.id}/debrief`,
      secondaryHref: `/flights/${pendingFlight.id}`,
      showAutoRefresh: !solo,
    };
  } else if (brief.upcomingReservation) {
    panel = {
      kind: "nextFlight",
      dateTimeLabel: (
        <LocalDateTime
          iso={brief.upcomingReservation.scheduledStart}
          options={{ weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
        />
      ),
      instructorName: brief.upcomingReservationInstructor?.name ?? "TBD",
      focusItems: brief.focusAreas,
    };
  } else if (brief.lastFlight) {
    panel = {
      kind: "lastFlight",
      route: `${brief.lastFlight.departureAirport} → ${brief.lastFlight.arrivalAirport}`,
      metaLabel: `${new Date(brief.lastFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${brief.lastFlight.aircraft.tailNumber} · ${formatDurationShort(brief.lastFlight.durationMinutes)}`,
    };
  } else {
    panel = { kind: "empty", addFlightHref: "/flights/new" };
  }

  return (
    <StudentHome
      firstName={viewer.user.name.split(" ")[0]!}
      panel={panel}
      justFlewRows={
        panel.kind === "justFlew"
          ? { myFlightsHref: "/dashboard", myFlightsCount: flights.length, pastDebriefsHref: "/debrief", pastDebriefsCount: debriefedCount }
          : undefined
      }
      keyReminder={panel.kind !== "empty" && cfi && brief.lastInstructorNote ? { instructorFirstName: cfi, quote: brief.lastInstructorNote.quote } : null}
      trainCta={panel.kind !== "empty" && brief.lastFlight ? { instructorFirstName: cfi, href: "/train" } : null}
      // Live-recording persistence is native-iOS work, not yet built for
      // web -- no real production destination exists, so this renders as a
      // visible disabled marker rather than linking into the prototype's
      // own recorder UI (see StudentHome's startFlight doc comment).
      startFlight={panel.kind !== "empty" && brief.lastFlight ? { disabled: true } : null}
      addFlightHref={panel.kind !== "empty" && brief.lastFlight ? "/flights/new" : null}
      bottomRows={
        panel.kind !== "empty" && brief.lastFlight
          ? {
              myFlightsHref: "/dashboard",
              myFlightsCount: flights.length,
              lastDebrief: {
                href: `/flights/${brief.lastFlight.id}/debrief/results`,
                dateLabel: new Date(brief.lastFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              },
              progressHref: "/progress",
            }
          : undefined
      }
    />
  );
}
