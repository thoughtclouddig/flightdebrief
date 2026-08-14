import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  ListChecks,
  MessageSquareQuote,
  Sparkles,
  Target,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListenButton } from "@/components/listen-button";
import { getRepository } from "@/lib/data";
import { getAuthorizedFlight } from "@/lib/auth/access";

export default async function DebriefResultsPage(props: PageProps<"/flights/[id]/debrief/results">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { flight } = authorized;
  const debrief = await getRepository().getDebriefByFlight(id);
  if (!debrief) notFound();

  const { structuredResult: result } = debrief;
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Debrief Summary</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
          {flight.aircraft.tailNumber} · {flight.departureAirport} → {flight.arrivalAirport}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {ttsEnabled ? <ListenButton baseSrc={`/api/flights/${flight.id}/debrief/audio`} label="Listen to your debrief" /> : null}

      <Section icon={ListChecks} title="What We Did" items={result.whatWeDid} empty="Nothing captured yet." />
      <Section icon={CheckCircle2} title="Went Well" items={result.wentWell} empty="Nothing flagged." tone="success" />
      <Section icon={Target} title="Needs Work" items={result.needsWork} empty="Nothing flagged." tone="warning" />

      {result.instructorGuidance.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareQuote className="size-4 text-brand" />
              Instructor Guidance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {result.instructorGuidance.map((g, i) => (
              <blockquote key={i} className="rounded-xl bg-brand/5 px-4 py-3 text-slate-700 dark:bg-brand/10 dark:text-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">{g.instructorName} said</p>
                <p className="mt-1 italic">&ldquo;{g.quote}&rdquo;</p>
              </blockquote>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Section icon={ClipboardList} title="Action Items" items={result.actionItems} empty="No action items." />

      {result.studyReferences.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4 text-brand" />
              Study References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {result.studyReferences.map((ref, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{ref.topic}</span>
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
                    <span className="text-slate-700 dark:text-slate-200">{ref.source}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-brand/30 bg-brand/5 dark:bg-brand/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand" />
            Next Lesson Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-2">
            {result.nextLessonFocus.map((focus, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                  {i + 1}
                </span>
                {focus}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link href="/next-lesson" className={buttonVariants({ size: "lg", className: "flex-1" })}>
          Go to Next-Lesson Brief
        </Link>
        <Link href="/dashboard" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  items,
  empty,
  tone,
}: {
  icon: typeof ListChecks;
  title: string;
  items: string[];
  empty: string;
  tone?: "success" | "warning";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-brand" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">{empty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                <span
                  className={
                    "mt-2 size-1.5 shrink-0 rounded-full " +
                    (tone === "success" ? "bg-emerald-500" : tone === "warning" ? "bg-amber-500" : "bg-brand")
                  }
                />
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
