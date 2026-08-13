"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "reset-sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication isn't configured for this deployment.");
      setStatus("idle");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setStatus("idle");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email above first, then click “Forgot password”.");
      return;
    }
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/invite/accept`,
    });
    // Supabase's recovery link isn't PKCE-based either -- the browser client
    // parses the URL hash and establishes a session automatically once the
    // person lands on /invite/accept, same as the invite flow.
    setStatus("reset-sent");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">
          FlightBrief
        </h1>
        <p className="mt-1 text-sm text-foreground-soft">Sign in to your account</p>
      </div>

      {status === "reset-sent" ? (
        <p className="rounded-lg bg-brand/10 px-4 py-3 text-center text-sm text-brand-dark dark:text-brand-light">
          If an account exists for {email}, a password reset link is on its way.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <Button type="submit" size="lg" disabled={status === "submitting"}>
            {status === "submitting" ? "Signing in…" : "Sign in"}
          </Button>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-center text-sm text-foreground-soft hover:text-brand hover:underline"
          >
            Forgot password?
          </button>
        </form>
      )}

      <p className="text-center text-xs text-foreground-faint">
        Need an account? Ask your school’s admin or CFI for an invite.
      </p>
      <Link href="/" className="text-center text-xs text-foreground-faint hover:underline">
        ← Back to flightbrief.com
      </Link>
    </div>
  );
}
