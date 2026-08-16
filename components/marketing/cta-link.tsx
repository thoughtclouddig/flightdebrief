import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Same button classes as the homepage hero/pricing CTAs, shared so every marketing page's buttons look identical. */
export function CtaLink({
  href,
  variant = "primary",
  className,
  onClick,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary" | "dark";
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-center text-base font-semibold",
        variant === "primary" && "bg-brand text-white hover:bg-brand-dark",
        variant === "secondary" && "border border-slate-200 text-[#101727] hover:bg-[#f4f5f6]",
        variant === "dark" && "border border-white/20 text-white hover:bg-white/10",
        className,
      )}
    >
      {children}
    </Link>
  );
}
