"use client";

import { useEffect, useRef, useState } from "react";
import { DebriefSummaryMockupCard } from "@/components/marketing/product-mockups";

/** How far below its anchored resting spot the card starts, in px -- reveals the iPad in the photo underneath it before the user scrolls. */
const REVEAL_OFFSET = 140;
/** Scroll distance (px) over which the card travels from revealed to anchored. */
const SCROLL_RANGE = 320;

/**
 * The card starts lower (uncovering the iPad the two people are holding in the
 * hero photo) and slides up as the page scrolls, easing to a stop exactly at
 * its bottom-anchored position -- never past it, so it always reads as
 * "docked" to the section's bottom edge rather than drifting. Once it
 * reaches the anchor it's locked there for good (a ref, not state, so
 * scrolling back to the top doesn't slide it back down and re-cover the
 * photo).
 */
export function HeroScoreCard({ className }: { className?: string }) {
  const [offset, setOffset] = useState(REVEAL_OFFSET);
  const lockedRef = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (lockedRef.current) return;
      const progress = Math.min(1, Math.max(0, window.scrollY / SCROLL_RANGE));
      setOffset(REVEAL_OFFSET * (1 - progress));
      if (progress >= 1) {
        lockedRef.current = true;
        window.removeEventListener("scroll", onScroll);
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <DebriefSummaryMockupCard className={className} style={{ transform: `translateY(${offset}px)` }} />;
}
