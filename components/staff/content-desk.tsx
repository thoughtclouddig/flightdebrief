"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DraftIdeaButton } from "./draft-idea-button";
import { RedraftArticleButton } from "./redraft-article-button";

/**
 * The content desk: everything AfterFlight is writing, in one table.
 *
 * The screens this replaces were a flat list of articles with a create form
 * bolted underneath, and a separate list for research. That layout answered
 * "what exists" and nothing else -- you could not see what was queued, what
 * was waiting on you, or what a draft looked like before it went live.
 *
 * So the organising idea here is the pipeline, not the table. A piece moves
 * Idea -> Queued -> Draft -> Published, each stage is a filter with a count,
 * and the count is the useful part: "3 drafts" is a to-do list. Ideas and
 * articles are different rows in the database but the same thing to a person
 * running a publication, so they share the table.
 */

export type Stage = "idea" | "queued" | "draft" | "published";

export interface ContentRow {
  id: string;
  title: string;
  stage: Stage;
  topicName: string | null;
  dateLabel: string;
  /** Where clicking the row goes -- an idea goes to review, a draft to its editor. */
  href: string;
  /** Present once there's something renderable to look at. */
  previewHref: string | null;
  liveHref: string | null;
  /** Set on queued rows: the idea this row can be drafted from, right here. */
  draftableIdeaId?: string | null;
  /** Set on real articles: rewriting is only meaningful once text exists. */
  redraftableId?: string | null;
}

const ARTICLE_STAGES: { key: Stage | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "idea", label: "Ideas" },
  { key: "queued", label: "Queued" },
  { key: "draft", label: "Drafts" },
  { key: "published", label: "Published" },
];

const STAGE_STYLE: Record<Stage, { label: string; className: string }> = {
  // Ideas and queued items are the same colour deliberately: neither is
  // written yet, and the difference between them is whose turn it is.
  idea: { label: "Idea", className: "bg-white/10 text-white/70" },
  queued: { label: "Queued", className: "bg-white/10 text-white/70" },
  draft: { label: "Draft", className: "bg-amber-400/15 text-amber-300" },
  published: { label: "Published", className: "bg-emerald-400/15 text-emerald-300" },
};

export function ContentDesk({
  articles,
  research,
  initialTab,
}: {
  articles: ContentRow[];
  research: ContentRow[];
  initialTab: "articles" | "research";
}) {
  const [tab, setTab] = useState<"articles" | "research">(initialTab);
  const [stage, setStage] = useState<Stage | "all">("all");
  const [query, setQuery] = useState("");

  const rows = tab === "articles" ? articles : research;
  const stages = tab === "articles" ? ARTICLE_STAGES : ARTICLE_STAGES.filter((s) => s.key !== "idea" && s.key !== "queued");

  const counts = useMemo(() => {
    const map = new Map<Stage | "all", number>([["all", rows.length]]);
    for (const row of rows) map.set(row.stage, (map.get(row.stage) ?? 0) + 1);
    return map;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (stage !== "all" && row.stage !== stage) return false;
      if (!q) return true;
      return `${row.title} ${row.topicName ?? ""}`.toLowerCase().includes(q);
    });
  }, [rows, stage, query]);

  function switchTab(next: "articles" | "research") {
    setTab(next);
    setStage("all");
  }

  return (
    <div className="flex flex-col">
      <div className="flex gap-6 border-b border-white/10">
        {(["articles", "research"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTab(key)}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-1 pb-3 text-sm font-semibold capitalize transition-colors",
              tab === key ? "border-brand text-white" : "border-transparent text-white/50 hover:text-white/80",
            )}
          >
            {key}
            <span className="ml-2 text-xs font-normal text-white/40">
              {key === "articles" ? articles.length : research.length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {stages.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStage(s.key)}
              aria-pressed={stage === s.key}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                stage === s.key ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/5 hover:text-white",
              )}
            >
              {s.label}
              <span className="ml-1.5 tabular-nums text-white/40">{counts.get(s.key) ?? 0}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles"
          aria-label="Search content"
          className="ml-auto h-9 w-56 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/35 focus:border-brand focus:outline-none"
        />
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-sm text-white/45">
          {rows.length === 0 ? "Nothing here yet." : "Nothing matches that filter."}
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.09em] text-white/40">
                <th className="px-4 py-2.5 font-semibold">Title</th>
                <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Topic</th>
                <th className="px-4 py-2.5 font-semibold">Stage</th>
                <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Updated</th>
                <th className="w-[210px] px-4 py-2.5 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const badge = STAGE_STYLE[row.stage];
                return (
                  <tr key={row.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link href={row.href} className="font-medium text-white hover:text-brand-bright">
                        {row.title}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-white/50 sm:table-cell">{row.topicName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-[0.07em]", badge.className)}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-sm tabular-nums text-white/40 md:table-cell">{row.dateLabel}</td>
                    <td className="w-[210px] px-4 py-3 align-top">
                      {/* Left-aligned in a fixed column rather than pushed
                          right. Rows carry different numbers of actions, so
                          right-aligning made every row start at a different
                          x and nothing lined up down the table. */}
                      <div className="flex gap-4 whitespace-nowrap text-sm">
                        {row.draftableIdeaId ? <DraftIdeaButton ideaId={row.draftableIdeaId} /> : null}
                        {row.redraftableId ? <RedraftArticleButton articleId={row.redraftableId} /> : null}
                        {row.previewHref ? (
                          <Link href={row.previewHref} className="font-medium text-white/60 hover:text-white">
                            Preview
                          </Link>
                        ) : null}
                        {row.liveHref ? (
                          <Link href={row.liveHref} className="font-medium text-white/60 hover:text-white">
                            View live
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
