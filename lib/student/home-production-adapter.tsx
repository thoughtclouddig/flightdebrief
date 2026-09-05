import { LocalDateTime } from "@/components/local-date-time";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeDebriefProgress } from "@/lib/debrief-progress";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatDurationShort, formatFlightContext } from "@/lib/utils";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { StudentHomePanel, StudentHomeProps } from "@/components/student/student-home";

/**
 * Where this adapter's caller lives, and which other V2 experiences it can
 * actually reach today. Every field except `addFlight` is nullable on
 * purpose: Milestone 2A productionizes Home ONLY, so /v2/flights,
 * /v2/debrief, /v2/train and /v2/progress all still exist purely as
 * Milestone 1B fixture routes -- none of them read real per-flight data.
 * Passing null tells this adapter that destination isn't real yet, so it
 * omits or disables rather than ever linking a real flight's Home into
 * fixture content. Milestone 2B replaces these with real functions as each
 * experience gets productionized -- no change to this adapter's internals
 * required, just different arguments from the caller.
 *
 * addFlight is the one non-nullable exception: Milestone 2A explicitly
 * approved keeping its row VISIBLE but disabled (same "known gap, shown not
 * hidden" treatment Start Flight already gets), rather than omitted --
 * `href` still has to be a real, non-empty string even when disabled, since
 * StudentHome's own render logic uses addFlightHref's truthiness to decide
 * whether the whole Start-Flight/Add-Flight row appears at all.
 */
export interface HomeHrefBuilders {
  myFlights: string | null;
  pastDebriefs: string | null;
  debrief: ((flightId: string) => string) | null;
  flightDetail: ((flightId: string) => string) | null;
  train: string | null;
  addFlight: { href: string; disabled: boolean };
  debriefResults: ((flightId: string) => string) | null;
  progress: string | null;
}

/**
 * The production adapter for V2 Home: real repository data, the real
 * lifecycle resolver (lib/debrief-progress.ts), zero fixture values. Mirrors
 * app/(product)/home/page.tsx's own logic (same lifecycle, same copy).
 *
 * Milestone-2A-specific honesty rules, applied uniformly rather than
 * special-cased per field:
 * - Start Flight is always disabled (no production web save endpoint for
 *   live recording exists anywhere yet, /v2 or otherwise).
 * - Any OTHER destination whose `hrefs.*` builder is null gets disabled
 *   (when the presentation contract supports a disabled variant for that
 *   field) or omitted entirely (when it doesn't -- trainCta and
 *   bottomRows.progressHref have no disabled variant in StudentHomeProps,
 *   and this adapter does not add one; that would be redesigning the
 *   approved presentation, not adapting data into it).
 */
export async function buildProductionHomeProps(
  repo: Repository,
  viewer: Viewer,
  hrefs: HomeHrefBuilders,
): Promise<StudentHomeProps> {
  const solo = viewer.organization.kind === "individual";
  const studentId = viewer.user.id;

  const [flights, brief] = await Promise.all([repo.listFlights({ studentId }), computeNextLessonBrief(repo, studentId)]);

  const pendingFlight =
    [...flights].filter((f) => f.debriefStatus !== "complete").sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;
  const pendingProgress = pendingFlight ? await computeDebriefProgress(repo, pendingFlight) : null;
  const cfi = resolveCfiFirstName(brief.lastInstructor);
  const debriefedCount = flights.filter((f) => f.debriefStatus === "complete").length;

  let panel: StudentHomePanel;
  if (pendingFlight && pendingProgress) {
    // Debrief-dependent CTA: the lifecycle state, copy and label are always
    // computed for real -- only the destination is conditional on
    // hrefs.debrief/flightDetail existing. Not yet true in Milestone 2A (no
    // /v2/flights/[id]/debrief route exists), so both render as a known,
    // honestly disabled milestone dependency rather than linking to the
    // legacy (product) route, fixture content, or a fixture-only /v2 route
    // reached with a real flight id.
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
      primaryHref: hrefs.debrief?.(pendingFlight.id) ?? "#",
      primaryDisabled: hrefs.debrief === null,
      secondaryHref: hrefs.flightDetail?.(pendingFlight.id) ?? "#",
      secondaryDisabled: hrefs.flightDetail === null,
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
    // Genuine contract gap, not silently resolved: StudentHomePanel's
    // "empty" variant renders Add Flight as an always-active PanelButton
    // with no disabled variant at all, unlike every other panel kind -- see
    // components/student/student-home.tsx's own "empty" branch. Not
    // reachable by Milestone 2A's required staging test states (a persona
    // with zero flights ever isn't one of the four), so left as a known
    // limitation rather than expanding this milestone's scope to add one.
    panel = { kind: "empty", addFlightHref: hrefs.addFlight.href };
  }

  return {
    firstName: viewer.user.name.split(" ")[0]!,
    panel,
    // Both fields point at not-yet-productionized destinations (Flights,
    // Debrief hub) in Milestone 2A; myFlightsDisabled exists on this type but
    // pastDebriefsHref has no disabled variant, so the whole block is omitted
    // rather than half-disabled -- see this file's own top doc comment.
    justFlewRows:
      panel.kind === "justFlew" && hrefs.myFlights && hrefs.pastDebriefs
        ? { myFlightsHref: hrefs.myFlights, myFlightsCount: flights.length, pastDebriefsHref: hrefs.pastDebriefs, pastDebriefsCount: debriefedCount }
        : undefined,
    keyReminder: panel.kind !== "empty" && cfi && brief.lastInstructorNote ? { instructorFirstName: cfi, quote: brief.lastInstructorNote.quote } : null,
    // trainCta has no disabled variant at all -- omitted entirely rather
    // than link a real flight into the fixture-only /v2/train.
    trainCta: panel.kind !== "empty" && brief.lastFlight && hrefs.train ? { instructorFirstName: cfi, href: hrefs.train } : null,
    // Live-recording persistence is native-iOS work, not yet built for web --
    // no real production destination exists, so this renders as a visible
    // disabled marker rather than linking anywhere fixture-only.
    startFlight: panel.kind !== "empty" && brief.lastFlight ? { disabled: true } : null,
    addFlightHref: panel.kind !== "empty" && brief.lastFlight ? hrefs.addFlight.href : null,
    addFlightDisabled: hrefs.addFlight.disabled,
    // myFlights and lastDebrief both support a disabled variant here, but
    // progressHref does not -- same reasoning as justFlewRows, the whole
    // block is omitted rather than partially honest.
    bottomRows:
      panel.kind !== "empty" && brief.lastFlight && hrefs.myFlights && hrefs.debriefResults && hrefs.progress
        ? {
            myFlightsHref: hrefs.myFlights,
            myFlightsCount: flights.length,
            lastDebrief: {
              href: hrefs.debriefResults(brief.lastFlight.id),
              dateLabel: new Date(brief.lastFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            },
            progressHref: hrefs.progress,
          }
        : undefined,
  };
}
