"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Uploads a bundle from scripts/export-content.mjs into THIS database.
 *
 * Exists because production runs a separate database from the workspace, so
 * articles written and reviewed in dev do not exist on the live site. A file
 * upload keeps the deployment's connection string where it belongs -- a
 * staff session already proves who you are.
 */
interface ImportResult {
  topics: number;
  articles: number;
  research: number;
  refused: string[];
  skippedColumns: string[];
}

export function ImportContentButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/admin/content/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: text,
      });
      const body = (await res.json().catch(() => null)) as (ImportResult & { error?: string }) | null;
      if (!res.ok) {
        setError(body?.error ?? `Import failed (${res.status}).`);
        return;
      }
      setResult(body as ImportResult);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <Button variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
        Import bundle
      </Button>
      {error ? <p className="max-w-xs text-right text-xs text-danger">{error}</p> : null}
      {result ? (
        <p className="max-w-xs text-right text-xs text-white/50">
          {result.articles} article{result.articles === 1 ? "" : "s"}, {result.topics} topic
          {result.topics === 1 ? "" : "s"}, {result.research} report{result.research === 1 ? "" : "s"} written.
          {result.refused.length
            ? ` Refused ${result.refused.length} unsourced: ${result.refused.join(", ")}.`
            : ""}
          {result.skippedColumns.length
            ? ` Columns this database doesn't have yet, so not copied: ${result.skippedColumns.join(", ")}.`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
