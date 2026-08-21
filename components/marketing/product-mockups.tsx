import type { CSSProperties } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, Target } from "lucide-react";

const DEBRIEF_ROWS = [
  { icon: CheckCircle2, label: "4 things went well", tint: "#dcfce7", ink: "#16803d" },
  { icon: Target, label: "2 areas to improve", tint: "#fef3c7", ink: "#b45309" },
  { icon: ClipboardList, label: "3 action items", tint: "#f1f2f4", ink: "#56636f" },
  { icon: ArrowRight, label: "Next lesson ready", tint: "#fde3d0", ink: "#b8540f" },
];

/**
 * The hero's "here's what came out of the conversation" card -- deliberately
 * NOT the FlightScore gauge. Cementing a single "82 / Good Flight" number
 * into the hero, before the FlightScore section gets to explain what it
 * actually represents (training progress, not a checkride-style grade), sets
 * the wrong first impression. This card shows the debrief outputs instead;
 * the gauge gets its own moment further down the page.
 */
export function DebriefSummaryMockupCard({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={style}>
      <div
        className="rounded-t-[22px] border border-black/[0.06] bg-white p-6"
        style={{ boxShadow: "0 1px 2px rgba(16,23,39,0.04), 0 16px 40px -12px rgba(16,23,39,0.22)" }}
      >
        <p className="text-balance text-[11px] font-bold uppercase tracking-[0.14em] text-brand">Flight Debrief</p>

        <p className="text-balance font-display mt-2 text-[21px] font-bold tracking-tight text-[#101727]">KSBD &rarr; KFUL</p>
        <p className="text-balance mt-0.5 text-[13.5px] text-[#8c97a2]">May 12, 2026 &middot; 1.3 Hobbs</p>

        <ul className="mt-5 flex flex-col gap-2.5">
          {DEBRIEF_ROWS.map((row) => (
            <li key={row.label} className="flex items-center gap-2.5">
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: row.tint }}
              >
                <row.icon className="size-4" style={{ color: row.ink }} strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[#101727]">{row.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const FLIGHT_HISTORY_ROWS = [
  { pair: "KSBD → KFUL", date: "May 12, 2026", score: 82, tint: "#dcfce7", ink: "#16803d" },
  { pair: "KSDL → KPHX", date: "May 5, 2026", score: 76, tint: "#dcfce7", ink: "#16803d" },
  { pair: "KSDL → KSDL", date: "Apr 28, 2026", score: 71, tint: "#fef3c7", ink: "#b45309" },
];

export function FlightHistoryMockupCard({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div
        className="rounded-[22px] border border-black/[0.06] bg-white p-5"
        style={{ boxShadow: "0 1px 2px rgba(16,23,39,0.04), 0 16px 40px -12px rgba(16,23,39,0.22)" }}
      >
        <p className="text-balance font-display text-[13px] font-bold uppercase tracking-wide text-[#101727]">Flight History</p>
        <ul className="mt-2 flex flex-col divide-y divide-black/[0.05]">
          {FLIGHT_HISTORY_ROWS.map((row) => (
            <li key={row.pair} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-balance text-[13.5px] font-semibold text-[#101727]">{row.pair}</p>
                <p className="text-balance text-[11.5px] text-[#8c97a2]">{row.date}</p>
              </div>
              <span
                className="font-display flex size-8 items-center justify-center rounded-full text-[13px] font-bold"
                style={{ backgroundColor: row.tint, color: row.ink }}
              >
                {row.score}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
