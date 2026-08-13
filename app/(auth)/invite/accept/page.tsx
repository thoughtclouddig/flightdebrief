"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Where both an invite email link and a "forgot password" link land. Neither
 * uses Supabase's PKCE code-exchange flow (invites explicitly can't -- see
 * the invite route), so there's no server callback: the browser client
 * itself auto-parses the URL and establishes a session on load. Same action
 * either way once that happens: set a password.
 */
export default function AcceptInvitePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"checking" | "idle" | "submitting" | "no-session">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const sessionPromise = supabase ? supabase.auth.getSession() : Promise.resolve({ data: { session: null } });
    sessionPromise.then(({ data: { session } }) => {
      setStatus(session ? "idle" : "no-session");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setStatus("submitting");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication isn't configured for this deployment.");
      setStatus("idle");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setStatus("idle");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  if (status === "checking") {
    return <p className="text-center text-sm text-foreground-soft">Checking your link…</p>;
  }

  if (status === "no-session") {
    return (
      <div className="flex flex-col gap-3 text-center">
        <h1 className="font-display text-xl font-extrabold uppercase tracking-wide text-foreground">
          Link Expired
        </h1>
        <p className="text-sm text-foreground-soft">
          This invite or reset link is invalid or has expired. Ask whoever invited you to send a new one, or request
          another password reset from the sign-in page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">
          Set Your Password
        </h1>
        <p className="mt-1 text-sm text-foreground-soft">One last step before you&rsquo;re in.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <Button type="submit" size="lg" disabled={status === "submitting"}>
          {status === "submitting" ? "Saving…" : "Set password & continue"}
        </Button>
      </form>
    </div>
  );
}
