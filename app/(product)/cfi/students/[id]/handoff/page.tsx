import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquareQuote, Repeat, Target, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcsBadge } from "@/components/acs-badge";
import { getRepository } from "@/lib/data";
import { getAuthorizedStudent } from "@/lib/auth/access";
import { computeNextLessonBrief } from "@/lib/training-memory";

export const dynamic = "force-dynamic";

export default async function CfiHandoffBriefPage(props: PageProps<"/cfi/students/[id]/handoff">) {
  const { id } = await props.params;
  const repo = getRepository();
  const authorized = await getAuthorizedStudent(id);
  if (!authorized) notFound();
  const { student, memberships } = authorized;

  const [flights, brief] = await Promise.all([
    repo.listFlights({ studentId: id }),
    computeNextLessonBrief(repo, id),
  ]);
  const certificateType = memberships.find((m) => m.role === "student")?.certificateType ?? null;

  const recentCompleted = [...flights]
    .filter((f) => f.debriefStatus === "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))
    .slice(0, 3);
  const recentDebriefs = await Promise.all(recentCompleted.map((f) => repo.getDebriefByFlight(f.id)));
  const recentTopics = Array.from(
    new Set(recentDebriefs.flatMap((d) => d?.structuredResult.whatWeDid ?? [])),
  );

  const topRecurring = brief.recurringThemes[0] ?? null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <Link href={`/cfi/students/${id}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand dark:text-slate-400">
        <ArrowLeft className="size-4" />
        Back to profile
      </Link>

      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">CFI Handoff Brief</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{student.name}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Everything you need before flying with this student for the first time.
        </p>
      </div>

      {recentTopics.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Training</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {recentTopics.map((t, i) => (
              <Badge key={i} variant="neutral">
                {t}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {brief.focusAreas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-brand" />
              Current Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1.5">
              {brief.focusAreas.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-800 dark:text-slate-100">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {topRecurring ? (
        <Card className="border-amber-300/60 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-amber-600 dark:text-amber-400" />
              Recurring Item
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              <span className="font-semibold text-slate-900 dark:text-white">{topRecurring.theme}</span> has been
              mentioned in {topRecurring.count} of the last {topRecurring.consideredFlights} debriefs.
            </p>
            <AcsBadge skill={topRecurring.skill} certificateType={certificateType} />
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
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{brief.lastInstructor.name}</p>
            {brief.lastInstructorNote ? (
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <MessageSquareQuote className="size-3.5" /> Last Instructor Note
                </p>
                <blockquote className="rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-700 dark:bg-white/5 dark:text-slate-200">
                  &ldquo;{brief.lastInstructorNote.quote}&rdquo;
                </blockquote>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {brief.focusAreas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Planned Next Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 dark:text-slate-200">{brief.focusAreas.join(" + ")}.</p>
          </CardContent>
        </Card>
      ) : null}

      <Link href={`/flights/new`} className={buttonVariants({ size: "lg" })}>
        Start Flight With {student.name.split(" ")[0]}
      </Link>
    </div>
  );
}
