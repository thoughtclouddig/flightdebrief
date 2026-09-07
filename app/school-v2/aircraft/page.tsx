import { SchoolV2AircraftScreen } from "@/components/school-v2/aircraft-screen";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * Real canonical CRUD (repo.listAircraft + the existing /api/admin/aircraft
 * routes -- see app/(product)/admin/aircraft/page.tsx for the identical
 * repository call), School V2 presentation. No new backend logic.
 */
export default async function SchoolV2AircraftPage() {
  const viewer = await getViewer();
  const repo = getRepository();
  const aircraft = await repo.listAircraft(viewer.organization.id);
  return <SchoolV2AircraftScreen aircraft={aircraft} />;
}
