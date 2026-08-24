"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

const PERSONA_COPY: Record<string, string> = {
  pilot: "Building your training history and lining up a flight for you to debrief...",
  cfi: "Building a student roster with real training history...",
  school: "Building a student roster with real training history...",
};

const POLL_INTERVAL_MS = 900;

function PreparingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const persona = searchParams.get("persona") ?? "pilot";
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (pollingRef.current) return;
    pollingRef.current = true;

    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/demo/status?token=${token}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.status === "ready") {
          router.push(data.redirectPath);
          return;
        }
        if (data.status === "error") {
          setError(data.message ?? "Couldn't start the demo. Please try again.");
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS);
      }
    }
    void poll();
    return () => {
      cancelled = true;
      pollingRef.current = false;
    };
  }, [token, router]);

  const displayError = error ?? (!token ? "Missing demo link. Please start again." : null);

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-white px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        {displayError ? (
          <>
            <p className="text-lg font-semibold text-[#101727]">{displayError}</p>
            <a href="/demo" className="mt-4 text-sm font-medium text-brand hover:underline">
              &larr; Back to the demo page
            </a>
          </>
        ) : (
          <>
            <Loader2 className="size-8 animate-spin text-brand" />
            <p className="mt-5 text-lg font-semibold text-[#101727]">Preparing your live demo</p>
            <p className="mt-2 text-sm text-[#68717D]">{PERSONA_COPY[persona] ?? PERSONA_COPY.pilot}</p>
          </>
        )}
      </div>
    </section>
  );
}

export default function DemoPreparingPage() {
  return (
    <Suspense>
      <PreparingContent />
    </Suspense>
  );
}
