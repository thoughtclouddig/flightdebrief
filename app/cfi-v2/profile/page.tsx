import { User } from "lucide-react";
import { getViewer } from "@/lib/viewer";
import { PageTitle, Screen } from "@/components/student/ui";

export const dynamic = "force-dynamic";

/** Placeholder only -- see app/cfi-v2/debrief/page.tsx's doc comment for why. */
export default async function CfiV2ProfilePage() {
  const viewer = await getViewer();
  return (
    <Screen>
      <PageTitle kicker="Coming in the next milestone">Profile</PageTitle>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hairline px-6 py-14 text-center">
        <User className="size-8 text-foreground-faint" aria-hidden />
        <p className="text-[15px] text-foreground-soft">{viewer.user.name}</p>
        <p className="text-[14px] text-foreground-faint">Not built yet in this milestone.</p>
      </div>
    </Screen>
  );
}
