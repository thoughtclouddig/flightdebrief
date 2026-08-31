import type { Metadata } from "next";
import { appOrigin } from "@/lib/email";
import { Hero } from "@/components/marketing/sections/hero";
import { BrandMoment } from "@/components/marketing/sections/brand-moment";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";
import { VectorSection } from "@/components/marketing/sections/vector";
import { NextFlight } from "@/components/marketing/sections/next-flight";
import { PersonalizedTraining } from "@/components/marketing/sections/personalized-training";
import { PerceptionGap } from "@/components/marketing/sections/perception-gap";
import { SkillProgress } from "@/components/marketing/sections/skill-progress";
import { DebriefReplay } from "@/components/marketing/sections/debrief-replay";
import { ForCfis } from "@/components/marketing/sections/for-cfis";
import { DebriefDoctrine } from "@/components/marketing/sections/debrief-doctrine";
import { Proof } from "@/components/marketing/sections/proof";
import { TrainingEconomics } from "@/components/marketing/sections/training-economics";
import { WhoItsFor } from "@/components/marketing/sections/who-its-for";
import { Pricing } from "@/components/marketing/sections/pricing";
import { FinalCta } from "@/components/marketing/sections/final-cta";

export const metadata: Metadata = {
  title: "AfterFlight — Get more out of every flight lesson.",
  description:
    "AfterFlight turns your instructor debrief into personalized training, quick practice, and a clear plan for what to work on before your next flight. Vector, your AI flight trainer, already knows your training history.",
  alternates: appOrigin() ? { canonical: appOrigin()! } : undefined,
};

/**
 * The homepage tells one story: the flight is the expensive part, and the
 * learning has to continue after it.
 *
 * Section order follows the student's own sequence -- the problem, the loop,
 * the trainer that runs the loop, and then the four artifacts the loop
 * produces (next flight, training, the perception gap, progress). The
 * instructor beat comes after all of that, because a CFI reading this page is
 * deciding whether it costs them anything, not whether it works.
 *
 * Three sections were removed rather than rewritten:
 *
 *  - EverythingThatMatters, a six-step walkthrough of CFI grading, student
 *    grading, recording and summary. Accurate, and the wrong lead: it framed
 *    the product as a training-records workflow with the debrief as the point.
 *    The debrief is the input. HowItWorks replaces it with the four-step loop.
 *  - LearningLoop, whose "Study" beat ended by pointing students at FAA
 *    references. Handing someone a handbook chapter is the "work on landings"
 *    problem with a citation attached. PersonalizedTraining replaces it, and
 *    keeps the FAA material as the grounding layer it should have been.
 *  - FlightScoreSection, a single aggregate gauge. That is exactly the overall
 *    readiness verdict this product will not make -- the signoff belongs to
 *    the instructor. SkillProgress replaces it with per-skill scores that
 *    carry the instructor's own sentence.
 *
 * All three components still exist; they are used by other pages or kept for
 * reference, and deleting them is a separate decision from this repositioning.
 */
export default function MarketingHomePage() {
  return (
    <>
      <Hero />
      <BrandMoment />
      <HowItWorks />
      <VectorSection />
      <NextFlight />
      <PersonalizedTraining />
      <PerceptionGap />
      <SkillProgress />
      <DebriefReplay />
      <ForCfis />
      <DebriefDoctrine />
      <Proof />
      <TrainingEconomics />
      <WhoItsFor />
      <Pricing />
      <FinalCta />
    </>
  );
}
