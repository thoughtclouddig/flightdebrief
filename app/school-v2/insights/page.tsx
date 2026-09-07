import { LineChart } from "lucide-react";
import { SchoolV2PlaceholderScreen } from "@/components/school-v2/placeholder-screen";

export default function SchoolV2InsightsPage() {
  return (
    <SchoolV2PlaceholderScreen
      title="Insights"
      description="Deeper training-pattern views across the whole school -- most common issues, recurring student themes, and coverage -- land here in a later milestone."
      icon={LineChart}
    />
  );
}
