import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";

export interface ProductionProfileProps {
  certificate: string | undefined;
  fullName: string;
  flightsHref: string;
  flightsCount: number;
  debriefsHref: string;
  debriefsCount: string;
  instructorHref: string;
  instructorName: string;
  guideHref: string;
  supportHref: string;
  dataHandlingHref: string;
  signOutHref: string;
}

/**
 * Real Profile -- feeds components/student/profile/profile-screen.tsx (the
 * approved V2 presentation) from the signed-in viewer's own data, mirroring
 * app/(product)/profile/page.tsx's prior inline logic (same instructor/
 * membership lookups, same debrief count).
 *
 * instructorHref points at "/profile" itself (a harmless self-link) rather
 * than a real instructor-detail page -- there isn't one, and the approved
 * fixture reference (app/v2/profile/page.tsx) already made this exact choice
 * for the identical reason, so this follows it rather than inventing a
 * different answer for the same non-existent destination.
 *
 * Avatar upload, email change, voice preference and leave-organization are
 * real, working account capabilities ProfileScreen has no field for at all
 * (it isn't just a href gap the way instructorHref is) -- see this adapter's
 * caller (app/(product)/profile/page.tsx) for how each is preserved without
 * modifying the shared component's fixed three-row Training section.
 */
export async function buildProductionProfileProps(
  repo: Repository,
  viewer: Viewer,
): Promise<ProductionProfileProps> {
  const [links, flights, memberships] = await Promise.all([
    repo.listInstructorLinksForStudent(viewer.user.id),
    repo.listFlights({ studentId: viewer.user.id }),
    repo.listMembershipsForUser(viewer.user.id),
  ]);
  const activeLinks = links.filter((l) => l.status === "active");
  const instructors = (await Promise.all(activeLinks.map((l) => repo.getInstructor(l.instructorId)))).filter(
    (i) => i !== null,
  );
  const certificateType = memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;
  const debriefedCount = flights.filter((f) => f.debriefStatus === "complete").length;

  return {
    certificate: certificateType ?? undefined,
    fullName: viewer.user.name,
    flightsHref: "/dashboard",
    flightsCount: flights.length,
    debriefsHref: "/debrief",
    debriefsCount: String(debriefedCount),
    instructorHref: "/profile",
    instructorName: instructors.length > 0 ? instructors.map((i) => i!.name).join(", ") : "None yet",
    guideHref: "/how-it-works",
    supportHref: "mailto:support@getafterflight.com",
    dataHandlingHref: "/data-handling",
    signOutHref: "/api/auth/logout",
  };
}
