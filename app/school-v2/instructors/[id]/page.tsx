import { notFound } from "next/navigation";
import { SchoolV2InstructorDetailScreen } from "@/components/school-v2/instructor-detail-screen";
import { getRepository } from "@/lib/data";
import { computeSchoolV2InstructorDetail } from "@/lib/school-v2/instructor-detail";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function SchoolV2InstructorDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const viewer = await getViewer();
  const repo = getRepository();

  const detail = await computeSchoolV2InstructorDetail(repo, viewer, id);
  if (!detail) notFound();

  return <SchoolV2InstructorDetailScreen detail={detail} />;
}
