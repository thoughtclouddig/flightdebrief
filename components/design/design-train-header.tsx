/** Train's page title + one page-level orientation line -- see components/student/training-context-header.tsx for the production equivalent this proposes replacing. */
export function DesignTrainHeader({ contextLine, subline }: { contextLine: string; subline?: string }) {
  return (
    <div className="flex flex-col gap-2 pb-2 pt-2 md:pb-3 xl:pb-4">
      <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--dm-text)] xl:text-[40px]">Train</h1>
      <p className="max-w-[23ch] text-pretty text-[15px] leading-relaxed text-[var(--dm-text-soft)] md:max-w-[52ch] md:text-[17px]">{contextLine}</p>
      {subline ? (
        <p className="max-w-[36ch] text-pretty text-[14px] leading-relaxed text-[var(--dm-text-faint)]">{subline}</p>
      ) : null}
    </div>
  );
}
