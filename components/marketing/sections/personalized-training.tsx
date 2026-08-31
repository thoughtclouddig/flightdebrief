import { Reveal } from "@/components/marketing/reveal";
import { SectionHead } from "@/components/marketing/section-head";

/**
 * Explain -> check -> rehearse, shown against one real weak area.
 *
 * Replaces the old "study" beat, which ended by pointing students at FAA
 * resources. Handing someone the Airplane Flying Handbook and a chapter
 * number is not training -- it's the same "work on landings" problem with a
 * citation attached. The FAA material is the grounding layer here, named at
 * the bottom, not the experience.
 */
export function PersonalizedTraining() {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Personalized training"
          headline={
            <>
              Don&rsquo;t just read about the problem. <span className="text-brand">Fix it.</span>
            </>
          }
          body="AfterFlight turns the weak areas from your actual flight into short training sessions, flight-specific questions, and cues you can carry into the cockpit next time."
        />

        <Reveal delay={120} className="mx-auto mt-14 max-w-[760px]">
          <div className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-[#f4f5f6]">
            <div className="border-b border-black/[0.06] bg-white px-7 py-6 sm:px-9">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Crosswind landings</p>
              <p className="font-display mt-1 text-2xl font-bold text-[#101727] sm:text-3xl">
                From one line in your debrief to something you can practice.
              </p>
            </div>

            <div className="flex flex-col gap-7 px-7 py-8 sm:px-9 sm:py-10">
              <Row label="Instructor feedback">
                <blockquote className="border-l-2 border-brand/60 pl-4 text-pretty text-lg italic leading-relaxed text-[#4b545d]">
                  &ldquo;Centerline control improved, but correction is still being relaxed through touchdown.&rdquo;
                </blockquote>
              </Row>

              <Row label="Vector explains">
                <p className="text-pretty text-lg leading-relaxed text-[#101727]">
                  Why control input needs to <em>increase</em> as the airplane slows — the same aileron does less
                  work at 55 knots than it did at 70.
                </p>
              </Row>

              <Row label="Quick check">
                <p className="text-lg text-[#101727]">3 questions about your flight, not a written-test bank.</p>
              </Row>

              <Row label="Next-flight cue">
                <p className="rounded-2xl bg-white px-5 py-4 text-lg font-medium leading-snug text-[#101727]">
                  &ldquo;Aileron progressively into the wind through touchdown.&rdquo;
                </p>
              </Row>

              {/* Sources named, and deliberately last. Grounding, not the product. */}
              <p className="border-t border-black/[0.07] pt-6 text-sm text-[#68717D]">
                Grounded in the FAA Airplane Flying Handbook and the Airman Certification Standards.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#68717D]">{label}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
