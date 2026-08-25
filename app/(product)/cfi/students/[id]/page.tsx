import { notFound } from "next/navigation";
import { StudentTrainingDetail } from "@/components/student-training-detail";
import { getAuthorizedStudent } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CfiStudentProfilePage(props: PageProps<"/cfi/students/[id]">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedStudent(id);
  if (!authorized) notFound();
  const { viewer, student } = authorized;

  // Marks the CFI's "Review student training history" Guide step (lib/guide.ts).
  if (!viewer.user.guideProgress?.progress) {
    void getRepository().markGuideStepViewed(viewer.user.id, "progress").catch(() => {});
  }

  return <StudentTrainingDetail student={student} viewer={viewer} handoffHref={`/cfi/students/${id}/handoff`} />;
}
