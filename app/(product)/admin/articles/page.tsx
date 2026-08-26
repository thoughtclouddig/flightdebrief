import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";
import { ArticleForm } from "@/components/admin/article-form";
import { GenerateDraftButton } from "@/components/admin/generate-draft-button";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const repo = getRepository();
  const [articles, topics] = await Promise.all([repo.listArticles({}), repo.listResourceTopics()]);
  const topicName = new Map(topics.map((t) => [t.id, t.name]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Articles</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{articles.length} total</p>
        </div>
        <GenerateDraftButton />
      </div>

      <div className="flex flex-col gap-3">
        {articles.map((article) => (
          <Link key={article.id} href={`/admin/articles/${article.id}`}>
            <Card>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{article.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {article.topicId ? topicName.get(article.topicId) ?? "No topic" : "No topic"} · /{article.slug}
                  </p>
                </div>
                <Badge variant={article.status === "published" ? "success" : "neutral"}>{article.status}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">New Article</h2>
        <ArticleForm topics={topics} />
      </div>
    </div>
  );
}
