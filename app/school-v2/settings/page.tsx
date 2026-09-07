import { Settings } from "lucide-react";
import { SchoolV2PlaceholderScreen } from "@/components/school-v2/placeholder-screen";

export default function SchoolV2SettingsPage() {
  return (
    <SchoolV2PlaceholderScreen
      title="Settings"
      description="Organization name, workspace details, and account settings land here in a later School V2 milestone. Canonical /admin/settings is unaffected."
      icon={Settings}
    />
  );
}
