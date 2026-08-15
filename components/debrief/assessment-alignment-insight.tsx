import { Card, CardContent } from "@/components/ui/card";

/** Framed as training-awareness, never as a score to feel bad about -- see the debrief-redesign plan. */
export function AssessmentAlignmentInsight({ agreedCount, totalCount }: { agreedCount: number; totalCount: number }) {
  if (totalCount === 0) return null;
  const pct = Math.round((agreedCount / totalCount) * 100);
  return (
    <Card>
      <CardContent className="text-sm text-foreground-soft">
        You and your instructor agreed on <span className="font-semibold text-foreground">{pct}%</span> of today&rsquo;s
        tasks ({agreedCount} of {totalCount}). The rest are exactly what the debrief is for.
      </CardContent>
    </Card>
  );
}
