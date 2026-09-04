import Link from "next/link";
import { PlaneTakeoff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ListenButton } from "@/components/listen-button";
import { StudyResourceLink } from "@/components/study-resource-link";
import { TrainingItemChecklist } from "@/components/training-item-checklist";
import { PageTitle, Screen, Section, SecondaryButton, VectorMark } from "@/components/student/ui";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { LocalDateTime } from "@/components/local-date-time";

export const dynamic = "force-dynamic";

/**
 * A 30-second pre-flight briefing, not a dashboard -- deliberately excludes
 * cross-flight history (recurring themes) which lives on /progress instead,
 * and the instructor-continuity moment (see components/debrief/student-
 * debrief-v2.tsx's recurring-theme Panel), which lives on the debrief a
 * theme was actually found on rather than being repeated here. See
 * lib/training-memory.ts's computeNextLessonBrief for where every field
 * here comes from; this page adds no new data beyond study-viewed state.
 */
export default async function NextLessonPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const brief = await computeNextLessonBrief(repo, viewer.user.id);

  if (!brief.lastFlight) {
    return (
      <Screen>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <PlaneTakeoff className="size-10 text-foreground-faint" aria-hidden />
          <h1 className="text-[28px] font-semibold text-foreground">Next Flight</h1>
          <p className="text-foreground-soft">Your Next Flight brief will appear after your first completed debrief.</p>
          <Link href="/dashboard" className={buttonVariants()}>
            Go to flights
          </Link>
        </div>
      </Screen>
    );
  }

  const studyReferences = brief.lastDebrief?.structuredResult.studyReferences ?? [];
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);
  const instructorFirstName = resolveCfiFirstName(brief.lastInstructor);
  const cfi = instructorFirstName ?? "your instructor";

  // A solo pilot has no instructor, and saying "your instructor wanted you to
  // work on" to someone the product told "no CFI needed" contradicts the page
  // they signed up from. resolveCfiFirstName returns null when no instructor
  // is attached to the last debrief, which is the same condition -- it just
  // was not being asked.
  const hasInstructor = instructorFirstName !== null;
  const focusToday = brief.focusAreas.slice(0, 2);
  const viewedUrls = studyReferences.length > 0 ? new Set(await repo.listViewedStudyResourceUrls(viewer.user.id)) : new Set<string>();
  // Same fields the CFI's per-student page shows -- if every one of them is
  // empty, the page below would otherwise just be a blank stretch under the
  // header with no explanation of why there's nothing to show.
  const hasAnyContent =
    brief.lastWentWell.length > 0 ||
    focusToday.length > 0 ||
    brief.keepWorkingOn.length > 0 ||
    brief.beforeFlightItems.length > 0 ||
    studyReferences.length > 0 ||
    Boolean(brief.suggestedQuestion);

  // Marks the "Prepare for your next flight" Guide step (lib/guide.ts).
  if (!viewer.user.guideProgress?.nextFlight) {
    void repo.markGuideStepViewed(viewer.user.id, "nextFlight").catch(() => {});
  }

  return (
    <Screen>
      <PageTitle kicker={`Based on your debrief with ${cfi}`}>Next Flight</PageTitle>
      {ttsEnabled ? <ListenButton baseSrc="/api/next-lesson/audio" label="Listen to your brief" /> : null}

      {brief.upcomingReservation ? (
        <Section title="When">
          <p className="text-[17px] text-foreground">
            <LocalDateTime
              iso={brief.upcomingReservation.scheduledStart}
              options={{ weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
            />
          </p>
        </Section>
      ) : null}

      {!hasAnyContent ? (
        <p className="rounded-2xl border border-hairline bg-surface px-5 py-6 text-center text-[15px] text-foreground-soft">
          {!hasInstructor
            ? "Nothing to prepare yet -- this fills in once your last debrief is finished."
            : `${cfi} hasn't set anything to focus on from your last debrief yet.`}
        </p>
      ) : null}

      {brief.lastWentWell.length > 0 ? (
        <Section title="Last time">
          <ul className="flex flex-col gap-2">
            {brief.lastWentWell.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed text-foreground-soft">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-state-good" />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {focusToday.length > 0 ? (
        <Section title="Focus today">
          <div className="flex flex-col gap-2">
            {focusToday.map((item, i) => (
              <p key={i} className="text-[22px] font-semibold leading-snug text-foreground">
                {item}
              </p>
            ))}
          </div>
        </Section>
      ) : null}

      {brief.keepWorkingOn.length > 0 ? (
        <Section title={hasInstructor ? `${cfi} wanted you to work on` : "What to work on"}>
          <ul className="flex flex-col gap-2">
            {brief.keepWorkingOn.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed text-foreground-soft">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {brief.beforeFlightTrainingItems.length > 0 ? (
        <Section title="Before today's flight">
          <div className="flex flex-col gap-3">
            <p className="text-[14px] text-foreground-faint">Check off what you&rsquo;ve reviewed -- this is for you, nobody else sees it.</p>
            <TrainingItemChecklist items={brief.beforeFlightTrainingItems} />
          </div>
        </Section>
      ) : null}

      {studyReferences.length > 0 ? (
        <Section title="Recommended study">
          <ul className="flex flex-col gap-4">
            {studyReferences.map((ref, i) => (
              <li key={i} className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">{ref.topic}</span>
                {ref.url ? (
                  <StudyResourceLink url={ref.url} label={ref.source} initiallyViewed={viewedUrls.has(ref.url)} />
                ) : (
                  <span className="text-[15px] text-foreground-soft">{ref.source}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/*
       * "Vector guidance" from the Phase 3 brief, represented honestly: this
       * is brief.suggestedQuestion -- a real, deterministic template over
       * this debrief's own content (lib/training-memory.ts's
       * buildSuggestedQuestion, never LLM-generated) -- with Vector's
       * identity attached, not a live chat. A production Ask-Vector
       * endpoint (lib/ai/vector.ts's askVector) exists but its only current
       * route is deliberately unauthenticated and prototype-only (see
       * app/api/prototype/vector/route.ts); wiring a new authenticated
       * production endpoint is backend work beyond this reskin, not
       * something to fake here.
       */}
      {brief.suggestedQuestion ? (
        <Section title="Ask your instructor" flush>
          <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">
            <VectorMark subtitle="Suggested by Vector" />
            <p className="mt-3 text-[17px] text-foreground">&ldquo;{brief.suggestedQuestion}&rdquo;</p>
          </div>
        </Section>
      ) : null}

      {/* Deliberately secondary, not a primary CTA. This page is a pre-flight
          read -- the student's actual next step is to go fly, not to press
          anything here. Logging is the after-landing action, kept available
          for whoever lands and comes back to this page, but styled so it
          doesn't read as "do this now." */}
      <div className="flex flex-col items-center gap-1.5 border-t border-hairline pt-5">
        <p className="text-[15px] text-foreground-soft">Already flown it?</p>
        <div className="mt-1 flex w-full">
          <SecondaryButton href="/flights/new">Log this flight</SecondaryButton>
        </div>
      </div>
    </Screen>
  );
}
