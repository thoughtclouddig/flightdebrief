import { ArrowRight } from "lucide-react";
import { Panel, PanelEyebrow, PanelHeadline, PrimaryButton } from "@/components/student/ui";

/**
 * "Your part is done, hand the phone over" -- shared between the fixture
 * demo (app/prototype/vector/debrief/new's Handoff stage) and the real
 * same-phone guest-instructor handoff (self-assessment/page.tsx's post-
 * submit screen). The copy genuinely differs by caller: production names
 * the real student ("Mia's answers are hidden...") and links to a real next
 * page, where the prototype's continue action is just a local stage flip
 * with no one to actually name. The visual treatment -- the panel, the
 * eyebrow, the headline, the CTA -- is the one canonical thing.
 */
export function HandoffScreen({
  headline,
  body,
  actionLabel,
  actionHref,
  onAction,
}: {
  headline: string;
  body: string;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <>
      <Panel className="flex flex-col gap-4 py-10 text-center">
        <PanelEyebrow icon={<ArrowRight className="size-3.5" aria-hidden />}>Your part is done</PanelEyebrow>
        <PanelHeadline>{headline}</PanelHeadline>
        <p className="text-[15px] leading-relaxed text-panel-foreground-soft">{body}</p>
      </Panel>
      <PrimaryButton href={actionHref} onClick={onAction}>
        {actionLabel}
      </PrimaryButton>
    </>
  );
}
