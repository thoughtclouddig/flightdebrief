import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-lg border border-hairline bg-surface px-4 text-base text-foreground placeholder:text-foreground-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
