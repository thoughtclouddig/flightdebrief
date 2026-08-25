import type { Metadata } from "next";
import { Hero } from "@/components/marketing/sections/hero";
import { LearningLoop } from "@/components/marketing/sections/learning-loop";
import { BrandMoment } from "@/components/marketing/sections/brand-moment";
import { DebriefDoctrine } from "@/components/marketing/sections/debrief-doctrine";
import { Proof } from "@/components/marketing/sections/proof";
import { DeferredBrandDeviceLoop } from "@/components/marketing/deferred-brand-device-loop";
import { EverythingThatMatters } from "@/components/marketing/sections/everything-that-matters";
import { NextFlightPayoff } from "@/components/marketing/sections/next-flight-payoff";
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
      <DeferredBrandDeviceLoop />
      <BrandMoment />
      <EverythingThatMatters />
      <NextFlightPayoff />
      <LearningLoop />
      <DebriefDoctrine />
      <Proof />
      <FlightScoreSection />
      <TrainingEconomics />
      <PplPayoff />
      <WhoItsFor />
      <Pricing />
      <FinalCta />
    </>
  );
}
