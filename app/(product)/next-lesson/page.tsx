import Link from "next/link";
import { BookOpen, ClipboardCheck, ExternalLink, PlaneTakeoff, Target } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChecklistCard } from "@/components/checklist-card";
import { ListenButton } from "@/components/listen-button";
import { NextLessonFocusCard } from "@/components/next-lesson-focus-card";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { formatDurationShort } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NextLessonPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const [flights, trainingItems] = await Promise.all([
    repo.listFlights({ studentId: viewer.user.id }),
    repo.listTrainingItems(),
  ]);

  const lastDebriefed = flights
    .filter((f) => f.debriefStatus === "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0];

  if (!lastDebriefed) {
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

  const debrief = await repo.getDebriefByFlight(lastDebriefed.id);
  const itemsForFlight = trainingItems.filter((t) => t.flightId === lastDebriefed.id && !t.done);
  const keepWorkingOn = itemsForFlight.filter((t) => t.category === "keep_working_on");
  const beforeToday = itemsForFlight.filter((t) => t.category === "before_next_flight");
  const focus = debrief?.structuredResult.nextLessonFocus ?? [];
  const whatWeDid = debrief?.structuredResult.whatWeDid ?? [];
  const studyReferences = debrief?.structuredResult.studyReferences ?? [];
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
            {new Date(lastDebriefed.flightDate + "T12:00:00").toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })}{" "}
            · {lastDebriefed.aircraft.tailNumber} · {formatDurationShort(lastDebriefed.durationMinutes)}
          </p>

          {whatWeDid.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">You worked on</p>
              <p className="mt-1 text-foreground">{whatWeDid.join(", ")}.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {keepWorkingOn.length > 0 ? (
        <ChecklistCard icon={Target} title="Keep working on" items={keepWorkingOn.map((i) => i.description)} />
      ) : null}

      {beforeToday.length > 0 ? (
        <ChecklistCard icon={ClipboardCheck} title="Before today's flight" items={beforeToday.map((i) => i.description)} />
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

      {focus.length > 0 ? <NextLessonFocusCard items={focus} /> : null}

      <Link href="/flights/new" className={buttonVariants({ size: "lg" })}>
        Start Today&rsquo;s Flight
      </Link>
    </div>
  );
}
