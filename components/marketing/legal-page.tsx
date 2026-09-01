import type { ReactNode } from "react";
import { Reveal } from "@/components/marketing/reveal";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <section className="bg-white px-6 pb-20 pt-32 sm:pb-28 sm:pt-36">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h1 className="font-display text-balance text-4xl font-bold text-[#101727] sm:text-5xl" style={{ textTransform: "none" }}>
            {title}
          </h1>
          <p className="mt-3 text-sm text-[#68717D]/70">Last updated: {updated}</p>
        </Reveal>

        <Reveal delay={100} className="mt-12 flex flex-col gap-8">
          {children}
        </Reveal>
      </div>
    </section>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-[#101727]">{title}</h2>
      {/*
       * [&_p] rather than plain text-pretty on the wrapper.
       *
       * text-wrap inherits, but globals.css sets `p { text-wrap: pretty }` as
       * an element rule -- and an element rule on the child beats a value
       * inherited from the parent, so balance on this div never reached the
       * paragraphs inside it. These run three to five lines, which is the
       * length balance is for; several were ending at 8-16% of the measure.
       */}
      <div className="mt-3 flex flex-col gap-3 leading-relaxed text-[#68717D] [&_p]:text-pretty">{children}</div>
    </div>
  );
}
