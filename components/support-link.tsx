"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, LifeBuoy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Status = "idle" | "sending" | "sent" | "error";

const ROLE_LABEL: Record<string, string> = { instructor: "CFI", admin: "School admin", student: "Student" };

/**
 * "Get help" in the product nav. Until this existed every support link lived
 * on marketing pages, so a signed-in user whose debrief wouldn't analyze had
 * nowhere to go -- the error said "try again" and stopped.
 *
 * Used to be a raw `mailto:` link with the org/role/page context stuffed
 * into the body -- did nothing for anyone without a mail client configured
 * (a sandboxed webview, or anyone using webmail). Now opens a small popover
 * that posts through the same real backend as every other in-app support
 * surface (POST /api/support/contact -> lib/email.ts's
 * sendSupportRequestEmail), so it works the same for everyone. Sender
 * identity comes from the authenticated viewer server-side, not this props
 * object -- name here is only used for the "Sent, {name}" confirmation
 * line; org and the current page are folded into the message itself since
 * the backend only takes context+message.
 */
export function SupportLink({
  name,
  organizationName,
  role,
  compact = false,
}: {
  name: string;
  organizationName: string;
  role: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function submit() {
    if (!message.trim()) return;
    setStatus("sending");
    try {
      const fullMessage = [message, "", "---", `Organization: ${organizationName}`, `Page: ${pathname}`].join("\n");
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: ROLE_LABEL[role] ?? role, message: fullMessage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.sent) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  function close() {
    setOpen(false);
    setStatus("idle");
    setMessage("");
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Get help"
        aria-expanded={open}
        title="Get help"
        className={cn(
          "flex items-center justify-center transition-colors",
          compact
            ? "size-11 rounded-full text-foreground-faint hover:text-foreground"
            : "size-10 rounded-lg text-foreground-faint hover:bg-surface-sunken hover:text-foreground",
          open && "text-foreground",
        )}
      >
        <LifeBuoy className={compact ? "size-[22px]" : "size-[18px]"} />
      </button>

      {open ? (
        <>
          {/* Click-away layer: sits under the popover, above everything else. */}
          <button
            type="button"
            aria-label="Close support"
            onClick={close}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-hairline bg-surface p-4 shadow-lg">
            {status === "sent" ? (
              <div className="flex items-center gap-2.5 text-[14px] text-foreground-soft">
                <CheckCircle2 className="size-[18px] shrink-0 text-good" aria-hidden />
                Sent, {name.split(" ")[0]} — we answer within a day.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[14px] font-semibold text-foreground">Get help</p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's going on?"
                  rows={4}
                  autoFocus
                  className="w-full rounded-lg border border-hairline bg-surface-sunken px-3 py-2.5 text-[14px] text-foreground placeholder:text-foreground-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                {status === "error" ? (
                  <p className="text-[13px] text-danger">
                    Couldn&rsquo;t send that -- try again, or email{" "}
                    <a href="mailto:support@getafterflight.com" className="font-semibold underline">
                      support@getafterflight.com
                    </a>{" "}
                    directly.
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={close} className="flex-1" disabled={status === "sending"}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={submit} disabled={status === "sending" || !message.trim()} className="flex-1">
                    {status === "sending" ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    Send
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
