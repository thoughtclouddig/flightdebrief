"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";

// Student-first, and the split is the point rather than a tidy-up. A flat bar
// listing "For Instructors" and "For Schools" beside the product links tells a
// student pilot that this site is addressed to three audiences and leaves them
// to work out which one they are. The primary row is now the product they
// would actually be buying; the audience pages move one interaction away,
// which is demotion, not removal -- both remain one click from every page,
// and both keep their footer links.
const NAV_LINKS = [
  { href: "/demo", label: "Live Demo" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#vector", label: "Vector" },
  { href: "/#progress", label: "Progress" },
  // Pricing stays last because it is adjacent to the signup CTA, and content
  // belongs before the ask rather than after it.
  { href: "/#pricing", label: "Pricing" },
];

const MORE_LINKS = [
  { href: "/instructors", label: "For Instructors" },
  { href: "/schools", label: "For Flight Schools" },
  { href: "/field-notes", label: "Field Notes" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on any navigation. Adjusting state during render (React's own
  // pattern for "reset state when a prop changes") rather than in an effect,
  // so the menu is already closed on the first render after navigating
  // instead of flashing open for a frame.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
    setMoreOpen(false);
  }

  // A hash-only link ("/#pricing") changes neither pathname nor the mounted
  // component, so the check above never fires for it. Without this the menu
  // could stay open with its full-screen backdrop mounted, silently
  // swallowing the next tap on the hamburger -- which is what read as "the
  // menu won't open again after going to How It Works".
  useEffect(() => {
    const close = () => {
      setOpen(false);
      setMoreOpen(false);
    };
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  // Dismissal for the desktop "More" menu. Pointerdown rather than click so a
  // press that starts outside the menu closes it before the target underneath
  // receives the event, and Escape because a disclosure that can only be
  // dismissed with a mouse is not keyboard-operable.
  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  // Don't leave the page scrollable behind an open full-screen menu.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function handleLogoClick(e: React.MouseEvent) {
    setOpen(false);
    if (pathname !== "/") return;
    // Already home: Link treats this as a no-op navigation, so nothing scrolls.
    // Clearing the hash first matters -- leaving "/#how-it-works" in the URL
    // lets the browser re-jump to that anchor and undo the scroll to top.
    e.preventDefault();
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Don't trust the smooth scroll to land. It is animated by the browser and
    // can be silently dropped (some engines, some automation contexts), which
    // is exactly the "tapped the logo and nothing happened" symptom this is
    // meant to fix. If we haven't actually moved shortly after, jump.
    window.setTimeout(() => {
      if ((document.scrollingElement?.scrollTop ?? 0) > 0) {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }, 600);
  }

  return (
    // Solid background, no backdrop-blur: backdrop-filter is the most common
    // cause of a fixed header misbehaving on iOS Safari, and it also creates a
    // containing block that broke position:fixed children (previously worked
    // around with a portal, no longer needed).
    <header className="fixed inset-x-0 top-0 z-40 bg-white">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6">
        <Link href="/" className="flex shrink-0 items-center" onClick={handleLogoClick}>
          <Image
            src="/brand/afterflight-lockup-dark.svg"
            alt="AfterFlight"
            width={166}
            height={26}
            priority
            className="h-6 w-auto sm:h-[26px]"
          />
        </Link>

        <nav className="hidden items-center gap-7 text-[15px] font-medium text-[#68717D] lg:flex">
          {NAV_LINKS.map((link) => {
            const active = !link.href.includes("#") && pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  "border-b-2 pb-0.5 transition-colors hover:border-brand hover:text-[#101727] " +
                  (active ? "border-brand text-[#101727]" : "border-transparent")
                }
              >
                {link.label}
              </Link>
            );
          })}

          <div ref={moreRef} className="relative">
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-haspopup="true"
              onClick={() => setMoreOpen((v) => !v)}
              className={
                "flex cursor-pointer items-center gap-1 border-b-2 pb-0.5 transition-colors hover:border-brand hover:text-[#101727] " +
                (moreOpen ? "border-brand text-[#101727]" : "border-transparent")
              }
            >
              More
              <ChevronDown
                className={"size-4 transition-transform " + (moreOpen ? "rotate-180" : "")}
                aria-hidden
              />
            </button>

            {moreOpen ? (
              <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
                {MORE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="flex min-h-[44px] items-center px-4 text-[15px] font-medium text-[#101727] hover:bg-[#f4f5f6]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-5">
          <Link href="/login" className="hidden text-[15px] font-medium text-[#68717D] transition-colors hover:text-[#101727] sm:block">
            Log in
          </Link>
          <Link
            href="/signup"
            className="whitespace-nowrap rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-bright hover:text-[#101727] sm:px-4 sm:text-sm"
          >
            Start Free
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="-mr-1.5 flex size-11 shrink-0 items-center justify-center rounded-lg text-[#101727] hover:bg-[#f4f5f6] lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Rendered inline rather than portaled -- with the blur gone the header
          no longer forms a containing block, so these position against the
          viewport correctly on their own. */}
      {open ? (
        <>
          <button
            aria-label="Close menu"
            className="fixed inset-0 top-16 z-30 cursor-default bg-black/20 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg lg:hidden">
            <div className="flex flex-col px-6 py-2">
              {NAV_LINKS.map((link) => {
                const active = !link.href.includes("#") && pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={
                      "flex min-h-[52px] items-center border-b border-slate-100 pl-3 text-base font-semibold text-[#101727] last:border-b-0 " +
                      (active ? "border-l-2 border-l-brand" : "border-l-2 border-l-transparent")
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
              {/* Same demotion as the desktop "More" menu, expressed the way a
                  narrow viewport can carry it: still present, still one tap,
                  visibly a second tier rather than a peer of the product links. */}
              <p className="px-3 pb-2 pt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#68717D]">More</p>
              {MORE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className="flex min-h-[52px] items-center border-b border-slate-100 pl-3 text-base font-medium text-[#68717D] last:border-b-0"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex min-h-[52px] items-center pt-2 text-base font-semibold text-[#101727] sm:hidden"
              >
                Log in
              </Link>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
