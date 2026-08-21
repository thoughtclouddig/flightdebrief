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
        "transition-[transform,box-shadow,background-color] duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        variant === "primary" && "bg-brand text-white hover:bg-brand-bright hover:shadow-lg hover:shadow-brand/25",
        variant === "secondary" && "border border-slate-200 text-[#101727] hover:bg-[#f4f5f6] hover:shadow-md",
        variant === "dark" && "border border-white/20 text-white hover:bg-white/10",
        className,
      )}
    >
      {children}
    </Link>
  );
}
