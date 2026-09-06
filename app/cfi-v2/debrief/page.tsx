import { ClipboardList } from "lucide-react";
import { getViewer } from "@/lib/viewer";
import { PageTitle, Screen } from "@/components/student/ui";

export const dynamic = "force-dynamic";

/**
 * Placeholder only -- Milestone CFI-V2-1 scope is Today/Students/Student
 * Detail/navigation. The real Debrief queue (unifying V1's Debrief In
 * Progress + Training into one roster-wide priority list, per the approved
 * architecture) is explicitly deferred to the next milestone so this one
 * stays reviewable on its own. Rendered honestly as "not built yet," not
 * disguised as a finished screen, so nav feel can still be judged without
 * anyone mistaking this for real content.
 */
export default async function CfiV2DebriefPage() {
  await getViewer();
  return (
    <Screen>
      <PageTitle kicker="Coming in the next milestone">Debrief</PageTitle>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hairline px-6 py-14 text-center">
        <ClipboardList className="size-8 text-foreground-faint" aria-hidden />
        <p className="text-[15px] text-foreground-soft">
          The roster-wide debrief queue isn&rsquo;t built yet in this milestone -- Today&rsquo;s &ldquo;Needs you now&rdquo;
          already surfaces anything actively in progress.
        </p>
      </div>
    </Screen>
  );
}
