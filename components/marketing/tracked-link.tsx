"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { trackEvent, type MarketingEvent } from "@/lib/marketing/analytics";

export function TrackedLink({
  href,
  event,
  className,
  children,
}: {
  href: string;
  event: MarketingEvent;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} onClick={() => trackEvent(event)} className={className}>
      {children}
    </Link>
  );
}