import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeCfiV2Profile } from "@/lib/cfi-v2/profile";
import { CfiV2ProfileScreen } from "@/components/cfi-v2/profile-screen";

export const dynamic = "force-dynamic";

export default async function CfiV2ProfilePage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const profile = await computeCfiV2Profile(repo, viewer);
  return <CfiV2ProfileScreen profile={profile} />;
}
