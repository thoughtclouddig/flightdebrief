/**
 * Train's page title + orientation copy.
 *
 * Two different jobs, so two different weights: contextLine is the actual
 * claim ("here's where you left off, and who with") and reads close to the
 * title's own authority -- semibold, full ink, not muted gray. subline is
 * the secondary mechanic (how the deck below behaves), and stays quiet on
 * purpose so it doesn't compete with the line that matters more.
 */
export function DesignTrainHeader({ contextLine, subline }: { contextLine: string; subline?: string }) {
  return (
    <div className="flex flex-col gap-3 pb-2 pt-2 md:pb-3 xl:pb-4">
      <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--dm-text)] xl:text-[40px]">Train</h1>
      <div className="flex flex-col gap-1.5">
        <p className="max-w-[24ch] text-pretty text-[19px] font-semibold leading-snug text-[var(--dm-text)] md:max-w-[38ch] md:text-[22px]">
          {contextLine}
        </p>
        {subline ? (
          <p className="max-w-[40ch] text-pretty text-[14px] leading-relaxed text-[var(--dm-text-faint)] md:max-w-[46ch] md:text-[15px]">
            {subline}
          </p>
        ) : null}
      </div>
    </div>
  );
}
