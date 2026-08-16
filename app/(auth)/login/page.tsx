"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  "not-invited":
    "That email isn't linked to an AfterFlight profile yet. Ask your school's admin or CFI to invite you, then request a new sign-in link with the invited email.",
  expired: "That sign-in link is invalid or has expired. Request a new one below.",
  "auth-failed": "Sign-in failed. Please try again.",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const error = errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES["auth-failed"]) : null;

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Read the live DOM value rather than trusting only React state: some
    // browsers' autofill (seen in the Replit webview) fills the input
    // visually without firing the event React's onChange listens for,
    // leaving `email` state stale even though the field looks filled in.
    const formEmail = new FormData(e.currentTarget as HTMLFormElement).get("email");
    const value = typeof formEmail === "string" && formEmail.trim() ? formEmail : email;
    if (!value.trim()) {
      setFormError("Enter your email address.");
      return;
    }
    if (value !== email) setEmail(value);
    setSending(true);
    setFormError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setFormError("Something went wrong — check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/brand/afterflight-lockup-dark.svg"
          alt="AfterFlight"
          width={186}
          height={30}
          className="dark:hidden"
          priority
        />
        <Image
          src="/brand/afterflight-lockup-light.svg"
          alt="AfterFlight"
          width={186}
          height={30}
          className="hidden dark:block"
          priority
        />
        <p className="mt-2 text-sm text-foreground-soft">Sign in to your account</p>
      </div>

      {error && !sent ? (
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-emerald-500/10 px-4 py-6 text-center">
          <MailCheck className="size-8 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-foreground">
            Check your email — if <span className="font-medium">{email.trim().toLowerCase()}</span> has an
            account, a sign-in link is on its way. The link expires in 15 minutes.
          </p>
          <button
            type="button"
            className="text-xs text-foreground-faint hover:underline"
            onClick={() => setSent(false)}
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              className="mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {formError ? <p className="text-sm text-red-600 dark:text-red-400">{formError}</p> : null}
          <Button type="submit" size="lg" disabled={sending}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : null}
            Email me a sign-in link
          </Button>
        </form>
      )}

      <p className="text-center text-xs text-foreground-faint">
        Need an account? Ask your school&apos;s admin or CFI for an invite, then request a sign-in
        link with the invited email. Independent CFI or flight school?{" "}
        <Link href="/signup" className="text-brand hover:underline">
          Start your own AfterFlight
        </Link>
        .
      </p>
      <Link href="/" className="text-center text-xs text-foreground-faint hover:underline">
        &larr; Back to afterflight.com
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
