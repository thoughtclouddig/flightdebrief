"use client";

import { useState } from "react";
import { Loader2, Mic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Copy lives here, as one constant, so jurisdiction-specific wording can
 * change later without touching the recording flow itself (see db/schema.sql's
 * consent_records table comment).
 */
const CONSENT_COPY =
  "This debrief will be recorded, transcribed, and analyzed by AI, then stored in the student's training history. Both of you should be comfortable with that before starting.";

/**
 * A solo pilot is the only person in the recording, so the two-party framing
 * ("both of you", "the student's history", "we agree") describes a room that
 * isn't there. Same disclosure and the same consent record -- just written to
 * the one person actually reading it.
 */
const SOLO_CONSENT_COPY =
  "This debrief will be recorded, transcribed, and analyzed by AI, then stored in your training history.";

/**
 * Lightweight step shown before either recorder starts -- not a legal form,
 * just a clear disclosure and a single acknowledgment. On grant, records
 * consent for the signed-in participant via POST before recording begins.
 */
export function RecordingConsent({
  flightId,
  onGranted,
  solo = false,
}: {
  flightId: string;
  onGranted: () => void;
  /** True when nobody else is in the debrief -- see SOLO_CONSENT_COPY. */
  solo?: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAgree() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/flights/${flightId}/debrief/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "granted" }),
      });
      if (!res.ok) throw new Error("Consent failed");
      onGranted();
    } catch {
      setError("Couldn't record consent. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Mic className="size-6" />
        </span>
        <div>
          <p className="font-medium text-foreground">Before you start recording</p>
          <p className="mt-1.5 max-w-sm text-sm text-foreground-soft">{solo ? SOLO_CONSENT_COPY : CONSENT_COPY}</p>
        </div>
        <button
          onClick={handleAgree}
          disabled={submitting}
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {solo ? "I agree, start recording" : "We agree, start recording"}
        </button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
