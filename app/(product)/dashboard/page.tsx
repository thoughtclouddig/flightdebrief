import { FlightsList } from "@/components/student/flights/flights-list";
import { buildProductionFlightsListProps } from "@/lib/student/flights-list-production-adapter";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * Real My Flights, wired to the approved V2 presentation
 * (components/student/flights/flights-list.tsx) via
 * lib/student/flights-list-production-adapter.ts. Not shared with CFI/admin
 * (no nav path leads them here and this query is scoped to viewer.user.id as
 * a student), so this is a direct in-place rewrite rather than a role branch.
 */
export default async function DashboardPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const props = await buildProductionFlightsListProps(repo, viewer.user.id);

  return <FlightsList {...props} />;
}
