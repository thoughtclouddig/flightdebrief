import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  AcsBadge,
  BackLink,
  InfoTip,
  Evidence,
  PrimaryButton,
  Screen,
  Section,
  SecondaryButton,
  SkillMeter,
  StateLabel,
  TrendStrip,
} from "@/components/prototype/ui";
import { ObjectiveComparison } from "@/components/prototype/assessment-comparison";
import { objectiveForSkill } from "@/lib/prototype/assessment";
import { INSTRUCTOR, SKILL_SCORES, skillBySlug } from "@/lib/prototype/vector-data";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return SKILL_SCORES.map((s) => ({ skill: s.slug }));
}

/**
 * One skill, in full. This is where progressive disclosure lands: the list
 * shows name, state and meter, and everything that explains those three lives
 * here, one tap away.
 *
 * The order is deliberate. The score is stated, then immediately sourced --
 * the instructor's own sentence sits directly under the number, because a
 * score without its evidence is exactly the thing this product refuses to
 * ship. Vector's read comes last and is labeled as Vector's, never as the
 * instructor's.
 */
export default async function SkillDetail({ params }: { params: Promise<{ skill: string }> }) {
  const { skill: slug } = await params;
  const skill = skillBySlug(slug);
  if (!skill) notFound();
  const gap = objectiveForSkill(skill.skill);

  return (
    <Screen>
      <BackLink href="/prototype/vector/progress">Progress</BackLink>

      <div>
        <h1 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">{skill.skill}</h1>
        <div className="mt-4 flex items-center gap-3">
          <SkillMeter score={skill.score} max={skill.max} state={skill.state} size="lg" />
          <StateLabel state={skill.state} />
          <InfoTip label="What this means" align="left">
            Four levels, from &ldquo;needs work&rdquo; to &ldquo;meets standard&rdquo;, for this one skill. It comes
            from what {INSTRUCTOR.firstName} said about it &mdash; the sentence is right below. There&rsquo;s no
            overall score, and no readiness percentage: whether you&rsquo;re ready to solo is your
            instructor&rsquo;s call.
          </InfoTip>
        </div>
        <div className="mt-3">
          <AcsBadge area={skill.acsArea} code={skill.acsCode} />
        </div>
      </div>

      {/*
        * Both assessments of this skill from the most recent flight, when the
        * flight rated it.
        *
        * Skill detail previously showed the instructor's judgment with the
        * student's remark underneath as supporting color, which quietly
        * ranked the two. They are two independent assessments of the same
        * objective, and seeing the distance between them is the point -- it is
        * how a student learns to calibrate their own read of a flight against
        * the standard.
        */}
      {gap ? (
        <Section title={<>How you both saw it</>} flush>
          <ObjectiveComparison
            task={gap.task}
            student={gap.studentLevel}
            instructor={gap.instructorLevel}
            instructorName={INSTRUCTOR.firstName}
          />
        </Section>
      ) : null}

      <Section title={<>Latest evidence</>}>
        <div className="flex flex-col gap-6">
          <Evidence label={INSTRUCTOR.firstName} tone="instructor" text={skill.instructorEvidence} />
          {skill.studentTake ? <Evidence label="You" tone="student" quoted={false} text={skill.studentTake} /> : null}
        </div>
      </Section>

      {skill.recurring ? (
        <Section title={<>Still showing up</>}>
          {/*
           * The cross-instructor count is the load-bearing number here: one
           * instructor flagging something twice is a coaching thread, two
           * instructors flagging it across a handover is a pattern that
           * survived a change of teacher.
           */}
          <p className="text-[17px] leading-snug text-foreground">
            {skill.recurring.lessons} recent lessons · {skill.recurring.instructors} instructors
          </p>
        </Section>
      ) : null}

      <Section title={<>Trend</>}>
        <TrendStrip points={skill.trend.map((t) => ({ ...t, max: skill.max }))} />
      </Section>

      <Section title={<>Vector&rsquo;s read</>}>
        <Evidence label="Vector" tone="vector" quoted={false} text={skill.vectorRead} />
      </Section>

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href="/prototype/vector/train">
          Train this with Vector
          <ArrowRight className="size-[18px]" aria-hidden />
        </PrimaryButton>
        <SecondaryButton href="/prototype/vector/debrief">View lesson history</SecondaryButton>
      </div>
    </Screen>
  );
}
