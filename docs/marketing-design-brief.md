# AfterFlight Marketing Design Brief

Source of truth: `app/(marketing)/page.tsx` and its sections. This brief is reverse-engineered
from the actual homepage implementation, not aspirational — every value below is in use today.
Apply it to any new page under `app/(marketing)/*`. If a new page needs something not covered
here, extend this doc in the same PR rather than inventing a one-off pattern.

Scope: the **marketing site** (`app/(marketing)/`) only. The logged-in product app
(`app/(product)/`) has its own token-driven design system (`app/globals.css` CSS variables +
`components/ui/*`) and is intentionally different — see "Marketing vs. product app" below.

---

## 1. Brand identity

- Wordmark: `/brand/afterflight-lockup-dark.svg` (nav) / `-light.svg` (dark sections).
- Brand mark alone: the orange triangle "A", used as the favicon and standalone accent.
- Primary accent color is **the only saturated color on the site**. Everything else is navy,
  gray, or white. Don't introduce a second accent color.

## 2. Color palette

Marketing pages don't use the product app's CSS custom properties — colors are pinned as literal
hex values directly in `className` (`text-[#68717D]`, `bg-[#f4f5f6]`, etc.) or the Tailwind
`brand` token. This is deliberate: the marketing site has a fixed light identity independent of
the product app's dark/light theme toggle (see the `LIGHT_SCOPE_STYLE` comment in
`app/(marketing)/layout.tsx`).

| Role | Value | Usage |
|---|---|---|
| Brand orange | `text-brand` / `bg-brand` (→ `#f07621`) | CTAs, eyebrows, accent words, icons |
| Brand orange (hover) | `bg-brand-dark` | Button hover state |
| Ink / headline text | `#101727` | All headlines, primary text |
| Body copy | `#68717D` | Paragraph text, subheads |
| Faint label text | `#8c97a2` | Small uppercase labels inside mocked UI |
| Page background | `#ffffff` | Default section background |
| Alternate section bg | `#f4f5f6` | Every other section, for rhythm (see §7) |
| Dark section bg | `#101727` + radial gradient overlay | Premium/CTA moments (see §7) |
| Card border | `border-slate-200` | Default card/button border |
| Hairline divider | `border-black/[0.05]` or `/[0.06]` | Inside mocked app screens |

Semantic tones (good/amber/danger) are **not** CSS variables on marketing pages — they're
literal hex passed as props, e.g. `tone="#16803d"` (good), `tone="#b45309"` (amber/attention),
`tone="#c0362b"` (danger). Match these exact values when adding new mocked-UI states so tone
usage stays consistent across pages.

## 3. Typography

- Font: **Archivo** (variable, `next/font/google`), loaded once in `app/layout.tsx` as
  `--font-archivo`. One family for everything — there is no second display font.
- "Archivo Expanded" (per the brand sheet) is simulated via `font-stretch: 125%` on the
  variable font's `wdth` axis, not a separate import. Apply it with the `.font-display` utility
  class (defined in `app/globals.css`), which also sets `letter-spacing: -0.02em`.
- Native `<h1>` gets `font-weight: 800`, `text-transform: uppercase`, and the expanded
  stretch/tracking automatically (global rule in `app/globals.css`) — don't re-apply those
  manually on `<h1>`.
- **Every page headline is written and displayed in sentence case, not the all-caps the global
  rule above would otherwise produce.** Any `<h1>` must explicitly opt out with
  `style={{ textTransform: "none" }}` (see `hero.tsx`) — forgetting this is an easy-to-miss bug:
  the page still looks intentional (bold, expanded, on-brand) but reads as shouty all-caps
  instead of the correct "Get better every flight." style. `<h2>`/`<h3>` are unaffected — the
  uppercase rule only targets the `h1` element.

**Type scale in practice** (copy these patterns, don't invent new sizes):

| Element | Classes |
|---|---|
| Hero H1 | `font-display text-[clamp(2.75rem,6vw,4.25rem)] font-extrabold leading-[0.98]` |
| Sub-page H1 (ICP pages) | `font-display text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-[1.02]` |
| Section H2 | `font-display text-balance text-4xl font-bold sm:text-5xl text-[#101727]` |
| Sub-section H3 | `font-display text-lg font-bold uppercase tracking-wide text-[#101727]` |
| Eyebrow (small caps label above a headline) | `text-sm font-bold uppercase tracking-[0.16em] text-brand` |
| Eyebrow (dense, inside a card grid) | `text-xs font-bold uppercase tracking-[0.14em] text-brand` |
| Body / subhead | `text-lg leading-relaxed text-[#68717D]` (use `text-pretty` for 2+ line paragraphs) |
| Fine print | `text-xs` or `text-sm text-[#68717D]/70` |

Use `text-balance` on headlines and `text-pretty` on paragraphs — both are applied throughout
to avoid ragged/orphaned line breaks.

## 4. Layout & spacing

- **Content container**: `mx-auto max-w-[1320px] px-6`. Every section wraps its content in this
  — never a bespoke max-width.
- **Section vertical rhythm**: `py-20 sm:py-28` for tighter sections (e.g. FlightScore),
  `py-24 sm:py-32` or `py-28 sm:py-36` for full feature sections. Hero-style sections use
  asymmetric `pb-20 pt-24 sm:pb-28 sm:pt-28` (accounts for the fixed nav).
- **Grid gaps**: `gap-6` (pricing cards), `gap-8`–`gap-12` (feature grids), `gap-x-8 gap-y-14`
  (card grids with room to breathe).
- **Card padding**: `p-8` is the standard card interior padding.
- **Radii**: `rounded-2xl` for cards and standalone photos, `rounded-xl` for photo/UI tiles
  inside a card, `rounded-3xl` for large hero images, `rounded-lg` for buttons, `rounded-full`
  for pills/badges/icon chips.

## 5. Buttons & CTAs

Marketing pages do **not** use `components/ui/button.tsx` (that's the product app's primitive,
sized differently — `h-11 px-5`). Use `components/marketing/cta-link.tsx` (`CtaLink`) for every
button-shaped link on marketing pages, which encodes the canonical classes:

```tsx
<CtaLink href="/signup/cfi">Start Free</CtaLink>
<CtaLink href="/#learning-loop" variant="secondary">See How It Works</CtaLink>
```

- **Primary**: `bg-brand text-white hover:bg-brand-dark`
- **Secondary**: `border border-slate-200 text-[#101727] hover:bg-[#f4f5f6]`
- **Dark** (for use on navy sections, outline-only): `border border-white/20 text-white hover:bg-white/10`
- Base shape for all variants: `rounded-lg px-8 py-4 text-base font-semibold`
- The nav's own CTA is the one exception (smaller, fits the fixed header): `rounded-lg bg-brand px-3 py-2 text-xs sm:px-4 sm:text-sm`

## 6. Cards & mocked product UI

Two reusable primitives live in `components/marketing/app-screen.tsx` — always use these instead
of re-building a card shell:

- **`Visual` / `PhotoVisual`**: the shared `aspect-[4/3]` frame every card visual sits in
  (`rounded-xl overflow-hidden bg-[#f4f5f6]`), whether it holds a real photo or a mocked screen.
- **`AppScreen`**: the "real app" shell — white card, header bar (`border-b border-black/[0.06]
  px-5 py-3.5`) + content area. Use this whenever a section needs to show believable product UI.
- **`Pill`**: small status/count badge, `tone` prop is a literal hex, background auto-computed
  at 10% opacity (`${tone}1a`).
- **`SummaryRow`**: icon chip + label/value row, the standard way to list stats inside an
  `AppScreen`.

Pricing/feature cards (not mocked UI) use a plain bordered shell:
`rounded-2xl border bg-white p-8`, with `border-brand shadow-lg shadow-brand/10` swapped in for
a "featured" card instead of `border-slate-200`.

**Never fabricate a fake analytics dashboard or a numeric "grade" for a single flight.**
Mocked UI must reflect real product concepts (debrief summary, ACS connection, next-flight
objective, qualitative training bands) — see `lib/performance-levels.ts` conventions. No invented
AI-score gauges outside the dedicated, honestly-labeled FlightScore section.

## 7. Section background rhythm

Sections alternate `bg-white` / `bg-[#f4f5f6]` — **never two of the same background back to
back**. A dark `bg-[#101727]` section (always paired with the radial-gradient overlay below) is
used sparingly as a premium/CTA beat, not as a repeating pattern. When adding a new page, sketch
the background sequence first and check it alternates before writing content.

Dark section pattern (copy exactly):

```tsx
<section className="relative overflow-hidden bg-[#101727] px-6 py-20 text-center sm:py-28">
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />
  <div className="relative">{/* content, white/brand text only */}</div>
</section>
```

## 8. Imagery

- Always real aviation photography from `public/images/marketing/` (or CFI/product screenshots
  via `AppScreen`) — never illustration, stock SaaS icon grids, or generic AI-art imagery.
- `object-cover` inside a `relative` positioned parent with `fill`.
- **`sizes` must be pixel-based at named breakpoints**, with a `vw` fallback only as the last,
  mobile-width entry — e.g. `sizes="(min-width: 1024px) 620px, (min-width: 640px) 480px, 92vw"`.
  A bare multi-breakpoint `vw` chain has caused oversized (`w=3840`) image requests that hang in
  dev; don't reintroduce that pattern.
- Never use a photo with UI baked into the pixels (e.g. a fake score readout burned into a phone
  screen in the photo itself) — any on-screen UI must be real, rendered `AppScreen` markup.

## 9. Icons

- `lucide-react` exclusively, `strokeWidth={1.5}` for standalone feature icons,
  `strokeWidth={2}` inside small chips (`SummaryRow`).
- Common sizes: `size-4` (inline/rows), `size-5`–`size-8` (feature icons), never larger than
  `size-8` outside a hero.
- Icon color is either `text-brand` or an inline `style={{ color: tone }}` matching the
  semantic hex from §2.

## 10. Motion

Two shared hooks/components, both respecting `prefers-reduced-motion` (skip the
`IntersectionObserver` entirely and render the settled state):

- **`Reveal`** (`components/marketing/reveal.tsx`): one-shot fade + rise
  (`opacity-0 translate-y-6` → `opacity-100 translate-y-0`), `duration-700 ease-out`. Wrap almost
  every section/card in this. Stagger siblings with `delay={i * 100}` (or `100`/`150` steps for
  slower cascades).
- **`SlideInRight`** (`components/marketing/slide-in-right.tsx`): same one-shot pattern but
  slides in from the right (`translate-x-10` → `0`) — used for individual list rows rather than
  whole blocks.
- Hover micro-interactions are subtle: `scale-105`, or a combined
  `translate-x-[3%] scale-[1.18]` pan-and-zoom on the learning-loop photo frames. Nothing larger,
  no rotation, no bouncing.

## 11. Copy voice

Established while building the ICP pages (`/instructors`, `/schools`, `/enterprise`) — applies
site-wide:

- Write like an aviation company, not a SaaS copywriter. Short sentences, plain language.
- Banned words: *unlock, supercharge, revolutionize, seamlessly, powered by AI, transform your
  training ecosystem, actionable insights, single source of truth.*
- Never imply an algorithm grades a student or second-guesses a CFI. The instructor is always
  the authority; AfterFlight structures and preserves their feedback.
- Keep circling back to the **debrief** as the product's wedge: what happened → what the
  instructor observed → what needs work → what the standard requires → what to study → what to
  practice next → whether the student is improving. New pages should connect to this chain
  rather than introducing a competing narrative.
- Section eyebrow + headline + one short subhead is the standard opener for every section — resist
  adding a second explanatory paragraph before getting to content.

## 12. Layout shell

Every marketing page is a child of `app/(marketing)/layout.tsx`, which already provides:

- `MarketingNav` (fixed header, `h-16`, blurred white background) — pages need top padding to
  clear it (`pt-24 sm:pt-28` on the first section, or more on hero-only pages — see the
  `/enterprise` hero's `pt-32 sm:pt-36`).
- The shared footer (three-column: Product / Who It's For / Company).
- `LIGHT_SCOPE_STYLE`, which pins the product app's theme-reactive CSS variables to their
  light-mode values so any shared product component (e.g. `FlightScoreGauge`) renders correctly
  here regardless of the visitor's site-wide theme.

**New pages never need their own `<header>`/`<footer>` or a different nav — just export a
default page component; the layout wraps it automatically.**

## 13. Responsive behavior

- Breakpoint discipline: mobile-first, with `sm:` (640px) and `lg:` (1024px) as the only two
  breakpoints actually used for layout changes (`grid-cols-1` → `sm:grid-cols-2` →
  `lg:grid-cols-3`/`4`). Don't reach for `md:` or `xl:` unless a section genuinely needs a third
  step.
- Hero sections: stacked single column on mobile (image below text, in a normal rounded block),
  side-by-side `lg:grid-cols-2` on desktop.
- Always test both the mobile single-column stack and the desktop grid before calling a section
  done — several past bugs were desktop-only regressions in mobile stacking order.

## 14. Marketing vs. product app

| | Marketing (`app/(marketing)/`) | Product app (`app/(product)/`) |
|---|---|---|
| Colors | Literal hex in className | CSS variables (`--brand`, `--good`, etc.) via `@theme inline` |
| Theme | Fixed light, independent of toggle | Reactive light/dark via `data-theme` |
| Buttons | `CtaLink` / inline classes | `components/ui/button.tsx` (`Button`) |
| Typography | `.font-display` + literal Tailwind sizes | Same font, but product screens lean smaller/denser |

Don't cross-import product-app primitives into marketing pages (or vice versa) except for the
handful of components explicitly designed to work in both (`FlightScoreGauge`, thanks to
`LIGHT_SCOPE_STYLE`).

---

## Checklist for a new marketing page

1. Confirm it's a child route under `app/(marketing)/` — the layout gives you nav/footer for free.
2. Export `metadata: Metadata` with a real `title`/`description`.
3. Sketch section backgrounds first; alternate white/`#f4f5f6`, use dark navy sparingly.
4. Every section: `<section className="bg-… px-6 py-…">` → `<div className="mx-auto max-w-[1320px]">` → content.
5. Wrap sections/cards in `<Reveal>`; stagger repeated items with `delay={i * 100}`.
6. Use `CtaLink` for every button; `AppScreen`/`Pill`/`SummaryRow` for any mocked product UI.
7. Headlines get `.font-display`; body copy stays `text-[#68717D]`.
8. Run the copy through §11 before finalizing.
9. Verify `npx tsc --noEmit`, `npx eslint <files>`, `npx vitest run --exclude '**/.claude/worktrees/**'`, then check the page in the browser at mobile and desktop widths.
