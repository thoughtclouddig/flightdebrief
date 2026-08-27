import { ChevronLeft, ChevronRight, Plus, SkipForward, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Navigation for the guided debrief card stack, ordered by how often a CFI
 * actually reaches for each control rather than as one flat cluster:
 *   1. Next -- the 90% action, full-width primary.
 *   2. Back / Skip -- occasional, smaller and side by side.
 *   3. Add Topic -- rare, a quiet text button.
 *   4. End Debrief -- terminal, visually separated so it's never a mis-tap
 *      next to Next (and only becomes primary on the last card).
 * The "revisit next lesson" toggle deliberately lives ON the card instead of
 * here -- it marks that card's state, it doesn't move you anywhere.
 */
export function CardControls({
  canGoBack,
  isLast,
  onBack,
  onSkip,
  onNext,
  onAddTopic,
  onEnd,
  disabled,
}: {
  canGoBack: boolean;
  isLast: boolean;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
  onAddTopic: () => void;
  onEnd: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {!isLast ? (
        <Button size="lg" onClick={onNext} disabled={disabled} className="h-14 w-full text-base font-semibold">
          Next <ChevronRight className="size-4" />
        </Button>
      ) : null}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onBack} disabled={!canGoBack || disabled} className="flex-1">
          <ChevronLeft className="size-4" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={onSkip} disabled={disabled || isLast} className="flex-1">
          <SkipForward className="size-4" /> Skip
        </Button>
      </div>

      <Button variant="ghost" size="sm" onClick={onAddTopic} disabled={disabled} className="w-full text-foreground-soft">
        <Plus className="size-4" /> Add a topic
      </Button>

      <div className="border-t border-hairline pt-3">
        <Button
          variant={isLast ? "default" : "outline"}
          size={isLast ? "lg" : "default"}
          onClick={onEnd}
          disabled={disabled}
          className={isLast ? "h-14 w-full text-base font-semibold" : "w-full"}
        >
          <Square className="size-4" /> End Debrief
        </Button>
        <p className="mt-2 text-center text-xs text-foreground-faint">
          Skip when there&rsquo;s nothing to say on a card. Next marks it as discussed.
        </p>
      </div>
    </div>
  );
}
