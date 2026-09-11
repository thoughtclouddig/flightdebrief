"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuietRow } from "@/components/student/ui";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Replaces a raw `mailto:support@getafterflight.com` link, which does
 * nothing for anyone without a mail client configured -- the common case in
 * a sandboxed webview or for anyone using webmail. Sends through the real
 * app backend (POST /api/support/contact -> lib/email.ts's
 * sendSupportRequestEmail) instead, so it works the same for everyone
 * regardless of what's installed on their device. `context` labels which
 * in-app support surface this came from (e.g. "CFI") so support doesn't
 * have to guess.
 */
export function SupportContactForm({ context }: { context: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function submit() {
    if (!message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.sent) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex items-center gap-3 py-4 text-[15px] text-foreground-soft">
        <CheckCircle2 className="size-[18px] shrink-0 text-good" aria-hidden />
        Sent — we answer within a day.
      </div>
    );
  }

  if (!open) {
    return (
      <QuietRow
        onClick={() => setOpen(true)}
        label={
          <span className="flex items-center gap-3">
            <Mail className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
            Email support
          </span>
        }
        meta="1 day"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's going on?"
        rows={4}
        autoFocus
        className="w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-[15px] text-foreground placeholder:text-foreground-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      {status === "error" ? (
        <p className="text-[14px] text-danger">
          Couldn&rsquo;t send that -- try again, or email{" "}
          <a href="mailto:support@getafterflight.com" className="font-semibold underline">
            support@getafterflight.com
          </a>{" "}
          directly.
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={status === "sending"}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={status === "sending" || !message.trim()} className="flex-1">
          {status === "sending" ? <Loader2 className="size-4 animate-spin" /> : null}
          Send
        </Button>
      </div>
    </div>
  );
}
