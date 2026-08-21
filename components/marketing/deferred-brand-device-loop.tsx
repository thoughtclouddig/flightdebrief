"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BrandDeviceStatic } from "@/components/marketing/brand-device-static";

const AnimatedBrandDevice = lazy(() =>
  import("@/components/marketing/brand-device-loop").then((module) => ({
    default: module.BrandDeviceLoop,
  })),
);

/** Loads the timer/layout animation only shortly before the brand device enters view. */
export function DeferredBrandDeviceLoop() {
  const ref = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNearby(true);
        observer.disconnect();
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {nearby ? (
        <Suspense fallback={<BrandDeviceStatic />}>
          <AnimatedBrandDevice />
        </Suspense>
      ) : (
        <BrandDeviceStatic />
      )}
    </div>
  );
}