/**
 * Radio Practice's supporting cue -- not a diagram of anything, just an
 * honest visual signal that real audio is involved, since faking a
 * transcript or waveform down to real content would misrepresent a scenario
 * that hasn't played yet.
 */
export function AudioCue() {
  const bars = [10, 22, 15, 28, 12, 24, 18, 30, 14, 20];
  return (
    <div className="flex h-10 items-center gap-1" role="img" aria-label="Real recorded ATC audio">
      {bars.map((h, i) => (
        <span key={i} className="w-1.5 rounded-full bg-[var(--dm-accent)] opacity-70" style={{ height: `${h}px` }} />
      ))}
    </div>
  );
}
