import { SchoolV2SettingsScreen } from "@/components/school-v2/settings-screen";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function SchoolV2SettingsPage() {
  const viewer = await getViewer();
  return (
    <SchoolV2SettingsScreen
      name={viewer.user.name}
      email={viewer.user.email}
      avatarUrl={viewer.user.avatarUrl}
      organizationName={viewer.organization.name}
      organizationKind={viewer.organization.kind}
    />
  );
}
