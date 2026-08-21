import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";
import { DEMO_HANDOFF } from "@/lib/marketing/demo-data";

export function CfiHandoff() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 sm:py-28">
      <Reveal className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Continuity</p>
        <h2 className="font-display mt-3 text-balance text-4xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-5xl">
          Different instructor. Same training history.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-pretty text-[17px] leading-relaxed text-foreground-soft">
          A student&rsquo;s training record shouldn&rsquo;t disappear when the instructor changes.
        </p>
      </Reveal>

      <Reveal delay={150}>
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>CFI Handoff — Andy</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-balance text-xs font-semibold uppercase tracking-wide text-foreground-faint">Recent Training</p>
              <p className="text-pretty mt-1 text-foreground-soft">{DEMO_HANDOFF.recentTraining.join(", ")}</p>
            </div>
            <div>
              <p className="text-balance text-xs font-semibold uppercase tracking-wide text-foreground-faint">Current Focus</p>
              <p className="text-pretty mt-1 text-foreground-soft">{DEMO_HANDOFF.currentFocus.join(", ")}</p>
            </div>
            <div className="sm:col-span-2 rounded-md bg-brand/5 p-3">
              <p className="text-balance text-xs font-semibold uppercase tracking-wide text-brand">Last CFI Note</p>
              <p className="text-pretty mt-1 text-foreground">{DEMO_HANDOFF.lastNote}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-balance text-xs font-semibold uppercase tracking-wide text-foreground-faint">Planned Next Lesson</p>
              <p className="text-pretty mt-1 text-foreground-soft">{DEMO_HANDOFF.plannedNextLesson}</p>
            </div>
          </CardContent>
        </Card>
      </Reveal>
    </section>
  );
}
