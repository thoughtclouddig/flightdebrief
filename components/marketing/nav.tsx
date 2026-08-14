import Link from "next/link";
import Image from "next/image";

export function MarketingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#101727]/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex shrink-0 items-center">
          <Image src="/brand/afterflight-lockup-light.svg" alt="AfterFlight" width={166} height={26} priority />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex">
          <Link href="#how-it-works" className="hover:text-white">
            How it works
          </Link>
          <Link href="#schools" className="hover:text-white">
            Flight schools
          </Link>
        </nav>

        <Link
          href="/app"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Start with AfterFlight
        </Link>
      </div>
    </header>
  );
}
