import type { ReactNode } from "react";

/**
 * Train's one page-level orientation line -- "starting where your last
 * flight ended" -- sitting between the page title and the plan below it.
 *
 * It used to live inside the Start Here panel itself, but a panel makes one
 * claim (the recommendation), and this sentence is about the plan as a
 * whole, not that one card -- worth a line of its own rather than crowding
 * the panel's own eyebrow/headline/evidence stack. Constrained to a real
 * reading measure at md+ so it doesn't stretch edge-to-edge once the shell
 * is wide enough to let it.
 */
export function TrainingContextHeader({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-pretty px-1.5 text-[15px] leading-relaxed text-foreground-soft md:max-w-[52ch] md:text-[17px]">{children}</p>;
}
