import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";
import { getRepository } from "@/lib/data";
import { appOrigin } from "@/lib/email";
import type { SourceType } from "@/lib/types";

export const dynamic = "force-dynamic";

const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  faa_requirement: "FAA Requirement",
  faa_guidance: "FAA Guidance",
  ntsb: "NTSB",
  nasa: "NASA",
  peer_reviewed_research: "Peer-Reviewed Research",
  industry_standard: "Industry Standard",
  afterflight_research: "AfterFlight Research",
  expert_opinion: "Expert Opinion",
  afterflight_recommendation: "AfterFlight Recommendation",
  afterflight_capability: "AfterFlight Capability",
};

const DETAIL_FIELDS: { key: "keyFindings" | "methodology" | "limitations" | "definitions" | "anonymizationNote"; label: string }[] = [
  { key: "keyFindings", label: "Key Findings" },
  { key: "methodology", label: "Methodology" },
  { key: "definitions", label: "Definitions" },
  { key: "limitations", label: "Limitations" },
  { key: "anonymizationNote", label: "Anonymization" },
];

async function loadReport(slug: string) {
  const repo = getRepository();
  const report = await repo.getResearchReportBySlug(slug);
  if (!report || report.status !== "published") return null;
  return report;
}

export async function generateMetadata(props: PageProps<"/research/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const report = await loadReport(slug);
  if (!report) return {};
  const origin = appOrigin();
  const canonical = origin ? `${origin}/research/${slug}` : undefined;
  return {
    title: `${report.title} — AfterFlight Research`,
    description: report.summary || undefined,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: report.title,
      description: report.summary || undefined,
      type: "article",
      publishedTime: report.publishedAt ?? undefined,
      modifiedTime: report.updatedAt,
    },
  };
}

export default async function ResearchReportPage(props: PageProps<"/research/[slug]">) {
  const { slug } = await props.params;
  const report = await loadReport(slug);
  if (!report) notFound();

  const repo = getRepository();
  const relatedTopic = await repo.getResourceTopicBySlug("aviation-research");

  const origin = appOrigin();
  const breadcrumbJsonLd = origin
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Research", item: `${origin}/research` },
          { "@type": "ListItem", position: 2, name: report.title, item: `${origin}/research/${slug}` },
        ],
      }
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: report.title,
    description: report.summary || undefined,
    datePublished: report.publishedAt ?? undefined,
    dateModified: report.updatedAt,
    author: { "@type": "Organization", name: report.authorName },
    publisher: { "@type": "Organization", name: "AfterFlight" },
    ...(origin ? { url: `${origin}/research/${slug}`, isPartOf: { "@type": "WebSite", url: origin } } : {}),
    ...(report.sources.length
      ? { citation: report.sources.map((s) => ({ "@type": "CreativeWork", name: s.label, url: s.url })) }
      : {}),
  };

  return (
    <section className="bg-white px-6 pb-20 pt-32 sm:pb-28 sm:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {breadcrumbJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      ) : null}
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <p className="text-balance text-sm font-bold uppercase tracking-[0.16em] text-brand">
            <Link href="/research" className="hover:underline">Research</Link>
          </p>
          <h1 className="font-display mt-2 text-balance text-4xl font-bold text-[#101727] sm:text-5xl" style={{ textTransform: "none" }}>
            {report.title}
          </h1>
          {report.summary ? <p className="mt-3 max-w-3xl text-pretty text-lg leading-relaxed text-[#68717D]">{report.summary}</p> : null}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[#68717D]">
            <span className="rounded-full bg-[#f4f5f6] px-3 py-1 font-medium text-[#101727]">{report.authorName}</span>
            {report.reviewerName ? <span>Reviewed by {report.reviewerName}</span> : null}
            {report.publishedAt ? (
              <span>{new Date(report.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            ) : null}
          </div>
        </Reveal>

        {report.imageUrl ? (
          <Reveal delay={80}>
            {/* eslint-disable-next-line @next/next/no-img-element -- must render both https:// and data: URLs */}
            <img src={report.imageUrl} alt="" className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-sm" />
          </Reveal>
        ) : null}
      </div>

      <div className="mx-auto max-w-3xl">
        <Reveal delay={100} className="mt-10 flex flex-col gap-8">
          {DETAIL_FIELDS.filter((f) => report[f.key]).map((f) => (
            <div key={f.key}>
              <h2 className="font-display text-xl font-bold text-[#101727]">{f.label}</h2>
              <p className="mt-3 text-pretty leading-relaxed text-[#68717D]">{report[f.key]}</p>
            </div>
          ))}

          {report.sampleSize || report.dateRange || report.dataSource ? (
            <div>
              <h2 className="font-display text-xl font-bold text-[#101727]">Study Details</h2>
              <dl className="mt-3 flex flex-col gap-1.5 text-[#68717D]">
                {report.sampleSize ? (
                  <div className="flex gap-2">
                    <dt className="font-medium text-[#101727]">Sample size:</dt>
                    <dd>{report.sampleSize}</dd>
                  </div>
                ) : null}
                {report.dateRange ? (
                  <div className="flex gap-2">
                    <dt className="font-medium text-[#101727]">Date range:</dt>
                    <dd>{report.dateRange}</dd>
                  </div>
                ) : null}
                {report.dataSource ? (
                  <div className="flex gap-2">
                    <dt className="font-medium text-[#101727]">Data source:</dt>
                    <dd>{report.dataSource}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {report.sources.length ? (
            <div>
              <h2 className="font-display text-xl font-bold text-[#101727]">Sources</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {report.sources.map((source, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{SOURCE_TYPE_LABEL[source.sourceType]}</Badge>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {relatedTopic ? (
            <div>
              <Link href={`/resources/${relatedTopic.slug}`} className="text-brand hover:underline">
                See related resources in {relatedTopic.name} &rarr;
              </Link>
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
