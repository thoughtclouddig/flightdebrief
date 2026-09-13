/**
 * Small, hand-built SVG diagrams for the two moments in a Vector session
 * where a picture genuinely does work words can't: setting the scene for a
 * physical rehearsal, and reinforcing an aerodynamic concept.
 *
 * Deliberately NOT AI-generated images -- this is safety-adjacent aviation
 * content, and a generated image can't be trusted to get the labels or the
 * physics right. Plain SVG means every line and label is something we
 * actually wrote, it's crisp at any size, and it inherits the design
 * system's own tokens instead of shipping a raster asset that goes stale
 * the moment the palette changes.
 */

/** Chair Fly's scene-setter: the crosswind correction through the flare, the exact sequence the rehearsal is about. */
export function CrosswindProfileDiagram() {
  return (
    <svg viewBox="0 0 320 140" className="h-auto w-full" role="img" aria-label="Diagram of a crosswind landing approach: wing-low into the wind on final, correction held through the flare to touchdown">
      <line x1="20" y1="118" x2="300" y2="118" stroke="var(--dm-border)" strokeWidth="2" />
      {[60, 100, 140, 180, 220, 260].map((x) => (
        <rect key={x} x={x} y="114" width="14" height="8" fill="var(--dm-border)" />
      ))}

      {/* wind arrows, crossing the runway */}
      <g stroke="var(--dm-text-faint)" strokeWidth="1.5" fill="none" opacity="0.7">
        <path d="M40 40 L58 48" markerEnd="url(#arrow)" />
        <path d="M40 65 L58 73" markerEnd="url(#arrow)" />
      </g>

      {/* approach path */}
      <path d="M270 25 Q160 55 90 105" stroke="var(--dm-accent)" strokeWidth="2" strokeDasharray="4 4" fill="none" />

      {/* aircraft silhouette, wing-low, on final */}
      <g transform="translate(200,45) rotate(8)">
        <path d="M-22 0 L22 0 M0 -5 L0 9 M-8 8 L8 8" stroke="var(--dm-text)" strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="196" y="30" fontSize="9" fill="var(--dm-text-faint)">Wing low, into the wind</text>

      {/* aircraft at flare, correction held */}
      <g transform="translate(100,98) rotate(4)">
        <path d="M-20 0 L20 0 M0 -4 L0 8 M-7 7 L7 7" stroke="var(--dm-accent)" strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="60" y="132" fontSize="9" fill="var(--dm-accent)">Correction held through the flare</text>

      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--dm-text-faint)" />
        </marker>
      </defs>
    </svg>
  );
}

/** The coach moment's own concept: less relative airflow at lower airspeed means the same bank needs more aileron to hold. */
export function AileronEffectivenessDiagram() {
  return (
    <svg viewBox="0 0 320 130" className="h-auto w-full" role="img" aria-label="Diagram comparing aileron deflection needed at higher airspeed (small deflection, more airflow) versus lower airspeed (larger deflection, less airflow)">
      <g transform="translate(0,0)">
        <text x="70" y="16" fontSize="11" fontWeight="600" textAnchor="middle" fill="var(--dm-text-soft)">
          Higher airspeed
        </text>
        {[28, 40, 52, 64].map((y) => (
          <path key={y} d={`M10 ${y} L120 ${y}`} stroke="var(--dm-text-faint)" strokeWidth="1.5" opacity="0.6" markerEnd="url(#wind1)" />
        ))}
        <g transform="translate(65,95)">
          <path d="M-30 0 L30 0" stroke="var(--dm-text)" strokeWidth="3" strokeLinecap="round" />
          <path d="M22 0 L34 -6" stroke="var(--dm-accent)" strokeWidth="3" strokeLinecap="round" />
        </g>
        <text x="65" y="120" fontSize="9" textAnchor="middle" fill="var(--dm-text-faint)">
          Small aileron input holds the bank
        </text>
      </g>

      <line x1="160" y1="10" x2="160" y2="115" stroke="var(--dm-border)" strokeWidth="1" />

      <g transform="translate(160,0)">
        <text x="70" y="16" fontSize="11" fontWeight="600" textAnchor="middle" fill="var(--dm-text-soft)">
          Lower airspeed
        </text>
        {[34, 58].map((y) => (
          <path key={y} d={`M10 ${y} L120 ${y}`} stroke="var(--dm-text-faint)" strokeWidth="1.5" opacity="0.6" markerEnd="url(#wind1)" />
        ))}
        <g transform="translate(65,95)">
          <path d="M-30 0 L30 0" stroke="var(--dm-text)" strokeWidth="3" strokeLinecap="round" />
          <path d="M18 0 L38 -16" stroke="var(--dm-accent)" strokeWidth="3" strokeLinecap="round" />
        </g>
        <text x="65" y="120" fontSize="9" textAnchor="middle" fill="var(--dm-accent)">
          Same bank needs more aileron
        </text>
      </g>

      <defs>
        <marker id="wind1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--dm-text-faint)" opacity="0.6" />
        </marker>
      </defs>
    </svg>
  );
}

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
