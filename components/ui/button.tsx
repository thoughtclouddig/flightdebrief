import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // font-semibold, not font-medium: at Archivo's weights a 500 button label
  // reads noticeably lighter than the body copy around it, which made CTAs
  // look secondary even when they were the primary action.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Brightens on hover rather than darkening. Darkening reads as
        // "pressed"/disabled on an already-saturated orange; lifting toward
        // --brand-bright reads as responsive. Every other primary orange
        // button in the app matches this.
        default: "bg-brand text-white hover:bg-brand-bright focus-visible:ring-brand shadow-sm",
        secondary: "bg-surface-sunken text-foreground hover:bg-hairline/40",
        outline: "border border-hairline bg-transparent text-foreground hover:bg-surface-sunken",
        ghost: "hover:bg-surface-sunken",
        destructive: "bg-danger text-white hover:opacity-90",
      },
      size: {
        default: "h-11 px-5 text-[15px]",
        sm: "h-9 px-4 text-sm",
        lg: "h-14 px-7 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
