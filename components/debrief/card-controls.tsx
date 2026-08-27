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
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack || disabled}
          className="min-w-[104px] flex-1 basis-[calc(50%-0.25rem)] sm:basis-0"
        >
          <ChevronLeft className="size-4" /> Back
        </Button>
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={disabled}
          className="min-w-[104px] flex-1 basis-[calc(50%-0.25rem)] sm:basis-0"
        >
          <SkipForward className="size-4" /> Skip
        </Button>
        <Button
          variant={flagged ? "default" : "outline"}
          onClick={onToggleFlag}
          disabled={disabled}
          className="min-w-[104px] flex-1 basis-full sm:basis-0"
        >
          <Flag className="size-4" /> {flagged ? "Flagged for next time" : "Flag for next time"}
        </Button>
      </div>
      <div className="flex gap-2">
        {!isLast ? (
          <Button onClick={onNext} disabled={disabled} className="flex-1">
            Next <ChevronRight className="size-4" />
          </Button>
        ) : null}
        <Button variant={isLast ? "default" : "outline"} onClick={onEnd} disabled={disabled} className="flex-1">
          <Square className="size-4" /> End Debrief
        </Button>
      </div>
      <p className="text-center text-xs text-foreground-faint">
        Skip if there&rsquo;s nothing to say here -- Next marks it as discussed. Flag brings this topic back sooner on a future flight.
      </p>
    </div>
  );
}
