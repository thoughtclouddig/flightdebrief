import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { CfiV2AddFlightClient } from "@/components/cfi-v2/add-flight-client";
import { BackLink, PageTitle, Screen } from "@/components/student/ui";

export const dynamic = "force-dynamic";

/**
 * CFI V2's Add Flight -- the destination for "Log a flight for [student]" on
 * the Student Record (components/cfi-v2/student-detail-screen.tsx). Same
 * student lookup/authorization shape as app/cfi-v2/students/[id]/page.tsx
 * (repo.getUser + org-membership check), kept inline rather than routed
 * through computeCfiV2StudentDetail since this screen only needs the
 * student's name, not their whole detail payload.
 */
export default async function CfiV2AddFlightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params;
  const repo = getRepository();
  const viewer = await getViewer();

  const student = await repo.getUser(studentId);
  if (!student) notFound();
  const memberships = await repo.listMembershipsForUser(studentId);
  if (!memberships.some((m) => m.organizationId === viewer.organization.id)) notFound();

  const firstName = student.name.split(" ")[0];

  return (
    <Screen>
      <BackLink href={`/cfi-v2/students/${studentId}`}>{student.name}</BackLink>
      <PageTitle kicker={`For ${firstName}`}>Log a flight</PageTitle>
      <CfiV2AddFlightClient studentId={studentId} studentFirstName={firstName} />
    </Screen>
  );
}
