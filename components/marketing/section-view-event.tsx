"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type MarketingEvent } from "@/lib/marketing/analytics";

export function SectionViewEvent({ event }: { event: MarketingEvent }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      trackEvent(event);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        trackEvent(event);
        observer.disconnect();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [event]);

  return <span ref={ref} className="pointer-events-none absolute inset-x-0 top-0 h-px" aria-hidden="true" />;
}