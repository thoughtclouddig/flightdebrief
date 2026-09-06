import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";

export interface CfiV2Profile {
  name: string;
  email: string;
  avatarUrl: string | null;
  organizationName: string;
  /** Roster size, not a performance metric -- same fact canonical /cfi/profile already shows. */
  activeStudentCount: number;
}

export async function computeCfiV2Profile(repo: Repository, viewer: Viewer): Promise<CfiV2Profile> {
  const links = await repo.listStudentLinksForInstructor(viewer.user.id, viewer.organization.id);
  return {
    name: viewer.user.name,
    email: viewer.user.email,
    avatarUrl: viewer.user.avatarUrl,
    organizationName: viewer.organization.name,
    activeStudentCount: links.filter((l) => l.status === "active").length,
  };
}
