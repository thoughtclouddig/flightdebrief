"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SkillState } from "@/lib/prototype/vector-data";

/**
 * The prototype's shared design language.
 *
 * Exists because the four screens were drifting into four designs -- each one
 * inventing its own section header, its own quote treatment, its own idea of
 * how much padding a card gets. Everything visual now comes from here, so a
 * change to the language is one edit rather than four.
 *
 * The colour discipline is the important part. Orange had been doing six
 * jobs: primary action, active tab, Vector, current focus, recurrence, and
 * "needs work". A colour meaning six things means nothing. It is now
 * reserved for ACTION AND IDENTITY -- the thing you tap, the tab you're on,
 * and Vector. State lives in a separate scale: green at standard, amber
 * needs work, muted for neutral.
 */

/** Page title. One per screen, and nothing else at this size. */
export function PageTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div>
      {kicker ? <p className="text-[15px] text-foreground-faint">{kicker}</p> : null}
      <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">{children}</h1>
    </div>
  );
}

/**
 * Section label. Sentence case, not all-caps -- the previous version had six
 * uppercase tracked labels per screen, which made every one of them read as
 * metadata and none of them as a heading.
 */
export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">{children}</h2>
      {action}
    </div>
  );
}

/** Vertical rhythm between major sections, applied once at the page level. */
export function Screen({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-8 px-6 pb-8 pt-6">{children}</div>;
}

export function Section({ children }: { children: ReactNode }) {
  return <section className="flex flex-col gap-3">{children}</section>;
}

/**
 * The one dominant card on a screen. Dark and elevated with an orange edge,
 * rather than a full orange slab -- the slab read as a banner ad and left
 * nothing for the primary button to do.
 */
export function PrimaryCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-foreground p-6 text-surface shadow-lg shadow-black/10">
      <span className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden />
      {children}
    </div>
  );
}

/** Everything that is not the dominant element. */
export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = cn("rounded-2xl border border-hairline bg-surface p-5", className);
  return onClick ? (
    <button onClick={onClick} className={cn(cls, "w-full text-left transition-colors hover:border-foreground-faint/40")}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  );
}

/** Primary action. Orange, full width, 52px -- one per screen. */
export function PrimaryButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls =
    "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-[17px] font-semibold text-brand-foreground transition-opacity active:opacity-90";
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** Secondary action. Never competes with the primary. */
export function SecondaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-hairline px-4 text-[15px] font-medium text-foreground transition-colors hover:border-foreground-faint/40"
    >
      {children}
    </button>
  );
}

/**
 * Vector's identity block. Shown wherever a student might meet Vector for
 * the first time, with the descriptor -- a brand name nobody can define is
 * just a word, and "Train with Vector" meant nothing on first run.
 */
export function VectorMark({ subtitle, context }: { subtitle?: string; context?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-4 text-brand" />
        <span className="text-[17px] font-semibold tracking-tight text-foreground">Vector</span>
      </div>
      {subtitle ? <p className="text-[15px] text-foreground-soft">{subtitle}</p> : null}
      {context ? <p className="text-[13px] text-foreground-faint">{context}</p> : null}
    </div>
  );
}

/**
 * An attributed quote. One treatment for every voice in the product, varied
 * only by a hairline rule and a small label -- loud per-source colour coding
 * would put four accents on one screen and undo the discipline above.
 */
export function Evidence({ label, text, quoted = true, tone = "neutral" }: { label: string; text: string; quoted?: boolean; tone?: "instructor" | "student" | "neutral" }) {
  const rule = tone === "instructor" ? "border-l-brand/60" : tone === "student" ? "border-l-good/60" : "border-l-hairline";
  return (
    <div className={cn("border-l-2 pl-3.5", rule)}>
      <p className="text-[13px] font-medium text-foreground-faint">{label}</p>
      <p className={cn("mt-0.5 text-[15px] leading-relaxed text-foreground-soft", quoted && "italic")}>
        {quoted ? `“${text}”` : text}
      </p>
    </div>
  );
}

/**
 * State colour lives here and nowhere else.
 *
 * Deliberately avoids orange: orange is reserved for action and identity, so
 * a skill sitting at "needs work" must not look like a button.
 *
 * Held one step deeper than the obvious pick. The 400/500 versions were
 * correct in hue and too loud in practice: four saturated meters stacked in a
 * list pulled attention away from the primary action and made a calm screen
 * feel like a status board. At 600 the states stay legible at a glance and
 * recede when you are not looking for them, which is what a colour used four
 * times per screen has to do.
 *
 * Amber-gold rather than the --amber token for "needs work": that token read
 * as muddy brown beside the brand orange, close enough in hue to look like a
 * dimmed CTA rather than its own state. Gold is warm rather than alarming,
 * which suits "work on this next" rather than "you failed".
 */
export function stateTone(state: SkillState) {
  return state === "Meets Standard"
    // emerald-500 rather than the --good token: that token is tuned for small
    // text on both themes and goes muted and dark as a fill, which made a
    // finished skill read as the least confident row on the screen. The one
    // state worth celebrating should be the brightest thing in the list.
    ? { text: "text-emerald-600", dot: "bg-emerald-600", fill: "bg-emerald-600" }
    : state === "Improving"
      ? { text: "text-sky-600", dot: "bg-sky-600", fill: "bg-sky-600" }
      : { text: "text-amber-500", dot: "bg-amber-500", fill: "bg-amber-500" };
}

/**
 * Where a skill stands, as a filled meter rather than a fraction.
 *
 * A number makes a student do arithmetic before they know anything. Four
 * segments in a state colour is read in one glance from arm's length, which
 * is the actual use -- checking a phone between other things. The value
 * survives as the accessible name, so a screen reader still gets what the
 * sighted reader gets from the fill.
 *
 * Segments rather than a continuous bar: the underlying assessment is a
 * discrete four-level scale, and a smooth bar would imply a precision the
 * instructor never expressed.
 */
export function SkillMeter({ score, max, state }: { score: number; max: number; state: SkillState }) {
  const tone = stateTone(state);
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`${state}, ${score} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={cn("h-2 w-5 rounded-full transition-colors", i < score ? tone.fill : "bg-hairline")} />
      ))}
    </span>
  );
}

export function StateLabel({ state }: { state: SkillState }) {
  const tone = stateTone(state);
  return <span className={cn("text-[13px] font-medium", tone.text)}>{state}</span>;
}
