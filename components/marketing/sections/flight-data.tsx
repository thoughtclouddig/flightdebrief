import { FlightCard } from "@/components/flight-card";
import { FlightMap } from "@/components/flight-map";
import { Reveal } from "@/components/marketing/reveal";
import { DEMO_FLIGHT } from "@/lib/marketing/demo-data";

export function FlightData() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 sm:py-28">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Flight data</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-5xl">
            Your flight tells part of the story.
          </h2>
          <p className="mt-5 max-w-md text-pretty text-[17px] leading-relaxed text-foreground-soft">
            Flight data provides context. The debrief explains what actually happened.
          </p>
        </Reveal>

        <Reveal delay={150} className="flex flex-col gap-3">
          <FlightMap track={DEMO_FLIGHT.track} />
          <FlightCard flight={DEMO_FLIGHT} href="/app" />
        </Reveal>
      </div>
    </section>
  );
}
