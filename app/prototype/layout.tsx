import type { ReactNode } from "react";

/**
 * Standalone shell for the prototype.
 *
 * Deliberately NOT inside the (product) route group: that layout requires a
 * session and a database connection, which would make the prototype
 * impossible to open without seeding an account -- and the whole point is
 * that it can be evaluated in five minutes. It reads no session, touches no
 * repository, and renders from lib/prototype/vector-data.ts alone.
 *
 * Same design tokens as the app, so what you are judging is the product
 * decision rather than a different visual language.
 */
export default function PrototypeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface">
      <div className="border-b border-hairline bg-surface-sunken/60">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2">
          <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber">
            Prototype
          </span>
          <p className="text-xs text-foreground-faint">Seeded data &mdash; not connected to a real account</p>
        </div>
      </div>
      <div className="px-4 py-6">{children}</div>
    </div>
  );
}
