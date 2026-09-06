import { CheckCircle2 } from "lucide-react";
import { Panel, PanelEyebrow, PanelHeadline } from "@/components/student/ui";

/**
 * REAL STATE NOT MODELED IN V2 #1, now modeled: both assessments are
 * submitted by a real, non-guest-handoff CFI account, so the student's own
 * device has nothing left to do until the CFI starts the recording from
 * their own separate session. Same shape as HandoffScreen (Panel/eyebrow/
 * headline/body, no CTA) -- state-attention tint on the eyebrow instead of
 * brand, since this is "someone else's turn" rather than "your part is
 * done." The caller renders AutoRefresh alongside this, same as every other
 * async wait in this flow.
 */
export function WaitingOnCfiScreen({
  flightContext,
  instructorFirstName,
}: {
  flightContext: string;
  instructorFirstName: string | null;
}) {
  const cfi = instructorFirstName ?? "your instructor";
  return (
    <Panel className="flex flex-col gap-4 py-10 text-center">
      <PanelEyebrow icon={<CheckCircle2 className="size-3.5" aria-hidden />} className="text-state-attention">
        {cfi}&rsquo;s turn
      </PanelEyebrow>
      <PanelHeadline>Both assessments are in</PanelHeadline>
      <p className="text-[15px] leading-relaxed text-panel-foreground-soft">
        {flightContext}
      </p>
      <p className="text-[15px] leading-relaxed text-panel-foreground-soft">
        There&rsquo;s nothing left for you to do &mdash; {cfi} will start the debrief from their own device. This
        page updates the moment they do.
      </p>
    </Panel>
  );
}
