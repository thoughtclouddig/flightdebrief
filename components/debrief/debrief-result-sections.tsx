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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListenButton } from "@/components/listen-button";
import { PerceptionGapList } from "@/components/debrief/perception-gap-list";
import type { PerceptionGapRow } from "@/lib/perception-gap";
import { FlightMap } from "@/components/flight-map";
import { SkillProgressList } from "@/components/skill-progress-list";
import { EditableTrainingItemList } from "@/components/debrief/editable-training-item-list";
import { matchSkills } from "@/lib/topics";
import { cn } from "@/lib/utils";
import type { CertificateType, StructuredDebrief, TrackPosition, TrainingItem } from "@/lib/types";
import type { SkillProgression } from "@/lib/skill-progress";

/**
 * The full generated-debrief content -- shared between the results page
 * (viewed any time after a debrief is complete) and the post-recording
 * /review page (the CFI/student "walk through it together" moment before
 * it's finalized). Both pages fetch their own data and own the surrounding
 * header/footer; this is purely the content in between, unchanged from what
 * used to live directly in results/page.tsx.
 */
export function DebriefResultSections({
  result,
  differenceRows,
  displayTrack,
  hasAdsbLookup = true,
  ttsEnabled,
  flightId,
  flightSkillProgressions,
  certificateType,
  canDismiss,
  instructorFirstName,
  editableTrainingItems,
}: {
  result: StructuredDebrief;
  differenceRows: PerceptionGapRow[];
  displayTrack: TrackPosition[] | null;
  /** False for a hand-logged flight, so the empty map doesn't claim an ADS-B lookup happened. */
  hasAdsbLookup?: boolean;
  ttsEnabled: boolean;
  flightId: string;
  flightSkillProgressions: SkillProgression[];
  certificateType: CertificateType | null;
  canDismiss: boolean;
  /** Resolved via lib/instructor-attribution.ts. Null when this flight has no instructor assigned -- falls back to "your instructor". */
  instructorFirstName: string | null;
  /**
   * CFI-only, /review-only: swaps "Needs Work"/"Action Items" from the frozen
   * result strings to their live, editable TrainingItem rows -- the CFI is
   * confirming/editing an auto-draft as part of finishing the debrief, not
   * starting from a blank page. Omitted (undefined) on /results and for
   * student viewers, which keep the static read-only rendering.
   */
  editableTrainingItems?: { keepWorkingOn: TrainingItem[]; beforeNextFlight: TrainingItem[] };
}) {
  return (
    <>
      {/* Grouped, not two loose paragraphs. As direct children of the page's
          flex column they inherited card-level spacing and floated between
          the cards with nothing holding them -- they're the lede for the whole
          result: who you debriefed with, and the one sentence describing the
          flight.

          The null fallback used to read "with your instructor" -- but null IS
          the no-instructor case, so it named someone who doesn't exist. */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
          {instructorFirstName ? `From your debrief with ${instructorFirstName}` : "From your debrief"}
        </p>
        {result.flightSummary ? (
          <p className="text-lg leading-relaxed text-foreground">{result.flightSummary}</p>
        ) : null}
      </div>

      {/* Above the flight path, not below it. Once a debrief is finished,
          listening to it is the thing the student came back for -- and it was
          sitting under a map they have to scroll past. The map is context;
          this is the deliverable. */}
      {ttsEnabled ? (
        <ListenButton baseSrc={`/api/flights/${flightId}/debrief/audio`} label="Listen to your debrief" />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Flight Path</CardTitle>
        </CardHeader>
        <CardContent>
          <FlightMap track={displayTrack} hasAdsbLookup={hasAdsbLookup} />
        </CardContent>
      </Card>

      {/* What We Did is a neutral recap, not a positive/negative judgment -- kept outside the Went Well grouping so that heading only ever sits over content that's actually praise. */}
      <Section icon={ListChecks} title="What We Did" items={result.whatWeDid} empty="Nothing captured yet." />

      {/* Went Well -- what worked, framed positively. */}
      <GroupHeading tone="good">What Went Well</GroupHeading>
      <div className="flex flex-col gap-4">
        <Section icon={CheckCircle2} title="Went Well" items={result.wentWell} empty="Nothing stood out." tone="good" />
      </div>

      {/* Items to Improve -- coaching, corrections, and where perceptions differed. */}
      <GroupHeading tone="amber">Items to Improve</GroupHeading>
      <div className="flex flex-col gap-4">
        {editableTrainingItems ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4 text-amber" />
                Needs Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditableTrainingItemList
                flightId={flightId}
                category="keep_working_on"
                initialItems={editableTrainingItems.keepWorkingOn}
                addPlaceholder="Add something to keep working on..."
              />
            </CardContent>
          </Card>
        ) : (
          <Section icon={Target} title="Needs Work" items={result.needsWork} empty="No issues noted." tone="amber" />
        )}

        {differenceRows.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber" />
                Where You and Your Instructor Saw It Differently
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PerceptionGapList rows={differenceRows} />
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
                <blockquote key={i} className="rounded-lg bg-surface-sunken px-4 py-3 text-foreground-soft">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-ink">{g.instructorName} said</p>
                  <p className="mt-1 italic">&ldquo;{g.quote}&rdquo;</p>
                </blockquote>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {instructorFirstName ? (
          <Section
            icon={LifeBuoy}
            title="Where Your Instructor Stepped In"
            description="Moments the instructor took over, prompted, or corrected -- captured only when it came up in the debrief, never assumed."
            items={result.instructorAssistance}
            empty="You flew this one without needing a hand -- nothing noted."
            tone="amber"
          />
        ) : null}
        <Section icon={ShieldAlert} title="Risk Management & ADM" items={result.riskManagementNotes} empty="No risk items noted." tone="amber" />
      </div>

      {/* Next Steps -- what to carry into the next lesson. */}
      <GroupHeading tone="brand">Next Steps</GroupHeading>
      <div className="flex flex-col gap-4">
        {editableTrainingItems ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-4 text-brand" />
                Action Items
              </CardTitle>
              <CardDescription>What to prep before the next flight -- edit or remove anything, or add your own.</CardDescription>
            </CardHeader>
            <CardContent>
              <EditableTrainingItemList
                flightId={flightId}
                category="before_next_flight"
                initialItems={editableTrainingItems.beforeNextFlight}
                addPlaceholder="Add an action item..."
              />
            </CardContent>
          </Card>
        ) : (
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
        )}

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

        <Card>
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
                solo={!instructorFirstName}
                progressions={flightSkillProgressions}
                certificateType={certificateType}
                dismissible={canDismiss}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
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
  description,
  items,
  empty,
  tone,
  renderBadge,
}: {
  icon: typeof ListChecks;
  title: string;
  /** One line explaining what a section is for, where the title alone doesn't carry it. */
  description?: string;
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
        {description ? <CardDescription>{description}</CardDescription> : null}
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
