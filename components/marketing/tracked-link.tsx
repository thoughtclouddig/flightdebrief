"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { trackEvent, type MarketingEvent } from "@/lib/marketing/analytics";

export function TrackedLink({
  href,
  event,
  className,
  rel,
  children,
}: {
  href: string;
  event: MarketingEvent;
  className?: string;
  /** For links to non-page destinations (e.g. an API route), e.g. "nofollow". */
  rel?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} onClick={() => trackEvent(event)} className={className} rel={rel}>
      {children}
    </Link>
  );
}