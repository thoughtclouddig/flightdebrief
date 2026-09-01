import { isContentPublic } from "@/lib/content/visibility";
import { formatHeadline, toTitleCase } from "@/lib/headline";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArticleBody } from "@/components/marketing/article-body";
import { ArticleCta } from "@/components/marketing/article-cta";
import { Reveal } from "@/components/marketing/reveal";
import { getRepository } from "@/lib/data";
import { heroImageSrc } from "@/lib/content/images";
import { toPlainText } from "@/lib/content/article-body";
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
  props: PageProps<"/field-notes/[topicSlug]/[articleSlug]">,
): Promise<Metadata> {
  const { topicSlug, articleSlug } = await props.params;
  const found = await loadArticle(topicSlug, articleSlug);
  if (!found) return {};
  const { article } = found;
  const origin = appOrigin();
  const canonical = origin ? `${origin}/field-notes/${topicSlug}/${articleSlug}` : undefined;
  return {
    title: `${toTitleCase(article.title)} — AfterFlight`,
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

export default async function ArticlePage(props: PageProps<"/field-notes/[topicSlug]/[articleSlug]">) {
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

  const plainText = article.bodyBlocks ? toPlainText(article.bodyBlocks) : article.body;
  const readMinutes = Math.max(1, Math.round(plainText.trim().split(/\s+/).filter(Boolean).length / 225));

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
      ? { url: `${origin}/field-notes/${topicSlug}/${articleSlug}`, isPartOf: { "@type": "WebSite", url: origin } }
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
            { "@type": "ListItem", position: 1, name: "Field Notes", item: `${origin}/field-notes` },
            { "@type": "ListItem", position: 2, name: topic.name, item: `${origin}/field-notes/${topic.slug}` },
            { "@type": "ListItem", position: 3, name: article.title, item: `${origin}/field-notes/${topicSlug}/${articleSlug}` },
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

      {/* One column for everything. Two centred containers of different widths
          share a center line but not a left edge, which is why the headline
          used to start outside the text it belonged to. Anything that should
          be wider than the measure breaks out of this column symmetrically
          (see the hero below) rather than living in a second container. */}
      <div className="mx-auto max-w-3xl">
        <Reveal>
          {topic ? (
            <p className="text-balance text-sm font-bold uppercase tracking-[0.16em] text-brand">
              <Link href={`/field-notes/${topic.slug}`} className="hover:underline">{topic.name}</Link>
            </p>
          ) : null}
          <h1
            /* Larger, with the leading pulled in -- at this size default
               line-height opens gaps that read as separate statements rather
               than one headline.
               Tracking is normal, not negative: .font-display already applies
               -0.02em, and at 125% width stretch that closes the counters and
               makes a long headline look cramped. Display type usually wants
               tightening; Archivo expanded at this size does not. */
            className="font-display mt-3 text-balance text-[2.75rem] font-bold leading-[1.05] tracking-normal text-[#101727] sm:text-[3.5rem]"
            style={{ textTransform: "none" }}
          >
            {formatHeadline(article.title)}
          </h1>
          {/* Stepped down and narrowed. The dek frames the piece; the lead
              answer below delivers it. At the old size the two competed, and
              a reader met two summaries before any content. */}
          {article.dek ? (
            <p className="mt-4 max-w-[52ch] text-pretty text-[17px] leading-relaxed text-[#68717D]">{article.dek}</p>
          ) : null}
          {/* Read time sits with the byline because it answers the question a
              reader has at exactly this point: is this worth starting now. */}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#68717D]">
            <span className="rounded-full bg-[#f4f5f6] px-3 py-1 font-medium text-[#101727]">{article.authorName}</span>
            {article.publishedAt ? (
              <span>{new Date(article.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            ) : null}
            <span aria-hidden>·</span>
            <span>{readMinutes} min read</span>
          </div>
        </Reveal>


        <Reveal delay={100} className="mt-10">
          <ArticleBody
            body={article.bodyBlocks}
            plainText={article.body}
            hero={
              article.imageUrl ? (
                /* Wider than the text, on the same center line. A hero
                   constrained to the measure reads as an illustration inside
                   the article; at full bleed past it, it reads as the
                   article's opening image, which is what it is. */
                /* A modest breakout, not a bleed. -mx-28 put the hero 224px
                   wider than the text on each side, which stopped it reading
                   as part of the article. Enough to sit outside the measure,
                   not enough to become a banner. */
                <div className="lg:-mx-12">
                  {/* eslint-disable-next-line @next/next/no-img-element -- served from /api/media, already sized and encoded */}
                  <img
                    src={heroImageSrc("articles", article.id, article.imageUrl)!}
                    alt=""
                    className="aspect-[16/9] w-full rounded-xl object-cover"
                  />
                </div>
              ) : null
            }
          />
          <ArticleCta topicSlug={topic?.slug ?? null} />
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
          <Reveal delay={200} className="mt-14 border-t border-slate-200 pt-10">
            {/* Cards, not a bulleted list of links. At the end of an article
                the question is "what should I read next", and a title alone
                doesn't answer it -- the image and dek are what make the
                choice. */}
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-[#68717D]">Keep reading</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {related.map((a) => {
                const src = heroImageSrc("articles", a.id, a.imageUrl);
                return (
                  <Link
                    key={a.id}
                    href={`/field-notes/${topicSlug}/${a.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-[#c8ced4]"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-[#f1efe8]">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element -- served from /api/media
                        <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="font-display text-pretty text-[16px] font-bold leading-[1.3] text-[#101727] group-hover:text-brand">
                        {formatHeadline(a.title)}
                      </p>
                      {a.dek ? (
                        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-[#68717D]">{a.dek}</p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
