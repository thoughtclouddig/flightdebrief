import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { DebriefResultSections } from "@/components/debrief/debrief-result-sections";
import { DebriefReplay } from "@/components/debrief/debrief-replay";
import { type ComparisonRow } from "@/components/debrief/comparison-table";
import { discrepancyDistance, discrepancyStatusFor } from "@/lib/debrief-cards/discrepancy";
import { getRepository } from "@/lib/data";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { simplifyTrackForDisplay } from "@/lib/flight-track";
import { computeSkillProgression } from "@/lib/skill-progress";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightContext } from "@/lib/utils";

export default async function DebriefResultsPage(props: PageProps<"/flights/[id]/debrief/results">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { flight, viewer } = authorized;
  const repo = getRepository();
  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) notFound();

  const { structuredResult: result } = debrief;
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);

  // Marks the "Review your Debrief Replay" Guide step (lib/guide.ts) for
  // whoever's actually looking -- student or CFI/admin alike, since the
  // Guide tracks each viewer's own progress. Fire-and-forget: this page
  // shouldn't wait on it, and a failed write just means the step re-marks
  // on the next visit.
  if (!viewer.user.guideProgress?.replay) {
    void repo.markGuideStepViewed(viewer.user.id, "replay").catch(() => {});
  }

  const [allStudentSignals, memberships, nextLessonBrief] = await Promise.all([
    repo.listTrainingSignals({ studentId: flight.userId }),
    repo.listMembershipsForUser(flight.userId),
    computeNextLessonBrief(repo, flight.userId),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === flight.organizationId)?.certificateType ?? null;
  const flightSkills = new Set(
    allStudentSignals.filter((s) => s.flightId === flight.id).map((s) => s.skill),
  );
  const flightSkillProgressions = computeSkillProgression(allStudentSignals.filter((s) => !s.dismissed)).filter((p) =>
    flightSkills.has(p.skill),
  );
  const isInstructorViewer = viewer.role === "instructor" || viewer.role === "admin";
  const canDismiss = isInstructorViewer;

  const differenceRows: ComparisonRow[] = result.assessmentDifferences.map((d) => ({
    taskLabel: d.taskLabel,
    studentLevel: d.studentLevel,
    instructorLevel: d.instructorLevel,
    status: discrepancyStatusFor(discrepancyDistance(d.studentLevel, d.instructorLevel)),
  }));
  const displayTrack = simplifyTrackForDisplay(flight.track);
  const instructorFirstName = resolveCfiFirstName(flight.instructor);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Debrief Summary</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          {formatFlightContext(flight)}
        </h1>
        <p className="mt-1 text-sm text-foreground-soft">
          {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <DebriefReplay
        flightId={flight.id}
        result={result}
        recurringTheme={nextLessonBrief.recurringThemes[0] ?? null}
        certificateType={certificateType}
        canEditCue={viewer.user.id === flight.userId}
        handoff={{
          keepWorkingOn: nextLessonBrief.keepWorkingOn,
          beforeFlightItems: nextLessonBrief.beforeFlightItems,
        }}
        instructorFirstName={instructorFirstName}
      />

      <DebriefResultSections
        result={result}
        differenceRows={differenceRows}
        displayTrack={displayTrack}
        ttsEnabled={ttsEnabled}
        flightId={flight.id}
        flightSkillProgressions={flightSkillProgressions}
        instructorFirstName={instructorFirstName}
        certificateType={certificateType}
        canDismiss={canDismiss}
      />

      {/* Both destinations are role-aware. "/dashboard" is the STUDENT flights
          list -- sending a CFI there dropped them somewhere that isn't their
          home at all, under a label ("Dashboard") that doesn't match what
          either role's nav calls it. */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={isInstructorViewer ? `/cfi/students/${flight.userId}/handoff` : "/next-lesson"}
          className={buttonVariants({ size: "lg", className: "w-full sm:flex-1" })}
        >
          Go to Next-Lesson Brief
        </Link>
        <Link
          href={isInstructorViewer ? "/cfi/today" : "/dashboard"}
          className={buttonVariants({ size: "lg", variant: "outline", className: "w-full sm:w-auto" })}
        >
          {isInstructorViewer ? "Back to Today" : "Back to Flights"}
        </Link>
      </div>
    </div>
  );
}
