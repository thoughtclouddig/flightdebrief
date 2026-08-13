import { CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Numbered "Today's Suggested Focus" / "Next Flight Brief" card -- shared by the real app and marketing demos. */
export function NextLessonFocusCard({ title = "Today's Suggested Focus", items, className }: { title?: string; items: string[]; className?: string }) {
  return (
    <Card className={cn("border-brand/30 bg-brand/5", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="size-4 text-brand" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-2">
          {items.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-foreground">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                {i + 1}
              </span>
              {f}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
