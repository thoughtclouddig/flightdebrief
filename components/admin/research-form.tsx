"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/slugify";
import { SourcesEditor } from "@/components/admin/sources-editor";
import type { ArticleStatus, ResearchReport, Source } from "@/lib/types";

const FIELD_CLASS =
  "mt-1.5 w-full rounded-lg border border-hairline bg-surface px-4 py-2.5 text-base text-foreground placeholder:text-foreground-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

type TextFieldKey =
  | "summary"
  | "keyFindings"
  | "methodology"
  | "sampleSize"
  | "dateRange"
  | "definitions"
  | "limitations"
  | "anonymizationNote"
  | "dataSource";

const TEXT_FIELDS: { key: TextFieldKey; label: string; rows: number }[] = [
  { key: "summary", label: "Summary (one-line, used as the meta description)", rows: 2 },
  { key: "keyFindings", label: "Key Findings", rows: 6 },
  { key: "methodology", label: "Methodology", rows: 4 },
  { key: "sampleSize", label: "Sample Size", rows: 1 },
  { key: "dateRange", label: "Date Range", rows: 1 },
  { key: "definitions", label: "Definitions", rows: 4 },
  { key: "limitations", label: "Limitations", rows: 4 },
  { key: "anonymizationNote", label: "Anonymization Explanation", rows: 4 },
  { key: "dataSource", label: "Data Source", rows: 2 },
];

/** Create/edit form for a research report -- mirrors article-form.tsx's pattern. */
export function ResearchForm({ report }: { report?: ResearchReport }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: report?.title ?? "",
    slug: report?.slug ?? "",
    summary: report?.summary ?? "",
    keyFindings: report?.keyFindings ?? "",
    methodology: report?.methodology ?? "",
    sampleSize: report?.sampleSize ?? "",
    dateRange: report?.dateRange ?? "",
    definitions: report?.definitions ?? "",
    limitations: report?.limitations ?? "",
    anonymizationNote: report?.anonymizationNote ?? "",
    dataSource: report?.dataSource ?? "",
    authorName: report?.authorName ?? "AfterFlight",
    reviewerName: report?.reviewerName ?? "",
    sources: report?.sources ?? ([] as Source[]),
    imageUrl: report?.imageUrl ?? "",
    status: (report?.status ?? "draft") as ArticleStatus,
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(report));
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
      const payload = { ...form, imageUrl: form.imageUrl.trim() || null, status: nextStatus ?? form.status };
      const res = await fetch(report ? `/api/admin/research/${report.id}` : "/api/admin/research", {
        method: report ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Something went wrong.");
        return;
      }
      router.push("/super-admin/research");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-5">
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div>
        <Label htmlFor="research-title">Title</Label>
        <Input
          id="research-title"
          className="mt-1.5"
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
          }}
        />
      </div>

      <div>
        <Label htmlFor="research-slug">Slug</Label>
        <Input
          id="research-slug"
          className="mt-1.5"
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setForm((f) => ({ ...f, slug: e.target.value }));
          }}
        />
      </div>

      {TEXT_FIELDS.map((field) => (
        <div key={field.key}>
          <Label htmlFor={`research-${field.key}`}>{field.label}</Label>
          {field.rows === 1 ? (
            <Input
              id={`research-${field.key}`}
              className="mt-1.5"
              value={form[field.key]}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
            />
          ) : (
            <textarea
              id={`research-${field.key}`}
              rows={field.rows}
              className={FIELD_CLASS}
              value={form[field.key]}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
            />
          )}
        </div>
      ))}

      <div>
        <Label htmlFor="research-author">Author name</Label>
        <Input
          id="research-author"
          className="mt-1.5"
          value={form.authorName}
          onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="research-reviewer">Reviewer name (optional)</Label>
        <Input
          id="research-reviewer"
          className="mt-1.5"
          value={form.reviewerName}
          onChange={(e) => setForm((f) => ({ ...f, reviewerName: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="research-image">Image URL (https:// or data:)</Label>
        <Input
          id="research-image"
          className="mt-1.5"
          placeholder="https://... or data:image/png;base64,..."
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
        />
        {form.imageUrl.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element -- must render both https:// and data: URLs; next/image can't optimize data: URLs
          <img src={form.imageUrl.trim()} alt="" className="mt-2 aspect-video w-full max-w-sm rounded-lg object-cover" />
        ) : null}
      </div>

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
