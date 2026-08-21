import Link from "next/link";
import { BookOpen, ExternalLink, PlaneTakeoff, Repeat, Target, ClipboardCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcsBadge } from "@/components/acs-badge";
import { ChecklistCard } from "@/components/checklist-card";
import { ListenButton } from "@/components/listen-button";
import { NextLessonFocusCard } from "@/components/next-lesson-focus-card";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { formatDurationShort } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NextLessonPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const [brief, memberships] = await Promise.all([
    computeNextLessonBrief(repo, viewer.user.id),
    repo.listMembershipsForUser(viewer.user.id),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  if (!brief.lastFlight) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
        <PlaneTakeoff className="size-10 text-foreground-faint" />
        <h1 className="text-2xl font-semibold text-foreground">Ready to Fly?</h1>
        <p className="text-foreground-soft">
          Debrief your first flight and your next-lesson brief will show up here.
        </p>
        <Link href="/dashboard" className={buttonVariants()}>
          Go to flights
        </Link>
      </div>
    );
  }

  const whatWeDid = brief.lastDebrief?.structuredResult.whatWeDid ?? [];
  const studyReferences = brief.lastDebrief?.structuredResult.studyReferences ?? [];
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold text-foreground">Ready to Fly?</h1>
        {ttsEnabled ? <ListenButton baseSrc="/api/next-lesson/audio" label="Listen to your brief" /> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last Lesson</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-foreground-soft">
            {new Date(brief.lastFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })}{" "}
            · {brief.lastFlight.aircraft.tailNumber} · {formatDurationShort(brief.lastFlight.durationMinutes)}
          </p>

          {whatWeDid.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">You worked on</p>
              <p className="mt-1 text-foreground">{whatWeDid.join(", ")}.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Historical context beyond the immediately previous flight -- a skill only shows up here once it's recurred, per computeNextLessonBrief's 4-flight window. */}
      {brief.recurringThemes.length > 0 ? (
        <Card className="border-amber/40 bg-amber-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-amber" />
              Worth Extra Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {brief.recurringThemes.map((theme, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm text-foreground-soft">
                  <span className="font-semibold text-foreground">{theme.theme}</span> has come up in{" "}
                  {theme.count} of your last {theme.consideredFlights} debriefs.
                </p>
                <AcsBadge skill={theme.skill} certificateType={certificateType} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {brief.keepWorkingOn.length > 0 ? (
        <ChecklistCard icon={Target} title="Keep working on" items={brief.keepWorkingOn} />
      ) : null}

      {brief.beforeFlightItems.length > 0 ? (
        <ChecklistCard icon={ClipboardCheck} title="Before today's flight" items={brief.beforeFlightItems} />
      ) : null}

      {studyReferences.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4 text-brand" />
              Study up on your weak areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {studyReferences.map((ref, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">{ref.topic}</span>
                  {ref.url ? (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand hover:underline"
                    >
                      {ref.source}
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-foreground-soft">{ref.source}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {brief.focusAreas.length > 0 ? <NextLessonFocusCard items={brief.focusAreas} /> : null}

      <div className="flex flex-col items-center gap-1.5">
        <Link href="/flights/new" className={buttonVariants({ size: "lg", className: "w-full" })}>
          Log Today&rsquo;s Flight
        </Link>
        <p className="text-xs text-foreground-faint">After you land -- this isn&rsquo;t a pre-flight step.</p>
      </div>
    </div>
  );
}
