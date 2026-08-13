import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  History,
  ListChecks,
  MessageSquareQuote,
  PlaneTakeoff,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data";
import { getAuthorizedStudent } from "@/lib/auth/access";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { formatDurationShort } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CfiStudentProfilePage(props: PageProps<"/cfi/students/[id]">) {
  const { id } = await props.params;
  const repo = getRepository();
  const authorized = await getAuthorizedStudent(id);
  if (!authorized) notFound();
  const { viewer, student } = authorized;

  const [flights, trainingItems, brief] = await Promise.all([
    repo.listFlights({ studentId: id }),
    repo.listTrainingItems(),
    computeNextLessonBrief(repo, id),
  ]);

  const flightIds = new Set(flights.map((f) => f.id));
  const relevantItems = trainingItems.filter((t) => flightIds.has(t.flightId) && t.visibility === "shared");
  const openItems = relevantItems.filter((t) => !t.done);
  const completedItems = relevantItems.filter((t) => t.done);
  const debriefedFlights = [...flights]
    .filter((f) => f.debriefStatus === "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate));

  const timeline = await Promise.all(
    debriefedFlights.map(async (flight) => ({ flight, debrief: await repo.getDebriefByFlight(flight.id) })),
  );

  const result = brief.lastDebrief?.structuredResult;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{student.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Student Pilot</p>
        </div>
        <Link href={`/cfi/students/${id}/handoff`} className={buttonVariants({ size: "sm", variant: "outline" })}>
          Handoff Brief
        </Link>
      </div>

      <Card className="border-brand/30 bg-brand/5 dark:bg-brand/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="size-4 text-brand" />
            Next Lesson
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {brief.focusAreas.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recommended Focus</p>
              <ol className="mt-1.5 flex flex-col gap-1.5">
                {brief.focusAreas.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-800 dark:text-slate-100">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
                      {i + 1}
                    </span>
                    {f}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No objectives set for the next lesson yet.</p>
          )}
          {brief.beforeFlightItems.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Before Flight</p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {brief.beforeFlightItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {brief.lastFlight ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlaneTakeoff className="size-4 text-brand" />
              Last Flight
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {brief.lastFlight.aircraft.tailNumber} · {brief.lastFlight.departureAirport} →{" "}
              {brief.lastFlight.arrivalAirport} · {formatDurationShort(brief.lastFlight.durationMinutes)}
            </p>

            {result ? (
              <>
                <MiniSection icon={ListChecks} title="What We Did" items={result.whatWeDid} />
                <MiniSection icon={CheckCircle2} title="Went Well" items={result.wentWell} tone="success" />
                <MiniSection icon={Target} title="Needs Work" items={result.needsWork} tone="warning" />
                {result.instructorGuidance.length > 0 ? (
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <MessageSquareQuote className="size-3.5" /> Instructor Guidance
                    </p>
                    {result.instructorGuidance.map((g, i) => (
                      <blockquote key={i} className="rounded-lg bg-brand/5 px-3 py-2 text-sm italic text-slate-700 dark:bg-brand/10 dark:text-slate-200">
                        &ldquo;{g.quote}&rdquo;
                      </blockquote>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}

            <Link
              href={`/flights/${brief.lastFlight.id}/debrief/results`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              View full debrief
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-brand" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Open ({openItems.length})</p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {openItems.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item.description}
                </li>
              ))}
              {openItems.length === 0 ? <p className="text-sm text-slate-400">Nothing open.</p> : null}
            </ul>
          </div>
          {completedItems.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Completed ({completedItems.length})
              </p>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {completedItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-300" />
                    <span className="line-through">{item.description}</span>
                    {item.completedAt ? (
                      <span className="shrink-0 text-xs text-slate-300">
                        {new Date(item.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {timeline.length > 0 ? (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <History className="size-4 text-brand" />
            Training Timeline
          </h2>
          <ol className="relative flex flex-col gap-6 border-l border-slate-200 pl-6 dark:border-white/10">
            {timeline.map(({ flight, debrief }) => (
              <li key={flight.id} className="relative">
                <span className="absolute -left-[29px] top-1 flex size-3.5 items-center justify-center rounded-full border-2 border-white bg-brand dark:border-[#0a0e17]" />
                <Link href={`/flights/${flight.id}/debrief/results`} className="group">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-brand dark:text-white">
                    {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(debrief?.structuredResult.whatWeDid ?? []).map((topic, i) => (
                      <Badge key={i} variant="neutral">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <p className="text-center text-xs text-slate-400">Organization: {viewer.organization.name}</p>
    </div>
  );
}

function MiniSection({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof ListChecks;
  title: string;
  items: string[];
  tone?: "success" | "warning";
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="size-3.5" /> {title}
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
            <span
              className={
                "mt-1.5 size-1.5 shrink-0 rounded-full " +
                (tone === "success" ? "bg-emerald-500" : tone === "warning" ? "bg-amber-500" : "bg-brand")
              }
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
