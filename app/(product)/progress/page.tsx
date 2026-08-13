import { AlertCircle, ClipboardList, Repeat, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcsBadge } from "@/components/acs-badge";
import { TrainingItemChecklist } from "@/components/training-item-checklist";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const studentId = viewer.user.id;

  const [flights, trainingItems, brief, memberships] = await Promise.all([
    repo.listFlights({ studentId }),
    repo.listTrainingItems(),
    computeNextLessonBrief(repo, studentId),
    repo.listMembershipsForUser(studentId),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  const flightIds = new Set(flights.map((f) => f.id));
  const openItems = trainingItems.filter((t) => flightIds.has(t.flightId) && !t.done && t.visibility === "shared");
  const keepWorkingOn = openItems.filter((t) => t.category === "keep_working_on");
  const beforeFlight = openItems.filter((t) => t.category === "before_next_flight");
  const debriefedCount = flights.filter((f) => f.debriefStatus === "complete").length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Your progress</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Patterns across your training -- conservative on purpose. Nothing here is a trend until it&rsquo;s shown up more than once.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Flights debriefed</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{debriefedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Open action items</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{openItems.length}</p>
          </CardContent>
        </Card>
      </div>

      {brief.recurringThemes.length > 0 ? (
        <Card className="border-amber-300/60 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-amber-600 dark:text-amber-400" />
              Recurring Themes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {brief.recurringThemes.map((theme, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold text-slate-900 dark:text-white">{theme.theme}</span> has come up in{" "}
                  {theme.count} of your last {theme.consideredFlights} debriefs.
                </p>
                <AcsBadge skill={theme.skill} certificateType={certificateType} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3 py-5 text-slate-400">
            <TrendingUp className="size-5 shrink-0" />
            <p className="text-sm">Not enough debriefs yet to spot a recurring theme -- keep flying.</p>
          </CardContent>
        </Card>
      )}

      {keepWorkingOn.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-4 text-brand" />
              Keep working on
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {keepWorkingOn.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item.description}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {beforeFlight.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-4 text-brand" />
              Outstanding before your next flight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrainingItemChecklist items={beforeFlight} />
          </CardContent>
        </Card>
      ) : null}

      {brief.focusAreas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Current focus</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {brief.focusAreas.map((f, i) => (
              <Badge key={i} variant="brand">
                {f}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
