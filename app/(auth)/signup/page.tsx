"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError("Enter your name and email address.");
      return;
    }
    setSending(true);
    setFormError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, orgName: orgName || undefined }),
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
        <p className="mt-2 text-sm text-foreground-soft">Start your own AfterFlight, as an independent CFI</p>
      </div>

      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-emerald-500/10 px-4 py-6 text-center">
          <MailCheck className="size-8 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-foreground">
            Check your email — if <span className="font-medium">{email.trim().toLowerCase()}</span> doesn&apos;t
            already have an account, a confirmation link is on its way. Click it to finish setting up your
            organization. The link expires in 15 minutes.
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
            <Label htmlFor="signup-name">Your name</Label>
            <Input
              id="signup-name"
              name="name"
              autoComplete="name"
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              className="mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="signup-org-name">Organization name (optional)</Label>
            <Input
              id="signup-org-name"
              name="orgName"
              className="mt-1.5"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder={name ? `${name}'s Flight Training` : "Your Name's Flight Training"}
            />
          </div>
          {formError ? <p className="text-sm text-red-600 dark:text-red-400">{formError}</p> : null}
          <Button type="submit" size="lg" disabled={sending}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : null}
            Email me a confirmation link
          </Button>
        </form>
      )}

      <p className="text-center text-xs text-foreground-faint">
        Already have an account?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Sign in
        </Link>
        .
      </p>
      <Link href="/" className="text-center text-xs text-foreground-faint hover:underline">
        &larr; Back to afterflight.com
      </Link>
    </div>
  );
}
