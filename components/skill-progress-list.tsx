"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AcsBadge } from "@/components/acs-badge";
import { toneForSkillStatus, type SkillProgression } from "@/lib/skill-progress";
import type { CertificateType } from "@/lib/types";

/**
 * "Needs Coaching" is the one rung of the ladder that names a person. A solo
 * pilot has no coach, so it reads as a broken reference the same way
 * "waiting on your instructor" did. Display-only -- SkillProgressionStatus is
 * computed, never stored, so nothing in the data changes.
 */
const SOLO_STATUS_LABEL: Partial<Record<SkillProgression["status"], string>> = {
  "Needs Coaching": "Needs Work",
};

/**
 * School V2's audience flattens the internal 5-level ladder to the 3
 * approved V2 terms (see toneForSkillStatus) instead of just relabeling the
 * one "Needs Coaching" rung the way `solo` does -- a school admin isn't the
 * CFI tracking Developing-vs-Improving nuance. "Introduced" is deliberately
 * NOT folded into "Improving" here even though toneForSkillStatus's tone
 * bucket does that for meter-coloring purposes: it means exactly one flight
 * has touched this skill so far (see deriveStatus in lib/skill-progress.ts),
 * which isn't evidence of a trend yet -- calling it "Improving" would
 * overstate a skill that's barely been seen.
 */
const SCHOOL_STATUS_LABEL: Record<SkillProgression["status"], string> = {
  Introduced: "Introduced",
  Developing: toneForSkillStatus("Developing"),
  "Needs Coaching": toneForSkillStatus("Needs Coaching"),
  Improving: toneForSkillStatus("Improving"),
  Demonstrated: toneForSkillStatus("Demonstrated"),
};

const STATUS_VARIANT: Record<SkillProgression["status"], "success" | "neutral" | "outline" | "warning"> = {
  Demonstrated: "success",
  Improving: "neutral",
  Developing: "neutral",
  Introduced: "outline",
  "Needs Coaching": "warning",
};

/**
 * Renders the V1 Training Progress list -- qualitative status per skill, no
 * numeric score anywhere. Shared between /progress (full history) and the
 * debrief results page (flight-scoped subset). `dismissible` only renders the
 * dismiss control for CFIs/admins (see V1 change 14); students never see it.
 */
export function SkillProgressList({
  progressions,
  certificateType,
  dismissible = false,
  solo = false,
  audience = "internal",
}: {
  progressions: SkillProgression[];
  certificateType: CertificateType | null;
  dismissible?: boolean;
  /** Relabels the one status that names a coach -- see SOLO_STATUS_LABEL. */
  solo?: boolean;
  /** "school" flattens to the 3 approved V2 terms -- see SCHOOL_STATUS_LABEL. Default keeps every existing CFI/Student caller unchanged. */
  audience?: "internal" | "school";
}) {
  if (progressions.length === 0) {
    return <p className="text-sm text-foreground-faint">Nothing tracked yet -- keep flying.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-hairline">
      {progressions.map((p) => (
        <SkillProgressRow key={p.skill} progression={p} certificateType={certificateType} dismissible={dismissible} solo={solo} audience={audience} />
      ))}
    </div>
  );
}

function SkillProgressRow({
  progression,
  certificateType,
  dismissible,
  solo,
  audience,
}: {
  progression: SkillProgression;
  certificateType: CertificateType | null;
  dismissible: boolean;
  solo: boolean;
  audience: "internal" | "school";
}) {
  const [dismissed, setDismissed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleDismiss() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/training-signals/${progression.latestSignalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissed: true }),
      });
      if (res.ok) setDismissed(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (dismissed) return null;

  const recent = progression.history.slice(-4);
  const trendingUp = recent.length >= 2 && recent[recent.length - 1]!.status === "IMPROVING" && recent[0]!.status === "NEEDS_COACHING";
  const trendingDown = recent.length >= 2 && recent[recent.length - 1]!.status === "NEEDS_COACHING" && recent[0]!.status === "IMPROVING";

  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      <div className="w-full min-w-0 sm:flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{progression.label}</span>
          <AcsBadge skill={progression.skill} certificateType={certificateType} />
        </div>
        <p className="mt-0.5 text-xs text-foreground-faint">
          {progression.history.length} {progression.history.length === 1 ? "flight" : "flights"} tracked · Last
          flown{" "}
          {new Date(progression.history[progression.history.length - 1]!.flightDate + "T12:00:00").toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric", year: "numeric" },
          )}
        </p>
      </div>
      {trendingUp ? <TrendingUp className="size-4 shrink-0 text-good" /> : null}
      {trendingDown ? <TrendingDown className="size-4 shrink-0 text-danger" /> : null}
      <Badge variant={STATUS_VARIANT[progression.status]} className="shrink-0">
        {audience === "school"
          ? SCHOOL_STATUS_LABEL[progression.status]
          : ((solo ? SOLO_STATUS_LABEL[progression.status] : undefined) ?? progression.status)}
      </Badge>
      {dismissible ? (
        <button
          onClick={handleDismiss}
          disabled={submitting}
          aria-label={`Dismiss ${progression.label} signal`}
          className="shrink-0 rounded-full p-1 text-foreground-faint hover:bg-surface-sunken hover:text-foreground-soft"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
