"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const COMMIT_DISTANCE_PX = 80;
/** Below this, a mostly-vertical drag is treated as a scroll attempt, not a swipe -- so swiping doesn't hijack the page while someone's just scrolling past the card. */
const HORIZONTAL_BIAS = 1.3;

/**
 * Wraps a debrief question card with left/right swipe navigation --
 * touch-first (also works with mouse drag for desktop testing), additive to
 * the existing Back/Skip/Next buttons rather than replacing them, so nothing
 * is lost for anyone who'd rather tap. Swipe left = next, swipe right = back,
 * matching how the card stack already advances left-to-right.
 */
export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft,
  canSwipeRight,
  disabled,
}: {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  disabled?: boolean;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const axisLocked = useRef<"horizontal" | "vertical" | null>(null);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY };
    axisLocked.current = null;
    setDragging(true);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!start.current || disabled) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;

    if (axisLocked.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      axisLocked.current = Math.abs(dx) > Math.abs(dy) * HORIZONTAL_BIAS ? "horizontal" : "vertical";
    }
    if (axisLocked.current !== "horizontal") return;

    // Resist dragging past an edge instead of letting it swing free -- a
    // small give reads as "there's nothing that way" without feeling stuck.
    const atLeftEdge = dx < 0 && !canSwipeLeft;
    const atRightEdge = dx > 0 && !canSwipeRight;
    const resisted = atLeftEdge || atRightEdge ? dx / 3 : dx;
    setDragX(resisted);
  }

  function endDrag() {
    if (axisLocked.current === "horizontal") {
      if (dragX <= -COMMIT_DISTANCE_PX && canSwipeLeft) onSwipeLeft();
      else if (dragX >= COMMIT_DISTANCE_PX && canSwipeRight) onSwipeRight();
    }
    start.current = null;
    axisLocked.current = null;
    setDragging(false);
    setDragX(0);
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => dragging && endDrag()}
      style={{
        transform: `translateX(${dragX}px) rotate(${dragX / 40}deg)`,
        opacity: 1 - Math.min(Math.abs(dragX) / 400, 0.35),
        transition: dragging ? "none" : "transform 200ms ease, opacity 200ms ease",
        touchAction: "pan-y",
      }}
    >
      {children}
    </div>
  );
}
