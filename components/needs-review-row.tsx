import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NeedsReviewReason } from "@/lib/training-insights";

export const REASON_VARIANT: Record<NeedsReviewReason, "warning" | "neutral"> = {
  "Repeated Deficiency": "warning",
  "Repeated Carry-Forward": "warning",
  "Limited Feedback": "neutral",
};

/** One "Needs Review" queue row -- shared by the real admin insights page and marketing demos. */
export function NeedsReviewRow({
  studentName,
  detail,
  reason,
  href,
}: {
  studentName: string;
  detail: string;
  reason: NeedsReviewReason;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-surface-sunken"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-foreground-faint" />
        <div>
          <p className="text-sm font-medium text-foreground">{studentName}</p>
          <p className="text-sm text-foreground-soft">{detail}</p>
        </div>
      </div>
      <Badge variant={REASON_VARIANT[reason]}>{reason}</Badge>
    </Link>
  );
}
