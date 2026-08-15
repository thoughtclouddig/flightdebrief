import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DiscrepancyBadge } from "@/components/debrief/discrepancy-badge";
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

export function QuestionCardStack({ card, position, total }: { card: DebriefCard; position: number; total: number }) {
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

        {card.followUpPrompts.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm text-foreground-soft">
            {card.followUpPrompts.map((prompt) => (
              <li key={prompt}>&bull; {prompt}</li>
            ))}
          </ul>
        ) : null}

        {card.discrepancyStatus !== "none" ? (
          <div>
            <DiscrepancyBadge status={card.discrepancyStatus} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
