import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  LifeBuoy,
  ListChecks,
  MessageSquareQuote,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";
import { AcsBadge } from "@/components/acs-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListenButton } from "@/components/listen-button";
import { ComparisonTable, type ComparisonRow } from "@/components/debrief/comparison-table";
import { FlightMap } from "@/components/flight-map";
import { SkillProgressList } from "@/components/skill-progress-list";
import { discrepancyDistance, discrepancyStatusFor } from "@/lib/debrief-cards/discrepancy";
import { getRepository } from "@/lib/data";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { computeSkillProgression } from "@/lib/skill-progress";
import { matchSkills } from "@/lib/topics";
import { cn } from "@/lib/utils";

export default async function DebriefResultsPage(props: PageProps<"/flights/[id]/debrief/results">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { flight, viewer } = authorized;
  const repo = getRepository();
  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) notFound();

  const { structuredResult: result } = debrief;
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);

  const [allStudentSignals, memberships] = await Promise.all([
    repo.listTrainingSignals({ studentId: flight.userId }),
    repo.listMembershipsForUser(flight.userId),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === flight.organizationId)?.certificateType ?? null;
  const flightSkills = new Set(
    allStudentSignals.filter((s) => s.flightId === flight.id).map((s) => s.skill),
  );
  const flightSkillProgressions = computeSkillProgression(allStudentSignals.filter((s) => !s.dismissed)).filter((p) =>
    flightSkills.has(p.skill),
  );
  const canDismiss = viewer.role === "instructor" || viewer.role === "admin";

  const differenceRows: ComparisonRow[] = result.assessmentDifferences.map((d) => ({
    taskLabel: d.taskLabel,
    studentLevel: d.studentLevel,
    instructorLevel: d.instructorLevel,
    status: discrepancyStatusFor(discrepancyDistance(d.studentLevel, d.instructorLevel)),
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Debrief Summary</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          {flight.aircraft.tailNumber} · {flight.departureAirport} → {flight.arrivalAirport}
        </h1>
        <p className="mt-1 text-sm text-foreground-soft">
          {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {result.flightSummary ? <p className="text-lg text-foreground-soft">{result.flightSummary}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Flight Path</CardTitle>
        </CardHeader>
        <CardContent>
          <FlightMap track={flight.track} />
        </CardContent>
      </Card>

      {ttsEnabled ? <ListenButton baseSrc={`/api/flights/${flight.id}/debrief/audio`} label="Listen to your debrief" /> : null}

      {/* Went Well -- what happened and what worked, framed positively. */}
      <GroupHeading tone="good">What Went Well</GroupHeading>
      <div className="flex flex-col gap-4">
        <Section icon={ListChecks} title="What We Did" items={result.whatWeDid} empty="Nothing captured yet." />
        <Section icon={CheckCircle2} title="Went Well" items={result.wentWell} empty="Nothing flagged." tone="good" />
      </div>

      {/* Items to Improve -- coaching, corrections, and where perceptions differed. */}
      <GroupHeading tone="amber">Items to Improve</GroupHeading>
      <div className="flex flex-col gap-4">
        <Section icon={Target} title="Needs Work" items={result.needsWork} empty="Nothing flagged." tone="amber" />

        {differenceRows.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber" />
                Where Your Perceptions Differed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonTable rows={differenceRows} />
            </CardContent>
          </Card>
        ) : null}

        {result.instructorGuidance.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareQuote className="size-4 text-amber" />
                Instructor Guidance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {result.instructorGuidance.map((g, i) => (
                <blockquote key={i} className="rounded-xl bg-amber-soft px-4 py-3 text-foreground-soft">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-ink">{g.instructorName} said</p>
                  <p className="mt-1 italic">&ldquo;{g.quote}&rdquo;</p>
                </blockquote>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Section
          icon={LifeBuoy}
          title="Instructor Assistance"
          items={result.instructorAssistance}
          empty="No instructor intervention noted."
          tone="amber"
        />
        <Section icon={ShieldAlert} title="Risk Management & ADM" items={result.riskManagementNotes} empty="Nothing flagged." tone="amber" />
      </div>

      {/* Next Steps -- what to carry into the next lesson. */}
      <GroupHeading tone="brand">Next Steps</GroupHeading>
      <div className="flex flex-col gap-4">
        <Section
          icon={ClipboardList}
          title="Action Items"
          items={result.actionItems}
          empty="No action items."
          renderBadge={(item) => {
            const skill = matchSkills(item)[0]?.skill;
            return skill ? <AcsBadge skill={skill} certificateType={certificateType} /> : null;
          }}
        />

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
                <li key={i} className="flex items-center gap-3 text-foreground">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  {focus}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {flightSkillProgressions.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Training Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillProgressList
                progressions={flightSkillProgressions}
                certificateType={certificateType}
                dismissible={canDismiss}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

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

const GROUP_TONE_CLASS = {
  good: "text-good",
  amber: "text-amber",
  brand: "text-brand",
} as const;

function GroupHeading({ tone, children }: { tone: keyof typeof GROUP_TONE_CLASS; children: React.ReactNode }) {
  return (
    <h2 className={cn("font-display text-sm font-bold uppercase tracking-wide", GROUP_TONE_CLASS[tone])}>{children}</h2>
  );
}

function Section({
  icon: Icon,
  title,
  items,
  empty,
  tone,
  renderBadge,
}: {
  icon: typeof ListChecks;
  title: string;
  items: string[];
  empty: string;
  tone?: "good" | "amber";
  /** Optional inline badge (e.g. an ACS deep link) rendered after each item's text. */
  renderBadge?: (item: string) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={cn("size-4", tone === "good" ? "text-good" : tone === "amber" ? "text-amber" : "text-brand")} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-foreground-faint">{empty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-foreground-soft">
                <span
                  className={cn(
                    "mt-2 size-1.5 shrink-0 rounded-full",
                    tone === "good" ? "bg-good" : tone === "amber" ? "bg-amber" : "bg-brand",
                  )}
                />
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {item}
                  {renderBadge?.(item)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
