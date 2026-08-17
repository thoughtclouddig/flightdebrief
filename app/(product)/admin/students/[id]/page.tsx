import { notFound } from "next/navigation";
import { StudentTrainingDetail } from "@/components/student-training-detail";
import { getAuthorizedStudent } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function AdminStudentDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const authorized = await getAuthorizedStudent(id);
  if (!authorized) notFound();
  const { viewer, student } = authorized;

  return <StudentTrainingDetail student={student} viewer={viewer} />;
}
