import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** "Keep working on" / "Before you fly" checklist card -- shared by the real app and marketing demos. */
export function ChecklistCard({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-brand" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-foreground-soft">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
