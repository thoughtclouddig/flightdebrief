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
        // Orange outline. A slate-200 border made the secondary CTA read as
        // disabled next to a solid orange primary; the brand outline pairs it
        // with the primary instead of retreating from it, while the dark ink
        // keeps the hierarchy -- filled beats outlined.
        variant === "secondary" && "border border-brand text-[#101727] hover:bg-brand/5 hover:shadow-md",
        variant === "dark" && "border border-white/20 text-white hover:bg-white/10",
        className,
      )}
    >
      {children}
    </Link>
  );
}
