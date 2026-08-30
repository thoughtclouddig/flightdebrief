import Link from "next/link";
import { BookOpen, CalendarClock, CheckCircle2, ClipboardCheck, HelpCircle, PlaneTakeoff, Target } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListenButton } from "@/components/listen-button";
import { StudyResourceLink } from "@/components/study-resource-link";
import { TrainingItemChecklist } from "@/components/training-item-checklist";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { LocalDateTime } from "@/components/local-date-time";

export const dynamic = "force-dynamic";

/**
 * A 30-second pre-flight briefing, not a dashboard -- deliberately excludes
 * cross-flight history (recurring themes) which lives on /progress instead.
 * See lib/training-memory.ts's computeNextLessonBrief for where every field
 * here comes from; this page adds no new data beyond study-viewed state.
 */
export default async function NextLessonPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const brief = await computeNextLessonBrief(repo, viewer.user.id);

  if (!brief.lastFlight) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
        <PlaneTakeoff className="size-10 text-foreground-faint" />
        <h1 className="text-2xl font-semibold text-foreground">Next Flight</h1>
        <p className="text-foreground-soft">
          Your Next Flight brief will appear after your first completed debrief.
        </p>
        <Link href="/dashboard" className={buttonVariants()}>
          Go to flights
        </Link>
      </div>
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
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold text-foreground">Next Flight</h1>
        <p className="text-sm text-foreground-soft">Based on your debrief with {cfi}</p>
        {ttsEnabled ? <ListenButton baseSrc="/api/next-lesson/audio" label="Listen to your brief" /> : null}
      </div>

      {brief.upcomingReservation ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4 text-brand" />
              When
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">
              <LocalDateTime
                iso={brief.upcomingReservation.scheduledStart}
                options={{ weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
              />
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!hasAnyContent ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-foreground-soft">
            {!hasInstructor
              ? "Nothing to prepare yet -- this fills in once your last debrief is finished."
              : `${cfi} hasn't set anything to focus on from your last debrief yet.`}
          </CardContent>
        </Card>
      ) : null}

      {brief.lastWentWell.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Last Time</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {brief.lastWentWell.map((item, i) => (
              <p key={i} className="flex items-start gap-2 text-foreground-soft">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" />
                {item}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {focusToday.length > 0 ? (
        <Card className="border-brand/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-brand" />
              Focus Today
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {focusToday.map((item, i) => (
              <p key={i} className="font-display text-2xl font-bold text-foreground">
                {item}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {brief.keepWorkingOn.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-brand" />
              {hasInstructor ? "Your Instructor Wanted You To Work On" : "What To Work On"}
            </CardTitle>
            <CardDescription>
              {hasInstructor ? `From your debrief with ${cfi}` : "From your last debrief"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {brief.keepWorkingOn.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-foreground-soft">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {brief.beforeFlightTrainingItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-brand" />
              Before today&rsquo;s flight
            </CardTitle>
            <CardDescription>Check off what you&rsquo;ve reviewed -- this is for you, nobody else sees it.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrainingItemChecklist items={brief.beforeFlightTrainingItems} />
          </CardContent>
        </Card>
      ) : null}

      {studyReferences.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4 text-brand" />
              Recommended Study
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {studyReferences.map((ref, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">{ref.topic}</span>
                  {ref.url ? (
                    <StudyResourceLink url={ref.url} label={ref.source} initiallyViewed={viewedUrls.has(ref.url)} />
                  ) : (
                    <span className="text-sm text-foreground-soft">{ref.source}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {brief.suggestedQuestion ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="size-4 text-brand" />
              Ask Your Instructor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">&ldquo;{brief.suggestedQuestion}&rdquo;</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Deliberately secondary, not a primary CTA. This page is a pre-flight
          read -- the student's actual next step is to go fly, not to press
          anything here. Logging is the after-landing action, kept available
          for whoever lands and comes back to this page, but styled so it
          doesn't read as "do this now." */}
      <div className="flex flex-col items-center gap-1.5 border-t border-hairline pt-5">
        <p className="text-sm text-foreground-soft">Already flown it?</p>
        <Link href="/flights/new" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          Log This Flight
        </Link>
      </div>
    </div>
  );
}
