import type { ReactNode } from "react";

/** Static server-rendered row wrapper used where motion would add hydration cost. */
export function SlideInRight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={className}>{children}</div>;
}
