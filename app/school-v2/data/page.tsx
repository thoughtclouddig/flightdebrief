import { ShieldCheck } from "lucide-react";
import { SchoolV2PlaceholderScreen } from "@/components/school-v2/placeholder-screen";

export default function SchoolV2DataPage() {
  return (
    <SchoolV2PlaceholderScreen
      title="Data & consent"
      description="Retention settings and consent/trust details land here in a later School V2 milestone. Canonical /admin/data-handling is unaffected."
      icon={ShieldCheck}
    />
  );
}
