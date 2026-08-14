import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { NewFlightClient } from "./new-flight-client";

export const dynamic = "force-dynamic";

export default async function NewFlightPage() {
  const repo = getRepository();
  const viewer = await getViewer();

  const instructorMembers = await repo.listMembers(viewer.organization.id, "instructor");
  const instructors = await Promise.all(instructorMembers.map((m) => repo.getUser(m.userId)));
  const instructorNames = instructors
    .filter((i): i is NonNullable<typeof i> => i !== null)
    .map((i) => i.name)
    .sort((a, b) => a.localeCompare(b));

  return <NewFlightClient instructorNames={instructorNames} />;
}
