import { isContentPublic } from "@/lib/content/visibility";
import { formatHeadline } from "@/lib/headline";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getRepository } from "@/lib/data";
import { heroImageSrc } from "@/lib/content/images";
import { toPlainText } from "@/lib/content/article-body";
import { appOrigin } from "@/lib/email";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Field Notes — AfterFlight",
  description:
    "Guidance for student pilots, CFIs, and flight schools -- grounded in how structured debriefing actually works.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/field-notes` } : undefined,
};

/**
 * The resources index.
 *
 * Rendered entirely on the server, with no scroll-reveal wrapper and no
 * client component. That is deliberate rather than incidental: the previous
 * version hid every section at opacity-0 until an IntersectionObserver fired,
 * so any environment where that didn't happen served a blank white page --
 * which is exactly what it did. A public index page has one job, and it
 * should not be able to fail at it.
 *
 * The consequence is that filtering and search are links and a GET form
 * rather than client state. That's the better shape here anyway: every filter
 * combination becomes a real URL that can be linked, shared, and crawled.
 */
export default async function FieldNotesHubPage(props: PageProps<"/field-notes">) {
  if (!isContentPublic()) notFound();

  const { topic: topicParam, q: queryParam } = await props.searchParams;
  const activeTopic = typeof topicParam === "string" ? topicParam : null;
  const query = (typeof queryParam === "string" ? queryParam : "").trim();

  const repo = getRepository();
  const [topics, articles] = await Promise.all([
    repo.listResourceTopics(),
    repo.listArticles({ status: "published" }),
  ]);
  const topicById = new Map(topics.map((t) => [t.id, t]));

  const items = articles
    .map((article) => {
      const topic = article.topicId ? topicById.get(article.topicId) ?? null : null;
      const text = article.bodyBlocks ? toPlainText(article.bodyBlocks) : article.body;
      return {
        id: article.id,
        title: article.title,
        dek: article.dek,
        topic,
        href: `/field-notes/${topic?.slug ?? "afterflight"}/${article.slug}`,
        imageSrc: heroImageSrc("articles", article.id, article.imageUrl),
        dateLabel: article.publishedAt
          ? new Date(article.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : null,
        readMinutes: Math.max(1, Math.round(text.trim().split(/\s+/).filter(Boolean).length / 225)),
        haystack: `${article.title} ${article.dek} ${topic?.name ?? ""}`.toLowerCase(),
      };
    })
    .filter((item) => {
      if (activeTopic && item.topic?.slug !== activeTopic) return false;
      if (query && !item.haystack.includes(query.toLowerCase())) return false;
      return true;
    });

  // Only topics that have something published -- a filter that always returns
  // an empty grid is a dead end dressed as navigation.
  const offered = topics.filter((t) => articles.some((a) => a.topicId === t.id));

  function filterHref(slug: string | null): string {
    const params = new URLSearchParams();
    if (slug) params.set("topic", slug);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `/field-notes?${qs}` : "/field-notes";
  }

  return (
    <div className="bg-white">
      <header className="border-b border-slate-200 px-6 pb-10 pt-32 sm:pt-36">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="text-sm text-[#8c97a2]">
            <Link href="/" className="hover:text-[#101727]">
              Home
            </Link>
            <span className="px-2" aria-hidden>
              /
            </span>
            <span className="text-[#3f474f]">Field Notes</span>
          </nav>

          <h1
            className="font-display mt-4 text-balance text-4xl font-bold text-[#101727] sm:text-5xl"
            style={{ textTransform: "none" }}
          >
            Field Notes
          </h1>
          <p className="mt-3 max-w-[64ch] text-pretty text-lg leading-relaxed text-[#68717D]">
            Guidance for student pilots, CFIs, and flight schools -- grounded in how structured debriefing actually
            works.
          </p>

          {/* A GET form, so a search is a URL. No JavaScript involved. */}
          <form action="/field-notes" method="get" className="mt-7 max-w-xl" role="search">
            {activeTopic ? <input type="hidden" name="topic" value={activeTopic} /> : null}
            <div className="flex gap-2">
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search articles"
                aria-label="Search articles"
                className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-[#101727] placeholder:text-[#8c97a2] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#101727] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#2a3444]"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            <FilterLink href={filterHref(null)} active={activeTopic === null}>
              All articles
            </FilterLink>
            {offered.map((topic) => (
              <FilterLink key={topic.id} href={filterHref(topic.slug)} active={activeTopic === topic.slug}>
                {topic.name}
              </FilterLink>
            ))}
          </div>
        </div>
      </header>

      <section className="px-6 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl">
          {items.length === 0 ? (
            <div className="py-10">
              <p className="font-display text-xl font-bold text-[#101727]">
                {articles.length === 0 ? "Nothing published yet" : "No articles match that"}
              </p>
              <p className="mt-2 text-[#68717D]">
                {articles.length === 0
                  ? "New guidance is added as it's written."
                  : "Try a different topic, or clear the search."}
              </p>
              {articles.length > 0 ? (
                <Link href="/field-notes" className="mt-4 inline-block font-semibold text-brand hover:underline">
                  Show all articles
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-[#c8ced4]"
                >
                  <Link href={item.href} className="flex flex-1 flex-col">
                    <div className="aspect-[16/10] w-full overflow-hidden bg-[#f1efe8]">
                      {item.imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element -- served from /api/media, already sized and encoded
                        <img src={item.imageSrc} alt="" loading="lazy" className="size-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      {item.topic ? (
                        <span className="inline-flex w-fit rounded-md bg-[#f4f5f6] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.09em] text-[#56636f]">
                          {item.topic.name}
                        </span>
                      ) : null}
                      <h2 className="font-display mt-3 text-pretty text-[19px] font-bold leading-[1.3] text-[#101727] group-hover:text-brand">
                        {formatHeadline(item.title)}
                      </h2>
                      {item.dek ? (
                        <p className="mt-2 line-clamp-3 text-pretty text-[15px] leading-relaxed text-[#68717D]">
                          {item.dek}
                        </p>
                      ) : null}
                      {/* mt-auto pins the byline down so dates line up across a
                          row regardless of how long each dek runs. */}
                      <p className="mt-auto pt-4 text-[13px] text-[#8c97a2]">
                        {item.dateLabel ? `${item.dateLabel} · ` : ""}
                        {item.readMinutes} min read
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
          : "rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-[#3f474f] transition-colors hover:border-[#c8ced4] hover:text-[#101727]"
      }
    >
      {children}
    </Link>
  );
}
