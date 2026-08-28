import { isContentPublic } from "@/lib/content/visibility";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";
import { ResourceIndex, type ResourceCard } from "@/components/marketing/resource-index";
import { getRepository } from "@/lib/data";
import { heroImageSrc } from "@/lib/content/images";
import { toPlainText } from "@/lib/content/article-body";
import { appOrigin } from "@/lib/email";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resources — AfterFlight",
  description: "Guidance for student pilots, CFIs, and flight schools -- grounded in how structured debriefing actually works.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/resources` } : undefined,
};

export default async function ResourcesHubPage() {
  // Whole content surface is gated until it's ready -- see lib/content/visibility.ts.
  if (!isContentPublic()) notFound();

  const repo = getRepository();
  const [topics, articles] = await Promise.all([
    repo.listResourceTopics(),
    repo.listArticles({ status: "published" }),
  ]);
  const topicById = new Map(topics.map((t) => [t.id, t]));

  const cards: ResourceCard[] = articles.map((article) => {
    const topic = article.topicId ? topicById.get(article.topicId) ?? null : null;
    return {
      id: article.id,
      href: `/resources/${topic?.slug ?? "afterflight"}/${article.slug}`,
      title: article.title,
      dek: article.dek,
      topicId: article.topicId,
      topicName: topic?.name ?? null,
      imageSrc: heroImageSrc("articles", article.id, article.imageUrl),
      dateLabel: article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : null,
      readMinutes: readMinutes(article.bodyBlocks ? toPlainText(article.bodyBlocks) : article.body),
    };
  });

  return (
    <section className="bg-white px-6 pb-24 pt-32 sm:pt-36">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <nav aria-label="Breadcrumb" className="text-sm text-[#8c97a2]">
            <Link href="/" className="hover:text-[#101727]">
              Home
            </Link>
            <span className="px-2" aria-hidden>
              /
            </span>
            <span className="text-[#3f474f]">Resources</span>
          </nav>
          <h1
            className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl"
            style={{ textTransform: "none" }}
          >
            Resources
          </h1>
          <p className="mt-3 max-w-[62ch] text-pretty text-lg leading-relaxed text-[#68717D]">
            Guidance for student pilots, CFIs, and flight schools -- grounded in how structured debriefing actually
            works.
          </p>
        </Reveal>

        <ResourceIndex cards={cards} topics={topics.map((t) => ({ id: t.id, name: t.name }))} />
      </div>
    </section>
  );
}

/**
 * Reading time at 225 words a minute, the usual figure for adult prose.
 * Rounded up and floored at one so nothing ever reads "0 min read".
 */
function readMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}
