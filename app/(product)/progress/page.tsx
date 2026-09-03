import Link from "next/link";
import { AlertCircle, ChevronRight, Repeat, TrendingUp } from "lucide-react";
import { AcsBadge } from "@/components/acs-badge";
import { TrainingItemChecklist } from "@/components/training-item-checklist";
import { PageTitle, Screen, Section } from "@/components/prototype/ui";
import { stateTone } from "@/lib/prototype/state-tone";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeSkillProgression, type SkillProgression } from "@/lib/skill-progress";
import { computeSchoolFreeDebriefs, computeStudentFreeFlights } from "@/lib/entitlements";
import { hasActiveSubscription } from "@/lib/billing-gate";
import { cn } from "@/lib/utils";
import type { SkillProgressionStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Buckets the real 5-value derived status (lib/skill-progress.ts's
 * deriveStatus) onto V2's 3-tone state scale for color only -- the status
 * WORD shown to a student is always the real one ("Needs Coaching",
 * "Demonstrated", ...), never relabeled into the 3-value set. This is
 * presentation bucketing of an existing computed value, not a second
 * scoring system: nothing here is persisted, and the underlying status is
 * unchanged from what CFI/admin viewers see via SkillProgressList.
 */
function toneForStatus(status: SkillProgressionStatus) {
  if (status === "Demonstrated") return "Meets Standard" as const;
  if (status === "Needs Coaching") return "Needs Work" as const;
  return "Improving" as const; // Introduced, Developing, Improving
}

export default async function ProgressPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  /** Certificated pilot flying without a CFI on the account -- see components/nav.tsx. */
  const solo = viewer.organization.kind === "individual";
  const studentId = viewer.user.id;

  const isSchoolOrg = viewer.organization.kind === "school";
  const [flights, trainingItems, brief, memberships, signals, billingScopedFlights] = await Promise.all([
    repo.listFlights({ studentId }),
    repo.listTrainingItems(),
    computeNextLessonBrief(repo, studentId),
    repo.listMembershipsForUser(studentId),
    repo.listTrainingSignals({ studentId }),
    // The real gate (lib/billing-gate.ts) caps a school on debriefs across
    // the WHOLE org, not per student -- computing "free flights used" from
    // just this student's own rows would undercount for any school with
    // more than one student. Only fetched when it matters; an individual
    // org's own flights already are its total.
    isSchoolOrg ? repo.listFlights({ organizationId: viewer.organization.id }) : Promise.resolve(null),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  // Marks the "Track your training over time" Guide step (lib/guide.ts).
  if (!viewer.user.guideProgress?.progress) {
    void repo.markGuideStepViewed(viewer.user.id, "progress").catch(() => {});
  }

  const flightIds = new Set(flights.map((f) => f.id));
  const openItems = trainingItems.filter((t) => flightIds.has(t.flightId) && !t.done && t.visibility === "shared");
  const keepWorkingOn = openItems.filter((t) => t.category === "keep_working_on");
  const beforeFlight = openItems.filter((t) => t.category === "before_next_flight");
  const debriefedCount = flights.filter((f) => f.debriefStatus === "complete").length;
  const skillProgressions = computeSkillProgression(signals.filter((s) => !s.dismissed));
  // Mirrors lib/billing-gate.ts's isBillingBlocked exactly: independent-CFI
  // orgs and an active subscription are never capped, so the line is hidden
  // rather than shown with a number that would never actually block anyone.
  const freeUsage = isSchoolOrg
    ? computeSchoolFreeDebriefs(billingScopedFlights ?? [])
    : computeStudentFreeFlights(flights);
  const showFreeUsage = viewer.organization.kind !== "independent_cfi" && !hasActiveSubscription(viewer.organization);

  return (
    <Screen>
      <PageTitle>{solo ? "Your proficiency" : "Your progress"}</PageTitle>
      <p className="-mt-4 px-1.5 text-[15px] leading-relaxed text-foreground-soft">
        Patterns across your training -- conservative on purpose. Nothing here is a trend until it&rsquo;s shown up more than once.
      </p>
      {showFreeUsage ? (
        <p className="-mt-2 px-1.5 text-[13px] font-semibold text-brand">
          {freeUsage.exhausted
            ? `You've used your ${freeUsage.cap} free ${isSchoolOrg ? "debriefs" : "flights"}.`
            : `${freeUsage.used} of ${freeUsage.cap} free ${isSchoolOrg ? "debriefs" : "flights"} used`}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Flights debriefed</p>
          <p className="mt-1 text-[28px] font-semibold tabular-nums text-foreground">{debriefedCount}</p>
        </div>
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Open action items</p>
          <p className="mt-1 text-[28px] font-semibold tabular-nums text-foreground">{openItems.length}</p>
        </div>
      </div>

      <Section title="Action items">
        {keepWorkingOn.length > 0 || beforeFlight.length > 0 ? (
          <div className="flex flex-col gap-4">
            {keepWorkingOn.length > 0 ? (
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">
                  <AlertCircle className="size-3.5" aria-hidden />
                  Ongoing ({keepWorkingOn.length})
                </p>
                <p className="mt-1 text-[15px] text-foreground-soft">
                  {solo ? "Skills that came out of your own debriefs." : "Skills your instructor called out across debriefs."} These
                  clear on their own once a later flight shows you&rsquo;ve got it -- or check one off yourself if you feel ready.
                </p>
                <div className="mt-2">
                  <TrainingItemChecklist items={keepWorkingOn} />
                </div>
              </div>
            ) : null}
            {beforeFlight.length > 0 ? (
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">
                  Before your next flight ({beforeFlight.length})
                </p>
                <div className="mt-2">
                  <TrainingItemChecklist items={beforeFlight} />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="py-6 text-center text-[15px] text-foreground-faint">Nothing open right now.</p>
        )}
      </Section>

      <Section title="Themes">
        {brief.focusAreas.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {brief.focusAreas.map((f, i) => (
              <span key={i} className="rounded-md bg-surface-sunken px-2.5 py-1 text-[13px] font-semibold text-foreground-soft">
                {f}
              </span>
            ))}
          </div>
        ) : null}

        {brief.recurringThemes.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {brief.recurringThemes.map((theme, i) => (
              <div key={i} className="rounded-xl border border-state-attention/30 bg-surface-sunken px-4 py-3.5">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-state-attention">
                  <Repeat className="size-3.5" aria-hidden />
                  Recurring
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-foreground-soft">
                  <span className="font-semibold text-foreground">{theme.theme}</span> has come up in {theme.count}{" "}
                  {theme.count === 1 ? "lesson" : "lessons"}
                  {/* The instructor count is the whole point when it's >1: a
                      weakness that outlived a change of instructor is about
                      the skill, not about whoever was teaching. Stated as
                      persistence, never as anyone failing to fix it. */}
                  {theme.instructorCount >= 2 ? ` with ${theme.instructorCount} instructors` : ""}.
                  <AcsBadge skill={theme.skill} certificateType={certificateType} />
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 flex items-center gap-3 py-2 text-[15px] text-foreground-faint">
            <TrendingUp className="size-5 shrink-0" aria-hidden />
            Not enough debriefs yet to spot a recurring theme -- keep flying.
          </p>
        )}
      </Section>

      <Section title="Skills" flush>
        {skillProgressions.length === 0 ? (
          <p className="px-1.5 text-[15px] text-foreground-faint">Nothing tracked yet -- keep flying.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface px-5">
            {skillProgressions.map((p) => (
              <SkillRow key={p.skill} progression={p} certificateType={certificateType} solo={solo} />
            ))}
          </div>
        )}
      </Section>
    </Screen>
  );
}

/** Display-only relabel for the one status that names a coach -- see SkillProgressList's identical rule. */
const SOLO_STATUS_LABEL: Partial<Record<SkillProgressionStatus, string>> = { "Needs Coaching": "Needs Work" };

function SkillRow({
  progression,
  certificateType,
  solo,
}: {
  progression: SkillProgression;
  certificateType: Parameters<typeof AcsBadge>[0]["certificateType"];
  solo: boolean;
}) {
  const tone = stateTone(toneForStatus(progression.status));
  const label = (solo ? SOLO_STATUS_LABEL[progression.status] : undefined) ?? progression.status;
  const lastFlown = progression.history[progression.history.length - 1]!.flightDate;

  return (
    <Link
      href={`/progress/${progression.skill}`}
      className="flex min-h-[64px] w-full items-center gap-3 border-b border-hairline py-3 last:border-b-0"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[17px] text-foreground">{progression.label}</span>
          <AcsBadge skill={progression.skill} certificateType={certificateType} />
        </div>
        <p className="mt-0.5 text-[13px] text-foreground-faint">
          {progression.history.length} {progression.history.length === 1 ? "flight" : "flights"} tracked · Last flown{" "}
          {new Date(lastFlown + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>
      <span className={cn("shrink-0 text-[14px] font-medium", tone.text)}>{label}</span>
      <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
    </Link>
  );
}
