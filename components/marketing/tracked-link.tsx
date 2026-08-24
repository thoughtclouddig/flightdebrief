"use client";

import type { MouseEventHandler, ReactNode } from "react";
import Link from "next/link";
import { trackEvent, type MarketingEvent } from "@/lib/marketing/analytics";

export function TrackedLink({
  href,
  event,
  className,
  rel,
  prefetch,
  onClick,
  children,
}: {
  href: string;
  event: MarketingEvent;
  className?: string;
  /** For links to non-page destinations (e.g. an API route), e.g. "nofollow". */
  rel?: string;
  prefetch?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={(clickEvent) => {
        trackEvent(event);
        onClick?.(clickEvent);
      }}
      className={className}
      rel={rel}
    >
      {children}
    </Link>
  );
}