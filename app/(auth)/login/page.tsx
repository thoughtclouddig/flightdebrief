"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  "not-invited":
    "Your Replit account isn't linked to a FlightBrief profile yet. Ask your school's admin or CFI to invite the email on your Replit account.",
  expired: "That sign-in attempt expired. Please try again.",
  "auth-failed": "Sign-in failed. Please try again.",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const error = errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES["auth-failed"]) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">
          FlightBrief
        </h1>
        <p className="mt-1 text-sm text-foreground-soft">Sign in to your account</p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <a href="/api/auth/login" className={cn(buttonVariants({ size: "lg" }))}>
        Log in with Replit
      </a>

      <p className="text-center text-xs text-foreground-faint">
        Need an account? Ask your school’s admin or CFI for an invite, then log in with the Replit
        account that uses the invited email.
      </p>
      <Link href="/" className="text-center text-xs text-foreground-faint hover:underline">
        ← Back to flightbrief.com
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
