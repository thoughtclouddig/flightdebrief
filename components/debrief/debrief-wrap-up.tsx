"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScheduleLessonForm } from "@/components/schedule-lesson-form";
import type { Aircraft } from "@/lib/types";

/**
 * CFI-only close-out for the /review page: "Finish Debrief" flips the
 * flight's status to complete (see app/api/flights/[id]/debrief/finish),
 * then rolls straight into scheduling the next lesson (or skipping it) --
 * the two steps the user's own walkthrough asked for back to back. Not
 * rendered at all for the student viewer; they just see the same review
 * content with no action to take here.
 */
export function DebriefWrapUp({
  flightId,
  studentId,
  aircraft,
  scheduleCaption,
}: {
  flightId: string;
  studentId: string;
  aircraft: Aircraft[];
  /** Shown above the schedule fields -- e.g. the FSP-sync disclosure for school orgs. */
  scheduleCaption?: string;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"review" | "finishing" | "schedule">("review");
  const [error, setError] = useState<string | null>(null);

  async function handleFinish() {
    setStage("finishing");
    setError(null);
    try {
      const res = await fetch(`/api/flights/${flightId}/debrief/finish`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to finish the debrief. Please try again.");
      setStage("schedule");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish the debrief. Please try again.");
      setStage("review");
    }
  }

  function goToResults() {
    router.push(`/flights/${flightId}/debrief/results`);
  }

  if (stage === "schedule") {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckCircle2 className="size-4 text-good" /> Debrief finished. Schedule the next lesson?
        </p>
        <ScheduleLessonForm
          studentId={studentId}
          aircraft={aircraft}
          autoOpen
          caption={scheduleCaption}
          onScheduled={goToResults}
          onSkip={goToResults}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button onClick={handleFinish} disabled={stage === "finishing"} size="lg">
        {stage === "finishing" ? <Loader2 className="size-4 animate-spin" /> : "Finish Debrief"}
      </Button>
    </div>
  );
}
