import { ChevronLeft, ChevronRight, Flag, SkipForward, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CardControls({
  canGoBack,
  isLast,
  flagged,
  onBack,
  onSkip,
  onNext,
  onToggleFlag,
  onEnd,
  disabled,
}: {
  canGoBack: boolean;
  isLast: boolean;
  flagged: boolean;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
  onToggleFlag: () => void;
  onEnd: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} disabled={!canGoBack || disabled} className="flex-1">
          <ChevronLeft className="size-4" /> Back
        </Button>
        <Button variant="outline" onClick={onSkip} disabled={disabled} className="flex-1">
          <SkipForward className="size-4" /> Skip
        </Button>
        <Button
          variant={flagged ? "default" : "outline"}
          onClick={onToggleFlag}
          disabled={disabled}
          className="flex-1"
        >
          <Flag className="size-4" /> {flagged ? "Flagged" : "Follow up"}
        </Button>
      </div>
      <div className="flex gap-2">
        {!isLast ? (
          <Button onClick={onNext} disabled={disabled} className="flex-1">
            Next <ChevronRight className="size-4" />
          </Button>
        ) : null}
        <Button variant="destructive" onClick={onEnd} disabled={disabled} className="flex-1">
          <Square className="size-4" /> End Debrief
        </Button>
      </div>
    </div>
  );
}
