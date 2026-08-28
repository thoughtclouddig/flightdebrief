import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        neutral: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
        success: "bg-good/15 text-good-ink dark:bg-good/20 dark:text-good-ink",
        warning: "bg-amber/15 text-amber-ink dark:bg-amber/20 dark:text-amber-ink",
        danger: "bg-danger/15 text-danger-ink dark:bg-danger/20 dark:text-danger-ink",
        outline: "border border-slate-300 text-slate-600 dark:border-white/20 dark:text-slate-300",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
