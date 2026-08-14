import { Reveal } from "@/components/marketing/reveal";

const STEPS = [
  { label: "Talk", body: "Have the conversation you're already having." },
  { label: "Remember", body: "AfterFlight captures what matters from the lesson." },
  { label: "Return", body: "The next flight starts where the last one ended." },
];

export function SimpleByDesign() {
  return (
    <section className="border-t border-hairline px-6 py-24 text-center sm:py-28">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Simple by design</p>
        <h2 className="font-display mt-3 text-balance text-4xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-5xl">
          Nothing extra to fill out.
        </h2>
      </Reveal>

      <Reveal delay={150} className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-8 text-left sm:grid-cols-3 sm:text-center">
        {STEPS.map((step) => (
          <div key={step.label}>
            <p className="font-display text-lg font-extrabold uppercase text-brand">{step.label}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">{step.body}</p>
          </div>
        ))}
      </Reveal>

      <Reveal delay={300}>
        <p className="mx-auto mt-12 max-w-sm text-xs text-foreground-faint">
          Powered by modern speech and language technology built quietly into the workflow.
        </p>
      </Reveal>
    </section>
  );
}
