import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { AcsBadge, BackLink, Evidence, PageTitle, Screen, Section } from "@/components/student/ui";
import { cn } from "@/lib/utils";
import type { MomentType } from "@/lib/student/telemetry";
import { momentTone } from "@/lib/student/telemetry";

/**
 * The completed-debrief detail screen -- the approved V2 hierarchy: lesson
 * identity, Listen Again, Went Well, Work On, [Instructor] Wants Next,
 * Flight Moments. Shared between the fixture demo
 * (app/prototype/vector/debrief/latest) and the real completed-debrief
 * route (app/(product)/flights/[id]/debrief/results, student branch) --
 * these used to be two independent implementations, and the prototype's had
 * quietly drifted to its own local WENT_WELL/WORK_ON copy instead of the
 * shared STRUCTURED fixture the rest of the prototype uses. One component
 * now; both callers pass their own data in.
 *
 * "How you both saw it" is deliberately not part of this component -- it
 * already has its own full moment at the reveal/compare screen, right when
 * both assessments come in. "Ask Vector about this" and "View transcript"
 * stay prototype-only for now (Vector has no production backend yet, see
 * the migration roadmap); the prototype route renders them itself, around
 * this shared component, rather than this component knowing about them.
 *
 * Listen Again is a slot, not a prop the two callers could share directly:
 * production plays a real synthesized narration (real fetch/loading/error
 * state), the prototype's is decorative. Same visual position, genuinely
 * different capability underneath -- the caller renders whichever belongs.
 */
export function DebriefDetail({
  kicker,
  lessonTitle,
  listenAgain,
  wentWell,
  workOn,
  acsArea,
  instructorFirstName,
  instructorGuidance,
  moments,
  backHref,
  children,
}: {
  kicker: string;
  lessonTitle: string;
  listenAgain: ReactNode;
  wentWell: string[];
  workOn: string[];
  acsArea: string | null;
  instructorFirstName: string;
  instructorGuidance: { instructorName: string; quote: string }[];
  moments: { id: string; href: string; title: string; type: MomentType; flightDataLabel: string | null }[];
  backHref: string;
  /** Caller-specific trailing content -- production's real "Next-Lesson Brief" CTA (no prototype equivalent exists) or the prototype's own extra demo-only sections (How You Both Saw It, Ask Vector, transcript), neither of which is part of the approved shared hierarchy itself. */
  children?: ReactNode;
}) {
  return (
    <Screen>
      <BackLink href={backHref}>Debriefs</BackLink>
      <PageTitle kicker={kicker}>{lessonTitle}</PageTitle>

      {listenAgain}

      {wentWell.length > 0 ? (
        <Section title="Went well">
          <ul className="flex flex-col gap-3">
            {wentWell.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
                <Check className="mt-1 size-4 shrink-0 text-state-good" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {workOn.length > 0 ? (
        <Section title="Work on">
          <ul className="flex flex-col gap-3">
            {workOn.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-state-attention" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          {acsArea ? <AcsBadge area={acsArea} /> : null}
        </Section>
      ) : null}

      {instructorGuidance.length > 0 ? (
        <Section title={`${instructorFirstName} wants next`}>
          <div className="flex flex-col gap-5">
            {instructorGuidance.map((g, i) => (
              <Evidence key={i} label={g.instructorName} tone="instructor" text={g.quote} />
            ))}
          </div>
        </Section>
      ) : null}

      {/* Flight Moments in the normal debrief, so a student never has to open
          Flight Analysis to discover that telemetry context exists. Compact
          on purpose -- this is a pointer into the deeper surface, not the
          surface itself. Omitted entirely (not faked) wherever there's no
          real capability behind it -- see the doc comment above. */}
      {moments.length > 0 ? (
        <Section title="Flight moments" flush>
          <div className="flex flex-col gap-3">
            {moments.map((m) => (
              <Link key={m.id} href={m.href} className="flex items-start gap-3 rounded-2xl border border-hairline bg-surface p-5">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2.5">
                    <span className="text-[17px] font-semibold text-foreground">{m.title}</span>
                    <span
                      className={cn(
                        "text-[14px] font-medium",
                        momentTone(m.type) === "attention"
                          ? "text-state-attention"
                          : momentTone(m.type) === "good"
                            ? "text-state-good"
                            : "text-foreground-faint",
                      )}
                    >
                      {m.type === "NEEDS_ATTENTION" ? "Needs attention" : m.type === "BEST_ATTEMPT" ? "Best attempt" : "Improved"}
                    </span>
                  </span>
                  {m.flightDataLabel ? (
                    <span className="mt-2 block text-[15px] leading-relaxed text-foreground-soft">
                      <span className="font-medium text-foreground">Flight data:</span> {m.flightDataLabel}
                    </span>
                  ) : null}
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-foreground-faint" aria-hidden />
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {children}
    </Screen>
  );
}
