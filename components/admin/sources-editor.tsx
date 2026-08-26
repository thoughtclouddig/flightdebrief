import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Source, SourceType } from "@/lib/types";

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "faa_requirement", label: "FAA Requirement" },
  { value: "faa_guidance", label: "FAA Guidance" },
  { value: "ntsb", label: "NTSB" },
  { value: "nasa", label: "NASA" },
  { value: "peer_reviewed_research", label: "Peer-Reviewed Research" },
  { value: "industry_standard", label: "Industry Standard" },
  { value: "afterflight_research", label: "AfterFlight Research" },
  { value: "expert_opinion", label: "Expert Opinion" },
  { value: "afterflight_recommendation", label: "AfterFlight Recommendation" },
  { value: "afterflight_capability", label: "AfterFlight Capability" },
];

const FIELD_CLASS =
  "mt-1.5 w-full rounded-lg border border-hairline bg-surface px-4 py-2.5 text-base text-foreground placeholder:text-foreground-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

/** Repeatable label/url/sourceType editor shared by the article and research admin forms -- see the Source type in lib/types.ts. */
export function SourcesEditor({ sources, onChange }: { sources: Source[]; onChange: (next: Source[]) => void }) {
  function update(index: number, patch: Partial<Source>) {
    onChange(sources.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  return (
    <div>
      <Label>Sources</Label>
      <div className="mt-1.5 flex flex-col gap-3">
        {sources.map((source, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-hairline p-3">
            <div className="flex items-center gap-2">
              <select
                className={FIELD_CLASS + " mt-0 flex-1"}
                value={source.sourceType}
                onChange={(e) => update(i, { sourceType: e.target.value as SourceType })}
              >
                {SOURCE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Remove source"
                onClick={() => onChange(sources.filter((_, idx) => idx !== i))}
                className="rounded-md p-2 text-foreground-faint hover:bg-surface-sunken hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <Input placeholder="Label" value={source.label} onChange={(e) => update(i, { label: e.target.value })} />
            <Input placeholder="https://..." value={source.url} onChange={(e) => update(i, { url: e.target.value })} />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...sources, { label: "", url: "", sourceType: "afterflight_capability" }])}
        >
          <Plus className="size-3.5" />
          Add source
        </Button>
      </div>
    </div>
  );
}
