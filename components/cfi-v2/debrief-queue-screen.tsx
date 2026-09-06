import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { PageTitle, Screen, Section } from "@/components/student/ui";
import type { CfiV2DebriefQueue } from "@/lib/cfi-v2/debrief-queue";

/**
 * CFI V2's Debrief destination -- one roster-wide priority queue, replacing
 * V1's split between Today's "Debrief In Progress" and the standalone
 * Training page. See lib/cfi-v2/debrief-queue.ts for the grouping logic.
 */
export function CfiV2DebriefQueueScreen({ queue }: { queue: CfiV2DebriefQueue }) {
  const isEmpty = queue.needsAction.length === 0 && queue.waiting.length === 0 && queue.recentlyCompleted.length === 0;

  return (
    <Screen>
      <PageTitle>Debrief</PageTitle>

      {queue.needsAction.length > 0 ? (
        <Section title="Needs your action">
          <div className="flex flex-col divide-y divide-hairline">
            {queue.needsAction.map((item) => (
              <QueueRow key={item.studentId} item={item} />
            ))}
          </div>
        </Section>
      ) : null}

      {queue.waiting.length > 0 ? (
        <Section title="Waiting">
          <div className="flex flex-col divide-y divide-hairline">
            {queue.waiting.map((item) => (
              <QueueRow key={item.studentId} item={item} showAction={false} />
            ))}
          </div>
        </Section>
      ) : null}

      {queue.recentlyCompleted.length > 0 ? (
        <details className="group overflow-hidden rounded-2xl border border-hairline bg-surface px-5 py-4">
          <summary className="cursor-pointer text-[14px] font-bold uppercase tracking-[0.08em] text-foreground-soft">
            Recently completed ({queue.recentlyCompleted.length})
          </summary>
          <div className="mt-3 flex flex-col divide-y divide-hairline">
            {queue.recentlyCompleted.map((c, i) => (
              <Link
                key={`${c.studentId}-${i}`}
                href={c.resultsHref}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-[15px] text-foreground">{c.studentName}</span>
                <span className="text-[13px] text-foreground-faint">{c.flightContext}</span>
              </Link>
            ))}
          </div>
        </details>
      ) : null}

      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-foreground-faint">
          <ClipboardList className="size-8" aria-hidden />
          <p className="text-[15px]">Nothing in the debrief pipeline right now.</p>
        </div>
      ) : null}
    </Screen>
  );
}

function QueueRow({
  item,
  showAction = true,
}: {
  item: CfiV2DebriefQueue["needsAction"][number];
  showAction?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-semibold text-foreground">{item.studentName}</span>
        {showAction ? (
          <Link href={item.actionHref} className="shrink-0 text-[14px] font-semibold text-brand">
            {item.actionLabel} &rarr;
          </Link>
        ) : (
          <Link href={item.actionHref} className="shrink-0 text-[14px] font-medium text-foreground-faint">
            View
          </Link>
        )}
      </div>
      <p className="text-[14px] text-foreground-soft">
        {item.reason} · {item.flightContext}
      </p>
      {item.otherInstructorName ? (
        <p className="text-[13px] text-foreground-faint">Flown with {item.otherInstructorName}</p>
      ) : null}
    </div>
  );
}
