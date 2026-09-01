import { CfiStudentCard } from "@/components/cfi-student-card";
import { Reveal } from "@/components/marketing/reveal";
import { DEMO_CFI_STUDENTS } from "@/lib/marketing/demo-data";

export function Cfis() {
  return (
    <section className="bg-[#101727] px-6 py-24 sm:py-28">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal>
          <p className="text-balance text-xs font-bold uppercase tracking-[0.16em] text-brand">For CFIs</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-extrabold uppercase leading-[1.02] text-white sm:text-5xl">
            Know where you left off.
          </h2>
          <p className="mt-5 max-w-md text-balance text-[17px] leading-relaxed text-white/70">
            Walk onto the ramp knowing what happened last time, what still needs work, and what today&rsquo;s lesson
            should focus on.
          </p>
        </Reveal>

        <Reveal delay={150} className="flex flex-col gap-4">
          {DEMO_CFI_STUDENTS.map((student, i) => (
            <Reveal key={student.studentName} delay={150 + i * 120}>
              <CfiStudentCard
                studentName={student.studentName}
                timeLabel={student.timeLabel}
                tailNumber={student.tailNumber}
                aircraftType={student.aircraftType}
                focusAreas={student.focusAreas}
                openBriefHref="/app"
                profileHref="/app"
              />
            </Reveal>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
