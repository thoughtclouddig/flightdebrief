import { AlertCircle, ClipboardList, Repeat, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcsBadge } from "@/components/acs-badge";
import { TrainingItemChecklist } from "@/components/training-item-checklist";
import { FlightScoreGauge } from "@/components/flight-score/flight-score-gauge";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { getFlightScoreForStudent, MIN_FLIGHTS_FOR_SCORE, MIN_OBSERVATIONS_FOR_SCORE } from "@/lib/flight-score";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const studentId = viewer.user.id;

  const [flights, trainingItems, brief, memberships, flightScore] = await Promise.all([
    repo.listFlights({ studentId }),
    repo.listTrainingItems(),
    computeNextLessonBrief(repo, studentId),
    repo.listMembershipsForUser(studentId),
    getFlightScoreForStudent(repo, studentId),
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
        <h1 className="text-2xl font-semibold text-foreground">Your progress</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          Patterns across your training -- conservative on purpose. Nothing here is a trend until it&rsquo;s shown up more than once.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          {flightScore.building ? (
            <>
              <FlightScoreGauge
                building
                skillsObserved={flightScore.skillsObserved}
                flightsObserved={flightScore.flightsObserved}
                size={160}
              />
              <p className="max-w-xs text-sm text-foreground-soft">
                FlightScore needs at least {MIN_OBSERVATIONS_FOR_SCORE} CFI-reviewed skill observations across{" "}
                {MIN_FLIGHTS_FOR_SCORE} guided debriefs before it shows a number. More instructor observations needed.
              </p>
            </>
          ) : (
            <>
              <FlightScoreGauge score={flightScore.gauge!.score} label={flightScore.gauge!.label} tone={flightScore.gauge!.tone} size={160} />
              <p className="max-w-xs text-sm text-foreground-soft">
                Built from {flightScore.totalObservations} CFI-reviewed skill observations across{" "}
                {flightScore.flightsObserved} guided debriefs. Instructor judgment, organized -- not a replacement for it.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {!flightScore.building && flightScore.gauge?.categories?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>FlightScore by area</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {flightScore.gauge.categories.map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground-soft">{c.label}</span>
                <Badge variant={c.tone === "good" ? "success" : c.tone === "amber" ? "warning" : "danger"}>{c.score}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {!flightScore.building && flightScore.skills.some((s) => s.trend !== "flat") ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-brand" />
              Trending
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {flightScore.skills
              .filter((s) => s.trend !== "flat")
              .map((s) => (
                <p key={s.skill} className="flex items-center gap-2 text-sm text-foreground-soft">
                  {s.trend === "up" ? (
                    <TrendingUp className="size-4 shrink-0 text-good" />
                  ) : (
                    <TrendingDown className="size-4 shrink-0 text-danger" />
                  )}
                  <span>
                    <span className="font-semibold text-foreground">{s.label}</span> is trending{" "}
                    {s.trend === "up" ? "upward" : "downward"} across your last {s.observationCount} observations.
                  </span>
                </p>
              ))}
          </CardContent>
        </Card>
      ) : null}

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

      {brief.recurringThemes.length > 0 ? (
        <Card className="border-amber/40 bg-amber-soft">
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
                  <span className="font-semibold text-foreground">{theme.theme}</span> has come up in{" "}
                  {theme.count} of your last {theme.consideredFlights} debriefs.
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
                <li key={item.id} className="flex items-start gap-2 text-sm text-foreground-soft">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber" />
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
