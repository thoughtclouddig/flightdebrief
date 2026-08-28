import { isContentPublic } from "@/lib/content/visibility";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArticleBody } from "@/components/marketing/article-body";
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

async function loadArticle(topicSlug: string, articleSlug: string) {
  const repo = getRepository();
  const article = await repo.getArticleBySlug(articleSlug);
  if (!article || article.status !== "published") return null;
  const topic = article.topicId ? await repo.getResourceTopicBySlug(topicSlug) : null;
  if (article.topicId && topic?.id !== article.topicId) return null;
  return { article, topic };
}

export async function generateMetadata(
  props: PageProps<"/resources/[topicSlug]/[articleSlug]">,
): Promise<Metadata> {
  const { topicSlug, articleSlug } = await props.params;
  const found = await loadArticle(topicSlug, articleSlug);
  if (!found) return {};
  const { article } = found;
  const origin = appOrigin();
  const canonical = origin ? `${origin}/resources/${topicSlug}/${articleSlug}` : undefined;
  return {
    title: `${article.title} — AfterFlight`,
    description: article.dek || undefined,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: article.title,
      description: article.dek || undefined,
      type: "article",
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
    },
  };
}

export default async function ArticlePage(props: PageProps<"/resources/[topicSlug]/[articleSlug]">) {
  // Whole content surface is gated until it's ready -- see lib/content/visibility.ts.
  if (!isContentPublic()) notFound();

  const { topicSlug, articleSlug } = await props.params;
  const found = await loadArticle(topicSlug, articleSlug);
  if (!found) notFound();
  const { article, topic } = found;

  const repo = getRepository();
  const related = topic
    ? (await repo.listArticles({ status: "published", topicId: topic.id }))
        .filter((a) => a.id !== article.id)
        .slice(0, 3)
    : [];

  const origin = appOrigin();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.dek || undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: article.authorName },
    publisher: { "@type": "Organization", name: "AfterFlight" },
    ...(origin
      ? { url: `${origin}/resources/${topicSlug}/${articleSlug}`, isPartOf: { "@type": "WebSite", url: origin } }
      : {}),
    ...(article.sources.length
      ? { citation: article.sources.map((s) => ({ "@type": "CreativeWork", name: s.label, url: s.url })) }
      : {}),
  };

  // Only emitted when the article genuinely carries an FAQ -- marking up
  // questions that aren't on the page is what gets structured data ignored.
  const faqJsonLd =
    article.bodyBlocks && article.bodyBlocks.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.bodyBlocks.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  const breadcrumbJsonLd =
    origin && topic
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Resources", item: `${origin}/resources` },
            { "@type": "ListItem", position: 2, name: topic.name, item: `${origin}/resources/${topic.slug}` },
            { "@type": "ListItem", position: 3, name: article.title, item: `${origin}/resources/${topicSlug}/${articleSlug}` },
          ],
        }
      : null;


  return (
    <section className="bg-white px-6 pb-20 pt-32 sm:pb-28 sm:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {breadcrumbJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      ) : null}
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      ) : null}

      <div className="mx-auto max-w-4xl">
        <Reveal>
          {topic ? (
            <p className="text-balance text-sm font-bold uppercase tracking-[0.16em] text-brand">
              <Link href={`/resources/${topic.slug}`} className="hover:underline">{topic.name}</Link>
            </p>
          ) : null}
          <h1
            className="font-display mt-2 text-balance text-4xl font-bold text-[#101727] sm:text-5xl"
            style={{ textTransform: "none" }}
          >
            {article.title}
          </h1>
          {article.dek ? <p className="mt-3 max-w-3xl text-pretty text-lg leading-relaxed text-[#68717D]">{article.dek}</p> : null}
          <div className="mt-5 flex items-center gap-2 text-sm text-[#68717D]">
            <span className="rounded-full bg-[#f4f5f6] px-3 py-1 font-medium text-[#101727]">{article.authorName}</span>
            {article.publishedAt ? (
              <span>{new Date(article.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            ) : null}
          </div>
        </Reveal>

        {article.imageUrl ? (
          <Reveal delay={80}>
            {/* eslint-disable-next-line @next/next/no-img-element -- must render both https:// and data: URLs; next/image can't optimize data: URLs */}
            <img
              src={article.imageUrl}
              alt=""
              className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-sm"
            />
          </Reveal>
        ) : null}
      </div>

      <div className="mx-auto max-w-3xl">
        <Reveal delay={100} className="mt-10">
          <ArticleBody body={article.bodyBlocks} plainText={article.body} />
        </Reveal>

        {article.sources.length ? (
          <Reveal delay={150} className="mt-10 rounded-xl border border-hairline bg-[#fafafb] p-5">
            <h2 className="font-display text-lg font-bold text-[#101727]">Sources</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {article.sources.map((source, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{SOURCE_TYPE_LABEL[source.sourceType]}</Badge>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {related.length ? (
          <Reveal delay={200} className="mt-10 border-t border-hairline pt-8">
            <h2 className="font-display text-lg font-bold text-[#101727]">Related</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {related.map((a) => (
                <li key={a.id}>
                  <Link href={`/resources/${topicSlug}/${a.slug}`} className="text-brand hover:underline">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
