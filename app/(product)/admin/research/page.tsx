import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";
import { ResearchForm } from "@/components/admin/research-form";

export const dynamic = "force-dynamic";

export default async function AdminResearchPage() {
  const repo = getRepository();
  const reports = await repo.listResearchReports({});

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Research</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{reports.length} total</p>
      </div>

      <div className="flex flex-col gap-3">
        {reports.map((report) => (
          <Link key={report.id} href={`/admin/research/${report.id}`}>
            <Card>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{report.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">/{report.slug}</p>
                </div>
                <Badge variant={report.status === "published" ? "success" : "neutral"}>{report.status}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">New Research Report</h2>
        <ResearchForm />
      </div>
    </div>
  );
}
