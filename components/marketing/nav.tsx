import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#0a0f1a]/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-display flex items-center gap-2 text-[17px] font-extrabold uppercase tracking-wide text-white">
          <span className="relative inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.6px] border-white/90">
            <span className="absolute h-[10px] w-[1.6px] rotate-[35deg] bg-white/90" />
          </span>
          FlightBrief
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
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0a0f1a] hover:bg-white/90"
        >
          Start with FlightBrief
        </Link>
      </div>
    </header>
  );
}
