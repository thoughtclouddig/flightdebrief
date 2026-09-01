"use client";

import { useState } from "react";
import Image from "next/image";
import { LoaderCircle } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { TrackedLink } from "@/components/marketing/tracked-link";

const PERSONAS = [
  {
    title: "I'm a Pilot",
    copy: "Log a flight and debrief it yourself -- no CFI needed to try it.",
    href: "/api/demo/start?persona=pilot",
    event: "live_demo_pilot" as const,
    src: "/images/marketing/pilot-lifestyle-smile.webp",
    alt: "A confident pilot smiling at the controls",
  },
  {
    title: "I'm a CFI",
    copy: "See a real roster of students with debriefs ready to walk through.",
    href: "/api/demo/start?persona=cfi",
    event: "live_demo_cfi" as const,
    src: "/images/marketing/preflight-cfi-student.webp",
    alt: "A CFI briefing a student pilot before a flight",
  },
  {
    title: "I run a school",
    copy: "The same roster, from the admin's view.",
    href: "/api/demo/start?persona=school",
    event: "live_demo_school" as const,
    src: "/images/marketing/enterprise-training-center.webp",
    alt: "A flight school training center",
  },
];

/**
 * Shared card grid for the public, no-signup live demo (see
 * app/api/demo/start/route.ts) -- used on the dedicated
 * app/(marketing)/demo/page.tsx landing page. Each card is a full-page
 * navigation (not client routing) to an API route that provisions a fresh
 * demo org and sets a real session cookie.
 */
export function DemoPersonaCards({ delay = 0 }: { delay?: number }) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  return (
    <Reveal
      delay={delay}
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      {PERSONAS.map((p) => (
        <TrackedLink
          key={p.href}
          href={p.href}
          event={p.event}
          rel="nofollow"
          // This GET creates a persona-specific account and sets its session
          // cookie. Prefetching all three cards races those cookies and can
          // send a CFI URL to the school-admin session (which correctly 404s).
          prefetch={false}
          onClick={(event) => {
            event.preventDefault();
            if (pendingHref) return;
            setPendingHref(p.href);
            // Give React one paint to show feedback before the full-page API
            // navigation begins.
            window.setTimeout(() => window.location.assign(p.href), 50);
          }}
          className={`group relative overflow-hidden rounded-xl border border-[#E5E8EC] bg-[#f4f5f6] text-center transition-colors hover:border-brand/40 ${
            pendingHref && pendingHref !== p.href ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={p.src}
              alt={p.alt}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(min-width: 640px) 33vw, 100vw"
            />
          </div>
          <div className="flex flex-col gap-2 p-5">
            <p className="font-display text-xl font-bold text-[#101727] transition-colors group-hover:text-brand">{p.title}</p>
            <p className="text-balance text-base text-[#4b545d]">{p.copy}</p>
          </div>
          {pendingHref === p.href ? (
            <span
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 px-6 text-[#101727]"
              role="status"
              aria-live="polite"
            >
              <LoaderCircle className="size-7 animate-spin text-brand" aria-hidden="true" />
              <span className="font-display text-lg font-bold">Preparing your demo…</span>
              <span className="text-sm text-[#4b545d]">Loading realistic flights and training history.</span>
            </span>
          ) : null}
        </TrackedLink>
      ))}
    </Reveal>
  );
}
