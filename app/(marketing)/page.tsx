import type { Metadata } from "next";
import { Hero } from "@/components/marketing/sections/hero";
import { LearningLoop } from "@/components/marketing/sections/learning-loop";
import { BrandMoment } from "@/components/marketing/sections/brand-moment";
import { Proof } from "@/components/marketing/sections/proof";
import { BrandDeviceLoop } from "@/components/marketing/brand-device-loop";
import { EverythingThatMatters } from "@/components/marketing/sections/everything-that-matters";
import { FeedbackToPlan } from "@/components/marketing/sections/feedback-to-plan";
import { FlightScoreSection } from "@/components/marketing/sections/flightscore";
import { TrainingEconomics } from "@/components/marketing/sections/training-economics";
import { WhoItsFor } from "@/components/marketing/sections/who-its-for";
import { PplPayoff } from "@/components/marketing/sections/ppl-payoff";
import { Pricing } from "@/components/marketing/sections/pricing";
import { FinalCta } from "@/components/marketing/sections/final-cta";

export const metadata: Metadata = {
  title: "AfterFlight — Get better every flight.",
  description:
    "AfterFlight turns each flight into the learning plan for the next one. Capture the debrief, connect feedback to the FAA Airman Certification Standards, and know exactly what to work on next.",
};

export default function MarketingHomePage() {
  return (
    <>
      <Hero />
      <BrandDeviceLoop />
      <BrandMoment />
      <LearningLoop />
      <Proof />
      <EverythingThatMatters />
      <FeedbackToPlan />
      <FlightScoreSection />
      <TrainingEconomics />
      <PplPayoff />
      <WhoItsFor />
      <Pricing />
      <FinalCta />
    </>
  );
}
