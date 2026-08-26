"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/demo", label: "Live Demo" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/instructors", label: "For Instructors" },
  { href: "/schools", label: "For Schools" },
  { href: "/resources", label: "Resources" },
  { href: "/#pricing", label: "Pricing" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          onClick={() => {
            setOpen(false);
            // Link only resets scroll on an actual route change -- clicking the
            // logo while already on "/" is a no-op navigation, so it would
            // otherwise leave the page scrolled wherever it was.
            if (window.location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <Image
            src="/brand/afterflight-lockup-dark.svg"
            alt="AfterFlight"
            width={166}
            height={26}
            priority
            className="h-6 w-auto sm:h-[26px]"
          />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#68717D] lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#101727]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-[#68717D] hover:text-[#101727] sm:block">
            Log in
          </Link>
          <Link
            href="/signup"
            className="whitespace-nowrap rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark sm:px-4 sm:text-sm"
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

      {open ? (
        <>
          <button
            aria-label="Close menu"
            className="fixed inset-0 top-16 z-30 cursor-default bg-black/20 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute inset-x-0 top-16 z-40 border-b border-slate-200 bg-white shadow-lg lg:hidden">
            <div className="flex flex-col px-6 py-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[52px] items-center border-b border-slate-100 text-base font-semibold text-[#101727] last:border-b-0"
                >
                  {link.label}
                </Link>
              ))}
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
