import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHead } from "@/components/marketing/section-head";

/**
 * The CFI beat.
 *
 * The one thing this section has to establish is that AfterFlight is LESS
 * work, not more. An instructor who reads "grade each task" or "review the
 * summary before it goes out" has already decided this is another admin
 * system. Four steps, ninety seconds, nothing to fill in.
 */
const STEPS = ["Tap Record", "Talk for about 90 seconds", "Tap Stop", "Done"] as const;

export function ForCfis() {
  return (
    <section id="for-cfis" className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="For instructors"
          headline={
            <>
              You teach. AfterFlight handles the <span className="text-brand">follow-through.</span>
            </>
          }
          body="Give your normal debrief. AfterFlight turns it into the student's recap, training focus, Vector review and next-flight prep — without another page of notes."
        />

        <Reveal delay={120} className="mx-auto mt-14 max-w-[860px]">
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li
                key={step}
                className="flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-[#f4f5f6] px-5 py-5 lg:flex-col lg:items-start lg:gap-3"
              >
                <span className="font-display text-2xl font-extrabold tabular-nums text-brand">{i + 1}</span>
                <span className="text-balance text-lg font-medium leading-snug text-[#101727]">{step}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={220} className="mt-10 text-center">
          <Link
            href="/instructors"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-brand hover:underline"
          >
            See how it works for instructors
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
