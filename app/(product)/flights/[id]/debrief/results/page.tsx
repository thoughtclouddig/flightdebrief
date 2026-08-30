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
  // Demo orgs carry an expiry; see lib/billing-gate.ts.
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
        {/* The "offline fallback analyzer, check ANTHROPIC_API_KEY" notice
            that used to sit here is gone. It was gated on the viewer being an
            instructor and not in a demo, and it reached a demo anyway --
            because the gate reads demoExpiresAt, which was not set on that
            org. But the deeper problem is that it was ever in the UI: naming
            one of our environment variables to a prospect evaluating the
            product, or to a paying CFI who cannot act on it either, is
            diagnostics leaking into a customer surface. A silent fallback is
            an operational alarm, not a page element -- lib/ai/index.ts logs
            it server-side where someone can act on it. */}
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
        hasAdsbLookup={flight.fr24FlightId !== null}
        ttsEnabled={ttsEnabled}
        flightId={flight.id}
        flightSkillProgressions={flightSkillProgressions}
        instructorFirstName={instructorFirstName}
        certificateType={certificateType}
        canDismiss={canDismiss}
      />

      {/* One button, not two. The second one pointed at the flights list for
          a student and Today for a CFI, both of which are already sitting in
          the nav at the top of the same screen -- a button whose only job is
          to duplicate a nav item makes the real next step look like one of
          two equal options.

          Named for where it goes, not "Back to": you can reach this page from
          Home, from a link, or straight from finishing a debrief, so claiming
          to return somewhere is usually wrong. */}
      <Link
        href={isInstructorViewer ? `/cfi/students/${flight.userId}/handoff` : "/next-lesson"}
        className={buttonVariants({ size: "lg", className: "w-full" })}
      >
        Go to Next-Lesson Brief
      </Link>
    </div>
  );
}
