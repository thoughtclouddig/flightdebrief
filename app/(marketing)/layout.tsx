import type { ReactNode } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background">
      <MarketingNav />
      {children}
      <footer className="border-t border-hairline bg-background px-6 py-10 text-sm text-foreground-faint">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© {new Date().getFullYear()} AfterFlight</p>
          <div className="flex gap-6">
            <Link href="#how-it-works" className="hover:text-foreground">
              How it works
            </Link>
            <Link href="#schools" className="hover:text-foreground">
              Flight schools
            </Link>
            <Link href="/app" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
