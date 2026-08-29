import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data";
import { ArticleBody } from "@/components/marketing/article-body";
import { ArticleCta } from "@/components/marketing/article-cta";
import { toPlainText } from "@/lib/content/article-body";
import { heroImageSrc } from "@/lib/content/images";
import { PublishArticleButton } from "@/components/staff/publish-article-button";
import type { SourceType } from "@/lib/types";

/** Mirrors the public article page's labels. */
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

export const dynamic = "force-dynamic";

/**
 * What a draft will look like once it's live.
 *
 * Deliberately renders the same ArticleBody and ArticleCta the public page
 * uses, on the same white ground, rather than a staff-styled approximation --
 * a preview that isn't the real template is worse than no preview, because it
 * tells you something false with confidence.
 *
 * The staff bar sits above it rather than around it, so nothing in the frame
 * changes how the article itself lays out.
 */
export default async function ArticlePreviewPage(props: PageProps<"/super-admin/articles/[id]/preview">) {
  const { id } = await props.params;
  const repo = getRepository();
  const [article, topics] = await Promise.all([repo.getArticle(id), repo.listResourceTopics()]);
  if (!article) notFound();

  const topic = article.topicId ? topics.find((t) => t.id === article.topicId) ?? null : null;
  const imageSrc = heroImageSrc("articles", article.id, article.imageUrl);

  return (
    <div className="-mx-4 -my-8">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-white/10 bg-[#101727] px-5 py-3">
        <Link href="/super-admin/articles" className="text-sm text-white/50 hover:text-white">
          ← Content
        </Link>
        <span className="rounded-md bg-amber-400/15 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-amber-300">
          {article.status === "published" ? "Published" : "Draft preview"}
        </span>
        <p className="truncate text-sm text-white/50">/{article.slug}</p>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href={`/super-admin/articles/${article.id}`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Edit
          </Link>
          <PublishArticleButton articleId={article.id} status={article.status} />
        </div>
      </div>

      <div className="bg-white px-6 py-14">
        <div className="mx-auto max-w-3xl">
          {topic ? (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#68717D]">{topic.name}</p>
          ) : null}
          <h1 className="font-display mt-3 text-balance text-[2.75rem] font-bold leading-[1.05] tracking-normal text-[#101727] sm:text-[3.5rem]">
            {article.title}
          </h1>
          {article.dek ? (
            <p className="mt-5 max-w-[52ch] text-pretty text-[17px] leading-relaxed text-[#68717D]">{article.dek}</p>
          ) : null}

          <div className="mt-10">
            <ArticleBody
              body={article.bodyBlocks}
              plainText={article.bodyBlocks ? toPlainText(article.bodyBlocks) : article.body}
              hero={
                imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element -- served from /api/media
                  <img src={imageSrc} alt="" className="aspect-[16/9] w-full rounded-xl object-cover" />
                ) : undefined
              }
            />
            <ArticleCta topicSlug={topic?.slug ?? null} />

            {/* Sources are the first thing to audit on a preview, and this
                page didn't show them -- so a fully-sourced article and an
                unsourced one looked identical here, which is precisely the
                confusion the research pass exists to remove. */}
            <section className="mt-14 border-t border-slate-200 pt-8">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-[#68717D]">
                Sources ({article.sources.length})
              </h2>
              {article.sources.length === 0 ? (
                <p className="mt-3 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-[15px] text-[#7a4a05]">
                  No sources. This article was written without verified research, so every factual claim in it is
                  unverified. Redraft it before publishing.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {article.sources.map((source, i) => (
                    <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="rounded-md bg-[#f4f5f6] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#56636f]">
                        {SOURCE_TYPE_LABEL[source.sourceType] ?? source.sourceType}
                      </span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[15px] text-brand hover:underline"
                      >
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
