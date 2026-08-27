import { RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DiscrepancyBadge } from "@/components/debrief/discrepancy-badge";
import { cn } from "@/lib/utils";
import type { DebriefCard } from "@/lib/types";

const CATEGORY_LABELS: Record<DebriefCard["category"], string> = {
  OBJECTIVE: "Flight Objective",
  STRENGTHS: "What Went Well",
  IMPROVEMENT: "Areas to Improve",
  KEY_TASK: "Key Task",
  RISK_ADM: "Risk Management",
  REFLECTION: "Reflection",
  NEXT_FLIGHT: "Next Flight",
  DISCREPANCY: "Worth Comparing Notes On",
  CUSTOM: "Discussion",
};

export function QuestionCardStack({
  card,
  position,
  total,
  taskLabels = [],
  onToggleRevisit,
  revisitDisabled,
}: {
  card: DebriefCard;
  position: number;
  total: number;
  /** What the CFI picked as flown this flight -- shown only on the opening objective card, as a memory jog for what the debrief is actually about. */
  taskLabels?: string[];
  /** Omitted on read-only renders; when present the card owns the revisit toggle (it's card state, not navigation -- see CardControls). */
  onToggleRevisit?: () => void;
  revisitDisabled?: boolean;
}) {
  const showTaskRecap = card.category === "OBJECTIVE" && taskLabels.length > 0;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Badge variant="brand">{CATEGORY_LABELS[card.category]}</Badge>
          <span className="text-xs font-medium text-foreground-soft">
            {position} of {total}
          </span>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground">{card.title}</h2>
          <p className="mt-2 text-foreground-soft">{card.primaryPrompt}</p>
        </div>

        {showTaskRecap ? (
          <div className="rounded-lg bg-surface-sunken px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">You logged this flight as</p>
            <p className="mt-1 text-sm text-foreground-soft">{taskLabels.join(" · ")}</p>
          </div>
        ) : null}

        {card.followUpPrompts.length > 0 ? (
          <ul className="flex flex-col gap-1.5 text-sm text-foreground-soft">
            {card.followUpPrompts.map((prompt) => (
              <li key={prompt} className="flex items-start gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground-faint" />
                <span className="min-w-0 flex-1 text-balance">{prompt}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {card.discrepancyStatus !== "none" ? (
          <div>
            <DiscrepancyBadge status={card.discrepancyStatus} />
          </div>
        ) : null}

        {onToggleRevisit ? (
          <button
            type="button"
            onClick={onToggleRevisit}
            disabled={revisitDisabled}
            aria-pressed={card.flaggedForFollowUp}
            className={cn(
              "flex items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
              card.flaggedForFollowUp
                ? "border-brand bg-brand/10 text-brand-dark dark:text-brand-light"
                : "border-hairline text-foreground-soft hover:border-brand hover:text-brand",
            )}
          >
            <RotateCcw className="size-3.5" />
            {card.flaggedForFollowUp ? "Will revisit next lesson" : "Revisit next lesson"}
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}
