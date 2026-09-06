import { notFound } from "next/navigation";
import { DebriefResultSections } from "@/components/debrief/debrief-result-sections";
import { DebriefReplay } from "@/components/debrief/debrief-replay";
import { PrimaryButton, Screen } from "@/components/student/ui";
import { discrepancyDistance, discrepancyStatusFor } from "@/lib/debrief-cards/discrepancy";
import { buildPerceptionGapRow, type PerceptionGapRow } from "@/lib/perception-gap";
import { getRepository } from "@/lib/data";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { simplifyTrackForDisplay } from "@/lib/flight-track";
import { computeSkillProgression } from "@/lib/skill-progress";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightContext } from "@/lib/utils";

/**
 * CFI V2's own finished-debrief summary -- deliberately NOT StudentDebriefV2
 * (that component's name and copy are explicitly the student's own view,
 * per its own doc comment; canonical's instructor branch never reused it
 * either). Same business logic and same DebriefReplay/DebriefResultSections
 * canonical's instructor branch renders, in V2 presentation, with the final
 * CTA pointed at CFI V2's Student Detail instead of the retired standalone
 * Handoff page.
 */
export default async function CfiV2DebriefResultsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { flight, viewer } = authorized;
  if (viewer.role !== "instructor" && viewer.role !== "admin") notFound();

  const repo = getRepository();
  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) notFound();

  const { structuredResult: result } = debrief;
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);

  if (!viewer.user.guideProgress?.replay) {
    void repo.markGuideStepViewed(viewer.user.id, "replay").catch(() => {});
  }

  const [allStudentSignals, memberships, nextLessonBrief] = await Promise.all([
    repo.listTrainingSignals({ studentId: flight.userId }),
    repo.listMembershipsForUser(flight.userId),
    computeNextLessonBrief(repo, flight.userId),
  ]);
  const certificateType = memberships.find((m) => m.organizationId === flight.organizationId)?.certificateType ?? null;
  const flightSkills = new Set(allStudentSignals.filter((s) => s.flightId === flight.id).map((s) => s.skill));
  const flightSkillProgressions = computeSkillProgression(allStudentSignals.filter((s) => !s.dismissed)).filter((p) =>
    flightSkills.has(p.skill),
  );

  const differenceRows: PerceptionGapRow[] = result.assessmentDifferences.map((d) =>
    buildPerceptionGapRow({
      taskLabel: d.taskLabel,
      studentLevel: d.studentLevel,
      instructorLevel: d.instructorLevel,
      status: discrepancyStatusFor(discrepancyDistance(d.studentLevel, d.instructorLevel)),
      note: d.note,
    }),
  );
  const displayTrack = simplifyTrackForDisplay(flight.track);
  const instructorFirstName = resolveCfiFirstName(flight.instructor);

  return (
    <Screen>
      <div className="text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Debrief Summary</p>
        <h1 className="mt-1 text-[27px] font-semibold text-foreground">{formatFlightContext(flight)}</h1>
        <p className="mt-1 text-[15px] text-foreground-soft">
          {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <DebriefReplay
        flightId={flight.id}
        result={result}
        recurringTheme={nextLessonBrief.recurringThemes[0] ?? null}
        certificateType={certificateType}
        canEditCue={false}
        handoff={{ keepWorkingOn: nextLessonBrief.keepWorkingOn, beforeFlightItems: nextLessonBrief.beforeFlightItems }}
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
        canDismiss
        showDebriefContext={false}
      />

      <PrimaryButton href={`/cfi-v2/students/${flight.userId}`}>Go to student</PrimaryButton>
    </Screen>
  );
}
