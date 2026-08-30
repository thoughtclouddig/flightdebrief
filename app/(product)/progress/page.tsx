import { AlertCircle, ClipboardList, Repeat, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabPanels } from "@/components/ui/tab-panels";
import { AcsBadge } from "@/components/acs-badge";
import { SkillProgressList } from "@/components/skill-progress-list";
import { TrainingItemChecklist } from "@/components/training-item-checklist";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeSkillProgression } from "@/lib/skill-progress";
import { computeStudentFreeFlights } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  /** Certificated pilot flying without a CFI on the account -- see components/nav.tsx. */
  const solo = viewer.organization.kind === "individual";
  const studentId = viewer.user.id;

  const [flights, trainingItems, brief, memberships, signals] = await Promise.all([
    repo.listFlights({ studentId }),
    repo.listTrainingItems(),
    computeNextLessonBrief(repo, studentId),
    repo.listMembershipsForUser(studentId),
    repo.listTrainingSignals({ studentId }),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  // Marks the "Track your training over time" Guide step (lib/guide.ts).
  if (!viewer.user.guideProgress?.progress) {
    void repo.markGuideStepViewed(viewer.user.id, "progress").catch(() => {});
  }

  const flightIds = new Set(flights.map((f) => f.id));
  const openItems = trainingItems.filter((t) => flightIds.has(t.flightId) && !t.done && t.visibility === "shared");
  const keepWorkingOn = openItems.filter((t) => t.category === "keep_working_on");
  const beforeFlight = openItems.filter((t) => t.category === "before_next_flight");
  const debriefedCount = flights.filter((f) => f.debriefStatus === "complete").length;
  const skillProgressions = computeSkillProgression(signals.filter((s) => !s.dismissed));
  const freeFlights = computeStudentFreeFlights(flights);

  const actionItemsPanel =
    keepWorkingOn.length > 0 || beforeFlight.length > 0 ? (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4 text-brand" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {keepWorkingOn.length > 0 ? (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                <AlertCircle className="size-3.5" />
                Ongoing ({keepWorkingOn.length})
              </p>
              <p className="mt-1 text-sm text-foreground-soft">
                {solo ? "Skills that came out of your own debriefs." : "Skills your instructor called out across debriefs."} These
                clear on their own once a later flight shows you&rsquo;ve got it -- or check one off yourself if you feel
                ready.
              </p>
              <div className="mt-2">
                <TrainingItemChecklist items={keepWorkingOn} />
              </div>
            </div>
          ) : null}
          {beforeFlight.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                Before your next flight ({beforeFlight.length})
              </p>
              <div className="mt-2">
                <TrainingItemChecklist items={beforeFlight} />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    ) : (
      <p className="py-8 text-center text-sm text-foreground-faint">Nothing open right now.</p>
    );

  const themesPanel = (
    <>
      {brief.focusAreas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Current focus</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {brief.focusAreas.map((f, i) => (
              <Badge key={i} variant="neutral">
                {f}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {brief.recurringThemes.length > 0 ? (
        <Card className="border-amber/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-amber" />
              Recurring Themes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {brief.recurringThemes.map((theme, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm text-foreground-soft">
                  <span className="font-semibold text-foreground">{theme.theme}</span> has come up in {theme.count}{" "}
                  {theme.count === 1 ? "lesson" : "lessons"}
                  {/* The instructor count is the whole point when it's >1: a
                      weakness that outlived a change of instructor is about
                      the skill, not about whoever was teaching. Stated as
                      persistence, never as anyone failing to fix it. */}
                  {theme.instructorCount >= 2 ? ` with ${theme.instructorCount} instructors` : ""}.
                </p>
                <AcsBadge skill={theme.skill} certificateType={certificateType} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3 py-5 text-foreground-faint">
            <TrendingUp className="size-5 shrink-0" />
            <p className="text-sm">Not enough debriefs yet to spot a recurring theme -- keep flying.</p>
          </CardContent>
        </Card>
      )}
    </>
  );

  const skillsPanel = (
    <Card>
      <CardHeader>
        <CardTitle>Training Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <SkillProgressList progressions={skillProgressions} certificateType={certificateType} solo={solo} />
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{solo ? "Your proficiency" : "Your progress"}</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          Patterns across your training -- conservative on purpose. Nothing here is a trend until it&rsquo;s shown up more than once.
        </p>
        <p className="mt-2 text-xs font-semibold text-brand">
          {freeFlights.exhausted
            ? "You've used your 3 free flights."
            : `${freeFlights.used} of ${freeFlights.cap} free flights used`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Flights debriefed</p>
            <p className="text-2xl font-semibold text-foreground">{debriefedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Open action items</p>
            <p className="text-2xl font-semibold text-foreground">{openItems.length}</p>
          </CardContent>
        </Card>
      </div>

      <TabPanels
        tabs={[
          { id: "action-items", label: "Action Items", content: actionItemsPanel },
          { id: "themes", label: "Themes", content: themesPanel },
          { id: "skills", label: "Skills", content: skillsPanel },
        ]}
      />
    </div>
  );
}
