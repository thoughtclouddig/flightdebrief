import Link from "next/link";
import { getRepository } from "@/lib/data";
import { ContentDesk, type ContentRow } from "@/components/staff/content-desk";
import { GenerateDraftButton } from "@/components/admin/generate-draft-button";

export const dynamic = "force-dynamic";

/**
 * AfterFlight's content desk. Articles and research share one screen because
 * they're one job; ideas share the articles table because an idea is just the
 * earliest stage of an article, and keeping them apart is what made it
 * unclear where an approved idea went.
 */
export default async function ContentDeskPage(props: PageProps<"/super-admin/articles">) {
  const { tab } = await props.searchParams;
  const repo = getRepository();
  const [articles, reports, ideas, topics] = await Promise.all([
    repo.listArticles({}),
    repo.listResearchReports({}),
    repo.listArticleIdeas(),
    repo.listResourceTopics(),
  ]);
  const topicById = new Map(topics.map((t) => [t.id, t]));

  const articleRows: ContentRow[] = [
    // Ideas that haven't become articles yet. A "drafted" idea is excluded --
    // it exists in this table already, as the article it became.
    ...ideas
      .filter((idea) => idea.status === "proposed" || idea.status === "approved")
      .map((idea) => ({
        id: idea.id,
        title: idea.title,
        stage: (idea.status === "approved" ? "queued" : "idea") as ContentRow["stage"],
        topicName: idea.topicId ? topicById.get(idea.topicId)?.name ?? null : null,
        dateLabel: shortDate(idea.createdAt),
        href: "/super-admin/ideas",
        previewHref: null,
        liveHref: null,
      })),
    ...articles.map((article) => {
      const topic = article.topicId ? topicById.get(article.topicId) ?? null : null;
      return {
        id: article.id,
        title: article.title,
        stage: article.status as ContentRow["stage"],
        topicName: topic?.name ?? null,
        dateLabel: shortDate(article.updatedAt),
        href: `/super-admin/articles/${article.id}`,
        previewHref: `/super-admin/articles/${article.id}/preview`,
        liveHref:
          article.status === "published" ? `/resources/${topic?.slug ?? "afterflight"}/${article.slug}` : null,
      };
    }),
  ];

  const researchRows: ContentRow[] = reports.map((report) => ({
    id: report.id,
    title: report.title,
    stage: report.status as ContentRow["stage"],
    topicName: null,
    dateLabel: shortDate(report.updatedAt),
    href: `/super-admin/research/${report.id}`,
    previewHref: null,
    liveHref: report.status === "published" ? `/research/${report.slug}` : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Content</h1>
          <p className="mt-1 text-sm text-white/50">
            Everything from proposed idea to published page. Nothing is written or published without you.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/articles/new"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            New article
          </Link>
          <GenerateDraftButton />
        </div>
      </div>

      <ContentDesk
        articles={articleRows}
        research={researchRows}
        initialTab={tab === "research" ? "research" : "articles"}
      />
    </div>
  );
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
