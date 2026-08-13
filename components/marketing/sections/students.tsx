import { ArrowUp, Clock3, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";
import { DEMO_STUDENT_PROGRESS } from "@/lib/marketing/demo-data";

export function Students() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 sm:py-28">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">For students</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-5xl">
            See your training take shape.
          </h2>
          <p className="mt-5 max-w-md text-pretty text-[17px] leading-relaxed text-foreground-soft">
            Every flight becomes part of one continuous record — not another conversation you have to remember on
            your own.
          </p>
        </Reveal>

        <Reveal delay={150} className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ArrowUp className="size-4 text-good" />
                Improving
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {DEMO_STUDENT_PROGRESS.improving.map((item) => (
                <div key={item} className="flex items-center justify-between text-foreground">
                  <span>{item}</span>
                  <ArrowUp className="size-3.5 text-good" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="size-4 text-amber" />
                Working On
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-foreground">
              {DEMO_STUDENT_PROGRESS.workingOn.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock3 className="size-4 text-brand" />
                Next Up
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-foreground">
              {DEMO_STUDENT_PROGRESS.nextUp.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
