import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data";
import { ResearchForm } from "@/components/admin/research-form";

export const dynamic = "force-dynamic";

export default async function AdminEditResearchPage(props: PageProps<"/admin/research/[id]">) {
  const { id } = await props.params;
  const repo = getRepository();
  const report = await repo.getResearchReport(id);
  if (!report) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Edit Research Report</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">/{report.slug}</p>
      </div>
      <ResearchForm report={report} />
    </div>
  );
}
