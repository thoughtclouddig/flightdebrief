import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";
import { getRepository } from "@/lib/data";
import { appOrigin } from "@/lib/email";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resources — AfterFlight",
  description: "Guidance for student pilots, CFIs, and flight schools -- grounded in how structured debriefing actually works.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/resources` } : undefined,
};

export default async function ResourcesHubPage() {
  const repo = getRepository();
  const [topics, articles] = await Promise.all([
    repo.listResourceTopics(),
    repo.listArticles({ status: "published" }),
  ]);

  return (
    <section className="bg-white px-6 pb-20 pt-32 sm:pb-28 sm:pt-36">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h1 className="font-display text-balance text-4xl font-bold text-[#101727] sm:text-5xl" style={{ textTransform: "none" }}>
            Resources
          </h1>
          <p className="mt-3 text-pretty text-lg leading-relaxed text-[#68717D]">
            Guidance for student pilots, CFIs, and flight schools -- grounded in how structured debriefing actually
            works.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-12">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#68717D]">Topics</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/resources/${topic.slug}`}
                className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand hover:bg-[#fef4ec]"
              >
                <p className="font-display font-bold text-[#101727]">{topic.name}</p>
                <p className="mt-1 text-sm text-[#68717D]">{topic.description}</p>
              </Link>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200} className="mt-14">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#68717D]">Latest</h2>
          {articles.length === 0 ? (
            <p className="mt-4 text-[#68717D]">Nothing published yet -- check back soon.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-6">
              {articles.map((article) => (
                <li key={article.id}>
                  <Link href={`/resources/${topicSlugFor(topics, article.topicId)}/${article.slug}`} className="group">
                    <p className="font-display text-xl font-bold text-[#101727] group-hover:text-brand">{article.title}</p>
                    {article.dek ? <p className="mt-1 text-[#68717D]">{article.dek}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function topicSlugFor(topics: { id: string; slug: string }[], topicId: string | null): string {
  return topics.find((t) => t.id === topicId)?.slug ?? "afterflight";
}
