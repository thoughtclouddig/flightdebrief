import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";
import { getRepository } from "@/lib/data";
import { appOrigin } from "@/lib/email";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AfterFlight Research",
  description: "Original AfterFlight research on flight-training debriefs, student pilot progress, and training continuity, drawn from anonymized aggregate product data.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/research` } : undefined,
};

export default async function ResearchHubPage() {
  const repo = getRepository();
  const reports = await repo.listResearchReports({ status: "published" });

  return (
    <section className="bg-white px-6 pb-20 pt-32 sm:pb-28 sm:pt-36">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-balance text-sm font-bold uppercase tracking-[0.16em] text-brand">Research</p>
          <h1 className="font-display mt-2 text-balance text-4xl font-bold text-[#101727] sm:text-5xl" style={{ textTransform: "none" }}>
            AfterFlight Research
          </h1>
          <p className="mt-3 text-pretty text-lg leading-relaxed text-[#68717D]">
            Original findings from AfterFlight&rsquo;s anonymized, aggregate debrief data -- published as the dataset
            matures, never before it does.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-10 flex flex-col gap-5">
          {reports.length === 0 ? (
            <p className="text-pretty leading-relaxed text-[#68717D]">
              Nothing published yet. AfterFlight publishes research once there&rsquo;s enough real, anonymized debrief
              data to support a finding -- check back as the dataset grows.
            </p>
          ) : (
            reports.map((report) => (
              <Link
                key={report.id}
                href={`/research/${report.slug}`}
                className="flex gap-4 rounded-lg border border-hairline p-5 transition-colors hover:border-brand/40"
              >
                {report.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- must render both https:// and data: URLs
                  <img src={report.imageUrl} alt="" className="aspect-[4/3] w-28 shrink-0 rounded-lg object-cover sm:w-36" />
                ) : null}
                <div>
                  <p className="font-display text-lg font-bold text-[#101727]">{report.title}</p>
                  {report.summary ? <p className="mt-1.5 text-pretty text-[#68717D]">{report.summary}</p> : null}
                </div>
              </Link>
            ))
          )}
        </Reveal>
      </div>
    </section>
  );
}
