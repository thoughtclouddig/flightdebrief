"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";

/**
 * Four primary destinations, and everything else demoted.
 *
 * The bar had six product links plus a More menu, which asked a visitor to
 * choose between Live Demo, How It Works, Vector, Progress and Pricing before
 * knowing what any of them were. Vector is a feature inside the loop rather
 * than a peer of it, and Live Demo is a thing you do after you understand the
 * product, not a way to navigate it.
 *
 * These four are the student's journey in the order the page tells it, so the
 * header and the page agree: understand the loop, see what happens between
 * lessons, see it add up, then the price.
 */
const PRIMARY_LINKS = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#between-flights", label: "Between Flights" },
  { href: "/#progress", label: "Progress" },
  // Pricing stays last because it is adjacent to the signup CTA, and content
  // belongs before the ask rather than after it.
  { href: "/#pricing", label: "Pricing" },
];

/**
 * Secondary, and the grouping is the demotion.
 *
 * A flat bar listing "For Instructors" beside the product links tells a student
 * pilot the site is addressed to three audiences and leaves them to work out
 * which one they are. These stay one interaction away rather than removed --
 * every one also keeps its footer link.
 */
const SECONDARY_GROUPS = [
  {
    label: "For CFIs & Schools",
    links: [
      { href: "/instructors", label: "For Instructors" },
      { href: "/schools", label: "For Flight Schools" },
      { href: "/enterprise", label: "Enterprise" },
    ],
  },
  {
    label: "Company",
    links: [
      { href: "/demo", label: "Live Demo" },
      { href: "/what-is-afterflight", label: "What Is AfterFlight" },
      { href: "/field-notes", label: "Field Notes" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  // One open-at-a-time: opening either secondary menu closes the other.
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on any navigation. Adjusting state during render (React's own
  // pattern for "reset state when a prop changes") rather than in an effect,
  // so the menu is already closed on the first render after navigating
  // instead of flashing open for a frame.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
    setOpenGroup(null);
  }

  // A hash-only link ("/#pricing") changes neither pathname nor the mounted
  // component, so the check above never fires for it. Without this the menu
  // could stay open with its full-screen backdrop mounted, silently
  // swallowing the next tap on the hamburger -- which is what read as "the
  // menu won't open again after going to How It Works".
  useEffect(() => {
    const close = () => {
      setOpen(false);
      setOpenGroup(null);
    };
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  // Dismissal for the desktop "More" menu. Pointerdown rather than click so a
  // press that starts outside the menu closes it before the target underneath
  // receives the event, and Escape because a disclosure that can only be
  // dismissed with a mouse is not keyboard-operable.
  useEffect(() => {
    if (!openGroup) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpenGroup(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenGroup(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openGroup]);

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

        <nav className="hidden items-center lg:flex">
          {/* Primary: ink, semibold, generous spacing. Secondary sits after a
              divider in lighter gray at a smaller size, so the four read as the
              header and the rest reads as the overflow. */}
          <div className="flex items-center gap-7 text-[15px] font-semibold text-[#101727]">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b-2 border-transparent pb-0.5 transition-colors hover:border-brand"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <span className="mx-6 h-5 w-px bg-slate-200" aria-hidden />

          <div className="flex items-center gap-5 text-sm font-medium text-[#68717D]">
            {SECONDARY_GROUPS.map((group) => (
              <div key={group.label} ref={group.label === openGroup ? menuRef : undefined} className="relative">
                <button
                  type="button"
                  aria-expanded={openGroup === group.label}
                  aria-haspopup="true"
                  onClick={() => setOpenGroup((v) => (v === group.label ? null : group.label))}
                  className={
                    "flex cursor-pointer items-center gap-1 transition-colors hover:text-[#101727] " +
                    (openGroup === group.label ? "text-[#101727]" : "")
                  }
                >
                  {group.label}
                  <ChevronDown
                    className={"size-4 transition-transform " + (openGroup === group.label ? "rotate-180" : "")}
                    aria-hidden
                  />
                </button>

                {openGroup === group.label ? (
                  <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpenGroup(null)}
                        aria-current={pathname === link.href ? "page" : undefined}
                        className="flex min-h-[44px] items-center px-4 text-[15px] font-medium text-[#101727] hover:bg-[#f4f5f6]"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
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
              {/* The same hierarchy a narrow viewport can carry: the four
                  primary destinations at full size with ink weight, then the
                  secondary groups under their own labels at a smaller size in
                  gray. Flattening everything into one list would make "Terms"
                  a peer of "Pricing". */}
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[56px] items-center border-b border-slate-100 border-l-2 border-l-transparent pl-3 text-[17px] font-bold text-[#101727]"
                >
                  {link.label}
                </Link>
              ))}

              {SECONDARY_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-1 pt-6 text-xs font-bold uppercase tracking-[0.14em] text-[#8c97a2]">
                    {group.label}
                  </p>
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className="flex min-h-[48px] items-center border-b border-slate-100 pl-3 text-[15px] font-medium text-[#68717D] last:border-b-0"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
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
