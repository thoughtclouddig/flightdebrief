"use client";

import { useEffect, useState } from "react";
import { DEMO_FLIGHT_ID, DEMO_STUDENT_ID } from "@/lib/demo/video-demo-data";

type Persona = "student" | "instructor";

interface Scene {
  n: number;
  label: string;
  persona: Persona;
  href: string;
  note?: string;
}

/**
 * The capture running order, rewritten after the Aug 2026 competitive
 * teardown (council/demo-story.md).
 *
 * The previous list was a feature tour -- flight, debrief, summary, next
 * lesson, history, CFI view -- and it did not include either of the two
 * things the product is now positioned on: the student/instructor
 * perception gap (/compare) and the same weakness recurring across a change
 * of instructor (the handoff brief). Those are the only screens no
 * competitor can render, so they are now the middle of the story rather
 * than absent from it.
 *
 * Order follows the 3-minute script: cost of the lost debrief, capture that
 * costs the CFI nothing, the recap in the student's ear, THE REVEAL, the
 * pattern across instructors, then the handoff. Scenes 8-10 are the
 * supporting material to cut to, not part of the main take.
 */
const SCENES: Scene[] = [
  {
    n: 1,
    label: "The flight (student home)",
    persona: "student",
    href: "/home",
    note: "Opening beat: a flight happened, the debrief is the part that gets lost.",
  },
  {
    n: 2,
    label: "Start debrief",
    persona: "instructor",
    href: `/flights/${DEMO_FLIGHT_ID}`,
  },
  {
    n: 3,
    label: "Capture -- record, talk, stop",
    persona: "instructor",
    href: `/flights/${DEMO_FLIGHT_ID}/debrief?started=1`,
    note: "The adoption argument. Click the mic, talk, End Debrief -- one continuous take, no typing. Time it.",
  },
  {
    n: 4,
    label: "Structured result",
    persona: "instructor",
    href: `/flights/${DEMO_FLIGHT_ID}/debrief/results`,
    note: "Everything below came from that one conversation. Scroll to the audio recap and play five seconds of it.",
  },
  {
    n: 5,
    label: "THE REVEAL -- two views of the same flight",
    persona: "student",
    href: `/flights/${DEMO_FLIGHT_ID}/debrief/compare`,
    note: "\"She thinks she's got crosswinds. He thinks she doesn't. Neither knows the other said it.\" Needs both assessments submitted.",
  },
  {
    n: 6,
    label: "The pattern across instructors",
    persona: "instructor",
    href: `/cfi/students/${DEMO_STUDENT_ID}/handoff`,
    note: "\"4 lessons, 2 instructors -- Marcus taught the first half, Sarah the second. Neither could see the other's lessons.\"",
  },
  {
    n: 7,
    label: "The handoff brief",
    persona: "instructor",
    href: `/cfi/students/${DEMO_STUDENT_ID}/handoff#objectives`,
    note: "Same page, scrolled to what carries forward + the recommended starting point. Today this is a hallway conversation.",
  },
  {
    n: 8,
    label: "Student's next flight",
    persona: "student",
    href: "/next-lesson",
    note: "Supporting: the student's own side of the same brief.",
  },
  {
    n: 9,
    label: "Training over time",
    persona: "student",
    href: "/progress",
    note: "Supporting: recurrence from the student's view.",
  },
  {
    n: 10,
    label: "Recording, retention & deletion",
    persona: "instructor",
    // The PUBLIC page, not /admin/data-handling: the demo instructor is a
    // plain 'instructor' member, and the admin version notFound()s for
    // anyone who isn't an org admin. The public one is also the version you
    // would actually send a prospect before they have an account.
    href: "/data-handling",
    note: "The trust answer. Cut here when the objection is \"where does the audio live\".",
  },
];

export function DemoControlPanel() {
  // Deliberately not persisted across navigation -- each scene is a full
  // page load (see jumpTo below), so the panel simply reappears visible on
  // the next scene by default; hide it again with Alt+Shift+D right before
  // each individual recording take. Keeps this component free of any
  // localStorage/SSR-hydration handling.
  const [hidden, setHidden] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Alt+Shift+D -- deliberately not a visible control, so recording
      // never shows any affordance that this is a demo when hidden.
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "d") {
        setHidden((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (hidden) return null;

  function jumpTo(scene: Scene) {
    // A real full-page navigation, not router.push() -- the destination is
    // /api/demo/enter, which must run as an actual HTTP request so its
    // Set-Cookie (the session JWT + demo-mode marker) takes effect before
    // the redirect it issues renders the target scene.
    window.location.assign(`/api/demo/enter?as=${scene.persona}&next=${encodeURIComponent(scene.href)}`);
  }

  async function reset() {
    setResetting(true);
    try {
      await fetch("/api/demo/reset", { method: "POST" });
    } finally {
      setResetting(false);
      jumpTo(SCENES[0]);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[999] w-80 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 text-slate-100 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-400">Video Demo Mode</p>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="rounded-md border border-slate-600 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800"
        >
          Hide (Alt+Shift+D)
        </button>
      </div>

      <button
        type="button"
        onClick={reset}
        disabled={resetting}
        className="mb-3 w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {resetting ? "Resetting…" : "Reset Demo (Scene 1)"}
      </button>

      <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
        {SCENES.map((scene) => (
          <button
            key={scene.n}
            type="button"
            onClick={() => jumpTo(scene)}
            title={scene.note}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-800"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[11px] font-bold">
              {scene.n}
            </span>
            <span className="flex-1 truncate">{scene.label}</span>
            <span className="shrink-0 text-[10px] uppercase text-slate-500">{scene.persona === "instructor" ? "CFI" : "Student"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
