import type { ComponentType } from "react";
import { Construction } from "lucide-react";

/**
 * Intentional placeholder for a School V2 destination not built in this
 * milestone -- exists so nav never silently falls back to canonical
 * /admin/** for a route that's on the map but not built yet.
 */
export function SchoolV2PlaceholderScreen({
  title,
  description,
  icon: Icon = Construction,
}: {
  title: string;
  description: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">{title}</h1>
      </header>
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-hairline px-6 py-8">
        <Icon className="size-6 text-foreground-faint" aria-hidden />
        <p className="max-w-md text-[15px] text-foreground-soft">{description}</p>
        <p className="text-[13px] text-foreground-faint">Coming in a later School V2 milestone.</p>
      </div>
    </div>
  );
}
