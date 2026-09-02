"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

/**
 * The nav IS the process.
 *
 * Three destinations and a More menu, chosen by what a visitor actually
 * arrives wanting: what is this, can I see it, what does it cost.
 *
 * This replaced Overview / Debrief / Next Flight / Progress, four anchors into
 * one page. Those read as a table of contents rather than navigation: they
 * only parse once you already know what AfterFlight is, and "Overview" was a
 * filler label sitting among three real stage names to fill a slot in a
 * four-item pattern. The cost was the whole visible tier -- Pricing, the live
 * demo, and both other audiences were all behind an unlabeled "+", which is
 * the money question and the strongest asset on the site hidden behind a
 * plus sign.
 *
 * The stage labels were not wrong, just in the wrong place. They belong in the
 * page as a rail that tracks while you read -- see the Debrief stage rail --
 * not in the header competing with navigation.
 *
 * No audience is named here, and that is deliberate. "For X" links exist to
 * serve people the default page does not, and this homepage IS the student
 * page -- student-first from the hero down. A "For Students" item would point
 * from the students' page to the students' page, and a student who read a
 * student-focused hero and then saw it would reasonably wonder what they had
 * just been reading. Naming CFIs and schools while students had no slot had
 * the opposite problem: it implied the main page was written for someone
 * else. Naming nobody is neutral, and the commercial priority is carried by
 * the homepage being the student page and Start Free going to student signup.
 *
 * How It Works points at the homepage carousel, NOT at /how-it-works. That
 * route is "How AfterFlight Works -- For School Owners" and covers what gets
 * captured, who sees what, and what happens when an instructor leaves -- an
 * institutional trust page that is now unlinked from the nav entirely. It is
 * still routable and still linked from the schools pages; if it stays
 * unlinked it should be retired rather than left to rot.
 *
 * Field Notes is primary rather than secondary because it is the only item
 * here that gives a visitor a reason to come back before they buy. Pricing
 * stays last: it is the question people arrive with, but ending the row on it
 * is what makes the row read as a funnel rather than a library.
 *
 * The page anchors #overview, #debrief, #next-flight and #progress all stay:
 * the hero, the final CTA, the footer and the Debrief rail still use them.
 */
const PRIMARY_LINKS = [
  { href: "/#overview", label: "How It Works" },
  { href: "/demo", label: "Demo" },
  { href: "/field-notes", label: "Field Notes" },
  { href: "/#pricing", label: "Pricing" },
];

/**
 * Secondary, and the grouping is the demotion.
 *
 * A flat bar listing "For Instructors" beside the product links tells a student
 * pilot the site is addressed to three audiences and leaves them to work out
 * which one they are. These stay one interaction away rather than removed --
 * every one also keeps its footer link.
 *
 * Enterprise, Privacy and Terms are deliberately absent. Enterprise has its own
 * sales path and does not belong in a student's overflow menu; Privacy and
 * Terms are footer material, and putting them a click from the logo gives legal
 * boilerplate the same standing as the product. All three keep their footer
 * links and their routes are untouched.
 */
const SECONDARY_GROUPS = [
  {
    label: "For CFIs & Schools",
    links: [
      { href: "/instructors", label: "For Instructors" },
      { href: "/schools", label: "For Flight Schools" },
    ],
  },
  {
    label: "Company",
    links: [
      { href: "/what-is-afterflight", label: "What Is AfterFlight" },
    ],
  },
];

export function MarketingNav({ contentPublic = true }: { contentPublic?: boolean }) {
  /*
   * Field Notes is behind CONTENT_PUBLIC, and this component cannot read it:
   * it is "use client", so process.env.CONTENT_PUBLIC is not there at runtime.
   * The flag is computed in the server layout and handed down, the same way
   * that layout already gates the footer's content column.
   *
   * This mattered the moment Field Notes was promoted out of the More menu.
   * lib/content/visibility.ts says the flag "covers every way the content can
   * be discovered, not just the pages" -- and with the link hardcoded into the
   * primary row, any environment without the flag showed a nav item that
   * 404s, because every page under /field-notes calls notFound(). Production
   * has the flag so it was fine there; dev does not, which is where it showed.
   */
  const primaryLinks = contentPublic ? PRIMARY_LINKS : PRIMARY_LINKS.filter((l) => l.href !== "/field-notes");
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
          <div className="flex items-center gap-6 text-[15px] font-semibold uppercase tracking-[0.06em] text-[#101727]">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b-2 border-transparent pb-0.5 transition-colors hover:border-brand"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* The secondary menu is gone from the desktop header.
              
              It was a dropdown with two group headings, a divider and a
              rotating icon, holding three links -- For Instructors, For Flight
              Schools, What Is AfterFlight -- every one of which is already in
              the footer. That is a lot of machinery to duplicate three links,
              and once the primary row went to caps the trigger read worse
              still: a symbol sitting among words.
              
              SECONDARY_GROUPS is kept and still renders in the mobile drawer,
              which is a full-height menu with room for a secondary tier and is
              where people expect to find everything. Nothing lost a home. */}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-5">
          <Link href="/login" className="hidden text-[15px] font-medium text-[#414B57] transition-colors hover:text-[#101727] sm:block">
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
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[56px] items-center border-b border-slate-100 border-l-2 border-l-transparent pl-3 text-[17px] font-bold uppercase tracking-[0.05em] text-[#101727]"
                >
                  {link.label}
                </Link>
              ))}

              {SECONDARY_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-1 pt-6 text-xs font-bold uppercase tracking-[0.14em] text-[#4E5A67]">
                    {group.label}
                  </p>
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className="flex min-h-[48px] items-center border-b border-slate-100 pl-3 text-[15px] font-medium text-[#414B57] last:border-b-0"
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
