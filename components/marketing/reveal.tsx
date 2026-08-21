import type { ReactNode } from "react";

/** Server-rendered marketing layout wrapper; decorative reveal work is intentionally omitted. */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={className}>{children}</div>;
}
