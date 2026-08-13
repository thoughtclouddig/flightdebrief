import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Big-number "N students have X" insight tile with a review link -- shared by the real admin insights page and marketing demos. */
export function InsightStatCard({
  icon: Icon,
  iconClassName,
  title,
  value,
  description,
  linkLabel,
  href,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  value: number;
  description: string;
  linkLabel: string;
  href: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={cn("size-4 text-brand", iconClassName)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-foreground-soft">{description}</p>
        </div>
        <Link href={href} className="shrink-0 text-sm font-medium text-brand hover:underline">
          {linkLabel} →
        </Link>
      </CardContent>
    </Card>
  );
}
