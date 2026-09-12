import Link from "next/link";
import { PlaneTakeoff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ListenButton } from "@/components/listen-button";
import { StudyResourceLink } from "@/components/study-resource-link";
import { PageTitle, PrimaryButton, Screen, Section, SecondaryButton, VectorMark } from "@/components/student/ui";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief, computeRecommendedFocus } from "@/lib/training-memory";
import { hasAuthoredScenario } from "@/lib/prototype/chair-fly";
import { matchSkills, type StudyReference } from "@/lib/topics";
import { instructorAttributionLabel } from "@/lib/instructor-attribution";
import { assessTranscriptAdequacy } from "@/lib/transcript-adequacy";
import { LocalDateTime } from "@/components/local-date-time";

export const dynamic = "force-dynamic";

/**
 * A 30-second pre-flight briefing, not a training destination -- deliberately
 * excludes cross-flight history (recurring themes), which lives on /progress,
 * and the full Vector-powered activity menu (Radio Practice, Chair Flying),
 * which lives on /train. This page's job is narrower: name the one thing
 * that matters, show the real evidence behind it, and hand off into a real
 * activity when one exists -- never reproduce Train's own menu here.
 *
 * "Focus for next flight" is lib/training-memory.ts's computeRecommendedFocus,
 * the same contested-objective -> recurring-theme -> weakest-open-skill
 * ranking Train's own recommendation uses, not brief.focusAreas (a single
 * debrief's own un-recurrence-tested focus list, never ranked against
 * anything -- the same category of honesty problem Progress's focusAreas
 * chips had before that section was fixed).
 *
 * "Prepare before you fly" routes each real before-flight item at a real
 * activity when one exists (a radio-communications item at Radio Practice)
 * and shows plain evidence text otherwise -- never a checkbox standing in
 * for proof of preparation, and never an invented "acknowledge this"
 * activity. Curated FAA study references (lib/topics.ts, never LLM-
 * generated) attach as a quiet citation under whichever bullet triggered
 * them, rather than forming their own standalone reading-list section.
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

  // A solo pilot has no instructor, and saying "your instructor wanted you to
  // work on" to someone the product told "no CFI needed" contradicts the
  // page they signed up from. instructorAttributionLabel() takes the raw
  // instructor record (not just its resolved name) so it can tell "no
  // instructor at all" apart from "instructor with an unresolvable name" --
  // only the former should ever produce a null here.
  const cfi = instructorAttributionLabel(brief.lastInstructor);

  // brief.lastWentWell is raw free-text AI output (structuredResult.wentWell),
  // with no enforcement beyond the prompt's own "don't invent" instructions --
  // see lib/transcript-adequacy.ts's own doc comment for the real incident
  // that motivated this recheck (a transcript with almost no real content
  // still produced a confident, fabricated debrief). A debrief analyzed
  // before that gate existed can still be sitting in the database with
  // fabricated content here, so it's re-validated at render time rather than
  // trusted just because it's persisted. computeRecommendedFocus's fields
  // are unaffected -- they're built from structured signals/per-task ratings,
  // never raw generated prose, same reasoning Train already relies on.
  const lastDebriefTrusted = brief.lastDebrief ? assessTranscriptAdequacy(brief.lastDebrief.transcript).adequate : false;
  const trustedLastWentWell = lastDebriefTrusted ? brief.lastWentWell : [];

  const focus = await computeRecommendedFocus(repo, brief);
  const focusChairFlyHref = focus.contested && hasAuthoredScenario(focus.contested.taskLabel) ? "/train/chair-fly" : null;
  const focusRadioPracticeHref =
    !focusChairFlyHref && focus.skillProgression?.skill === "RADIO_COMMUNICATIONS" ? "/train/radio-practice" : null;

  const referenceFor = (description: string): StudyReference | null =>
    studyReferences.find((r) => r.why === description) ?? null;

  const viewedUrls = studyReferences.length > 0 ? new Set(await repo.listViewedStudyResourceUrls(viewer.user.id)) : new Set<string>();

  // Same fields the CFI's per-student page shows -- if every one of them is
  // empty, the page below would otherwise just be a blank stretch under the
  // header with no explanation of why there's nothing to show.
  const hasAnyContent =
    trustedLastWentWell.length > 0 ||
    Boolean(focus.label) ||
    brief.keepWorkingOn.length > 0 ||
    brief.beforeFlightItems.length > 0 ||
    Boolean(brief.suggestedQuestion);

  // Marks the "Prepare for your next flight" Guide step (lib/guide.ts).
  if (!viewer.user.guideProgress?.nextFlight) {
    void repo.markGuideStepViewed(viewer.user.id, "nextFlight").catch(() => {});
  }

  return (
    <Screen>
      <PageTitle kicker={cfi ? `Based on your debrief with ${cfi}` : "Based on your latest debrief"}>Next Flight</PageTitle>
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
          {cfi
            ? `${cfi} hasn't set anything to focus on from your last debrief yet.`
            : "Nothing to prepare yet -- this fills in once your last debrief is finished."}
        </p>
      ) : null}

      {trustedLastWentWell.length > 0 ? (
        <Section title="Last time">
          <ul className="flex flex-col gap-2">
            {trustedLastWentWell.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed text-foreground-soft">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-state-good" />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {focus.label ? (
        <Section title="Focus for next flight">
          <div className="flex flex-col gap-3">
            <p className="text-[22px] font-semibold leading-snug text-foreground">{focus.label}</p>
            {focusChairFlyHref ? (
              <PrimaryButton href={focusChairFlyHref}>Chair Fly it</PrimaryButton>
            ) : focusRadioPracticeHref ? (
              <PrimaryButton href={focusRadioPracticeHref}>Practice with Vector</PrimaryButton>
            ) : null}
          </div>
        </Section>
      ) : null}

      {brief.keepWorkingOn.length > 0 ? (
        <Section title={cfi ? `${cfi} wanted you to work on` : "What to work on"}>
          <ul className="flex flex-col gap-3">
            {brief.keepWorkingOn.map((item, i) => {
              const ref = referenceFor(item);
              return (
                <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed text-foreground-soft">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  <span>
                    {item}
                    {ref ? (
                      <span className="mt-1 flex items-center gap-1.5 text-[13px] text-foreground-faint">
                        Based on {ref.topic}
                        {ref.url ? (
                          <StudyResourceLink url={ref.url} label="View source" initiallyViewed={viewedUrls.has(ref.url)} />
                        ) : null}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {brief.beforeFlightItems.length > 0 ? (
        <Section title="Prepare before you fly">
          <ul className="flex flex-col gap-3">
            {brief.beforeFlightItems.map((item, i) => {
              const isRadioGap = matchSkills(item).some((m) => m.skill === "RADIO_COMMUNICATIONS");
              const ref = referenceFor(item);
              return (
                <li key={i} className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface px-4 py-3">
                  <p className="text-[15px] leading-relaxed text-foreground-soft">{item}</p>
                  {ref ? (
                    <span className="flex items-center gap-1.5 text-[13px] text-foreground-faint">
                      Based on {ref.topic}
                      {ref.url ? (
                        <StudyResourceLink url={ref.url} label="View source" initiallyViewed={viewedUrls.has(ref.url)} />
                      ) : null}
                    </span>
                  ) : null}
                  {isRadioGap ? (
                    <div className="mt-1">
                      <SecondaryButton href="/train/radio-practice">Practice with Vector</SecondaryButton>
                    </div>
                  ) : null}
                </li>
              );
            })}
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
        <Section title={cfi ? "Ask your instructor" : "Worth thinking about"} flush>
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
