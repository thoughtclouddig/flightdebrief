"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, FileText, Sparkles, Trash2, X } from "lucide-react";

/**
 * The audio-privacy explanation, kept on the homepage.
 *
 * It used to link to /data-handling, which is a legal page written for
 * someone auditing the product rather than someone deciding to try it -- and
 * once a visitor landed there, getting back to where they were reading meant
 * the browser's back button. A reassurance that costs you the page you were
 * on is a bad trade at this point in the story.
 *
 * Four steps, because the reassurance IS the sequence: the recording exists,
 * it becomes a transcript, the transcript becomes the training record, and
 * then the audio is gone. Stating the last step alone sounds like a claim;
 * showing where it sits in the flow makes it checkable.
 *
 * /data-handling still exists and is still linked from the footer for anyone
 * who wants the full version.
 */
const STEPS = [
  { icon: Mic, title: "You record the debrief", copy: "The conversation you were already having, captured as you have it." },
  { icon: FileText, title: "It's securely transcribed", copy: "The audio is turned into text over an encrypted connection." },
  { icon: Sparkles, title: "The transcript becomes your training record", copy: "What went well, what needs work, and what carries into your next flight." },
  { icon: Trash2, title: "The audio is discarded", copy: "Once the transcript exists, the original recording is deleted. AfterFlight keeps the training record, not the recording." },
] as const;

export function AudioPrivacyNote() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes, and focus moves into the dialog on open so the keyboard
  // path matches the pointer one.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <p className="mx-auto mt-9 max-w-xl text-balance text-center text-sm leading-relaxed text-[#414B57]">
        Your audio is transcribed and then discarded. AfterFlight keeps the training record, not the recording &mdash;{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="cursor-pointer underline underline-offset-2 hover:text-[#101727]"
        >
          here&rsquo;s exactly how that works
        </button>
        .
      </p>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#101727]/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="How AfterFlight handles your audio"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl bg-white p-7 shadow-[0_40px_80px_-24px_rgba(16,23,39,0.45)] sm:p-9"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 flex size-9 cursor-pointer items-center justify-center rounded-lg text-[#414B57] transition-colors hover:bg-[#f4f5f6] hover:text-[#101727]"
            >
              <X className="size-5" />
            </button>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Your audio</p>
            <p className="font-display mt-2 text-balance text-2xl font-bold leading-tight text-[#101727]">
              Recorded, transcribed, then deleted.
            </p>

            <ol className="mt-7 flex flex-col gap-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f4f5f6] text-[#101727]">
                    <s.icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-balance text-[15px] font-bold text-[#101727]">
                      <span className="text-brand tabular-nums">{i + 1}. </span>
                      {s.title}
                    </p>
                    <p className="mt-1 text-pretty text-sm leading-relaxed text-[#414B57]">{s.copy}</p>
                  </div>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-8 w-full cursor-pointer rounded-xl bg-[#101727] px-5 py-3 text-base font-bold text-white transition-colors hover:bg-[#1b283d]"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
