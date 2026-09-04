"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { stateTone, type SkillState } from "@/lib/student/state-tone";

/**
 * The prototype's shared design language. Implements
 * design-system/afterflight/MASTER.md; read that before changing anything here.
 *
 * Two rules do most of the work.
 *
 * COLOR BUDGET. Orange is reserved for action and identity -- the thing you
 * tap, the tab you're on, and Vector. It had been doing six jobs at once, and a
 * color that means six things means nothing. Skill state lives in its own
 * scale (--state-*), so a skill that needs work never looks like a button.
 *
 * ONE PANEL. The signature is a dark navy panel on a light canvas, not a dark
 * app. The panel is where the product makes its claim for the screen, it is the
 * only thing carrying a shadow, and there is normally one of it.
 */

/* ------------------------------------------------------------------ layout */

/**
 * Vertical rhythm between major sections, applied once at the page level.
 *
 * The canvas is sunken so the grouped sections below can be white cards that
 * physically separate from it. Before this the whole screen was one white
 * sheet with headings floating in it, and the sections ran together -- a
 * heading and the paragraph above it looked like the same block.
 */
export function Screen({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-7 bg-surface-sunken px-4 pb-10 pt-4">{children}</div>;
}

/**
 * A grouped section: a label outside, its content inside a white card.
 *
 * This is the iOS Settings/Health shape, and it is the fix for "everything
 * runs together". Whitespace alone cannot separate sections on a screen that
 * is already mostly whitespace; a surface change can. Pass `title` rather
 * than nesting a SectionLabel, so the label always sits outside the card and
 * the relationship reads the same on every screen.
 *
 * `flush` opts out of the card for content that supplies its own surface --
 * a Panel, or a stack of Evidence quotes that would look boxed twice.
 */
export function Section({
  children,
  title,
  action,
  flush = false,
}: {
  children: ReactNode;
  title?: ReactNode;
  action?: ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      {title ? <SectionLabel action={action}>{title}</SectionLabel> : null}
      {flush ? (
        children
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface px-5 py-4">{children}</div>
      )}
    </section>
  );
}

/** Page title. One per screen, and nothing else at this size. */
export function PageTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div>
      {kicker ? <p className="text-[15px] text-foreground-faint">{kicker}</p> : null}
      <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground">{children}</h1>
    </div>
  );
}

/**
 * Section label.
 *
 * Full-strength ink at bold, not faint at semibold. The faint version sat at
 * the same visual weight as the metadata line directly beneath it, so a label
 * and the thing it was labeling blended into one gray block -- the label has
 * to win that comparison or it is not doing a heading's job. Capped at two
 * per screen by the design system; that cap is what lets them be this loud.
 */
export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-1.5">
      <h2 className="text-[14px] font-bold uppercase tracking-[0.08em] text-foreground-soft">{children}</h2>
      {action}
    </div>
  );
}

/** Back affordance for a pushed sub-screen. Top-left, 44px, never a tab. */
export function BackLink({ href, children, onClick }: { href?: string; children: ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      <ChevronLeft className="size-[18px]" aria-hidden />
      {children}
    </>
  );
  const cls = "-ml-1 -mb-3 flex min-h-[44px] items-center gap-0.5 self-start pr-3 text-[15px] font-medium text-brand";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/* ------------------------------------------------------------------ panels */

/**
 * The one dominant element on a screen.
 *
 * Dark navy with an orange edge rather than a full orange slab: the slab was
 * the loudest thing on screen and it was not the thing to tap, which left the
 * actual primary action looking secondary. The shadow is the only one in the
 * light theme, which is how the panel earns its dominance -- if everything has
 * one, nothing does.
 */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-panel p-6 text-panel-foreground shadow-lg shadow-black/10",
        className,
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden />
      {children}
    </div>
  );
}

/**
 * The one uppercase line a panel is allowed. Says what kind of claim follows.
 *
 * `className` exists so a state-carrying eyebrow ("Needs Work") can wear the
 * state color rather than brand orange -- orange means "tap this", and an
 * eyebrow is never tappable.
 */
export function PanelEyebrow({
  children,
  icon,
  className,
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className ?? "text-brand")}>
      {icon}
      <span className="text-[13px] font-semibold uppercase tracking-[0.1em]">{children}</span>
    </div>
  );
}

/** The claim itself. One per panel. */
export function PanelHeadline({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[27px] font-semibold leading-[1.15] tracking-[-0.01em]">{children}</p>;
}

export function PanelMeta({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[15px] text-panel-foreground-soft">{children}</p>;
}

/** Everything that is not the dominant element. Flat, hairline, no shadow. */
export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = cn("rounded-2xl border border-hairline bg-surface p-5", className);
  return onClick ? (
    <button onClick={onClick} className={cn(cls, "w-full cursor-pointer text-left transition-colors hover:border-foreground-faint/40")}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  );
}

/* ----------------------------------------------------------------- actions */

const PRIMARY =
  "flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 text-[17px] font-semibold transition-[opacity,transform] duration-200 active:scale-[0.99] active:opacity-90";

/**
 * Primary action. Exactly one per screen.
 *
 * The label color comes from --on-brand rather than being written here, so
 * the whole product's orange fills change together -- see that token for the
 * measured contrast and why white is a deliberate exception.
 */
export function PrimaryButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls = cn(PRIMARY, "bg-brand text-on-brand");
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/**
 * The primary when it lives inside a panel. Orange on navy is legible but puts
 * two saturated blocks in the same 200px; the light fill reads as the obvious
 * target without adding a second accent.
 */
export function PanelButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls = cn(PRIMARY, "bg-panel-foreground text-panel");
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** Secondary action. Never orange, never competes with the primary. */
export function SecondaryButton({
  children,
  onClick,
  href,
  onPanel = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  onPanel?: boolean;
  /** Renders as a non-interactive, visibly muted marker instead of a link/button -- an explicit known-state gap, never a silent link elsewhere. */
  disabled?: boolean;
}) {
  const cls = cn(
    "flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 text-[15px] font-medium transition-colors duration-200",
    disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
    onPanel
      // Filled, not outlined. A hairline border against navy is barely a
      // shade off the panel itself, so the buttons dissolved into the
      // background -- on a dark ground a control has to be a surface, not an
      // edge. --panel-elevated lifts them off the panel; the brighter border
      // then reads as a rim rather than as the whole button.
      ? "border-panel-hairline bg-panel-elevated text-panel-foreground hover:border-panel-foreground-soft hover:bg-panel-elevated/70"
      : "border-hairline text-foreground hover:border-foreground-faint/40",
  );
  if (disabled) {
    return (
      <span className={cls} aria-disabled="true">
        {children}
      </span>
    );
  }
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** Navigation, not action. A hairline-separated row with a chevron. */
export function QuietRow({ href, label, meta, onClick }: { href?: string; label: ReactNode; meta?: ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      <span className="min-w-0 flex-1 text-[17px] text-foreground">{label}</span>
      {meta ? <span className="shrink-0 text-[15px] text-foreground-faint">{meta}</span> : null}
      <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
    </>
  );
  const cls =
    "flex min-h-[56px] w-full cursor-pointer items-center gap-3 border-b border-hairline text-left last:border-b-0";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/* ------------------------------------------------------------------ vector */

/**
 * Vector's identity block. Shown wherever a student might meet Vector for the
 * first time, with the descriptor -- a brand name nobody can define is just a
 * word, and "Train with Vector" meant nothing on first run.
 */
export function VectorMark({ subtitle, context, onPanel = false }: { subtitle?: string; context?: string; onPanel?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-4 text-brand" aria-hidden />
        <span className={cn("text-[17px] font-semibold tracking-tight", onPanel ? "text-panel-foreground" : "text-foreground")}>
          Vector
        </span>
      </div>
      {subtitle ? (
        <p className={cn("text-[15px]", onPanel ? "text-panel-foreground-soft" : "text-foreground-soft")}>{subtitle}</p>
      ) : null}
      {context ? (
        <p className={cn("text-[14px] leading-relaxed", onPanel ? "text-panel-foreground-soft" : "text-foreground-faint")}>
          {context}
        </p>
      ) : null}
    </div>
  );
}

/**
 * An attributed quote. One treatment for every voice in the product, varied
 * only by a hairline rule and a small label -- loud per-source color coding
 * would put four accents on one screen and undo the color budget.
 */
export function Evidence({
  label,
  text,
  quoted = true,
  tone = "neutral",
  onPanel = false,
}: {
  label: string;
  text: string;
  quoted?: boolean;
  tone?: "instructor" | "student" | "vector" | "neutral";
  onPanel?: boolean;
}) {
  const rule = onPanel
    ? "border-l-panel-hairline"
    : tone === "instructor"
      ? "border-l-brand/60"
      : tone === "student"
        ? "border-l-state-good/50"
        : tone === "vector"
          ? "border-l-state-improving/50"
          : "border-l-hairline";
  return (
    <div className={cn("border-l-2 py-1 pl-4", rule)}>
      <p className={cn("text-[14px] font-bold", onPanel ? "text-panel-foreground" : "text-foreground")}>{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[16px] leading-relaxed",
          onPanel ? "text-panel-foreground" : "text-foreground-soft",
          quoted && "italic",
        )}
      >
        {quoted ? `“${text}”` : text}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------- state */

// stateTone/SkillState now live in lib/prototype/state-tone.ts (a plain
// module, not "use client") and are imported above -- re-exported here so
// every existing `import { stateTone } from "@/components/student/ui"`
// keeps working unchanged. Server Components must import from
// lib/prototype/state-tone directly instead of from this file; see that
// module's own comment for why.
export { stateTone };

/**
 * Where a skill stands, as a filled meter rather than a fraction.
 *
 * A number makes a student do arithmetic before they know anything. Four
 * segments in a state color are read in one glance from arm's length, which
 * is the actual use -- checking a phone between other things. The value
 * survives as the accessible name, so a screen reader gets what the sighted
 * reader gets from the fill.
 *
 * Segments rather than a continuous bar: the underlying assessment is a
 * discrete four-level scale, and a smooth bar would imply a precision the
 * instructor never expressed.
 */
export function SkillMeter({
  score,
  max,
  state,
  onPanel = false,
  size = "md",
}: {
  score: number;
  max: number;
  state: SkillState;
  onPanel?: boolean;
  size?: "md" | "lg";
}) {
  const tone = stateTone(state, onPanel);
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`${state}, ${score} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "rounded-full transition-colors duration-200",
            size === "lg" ? "h-2.5 w-9" : "h-2 w-5",
            i < score ? tone.fill : tone.track,
          )}
        />
      ))}
    </span>
  );
}

export function StateLabel({ state, onPanel = false }: { state: SkillState; onPanel?: boolean }) {
  return <span className={cn("text-[14px] font-medium", stateTone(state, onPanel).text)}>{state}</span>;
}

/**
 * The ACS metadata row.
 *
 * Deliberately quiet. ACS is here so the product reads as real flight training
 * rather than generic AI coaching -- one line that says the skill belongs to a
 * recognized Area of Operation, then it gets out of the way. Codes live on the
 * skill-detail screen only, where a student who wants them will look.
 */
export function AcsBadge({ area, code, onPanel = false }: { area: string; code?: string; onPanel?: boolean }) {
  return (
    <p className={cn("text-[14px] leading-snug", onPanel ? "text-panel-foreground-soft" : "text-foreground-faint")}>
      <span className="font-semibold uppercase tracking-[0.06em]">FAA ACS</span>
      <span className="px-1.5 opacity-40">·</span>
      {area}
      {code ? <span className="opacity-70"> · {code}</span> : null}
    </p>
  );
}

/**
 * One skill's last few assessments. Not a chart -- axes and gridlines on three
 * data points is decoration. Dated columns, state-colored, directly labeled.
 */
export function TrendStrip({ points }: { points: { label: string; score: number; max: number; state: SkillState }[] }) {
  return (
    <div className="flex items-end gap-2.5">
      {points.map((p, i) => {
        const tone = stateTone(p.state);
        return (
          // Index, not label -- two real signals for the same skill can
          // land on the same date (production data), and the label alone
          // isn't a stable identity for those rows.
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-16 w-full flex-col justify-end gap-1" role="img" aria-label={`${p.label}: ${p.state}, ${p.score} of ${p.max}`}>
              {Array.from({ length: p.max }, (_, i) => {
                const filled = p.max - i <= p.score;
                return <span key={i} className={cn("h-3 flex-1 rounded-[3px]", filled ? tone.fill : "bg-hairline/60")} />;
              })}
            </div>
            <span className="text-[14px] tabular-nums text-foreground-faint">{p.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * A tap-to-open explanation.
 *
 * Not a hover tooltip: this is a phone product, there is no hover, and the
 * things that need explaining ("chair-fly", a 3/4 meter, an ACS area) are
 * exactly the terms a first-time student has never met. The disclosure is a
 * real popover rather than an always-visible caption, so the vocabulary is
 * available without every screen carrying a glossary.
 *
 * Closes on Escape and on any outside tap, because a popover you cannot
 * dismiss by looking away is worse than no popover.
 */
export function InfoTip({
  label,
  children,
  onPanel = false,
  align = "right",
}: {
  label: string;
  children: ReactNode;
  onPanel?: boolean;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrap} className="relative inline-flex">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        className={cn(
          "flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors",
          onPanel ? "text-panel-foreground-soft hover:text-panel-foreground" : "text-foreground-faint hover:text-foreground",
        )}
      >
        <Info className="size-[18px]" strokeWidth={2} aria-hidden />
      </button>

      {open ? (
        <span
          id={id}
          role="dialog"
          aria-label={label}
          className={cn(
            "absolute top-full z-30 mt-1 w-[min(19rem,calc(100vw-3rem))] rounded-2xl border border-hairline bg-surface p-4 text-left shadow-xl shadow-black/15",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <span className="flex items-start justify-between gap-3">
            <span className="text-[15px] font-semibold text-foreground">{label}</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="-mr-1 -mt-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground-faint"
            >
              <X className="size-4" aria-hidden />
            </button>
          </span>
          <span className="mt-2 block text-[15px] leading-relaxed text-foreground-soft">{children}</span>
        </span>
      ) : null}
    </span>
  );
}

/** Two-way view switch. Used once, for Skills | ACS on Progress. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 rounded-xl bg-surface-sunken p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-[40px] flex-1 cursor-pointer rounded-lg text-[15px] font-medium transition-colors duration-200",
              active ? "bg-surface text-foreground shadow-sm shadow-black/5" : "text-foreground-faint",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
