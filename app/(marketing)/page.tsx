import { Hero } from "@/components/marketing/sections/hero";
import { Problem } from "@/components/marketing/sections/problem";
import { SocialProof } from "@/components/marketing/sections/social-proof";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";
import { Transformation } from "@/components/marketing/sections/transformation";
import { Students } from "@/components/marketing/sections/students";
import { Cfis } from "@/components/marketing/sections/cfis";
import { CfiHandoff } from "@/components/marketing/sections/cfi-handoff";
import { FlightSchools } from "@/components/marketing/sections/flight-schools";
import { TrainingInsights } from "@/components/marketing/sections/training-insights";
import { ExistingSystems } from "@/components/marketing/sections/existing-systems";
import { FlightData } from "@/components/marketing/sections/flight-data";
import { SimpleByDesign } from "@/components/marketing/sections/simple-by-design";
import { FinalCta } from "@/components/marketing/sections/final-cta";

export default function MarketingHomePage() {
  return (
    <>
      <Hero />
      <Problem />
      <SocialProof />
      <HowItWorks />
      <Transformation />
      <Students />
      <Cfis />
      <CfiHandoff />
      <FlightSchools />
      <TrainingInsights />
      <ExistingSystems />
      <FlightData />
      <SimpleByDesign />
      <FinalCta />
    </>
  );
}
