import type { Metadata } from "next";
import { Reveal } from "@/components/marketing/reveal";
import { DemoPersonaCards } from "@/components/marketing/demo-persona-cards";
import { appOrigin } from "@/lib/email";

export const metadata: Metadata = {
  title: "Try AfterFlight Live",
  description:
    "A real, interactive demo of AfterFlight -- no signup required. Log a flight, complete a debrief, or explore a CFI's roster with realistic data.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/demo` } : undefined,
};

export default function DemoPage() {
  return (
    <section className="bg-white px-6 pb-24 pt-40 sm:pt-48">
      <div className="mx-auto max-w-5xl text-center">
        <Reveal>
          <p className="text-balance text-xs font-bold uppercase tracking-[0.16em] text-brand">Live Demo</p>
          <h1 className="font-display mx-auto mt-3 max-w-3xl text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            Try the real product. No signup.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-[#414B57]">
            Every click here is the real app, populated with realistic data. Log your own flight, complete a
            debrief, or step into a CFI&rsquo;s roster of students. Nothing you do here is permanent -- it resets
            automatically.
          </p>
        </Reveal>

        <div className="mt-12">
          <DemoPersonaCards delay={120} />
        </div>
      </div>
    </section>
  );
}
