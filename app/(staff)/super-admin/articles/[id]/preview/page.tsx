import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data";
import { ArticleBody } from "@/components/marketing/article-body";
import { ArticleCta } from "@/components/marketing/article-cta";
import { toPlainText } from "@/lib/content/article-body";
import { heroImageSrc } from "@/lib/content/images";
import { PublishArticleButton } from "@/components/staff/publish-article-button";

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
          </div>
        </div>
      </div>
    </div>
  );
}
