import { ClipboardCheck } from "lucide-react";
import { ChecklistCard } from "@/components/checklist-card";
import { NextLessonFocusCard } from "@/components/next-lesson-focus-card";
import { Reveal } from "@/components/marketing/reveal";
import { DEMO_BEFORE_YOU_FLY, DEMO_CONVERSATION, DEMO_NEXT_LESSON_FOCUS } from "@/lib/marketing/demo-data";

const HIGHLIGHTS = ["fast", "configured earlier", "tower calls"];

function highlight(line: string) {
  const pattern = new RegExp(`(${HIGHLIGHTS.join("|")})`, "gi");
  const parts = line.split(pattern);
  return parts.map((part, i) =>
    HIGHLIGHTS.some((h) => h.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="rounded bg-brand/15 px-1 text-foreground">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function Transformation() {
  return (
    <section className="border-y border-hairline bg-surface-sunken px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">The transformation</p>
          <h2 className="font-display mt-3 max-w-2xl text-balance text-4xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-5xl">
            Today&rsquo;s debrief becomes tomorrow&rsquo;s briefing.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
          <Reveal delay={100} className="flex flex-col justify-center gap-5">
            {DEMO_CONVERSATION.map((line, i) => (
              <div key={i} className={line.speaker === "CFI" ? "" : "pl-6"}>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">{line.speaker}</p>
                <p className="mt-1 text-[17px] leading-relaxed text-foreground">{highlight(line.line)}</p>
              </div>
            ))}
          </Reveal>

          <Reveal delay={250} className="flex flex-col gap-4">
            <NextLessonFocusCard title="Next Flight Brief — Focus" items={DEMO_NEXT_LESSON_FOCUS} />
            <ChecklistCard icon={ClipboardCheck} title="Before You Fly" items={DEMO_BEFORE_YOU_FLY} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
