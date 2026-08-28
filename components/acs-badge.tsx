import { ExternalLink } from "lucide-react";
import { acsAreaForSkill } from "@/lib/acs";
import type { CertificateType, TrainingSkill } from "@/lib/types";

export function AcsBadge({
  skill,
  certificateType,
}: {
  skill: TrainingSkill;
  certificateType: CertificateType | null;
}) {
  const area = acsAreaForSkill(skill, certificateType);
  if (!area) return null;

  return (
    <a
      href={area.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md bg-surface-sunken px-2 py-0.5 text-xs font-semibold text-foreground-soft transition-colors hover:text-brand"
    >
      ACS: {area.name}
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}
