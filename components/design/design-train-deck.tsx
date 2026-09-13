"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DesignAssignedPracticeCard, DesignTrainingUnitCard, DesignTransferCard } from "@/components/design/design-training-unit-card";
import type { DesignDeckItem } from "@/lib/design/train-fixtures";

/**
 * One card at a time, indexed across everything from this debrief -- no
 * more "Start Here" vs. "Also Train" tiers, no separate hidden overflow
 * list. Vector's own ranking only decides which card you land on first
 * (index 0, the one that gets the "Start here" eyebrow); every other unit,
 * including the transfer case, is reached the same way everything else is.
 *
 * Built on CSS scroll-snap rather than a gesture library: on a touch device
 * this already IS a native swipe (the browser's own horizontal scroll
 * physics, not a simulation of one), and on desktop the same scroll
 * position drives the arrow buttons and dots below -- one source of truth
 * for "which card is active," not three.
 */
export function DesignTrainDeck({ items }: { items: DesignDeckItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!el) return;
        const index = Math.round(el.scrollLeft / el.clientWidth);
        setActiveIndex((prev) => (prev === index ? prev : index));
      });
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" && activeIndex < items.length - 1) scrollToIndex(activeIndex + 1);
    if (e.key === "ArrowLeft" && activeIndex > 0) scrollToIndex(activeIndex - 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div
          ref={scrollerRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          role="region"
          aria-label={`Training card ${activeIndex + 1} of ${items.length}`}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, index) => (
            <div key={item.id} className="w-full shrink-0 snap-center">
              {item.kind === "transfer" ? (
                <DesignTransferCard unit={item} />
              ) : item.kind === "radio-assignment" ? (
                <DesignAssignedPracticeCard assignment={item} />
              ) : (
                <DesignTrainingUnitCard unit={item} eyebrow={index === 0 ? "Start here" : undefined} />
              )}
            </div>
          ))}
        </div>

        {/* Prev/next: a desktop affordance. Touch already has real swipe,
            so these stay hidden below md rather than duplicating it. */}
        {activeIndex > 0 ? (
          <button
            type="button"
            aria-label="Previous card"
            onClick={() => scrollToIndex(activeIndex - 1)}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--dm-border)] bg-[var(--dm-surface)] p-2.5 shadow-[var(--dm-shadow)] transition-colors hover:bg-[var(--dm-surface-muted)] md:flex"
          >
            <ChevronLeft className="size-5 text-[var(--dm-text)]" aria-hidden />
          </button>
        ) : null}
        {activeIndex < items.length - 1 ? (
          <button
            type="button"
            aria-label="Next card"
            onClick={() => scrollToIndex(activeIndex + 1)}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--dm-border)] bg-[var(--dm-surface)] p-2.5 shadow-[var(--dm-shadow)] transition-colors hover:bg-[var(--dm-surface-muted)] md:flex"
          >
            <ChevronRight className="size-5 text-[var(--dm-text)]" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Training cards">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Go to card ${index + 1} of ${items.length}`}
            onClick={() => scrollToIndex(index)}
            className={cn(
              "h-2 cursor-pointer rounded-full transition-all",
              index === activeIndex ? "w-6 bg-[var(--dm-accent)]" : "w-2 bg-[var(--dm-border)]",
            )}
          />
        ))}
      </div>
    </div>
  );
}
