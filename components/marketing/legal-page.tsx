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
      <div className="mt-3 flex flex-col gap-3 text-pretty leading-relaxed text-[#68717D]">{children}</div>
    </div>
  );
}
