import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

/** School-overview stat tile ("42 Active Students") -- shared by the real admin dashboard and marketing demos. */
export function AdminStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4">
        <p className="font-display text-3xl font-bold text-foreground">{value}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-faint">{label}</p>
      </CardContent>
    </Card>
  );
}
