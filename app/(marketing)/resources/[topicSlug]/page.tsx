import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/marketing/reveal";
import { getRepository } from "@/lib/data";
import { appOrigin } from "@/lib/email";

export const dynamic = "force-dynamic";

/** One real, relevant cross-link per topic to an existing product page -- not a generated "related" guess. */
const TOPIC_PRODUCT_LINK: Record<string, { href: string; label: string }> = {
  "cfi-resources": { href: "/instructors", label: "See AfterFlight for Flight Instructors" },
  "flight-schools": { href: "/schools", label: "See AfterFlight for Flight Schools" },
  "student-pilot": { href: "/what-is-afterflight", label: "See what AfterFlight is" },
};

export async function generateMetadata(props: PageProps<"/resources/[topicSlug]">): Promise<Metadata> {
  const { topicSlug } = await props.params;
  const topic = await getRepository().getResourceTopicBySlug(topicSlug);
  if (!topic) return {};
  const origin = appOrigin();
  return {
    title: `${topic.name} — AfterFlight Resources`,
    description: topic.description,
    alternates: origin ? { canonical: `${origin}/resources/${topicSlug}` } : undefined,
  };
}

export default async function ResourceTopicPage(props: PageProps<"/resources/[topicSlug]">) {
  const { topicSlug } = await props.params;
  const repo = getRepository();
  const topic = await repo.getResourceTopicBySlug(topicSlug);
  if (!topic) notFound();

  const articles = await repo.listArticles({ status: "published", topicId: topic.id });
  const productLink = TOPIC_PRODUCT_LINK[topic.slug];

  const origin = appOrigin();
  const breadcrumbJsonLd = origin
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Resources", item: `${origin}/resources` },
          { "@type": "ListItem", position: 2, name: topic.name, item: `${origin}/resources/${topic.slug}` },
        ],
      }
    : null;

  return (
    <section className="bg-white px-6 pb-20 pt-32 sm:pb-28 sm:pt-36">
      {breadcrumbJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      ) : null}
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-balance text-sm font-bold uppercase tracking-[0.16em] text-brand">
            <Link href="/resources" className="hover:underline">Resources</Link>
          </p>
          <h1 className="font-display mt-2 text-balance text-4xl font-bold text-[#101727] sm:text-5xl" style={{ textTransform: "none" }}>
            {topic.name}
          </h1>
          {topic.description ? <p className="mt-3 text-pretty text-lg leading-relaxed text-[#68717D]">{topic.description}</p> : null}
        </Reveal>

        <Reveal delay={100} className="mt-12">
          {articles.length === 0 ? (
            <p className="text-[#68717D]">Nothing published in this topic yet -- check back soon.</p>
          ) : (
            <ul className="flex flex-col gap-6">
              {articles.map((article) => (
                <li key={article.id}>
                  <Link href={`/resources/${topic.slug}/${article.slug}`} className="group flex gap-4">
                    {article.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- must render both https:// and data: URLs
                      <img
                        src={article.imageUrl}
                        alt=""
                        className="aspect-[4/3] w-28 shrink-0 rounded-lg object-cover sm:w-36"
                      />
                    ) : null}
                    <div>
                      <p className="font-display text-xl font-bold text-[#101727] group-hover:text-brand">{article.title}</p>
                      {article.dek ? <p className="mt-1 text-[#68717D]">{article.dek}</p> : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        {productLink ? (
          <Reveal delay={150} className="mt-10 border-t border-hairline pt-8">
            <Link href={productLink.href} className="text-brand hover:underline">
              {productLink.label} &rarr;
            </Link>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
