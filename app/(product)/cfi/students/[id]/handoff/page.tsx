import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Eye,
  MessageSquareQuote,
  Target,
  User,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcsBadge } from "@/components/acs-badge";
import { EditableTrainingItemList } from "@/components/debrief/editable-training-item-list";
import { getRepository } from "@/lib/data";
import { getAuthorizedStudent } from "@/lib/auth/access";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";

export const dynamic = "force-dynamic";

/**
 * Condensed "where this student left off" view for a CFI about to fly with
 * them again -- built entirely from computeNextLessonBrief, the same data
 * powering the student's own /next-lesson page. Deliberately short: the goal
 * is understanding this student's status in seconds, not a full history.
 */
export default async function CfiHandoffBriefPage(props: PageProps<"/cfi/students/[id]/handoff">) {
  const { id } = await props.params;
  const repo = getRepository();
  const authorized = await getAuthorizedStudent(id);
  if (!authorized) notFound();
  const { viewer, student, memberships } = authorized;

  const brief = await computeNextLessonBrief(repo, id);

  // Marks the CFI's "Prepare for a student's next lesson" Guide step (lib/guide.ts).
  if (!viewer.user.guideProgress?.nextFlight) {
    void repo.markGuideStepViewed(viewer.user.id, "nextFlight").catch(() => {});
  }
  const certificateType = memberships.find((m) => m.role === "student")?.certificateType ?? null;

  const instructorFirstName = resolveCfiFirstName(brief.lastInstructor);
  const cfi = instructorFirstName ?? "your instructor";
  const flyingWithDifferentInstructor = Boolean(brief.lastInstructor) && brief.lastInstructor?.id !== viewer.user.id;
  const watchFor = brief.recurringThemes[0] ?? null;
  const topNeedsWork = brief.lastDebrief?.structuredResult.needsWork[0] ?? null;
  const studyReferences = brief.lastDebrief?.structuredResult.studyReferences ?? [];
  const viewedUrls =
    studyReferences.length > 0 ? new Set(await repo.listViewedStudyResourceUrls(id)) : new Set<string>();
  const dateLabel = brief.lastFlight
    ? new Date(brief.lastFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <Link href={`/cfi/students/${id}`} className="flex items-center gap-1.5 text-sm text-foreground-soft hover:text-brand">
        <ArrowLeft className="size-4" />
        Back to profile
      </Link>

      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Next Flight</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{student.name}&rsquo;s Next Flight</h1>
        {dateLabel ? (
          <p className="mt-1 text-sm text-foreground-soft">
            Last debrief with {cfi} &middot; {dateLabel}
          </p>
        ) : null}
      </div>

      {flyingWithDifferentInstructor ? (
        <p className="rounded-lg bg-surface-sunken px-3 py-2 text-sm text-foreground-soft">
          You didn&rsquo;t fly the last lesson -- here&rsquo;s where things stand.
        </p>
      ) : null}

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
              {new Date(brief.upcomingReservation.scheduledStart).toLocaleString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            {brief.upcomingReservationInstructor ? (
              <p className="mt-0.5 text-sm text-foreground-soft">With {brief.upcomingReservationInstructor.name}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-lg bg-surface-sunken px-3 py-2 text-sm text-foreground-soft">
          No flight scheduled with {student.name.split(" ")[0]} yet.
        </p>
      )}

      {brief.lastWentWell.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Last Lesson</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {brief.lastWentWell.map((item, i) => (
              <p key={i} className="flex items-start gap-2 text-sm text-foreground-soft">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" />
                {item}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {brief.focusAreas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-brand" />
              Build On Today
            </CardTitle>
            <CardDescription>From your debrief with {cfi}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1.5">
              {brief.focusAreas.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {brief.lastFlight ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-4 text-brand" />
              Keep Working On
            </CardTitle>
            <CardDescription>From the transcript, or add your own -- edit or remove anything.</CardDescription>
          </CardHeader>
          <CardContent>
            <EditableTrainingItemList
              flightId={brief.lastFlight.id}
              category="keep_working_on"
              initialItems={brief.keepWorkingOnTrainingItems}
              addPlaceholder="Add something to keep working on..."
            />
          </CardContent>
        </Card>
      ) : null}

      {brief.lastFlight ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-4 text-brand" />
              Before Next Flight
            </CardTitle>
            <CardDescription>What {student.name.split(" ")[0]} should do before showing up.</CardDescription>
          </CardHeader>
          <CardContent>
            <EditableTrainingItemList
              flightId={brief.lastFlight.id}
              category="before_next_flight"
              initialItems={brief.beforeFlightTrainingItems}
              addPlaceholder="Add something to prep before the flight..."
            />
          </CardContent>
        </Card>
      ) : null}

      {watchFor || topNeedsWork ? (
        <Card className="border-amber/40 bg-amber-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-4 text-amber" />
              Watch For
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            {watchFor ? (
              <>
                <p className="text-sm text-foreground-soft">
                  <span className="font-semibold text-foreground">{watchFor.theme}</span> has come up in{" "}
                  {watchFor.count} of the last {watchFor.consideredFlights} debriefs.
                </p>
                <AcsBadge skill={watchFor.skill} certificateType={certificateType} />
              </>
            ) : (
              <p className="text-sm text-foreground-soft">{topNeedsWork}</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {studyReferences.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4 text-brand" />
              Student Prep
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {studyReferences.map((ref, i) => (
              <p key={i} className="flex items-center gap-2 text-sm text-foreground-soft">
                {viewedUrls.has(ref.url) ? (
                  <CheckCircle2 className="size-4 shrink-0 text-good" />
                ) : (
                  <span className="size-1.5 shrink-0 rounded-full bg-foreground-faint" />
                )}
                {viewedUrls.has(ref.url) ? "Reviewed" : "Not yet reviewed"}: {ref.topic}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {brief.lastInstructor ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4 text-brand" />
              Last Instructor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">{brief.lastInstructor.name}</p>
            {brief.lastInstructorNote ? (
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                  <MessageSquareQuote className="size-3.5" /> Last Instructor Note
                </p>
                <blockquote className="rounded-lg bg-surface-sunken px-3 py-2 text-sm italic text-foreground-soft">
                  &ldquo;{brief.lastInstructorNote.quote}&rdquo;
                </blockquote>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Link href={`/flights/new`} className={buttonVariants({ size: "lg" })}>
        Start Flight With {student.name.split(" ")[0]}
      </Link>
    </div>
  );
}
