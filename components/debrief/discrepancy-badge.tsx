import { Badge } from "@/components/ui/badge";
import type { DiscrepancyStatus } from "@/lib/types";

export function DiscrepancyBadge({ status }: { status: DiscrepancyStatus }) {
  if (status === "none") return <Badge variant="success">Agree</Badge>;
  if (status === "minor") return <Badge variant="warning">Slight difference</Badge>;
  return <Badge variant="warning">Worth discussing</Badge>;
}
