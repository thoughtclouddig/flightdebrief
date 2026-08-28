"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/demo", label: "Live Demo" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/instructors", label: "For Instructors" },
  { href: "/schools", label: "For Schools" },
  // "Resources" is deliberately not in the public nav yet -- the hub has no
  // published articles, so it's crawlable/linkable but not surfaced as a
  // primary nav item until there's real content worth sending visitors to.
  { href: "/#pricing", label: "Pricing" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on any navigation. Adjusting state during render (React's own
  // pattern for "reset state when a prop changes") rather than in an effect,
  // so the menu is already closed on the first render after navigating
  // instead of flashing open for a frame.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // A hash-only link ("/#pricing") changes neither pathname nor the mounted
  // component, so the check above never fires for it. Without this the menu
  // could stay open with its full-screen backdrop mounted, silently
  // swallowing the next tap on the hamburger -- which is what read as "the
  // menu won't open again after going to How It Works".
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

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
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-5">
          <Link href="/login" className="hidden text-[15px] font-medium text-[#68717D] transition-colors hover:text-[#101727] sm:block">
            Log in
          </Link>
          <Link
            href="/signup"
            className="whitespace-nowrap rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-bright sm:px-4 sm:text-sm"
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
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex min-h-[52px] items-center text-base font-semibold text-[#101727] sm:hidden"
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
