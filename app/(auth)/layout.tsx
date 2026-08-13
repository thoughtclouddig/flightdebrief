import type { ReactNode } from "react";

/** No Nav/viewer -- these pages exist precisely because there's no session yet. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
