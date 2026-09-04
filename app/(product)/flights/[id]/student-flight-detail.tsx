import Link from "next/link";
import { ChevronRight, Mic } from "lucide-react";
import { FlightMap } from "@/components/flight-map";
import { ResumeDebriefButton } from "@/components/resume-debrief-button";
import { PageTitle, PrimaryButton, Screen, Section, StateLabel } from "@/components/student/ui";
import { AcsBadge } from "@/components/acs-badge";
import { simplifyTrackForDisplay } from "@/lib/flight-track";
import { formatDurationShort } from "@/lib/utils";
import type { CertificateType, FlightWithRelations, SkillProgressionStatus } from "@/lib/types";
import type { SkillProgression } from "@/lib/skill-progress";

function toneForStatus(status: SkillProgressionStatus) {
  if (status === "Demonstrated") return "Meets Standard" as const;
  if (status === "Needs Coaching") return "Needs Work" as const;
  return "Improving" as const;
}

/**
 * Student's own view of one flight -- app/prototype/vector/flights/[id]/page.tsx
 * is the design source. A new component, not a reskin of the page below it in
 * the tree: this same route is shared with instructor/admin viewers (see
 * FlightDetailPage's own isInstructorViewer branch and student-training-
 * detail.tsx's link into it), so that rendering stays untouched.
 *
 * "Flight analysis" (moments/telemetry insight) isn't ported -- the
 * prototype's version is keyed to one hardcoded flight id
 * (lib/prototype/moments.ts's analysisFor("aug-29")) with no production
 * equivalent, so it's left out rather than faked.
 */
export function StudentFlightDetail({
  flight,
  tasksPending,
  hasPendingDebrief,
  guidanceMode,
  skillProgressions,
  certificateType,
}: {
  flight: FlightWithRelations;
  tasksPending: boolean;
  hasPendingDebrief: boolean;
  guidanceMode: "freeform" | "guided" | "light";
  skillProgressions: SkillProgression[];
  certificateType: CertificateType | null;
}) {
  const displayTrack = simplifyTrackForDisplay(flight.track);
  const dateLabel = new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Screen>
      <div>
        <p className="text-[15px] text-foreground-faint">
          {dateLabel} · {flight.departureAirport} → {flight.arrivalAirport}
        </p>
        <PageTitle>{flight.aircraft.tailNumber}</PageTitle>
        <p className="mt-2 text-[17px] text-foreground-soft">
          {flight.aircraft.type} · {formatDurationShort(flight.durationMinutes)} · {flight.instructor?.name ?? "Solo"}
        </p>
      </div>

      {/* Same real gating results/[id]/page.tsx has always used -- guided/
          light orgs require the CFI to pick tasks first, a saved-but-
          unanalyzed recording resumes instead of re-recording, and a solo/
          freeform flight is the only case where the student's own tap
          starts the recording. */}
      {flight.debriefStatus === "complete" ? (
        <PrimaryButton href={`/flights/${flight.id}/debrief/results`}>View debrief</PrimaryButton>
      ) : hasPendingDebrief ? (
        <ResumeDebriefButton flightId={flight.id} />
      ) : tasksPending ? (
        <p className="rounded-2xl border border-hairline bg-surface-sunken px-5 py-4 text-center text-[15px] text-foreground-soft">
          Waiting on your CFI to pick today&rsquo;s tasks.
        </p>
      ) : (
        <PrimaryButton href={`/flights/${flight.id}/debrief`}>
          <Mic className="size-[18px]" aria-hidden />
          {guidanceMode !== "freeform" ? "Continue" : "Start debrief"}
        </PrimaryButton>
      )}

      <Section title="Flight path" flush>
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <FlightMap track={displayTrack} hasAdsbLookup={flight.fr24FlightId !== null} />
        </div>
      </Section>

      {skillProgressions.length > 0 ? (
        <Section title="Skills this flight moved">
          <div className="flex flex-col">
            {skillProgressions.map((p) => {
              const tone = toneForStatus(p.status);
              return (
                <Link
                  key={p.skill}
                  href="/progress"
                  className="flex min-h-[64px] items-center gap-4 border-b border-hairline py-3.5 last:border-b-0"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-medium text-foreground">{p.label}</span>
                    <span className="text-[14px] text-foreground-faint">{p.status}</span>
                  </span>
                  <StateLabel state={tone} />
                  <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
                </Link>
              );
            })}
          </div>
          <div className="pt-3">
            <AcsBadge skill={skillProgressions[0]!.skill} certificateType={certificateType} />
          </div>
        </Section>
      ) : null}
    </Screen>
  );
}
