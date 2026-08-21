import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  History,
  ListChecks,
  MessageSquareQuote,
  PlaneTakeoff,
  Target,
} from "lucide-react";
import { AssignRadioPracticeCard } from "@/components/assign-radio-practice-card";
import { ScheduleLessonForm } from "@/components/schedule-lesson-form";
import { StudentNotesCard } from "@/components/student-notes-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillProgressList } from "@/components/skill-progress-list";
import { getRepository } from "@/lib/data";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeSkillProgression } from "@/lib/skill-progress";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { formatDurationShort } from "@/lib/utils";
import type { User } from "@/lib/types";
import type { Viewer } from "@/lib/viewer";

/**
 * Recent flights, debrief summaries, topics, strengths, recurring challenges,
 * action items, next-flight priorities, and skill history for one student --
 * shared between the CFI's per-student profile (app/(product)/cfi/students/
 * [id]/page.tsx) and the school-admin equivalent (app/(product)/admin/
 * students/[id]/page.tsx). Both callers own their own auth check
 * (getAuthorizedStudent already accepts both instructor and admin roles) and
 * just pass the already-authorized student/viewer through.
 */
export async function StudentTrainingDetail({
  student,
  viewer,
  handoffHref,
}: {
  student: User;
  viewer: Viewer;
  /** CFI-only affordance; omit for the admin view, which has no handoff concept. */
  handoffHref?: string;
}) {
  const repo = getRepository();
  const isCfiOrAdmin = viewer.role === "instructor" || viewer.role === "admin";
  // School orgs are the ones actually running Flight Schedule Pro today --
  // showing a second, unsynced scheduler there risks two systems drifting
  // out of sync, not just going unused. Independent CFIs and solo accounts
  // have no scheduling tool at all, so manual scheduling is real value there.
  const canScheduleLessons = isCfiOrAdmin && viewer.organization.kind !== "school";
  const [flights, trainingItems, brief, signals, radioPracticeAssignments, studentNotes, aircraft] = await Promise.all([
    repo.listFlights({ studentId: student.id }),
    repo.listTrainingItems(),
    computeNextLessonBrief(repo, student.id),
    repo.listTrainingSignals({ studentId: student.id }),
    repo.listRadioPracticeAssignments(student.id),
    isCfiOrAdmin ? repo.listStudentNotes({ studentId: student.id }) : Promise.resolve([]),
    canScheduleLessons ? repo.listAircraft(viewer.organization.id) : Promise.resolve([]),
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
  const skillProgressions = computeSkillProgression(signals.filter((s) => !s.dismissed));

  // Radio-practice auto-suggest: only for skills unambiguously about radio
  // communications (not EMERGENCY_PROCEDURES, which also covers non-radio
  // emergency handling) -- surfaced as a one-click suggestion for the CFI to
  // confirm, never silently auto-assigned, same "suggest, don't act" pattern
  // training signals themselves already use.
  const RADIO_SUGGESTION_SKILLS = new Set(["RADIO_COMMUNICATIONS", "TOWER_READBACKS"]);
  const assignedScenarioIds = new Set(radioPracticeAssignments.map((a) => a.scenarioId));
  const suggestedRadioScenarioId =
    skillProgressions
      .filter((p) => RADIO_SUGGESTION_SKILLS.has(p.skill) && p.status === "Needs Coaching")
      .map((p) => RADIO_PRACTICE_SCENARIOS.find((s) => s.skill === p.skill && !assignedScenarioIds.has(s.id)))
      .find((s): s is (typeof RADIO_PRACTICE_SCENARIOS)[number] => s !== undefined)?.id ?? null;

  const memberships = await repo.listMembershipsForUser(student.id);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{student.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Student Pilot</p>
        </div>
        {handoffHref ? (
          <Link href={handoffHref} className={buttonVariants({ size: "sm", variant: "outline" })}>
            Handoff Brief
          </Link>
        ) : null}
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

          <div className="border-t border-brand/20 pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <CalendarClock className="size-3.5" /> Next Scheduled Lesson
            </p>
            {brief.upcomingReservation ? (
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {new Date(brief.upcomingReservation.scheduledStart).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            ) : (
              <p className="text-sm text-slate-400">Nothing scheduled yet.</p>
            )}
            {canScheduleLessons ? (
              <div className="mt-2">
                <ScheduleLessonForm studentId={student.id} aircraft={aircraft} />
              </div>
            ) : null}
          </div>
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
          <CardTitle>Training Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillProgressList
            progressions={skillProgressions}
            certificateType={certificateType}
            dismissible={viewer.role === "instructor" || viewer.role === "admin"}
          />
        </CardContent>
      </Card>

      {viewer.role === "instructor" || viewer.role === "admin" ? (
        <AssignRadioPracticeCard
          studentId={student.id}
          initialAssignments={radioPracticeAssignments}
          suggestedScenarioId={suggestedRadioScenarioId}
        />
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
                  <span className="flex-1">{item.description}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
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

      {isCfiOrAdmin ? <StudentNotesCard studentId={student.id} initialNotes={studentNotes} /> : null}

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
