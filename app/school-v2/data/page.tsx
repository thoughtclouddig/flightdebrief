import { SchoolV2DataConsentScreen } from "@/components/school-v2/data-consent-screen";
import { effectiveRetentionDays } from "@/lib/consent";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function SchoolV2DataPage() {
  const viewer = await getViewer();
  const repo = getRepository();
  const org = await repo.getOrganization(viewer.organization.id);
  const retentionDays = effectiveRetentionDays(org?.transcriptRetentionDays);
  return <SchoolV2DataConsentScreen retentionDays={retentionDays} />;
}
