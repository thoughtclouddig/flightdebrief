"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TTS_VOICES, readStoredVoice, setStoredVoice } from "@/lib/tts-voices";

export function VoicePreferencePicker() {
  const [voice, setVoice] = useState(readStoredVoice);

  function choose(id: string) {
    setVoice(id);
    setStoredVoice(id);
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full border border-hairline bg-surface p-1">
      {TTS_VOICES.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => choose(v.id)}
          title={v.description}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            voice === v.id ? "bg-brand text-white" : "text-foreground-soft hover:bg-surface-sunken",
          )}
        >
          {v.name}
        </button>
      ))}
    </div>
  );
}
