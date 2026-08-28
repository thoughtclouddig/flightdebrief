"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/**
 * The resources index: search, topic filters, and a card grid.
 *
 * Filtering runs on the client over the already-loaded set rather than
 * round-tripping to the server. That is the right trade at this size -- the
 * whole library is a few dozen rows of text, and typing that waits on a
 * network hop feels broken. If the library ever outgrows that, this becomes a
 * server-filtered route and the component keeps its shape.
 *
 * Cards carry a topic badge, a date, and a read time because a reader
 * scanning an index is deciding what to spend ten minutes on, and those are
 * the three things that decision is made from.
 */

export interface ResourceCard {
  id: string;
  href: string;
  title: string;
  dek: string;
  topicId: string | null;
  topicName: string | null;
  imageSrc: string | null;
  dateLabel: string | null;
  readMinutes: number;
}

export interface ResourceTopicOption {
  id: string;
  name: string;
}

export function ResourceIndex({ cards, topics }: { cards: ResourceCard[]; topics: ResourceTopicOption[] }) {
  const [query, setQuery] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((card) => {
      if (topicId && card.topicId !== topicId) return false;
      if (!q) return true;
      return `${card.title} ${card.dek} ${card.topicName ?? ""}`.toLowerCase().includes(q);
    });
  }, [cards, query, topicId]);

  // Only offer a filter that can actually return something -- a pill that
  // always yields an empty grid is a dead end dressed as navigation.
  const offered = topics.filter((t) => cards.some((c) => c.topicId === t.id));

  return (
    <>
      <div className="relative mt-8 max-w-xl">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8c97a2]"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles"
          aria-label="Search articles"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[15px] text-[#101727] placeholder:text-[#8c97a2] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterPill active={topicId === null} onClick={() => setTopicId(null)}>
          All articles
        </FilterPill>
        {offered.map((topic) => (
          <FilterPill key={topic.id} active={topicId === topic.id} onClick={() => setTopicId(topic.id)}>
            {topic.name}
          </FilterPill>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-12 text-[#68717D]">
          {cards.length === 0 ? "Nothing published yet." : "No articles match that search."}
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((card) => (
            <article
              key={card.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-[#c8ced4]"
            >
              <Link href={card.href} className="flex flex-1 flex-col">
                <div className="aspect-[16/10] w-full overflow-hidden bg-[#f1efe8]">
                  {card.imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element -- served from /api/media, already sized and encoded
                    <img
                      src={card.imageSrc}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {card.topicName ? (
                    <span className="inline-flex w-fit rounded-md bg-[#f4f5f6] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.09em] text-[#56636f]">
                      {card.topicName}
                    </span>
                  ) : null}
                  <h3 className="font-display mt-3 text-pretty text-[19px] font-bold leading-[1.3] text-[#101727] group-hover:text-brand">
                    {card.title}
                  </h3>
                  {card.dek ? (
                    <p className="mt-2 line-clamp-3 text-pretty text-[15px] leading-relaxed text-[#68717D]">
                      {card.dek}
                    </p>
                  ) : null}
                  {/* mt-auto pins the byline to the bottom so a short dek and a
                      long one still line their dates up across a row. */}
                  <p className="mt-auto pt-4 text-[13px] text-[#8c97a2]">
                    {card.dateLabel ? `${card.dateLabel} · ` : ""}
                    {card.readMinutes} min read
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
          : "rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-[#3f474f] transition-colors hover:border-[#c8ced4] hover:text-[#101727]"
      }
    >
      {children}
    </button>
  );
}
