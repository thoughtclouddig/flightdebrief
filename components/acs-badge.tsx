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
      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark hover:bg-brand/20 dark:bg-brand/20 dark:text-brand-light dark:hover:bg-brand/30"
    >
      ACS: {area.name}
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}
