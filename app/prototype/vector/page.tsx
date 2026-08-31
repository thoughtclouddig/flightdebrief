import type { Metadata } from "next";
import { ArrowRight, BookOpen, CalendarClock, CheckCircle2, History, MessageSquareQuote, Repeat, Volume2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AskVector } from "@/components/prototype/ask-vector";
import { KnowledgeCheck } from "@/components/prototype/knowledge-check";
import { ChairFly } from "@/components/prototype/chair-fly";
import { SkillScores } from "@/components/prototype/skill-scores";
import {
  CONCEPTS,
  IMPROVING,
  INSTRUCTOR,
  LAST_FLIGHT,
  NEXT_LESSON,
  PERCEPTION_GAPS,
  RECURRING,
  STRUCTURED,
  STUDENT,
  SUGGESTED,
} from "@/lib/prototype/vector-data";

export const metadata: Metadata = { title: "Vector prototype — AfterFlight", robots: { index: false, follow: false } };

/**
 * The Vector prototype.
 *
 * Contained under /prototype on purpose: no schema changes, no database
 * reads, no production route touched. Everything here runs off the seeded
 * module in lib/prototype/vector-data.ts, so it can be evaluated and then
 * deleted or promoted without a migration either way.
 *
 * The hierarchy is the argument. NEXT FLIGHT is first and largest because
 * the strategic bet is that the product points forward -- what should I do
 * before I spend money again -- rather than backward into a record of what
 * happened. The debrief is still here; it is just no longer the destination.
 */
export default function VectorPrototypePage() {
  const gapsWithDifference = PERCEPTION_GAPS.filter((g) => g.takeaway);
  const crosswind = CONCEPTS["crosswind-correction-through-touchdown"]!;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-16">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Prototype</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Good afternoon, {STUDENT.firstName}</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          {STUDENT.hours} hours &middot; {STUDENT.certificate} &middot; flying with {INSTRUCTOR.firstName}
        </p>
      </div>

      {/* 1 — NEXT FLIGHT. The dominant surface. */}
      <Card className="border-brand/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-brand" />
            Your next flight &mdash; {NEXT_LESSON.date}, {NEXT_LESSON.time}
          </CardTitle>
          <CardDescription>
            With {NEXT_LESSON.instructor}. Planned focus: {NEXT_LESSON.focus.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">What matters most</p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {STRUCTURED.nextFlightFocus.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
              What {INSTRUCTOR.firstName} wants continued
            </p>
            {STRUCTURED.instructorEmphasis.map((e) => (
              <blockquote key={e.quote} className="mt-1.5 rounded-lg bg-surface-sunken px-3 py-2 text-sm italic text-foreground-soft">
                &ldquo;{e.quote}&rdquo;
              </blockquote>
            ))}
          </div>

          <div className="rounded-lg bg-surface-sunken px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Remember in the cockpit</p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {STRUCTURED.cockpitCues.map((c) => (
                <li key={c} className="text-sm text-foreground-soft">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 2 — TRAIN WITH VECTOR, in the next-flight context. */}
      <AskVector suggestions={SUGGESTED.nextFlight} placeholder="Ask about Thursday..." />

      {/* Quick Review — taught, with FAA underneath rather than in place of. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-brand" />
            Quick review &mdash; {crosswind.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-foreground-soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
              What {INSTRUCTOR.firstName} meant
            </p>
            <p className="mt-1">{crosswind.instructorMeant}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Why it happens</p>
            <p className="mt-1">{crosswind.whyItHappens}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">What to picture</p>
            <p className="mt-1">{crosswind.picture}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Common mistake</p>
            <p className="mt-1">{crosswind.commonMistake}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Next time</p>
            <ul className="mt-1 flex flex-col gap-1">
              {crosswind.nextTime.map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-brand" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
          {/* Source grounds the lesson; it is not the lesson. */}
          <p className="border-t border-hairline pt-2.5 text-xs text-foreground-faint">
            {crosswind.sources.join(" · ")}
          </p>
        </CardContent>
      </Card>

      <KnowledgeCheck />
      <ChairFly />

      {/* 3 — STILL WORKING ON. Skill is the subject; instructors are context. */}
      <Card className="border-amber/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="size-4 text-amber" />
            Still showing up
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-foreground">{RECURRING.summary}</p>
          <ol className="flex flex-col gap-2.5 border-l border-hairline pl-3.5">
            {RECURRING.lessons.map((l) => (
              <li key={l.n} className="relative">
                <span className="absolute -left-[18px] top-1.5 size-1.5 rounded-full bg-amber" />
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                  {l.date} &middot; {l.instructor}
                </p>
                <p className="mt-0.5 text-sm text-foreground-soft">{l.note}</p>
              </li>
            ))}
          </ol>
          <p className="rounded-lg bg-surface-sunken px-3 py-2 text-sm text-foreground-soft">{RECURRING.interpretation}</p>
        </CardContent>
      </Card>

      {/* 4 — LAST DEBRIEF, including the perception gap. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4 text-brand" />
            Last debrief &mdash; {LAST_FLIGHT.date}
          </CardTitle>
          <CardDescription>
            {LAST_FLIGHT.lesson} &middot; {LAST_FLIGHT.duration} hrs &middot; with {LAST_FLIGHT.instructor}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <button className="flex items-center gap-2 self-start rounded-lg border border-hairline px-3 py-2 text-sm text-foreground-soft transition-colors hover:border-brand hover:text-brand">
            <Volume2 className="size-4" />
            Play the recap &mdash; 1:12
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">What went well</p>
            {STRUCTURED.wentWell.map((w) => (
              <p key={w} className="mt-1 flex items-start gap-2 text-sm text-foreground-soft">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" />
                {w}
              </p>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Still needs work</p>
            {STRUCTURED.needsWork.map((w) => (
              <p key={w} className="mt-1 flex items-start gap-2 text-sm text-foreground-soft">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber" />
                {w}
              </p>
            ))}
          </div>

          <div className="border-t border-hairline pt-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquareQuote className="size-4 text-brand" />
              Where you and {INSTRUCTOR.firstName} landed
            </p>
            <p className="mt-1 text-sm text-foreground-soft">
              You agreed on {PERCEPTION_GAPS.length - gapsWithDifference.length} of {PERCEPTION_GAPS.length}. The rest is
              the useful part.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {gapsWithDifference.map((g) => (
                <div key={g.task} className="rounded-lg border border-hairline px-3.5 py-3">
                  <p className="text-sm font-semibold text-foreground">{g.task}</p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">How you saw it</p>
                      <p className="mt-0.5 text-sm text-foreground-soft">{g.studentView}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                        How {INSTRUCTOR.firstName} saw it
                      </p>
                      <p className="mt-0.5 text-sm text-foreground-soft">{g.instructorView}</p>
                    </div>
                  </div>
                  {g.takeaway ? (
                    <div className="mt-2.5 rounded-lg bg-surface-sunken px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                        What to take from this
                      </p>
                      <p className="mt-0.5 text-sm text-foreground-soft">{g.takeaway}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <SkillScores />

      {/* 5 — PROGRESS. Per-skill, explainable, never an aggregate. */}
      <Card>
        <CardHeader>
          <CardTitle>Your progress</CardTitle>
          <CardDescription>What&rsquo;s moving, what isn&rsquo;t, and what your instructor still has open.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-good">Improving</p>
            {IMPROVING.map((i) => (
              <p key={i.skill} className="mt-1 text-sm text-foreground-soft">
                <span className="font-medium text-foreground">{i.skill}</span> &mdash; {i.note}
              </p>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber">Still unresolved</p>
            <p className="mt-1 text-sm text-foreground-soft">
              <span className="font-medium text-foreground">Stabilized approach speed</span> &mdash; 3 lessons, 2
              instructors
            </p>
            <p className="mt-1 text-sm text-foreground-soft">
              <span className="font-medium text-foreground">Crosswind correction through touchdown</span> &mdash; raised
              this lesson
            </p>
          </div>
          {/* Deliberately not a readiness verdict: the signoff call is the instructor's. */}
          <p className="rounded-lg bg-surface-sunken px-3 py-2.5 text-sm text-foreground-soft">
            These are the items {INSTRUCTOR.firstName} has flagged and not yet cleared. Whether they&rsquo;re behind you
            is his call &mdash; worth asking him directly on Thursday.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
