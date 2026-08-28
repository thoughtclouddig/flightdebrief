"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ArticleIdea } from "@/lib/types";

/**
 * The review queue. Everything here is shaped around the decision being cheap:
 * the whole idea fits in a glance, and approve/reject is one click with no
 * confirmation step, because an idea is trivially re-proposable and nothing is
 * destroyed by rejecting one.
 *
 * Rows disappear on decision rather than waiting for a refresh -- with a queue
 * you're working through, a row that stays put after you've judged it is the
 * fastest way to lose your place.
 */
export function IdeaReviewList({
  ideas,
  topicNames,
}: {
  ideas: ArticleIdea[];
  topicNames: Record<string, string>;
}) {
  const router = useRouter();
  const [decided, setDecided] = useState<Record<string, "approved" | "rejected">>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, status: "approved" | "rejected") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Couldn't save that.");
      setDecided((d) => ({ ...d, [id]: status }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that.");
    } finally {
      setBusy(null);
    }
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5 }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Couldn't generate ideas.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate ideas.");
    } finally {
      setGenerating(false);
    }
  }

  const pending = ideas.filter((i) => !decided[i.id]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-foreground-soft">
          {pending.length} awaiting review
          {Object.keys(decided).length > 0 ? ` · ${Object.keys(decided).length} decided just now` : ""}
        </p>
        <Button size="sm" onClick={generate} disabled={generating}>
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Propose more
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {pending.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline p-8 text-center text-sm text-foreground-soft">
          Nothing awaiting review. Approved ideas get drafted on the next run.
        </div>
      ) : null}

      {pending.map((idea) => (
        <Card key={idea.id}>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{idea.title}</p>
                {idea.targetQuery ? (
                  // The reader's own words -- the fastest way to judge whether
                  // this is a question anyone actually asks.
                  <p className="mt-1 text-sm italic text-foreground-soft">&ldquo;{idea.targetQuery}&rdquo;</p>
                ) : null}
              </div>
              {idea.topicId ? (
                <Badge variant="neutral" className="shrink-0">
                  {topicNames[idea.topicId] ?? "No topic"}
                </Badge>
              ) : null}
            </div>

            {idea.angle ? <p className="text-sm text-foreground-soft">{idea.angle}</p> : null}
            {idea.rationale ? <p className="text-sm text-foreground-faint">{idea.rationale}</p> : null}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={busy === idea.id}
                onClick={() => decide(idea.id, "rejected")}
              >
                <X className="size-4" /> Reject
              </Button>
              <Button size="sm" className="flex-1" disabled={busy === idea.id} onClick={() => decide(idea.id, "approved")}>
                {busy === idea.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
