import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data";
import { ArticleForm } from "@/components/admin/article-form";

export const dynamic = "force-dynamic";

export default async function AdminEditArticlePage(props: PageProps<"/super-admin/articles/[id]">) {
  const { id } = await props.params;
  const repo = getRepository();
  const [article, topics] = await Promise.all([repo.getArticle(id), repo.listResourceTopics()]);
  if (!article) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Edit Article</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">/{article.slug}</p>
      </div>
      <ArticleForm topics={topics} article={article} />
    </div>
  );
}
