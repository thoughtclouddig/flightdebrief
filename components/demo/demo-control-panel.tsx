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

const SCENES: Scene[] = [
  { n: 1, label: "The Flight (dashboard)", persona: "student", href: "/home" },
  { n: 2, label: "Start Debrief", persona: "instructor", href: `/flights/${DEMO_FLIGHT_ID}` },
  {
    n: 3,
    label: "Guided Debrief (cards ready)",
    persona: "instructor",
    href: `/flights/${DEMO_FLIGHT_ID}/debrief?started=1`,
    note: "Click the mic to enter Recording (Scene 4), then End Debrief for Processing (Scene 5) -- one continuous take.",
  },
  {
    n: 4,
    label: "Recording",
    persona: "instructor",
    href: `/flights/${DEMO_FLIGHT_ID}/debrief?started=1`,
    note: "Same page as Scene 3 -- click the mic button to start.",
  },
  {
    n: 5,
    label: "AI Processing",
    persona: "instructor",
    href: `/flights/${DEMO_FLIGHT_ID}/debrief?started=1`,
    note: "Same page as Scene 3/4 -- click End Debrief to trigger this.",
  },
  { n: 6, label: "AfterFlight Summary (results)", persona: "instructor", href: `/flights/${DEMO_FLIGHT_ID}/debrief/results` },
  { n: 7, label: "Next Flight brief", persona: "student", href: "/next-lesson" },
  { n: 8, label: "Training Over Time (history)", persona: "student", href: "/history" },
  { n: 9, label: "CFI / School view", persona: "instructor", href: `/cfi/students/${DEMO_STUDENT_ID}` },
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
