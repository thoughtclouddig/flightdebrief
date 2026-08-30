"use client";

import { useState } from "react";
import type { ArticleImagePrompt } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArticleImageField } from "./article-image-field";
import { slugify } from "@/lib/slugify";
import { SourcesEditor } from "@/components/admin/sources-editor";
import type { Article, ArticleStatus, ResourceTopic, Source } from "@/lib/types";

const FIELD_CLASS =
  "mt-1.5 w-full rounded-lg border border-hairline bg-surface px-4 py-2.5 text-base text-foreground placeholder:text-foreground-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

/** Create/edit form for a single article -- mirrors add-aircraft-form.tsx's client-form + fetch + router.refresh() pattern (no Server Actions in this codebase). */
export function ArticleForm({ topics, article }: { topics: ResourceTopic[]; article?: Article }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    topicId: article?.topicId ?? topics[0]?.id ?? "",
    dek: article?.dek ?? "",
    body: article?.body ?? "",
    authorName: article?.authorName ?? "AfterFlight",
    sources: article?.sources ?? ([] as Source[]),
    imageUrl: article?.imageUrl ?? "",
    status: (article?.status ?? "draft") as ArticleStatus,
  });
  // The shot brief lives outside `form` because the image route writes it as
  // a side effect of generating -- it is not a field the editor types into
  // and then saves, it round-trips through the generator.
  const [imagePrompt, setImagePrompt] = useState<ArticleImagePrompt | null>(article?.imagePrompt ?? null);
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(nextStatus?: ArticleStatus) {
    if (!form.title.trim() || !form.slug.trim()) {
      setError("Title and slug are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        imageUrl: form.imageUrl.trim() || null,
        imagePrompt,
        status: nextStatus ?? form.status,
      };
      const res = await fetch(article ? `/api/admin/articles/${article.id}` : "/api/admin/articles", {
        method: article ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Something went wrong.");
        return;
      }
      router.push("/super-admin/articles");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-5">
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div>
        <Label htmlFor="article-title">Title</Label>
        <Input
          id="article-title"
          className="mt-1.5"
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
          }}
        />
      </div>

      <div>
        <Label htmlFor="article-slug">Slug</Label>
        <Input
          id="article-slug"
          className="mt-1.5"
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setForm((f) => ({ ...f, slug: e.target.value }));
          }}
        />
      </div>

      <div>
        <Label htmlFor="article-topic">Topic</Label>
        <select
          id="article-topic"
          className={FIELD_CLASS}
          value={form.topicId}
          onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}
        >
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="article-dek">Dek (one-line summary, used as the meta description)</Label>
        <textarea
          id="article-dek"
          rows={2}
          className={FIELD_CLASS}
          value={form.dek}
          onChange={(e) => setForm((f) => ({ ...f, dek: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="article-body">Body (plain text, blank line between paragraphs)</Label>
        <textarea
          id="article-body"
          rows={16}
          className={FIELD_CLASS}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="article-author">Author name</Label>
        <Input
          id="article-author"
          className="mt-1.5"
          value={form.authorName}
          onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
        />
      </div>

      <ArticleImageField
        prompt={imagePrompt}
        onPromptChange={setImagePrompt}
        articleId={article?.id ?? null}
        value={form.imageUrl}
        onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))}
      />

      <SourcesEditor sources={form.sources} onChange={(sources) => setForm((f) => ({ ...f, sources }))} />

      <div className="flex gap-2">
        <Button variant="outline" disabled={saving} onClick={() => submit("draft")} className="flex-1">
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Save Draft
        </Button>
        <Button disabled={saving} onClick={() => submit("published")} className="flex-1">
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {form.status === "published" ? "Save & Keep Published" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
