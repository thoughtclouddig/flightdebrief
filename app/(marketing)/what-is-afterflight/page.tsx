import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";
import { AnswerBlock } from "@/components/marketing/answer-block";
import { appOrigin } from "@/lib/email";
import { PRICING_TIERS, ENTERPRISE_PRICING } from "@/lib/marketing/pricing";

export const metadata: Metadata = {
  title: "What Is AfterFlight? — AfterFlight",
  description:
    "AfterFlight is a structured debrief tool for flight training: it captures the post-flight debrief conversation, organizes it into what went well, what to work on, and what to study, and carries that forward into the next lesson.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/what-is-afterflight` } : undefined,
};

export default function WhatIsAfterFlightPage() {
  const origin = appOrigin() ?? "https://getafterflight.com";
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AfterFlight",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${origin}/what-is-afterflight`,
    publisher: { "@id": `${origin}/#organization` },
    offers: [
      ...PRICING_TIERS.map((tier) => ({
        "@type": "Offer",
        name: tier.name,
        price: tier.price === "Free" ? "0" : tier.price.replace("$", ""),
        priceCurrency: "USD",
        description: `${tier.audience} ${tier.priceSuffix ? `Billed ${tier.priceSuffix.replace("/", "per ")}.` : ""}`.trim(),
      })),
      { "@type": "Offer", name: "Enterprise", description: ENTERPRISE_PRICING.priceLabel },
    ],
  };

  return (
    <section className="bg-white px-6 pb-20 pt-32 sm:pb-28 sm:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h1 className="font-display text-balance text-4xl font-bold text-[#101727] sm:text-5xl" style={{ textTransform: "none" }}>
            What Is AfterFlight?
          </h1>
          <p className="mt-3 text-sm text-[#68717D]/70">Last updated: August 25, 2026</p>
        </Reveal>

        <Reveal delay={100} className="mt-12 flex flex-col gap-10">
          <AnswerBlock
            question="What is AfterFlight?"
            answer="AfterFlight is a structured debrief tool for flight training. It captures the post-flight conversation between a CFI and student, organizes it into what went well, what needs work, and what to study next, and carries that forward into the following lesson."
          />

          <AnswerBlock
            question="Who is it for?"
            answer="Individual student pilots, individual CFIs, and flight schools -- anywhere a CFI and student debrief a lesson together. It's used the same way whether that's a single instructor with a handful of students or a school running many CFIs across many students."
          />

          <AnswerBlock
            question="What problem does it solve?"
            answer="Flight-training debriefs are usually said once, out loud, and then forgotten. Nothing from last lesson's conversation carries forward, so students walk into the next flight without a clear record of what they were told to work on. AfterFlight turns that spoken conversation into a structured, carried-forward record."
          />

          <AnswerBlock
            question="How does it work?"
            answer="Before the debrief, the CFI and student each rate the flight separately -- their own honest take, on their own. The CFI then records the structured debrief conversation, guided by where the two ratings agree and where they don't. AfterFlight turns that conversation into an organized summary and carries the relevant parts into a Next Flight brief before the following lesson."
          >
            <p>Nothing changes about how the lesson itself is flown or how the debrief conversation happens -- AfterFlight organizes what already gets said, it doesn&rsquo;t change it.</p>
          </AnswerBlock>

          <AnswerBlock
            question="What happens during a flight-training debrief?"
            answer="Each side rates the flight independently first. Then the CFI leads the actual conversation, walking through what went well and what needs work, with AfterFlight surfacing where the student's and CFI's independent ratings agreed or diverged so the conversation can focus on what matters."
          />

          <AnswerBlock
            question="What does AfterFlight produce after a debrief?"
            answer="A written summary (what went well, what needs work, direct instructor quotes, action items), an audio recap narrated by AfterFlight's Digital Debriefer, study resources linked to the relevant FAA Airman Certification Standards, and a Next Flight brief for the following lesson."
          >
            <p>
              The audio recap is not a replay of the CFI&rsquo;s actual voice or the original conversation -- it&rsquo;s an
              AI-generated summary that explicitly attributes the guidance to the CFI by name, so it never reads as
              independent instruction.
            </p>
          </AnswerBlock>

          <AnswerBlock
            question="How does it help student pilots?"
            answer="It gives students a clear, organized record of what their CFI actually said, connected to the FAA standards it relates to, plus a heads-up on what to expect and study before the next lesson -- instead of relying on memory of a conversation from a week ago."
          />

          <AnswerBlock
            question="How does it help CFIs?"
            answer="It turns a debrief a CFI is already giving into a structured, saved record, without changing how the CFI teaches. CFIs can see a student's training history at a glance, including recurring themes across multiple lessons, so they can pick up exactly where they left off."
          />

          <AnswerBlock
            question="How does it help flight schools?"
            answer="Schools get visibility into training progress and recurring gaps across every student and instructor -- which students may be falling behind, how consistently debriefs are happening, and where proficiency trends show up across the program, not just within one CFI's memory."
          />

          <AnswerBlock
            question="How is it different from a digital pilot logbook?"
            answer="A logbook records that a flight happened -- date, duration, aircraft, maneuvers logged. AfterFlight records what was actually discussed and learned in the debrief after the flight. The two are complementary, not overlapping: a logbook tracks flight time, AfterFlight tracks training content and progress."
          />

          <AnswerBlock
            question="How is it different from flight scheduling software?"
            answer="Scheduling software manages who's flying when, with which aircraft and instructor. AfterFlight starts after the flight is over, capturing and organizing the debrief conversation. It doesn't book aircraft, manage instructor availability, or handle reservations."
          />

          <AnswerBlock
            question="How does it improve continuity between lessons?"
            answer="By carrying the specific things a student was told to work on into a Next Flight brief the student sees before the following lesson -- so training builds on what actually happened last time, even if the same student sees a different instructor."
          />

          <AnswerBlock
            question="What role does AI play?"
            answer="AI organizes the debrief conversation into a structured summary, generates the audio recap, and connects feedback to relevant FAA Airman Certification Standards. It does not evaluate flight safety, certify proficiency, or originate new flight instruction -- it organizes and summarizes what the CFI actually said, and every summary is written to attribute guidance to the CFI, not to AfterFlight itself."
          />

          <AnswerBlock
            question="What are the core product features?"
            answer="Independent pre-debrief self-assessment for both CFI and student, a guided structured debrief, an AI-organized written and audio summary, ACS-linked study resources, and a Next Flight brief that carries context into the following lesson."
          >
            <p>For CFIs and schools: student training history across lessons, recurring-theme visibility, and (for schools) training-progress visibility across students and instructors.</p>
          </AnswerBlock>

          <AnswerBlock
            question="What does it cost?"
            answer={`Pilot is ${PRICING_TIERS[0].price}${PRICING_TIERS[0].priceSuffix} (${PRICING_TIERS[0].priceNote}). CFI is free. School Core is free. Enterprise is custom annual pricing for multi-location organizations.`}
          >
            <p>
              See the full breakdown on the <Link href="/#pricing" className="text-brand hover:underline">pricing section</Link> of
              the homepage.
            </p>
          </AnswerBlock>

          <AnswerBlock
            question="Where can users learn more?"
            answer="The pages linked below cover instructors, schools, pricing, and published guidance on flight-training debriefs and continuity."
          >
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              <li><Link href="/instructors" className="text-brand hover:underline">For Flight Instructors</Link></li>
              <li><Link href="/schools" className="text-brand hover:underline">For Flight Schools</Link></li>
              <li><Link href="/enterprise" className="text-brand hover:underline">Enterprise</Link></li>
              <li><Link href="/#pricing" className="text-brand hover:underline">Pricing</Link></li>
              <li><Link href="/field-notes" className="text-brand hover:underline">Field Notes</Link></li>
              <li><Link href="/research" className="text-brand hover:underline">Research</Link></li>
            </ul>
          </AnswerBlock>

          <div className="border-t border-hairline pt-8">
            <h2 className="font-display text-xl font-bold text-[#101727]">What AfterFlight is not</h2>
            <p className="mt-3 text-pretty leading-relaxed text-[#68717D]">
              AfterFlight does not evaluate flight safety, certify proficiency, or replace a CFI&rsquo;s judgment. It
              organizes and preserves what the CFI and student actually discussed -- it never originates new flight
              instruction.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
