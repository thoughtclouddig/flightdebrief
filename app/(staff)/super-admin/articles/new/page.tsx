import Link from "next/link";
import { getRepository } from "@/lib/data";
import { ArticleForm } from "@/components/admin/article-form";

export const dynamic = "force-dynamic";

/**
 * Creating an article is its own screen. It used to sit as a form underneath
 * the article list, which meant the list could never be a list -- every visit
 * scrolled past everything published to reach a form nobody asked for.
 */
export default async function NewArticlePage() {
  const topics = await getRepository().listResourceTopics();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link href="/super-admin/articles" className="text-sm text-white/50 hover:text-white">
          ← Content
        </Link>
        <h1 className="font-display mt-2 text-2xl font-bold text-white">New article</h1>
      </div>
      <ArticleForm topics={topics} />
    </div>
  );
}
