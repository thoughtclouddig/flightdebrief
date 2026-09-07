import { Plane } from "lucide-react";
import { SchoolV2PlaceholderScreen } from "@/components/school-v2/placeholder-screen";

export default function SchoolV2AircraftPage() {
  return (
    <SchoolV2PlaceholderScreen
      title="Aircraft"
      description="Fleet management -- add, edit, or retire aircraft -- lands here in a later School V2 milestone. Canonical /admin/aircraft is unaffected."
      icon={Plane}
    />
  );
}
