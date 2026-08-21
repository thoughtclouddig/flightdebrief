import type { ReactNode } from "react";

export function BrandDeviceFrame({ action }: { action: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-[#101727] px-6 pb-6 pt-8 text-center sm:pb-8 sm:pt-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />
      <div className="relative mx-auto max-w-4xl">
        <div className="font-display flex flex-wrap items-baseline justify-center gap-x-2 gap-y-3 text-[clamp(1.75rem,5.5vw,3.25rem)] font-extrabold uppercase leading-[1.1] tracking-wide text-white sm:gap-y-2 lg:flex-nowrap">
          <span className="shrink-0 whitespace-nowrap">Fly. Debrief.</span>
          <span className="inline-flex shrink-0 items-baseline gap-x-2 whitespace-nowrap">
            {action}
            <span className="shrink-0 whitespace-nowrap">Repeat.</span>
          </span>
        </div>
      </div>
    </section>
  );
}