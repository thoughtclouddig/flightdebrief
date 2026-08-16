import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/instructors", label: "For Instructors" },
  { href: "/schools", label: "For Schools" },
  { href: "/#pricing", label: "Pricing" },
];

export function MarketingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/brand/afterflight-lockup-dark.svg"
            alt="AfterFlight"
            width={166}
            height={26}
            priority
            className="h-5 w-auto sm:h-[26px]"
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
            Start Free Trial
          </Link>
        </div>
      </div>
    </header>
  );
}
