# AfterFlight — Design System Master

> **LOGIC:** When building a specific screen, first check `design-system/afterflight/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file. If not, follow the rules below.

**Project:** AfterFlight — student-pilot training app (debrief capture + Vector, the AI flight trainer)
**Platform:** mobile-first web, `max-w-lg` phone column, persistent bottom tab bar
**Stack:** Next.js 16 App Router, Tailwind v4, `lucide-react`
**Generated with:** UI/UX Pro Max v2.5.0 (`--design-system --variance 3 --motion 3 --density 4`)
**Last revised:** 2026-08-31

---

## 0. Provenance, and where the generator was overruled

The generator was run and its result was **verified before use**, as its own query
contract requires. Three of its outputs did not fit this product and were replaced.
They are listed here so the substitution is auditable rather than silent.

| Generator said | We use | Why |
|---|---|---|
| Category *Mental Health App*; lavender `#8B5CF6` / `#FAF5FF` palette | The palette in §2 | The nearest catalogue rows were "Fitness/Gym App" (energetic orange on OLED black) and "Mental Health App" (calming lavender). Neither is an aviation training tool. The palette below is the one specified by the product owner, checked for contrast rather than adopted on look. |
| Inter + Playfair Display | Archivo (already shipped) | The repo already ships one variable family across marketing and product. A display serif would fork the brand for four prototype screens. |
| Page pattern *Hero → Testimonials → CTA* | The IA in §12 | That is a landing-page conversion pattern. This is a signed-in app; there is no funnel to run. |

**Kept from the generator, verified as fitting:** style family *Minimalism & Swiss
Style* (light + dark supported, low a11y risk, `contrast-text-4.5 / keyboard /
visible-focus / reduced-motion`), the *Subtle* motion tier (300–400ms, `power1.out`,
8–16px offsets), the density-4 spacing scale, and the pre-delivery checklist in §24.

---

## 1. What this product is

A student pilot opens AfterFlight in a hangar, one-handed, between other things.
Every screen answers three questions in about three seconds:

**What matters? · Why? · What do I do next?**

The loop the UI must make obvious:

```
FLY  →  DEBRIEF  →  TRAIN  →  FLY AGAIN
        (captures        (uses the
         the truth)       truth)
```

The debrief is the ingestion engine. If starting one is ever hard to find, the
rest of the product has nothing to run on.

---

## 2. Color

Light mode is primary. The signature is **a dark navy panel on a light canvas** —
not a dark app, and not a light app with a dark theme bolted on.

### Tokens (`app/globals.css`)

| Role | Light | Dark | Token |
|---|---|---|---|
| Canvas | `#f4f5f6` | `#101727` | `--background` |
| Surface (cards, sheet) | `#ffffff` | `#171f33` | `--surface` |
| Sunken (inset blocks) | `#e9ebed` | `#0c1220` | `--surface-sunken` |
| Text | `#101727` | `#eef0f3` | `--foreground` |
| Text, secondary | `#56636f` | `#b3bcc9` | `--foreground-soft` |
| Text, metadata | `#5f6b77` | `#aab3c4` | `--foreground-faint` |
| Hairline | `#c7ccd1` | `#2a3247` | `--hairline` |
| **Panel** | `#142033` | `#1b283d` | `--panel` |
| Panel, elevated | `#1b283d` | `#24334a` | `--panel-elevated` |
| Panel text | `#f7f9fb` | `#f7f9fb` | `--panel-foreground` |
| Panel text, secondary | `#9da7b8` | `#9da7b8` | `--panel-foreground-soft` |
| Panel hairline | `#2a3a52` | `#33415c` | `--panel-hairline` |
| Brand orange | `#f07621` | `#f07621` | `--brand` |
| Text **on** orange | `#142033` | `#142033` | `--on-brand` |

### Semantic state scale

Skill state is a **separate scale from brand orange**. Orange means *tap this*;
a skill that needs work must never look like a button.

| State | On paper | On panel / dark mode | Token |
|---|---|---|---|
| Meets Standard | `#1f7a4c` | `#48be83` | `--state-good` / `--state-good-on-panel` |
| Improving | `#2c6c93` | `#6f9fbd` | `--state-improving` / `--state-improving-on-panel` |
| Needs Work | `#9a6612` | `#e6a23c` | `--state-attention` / `--state-attention-on-panel` |

**Two variants per state, because contrast is a property of the pair, not the colour.**
Measured (WCAG 2.x relative luminance):

| Pair | Ratio | Verdict |
|---|---|---|
| `#48be83` on `#ffffff` | 2.34 | ✗ unusable on paper |
| `#48be83` on `#142033` | 6.98 | ✓ AA |
| `#1f7a4c` on `#ffffff` | 5.32 | ✓ AA |
| `#1f7a4c` on `#142033` | 3.07 | ✗ unusable on panel |
| `#e6a23c` on `#ffffff` | 2.19 | ✗ |
| `#9a6612` on `#ffffff` | 4.90 | ✓ AA |
| **white on `#f07621`** | **2.71** | **✗ — never do this** |
| **`#142033` on `#f07621`** | **6.04** | **✓ — this is why `--on-brand` is navy** |
| `#142033` on `#f4f5f6` | 14.99 | ✓ AAA |
| `#9da7b8` on `#142033` | 6.74 | ✓ AA |

Rule: **never hand-pick a state colour at the call site.** Import `stateTone()`
from `components/prototype/ui.tsx` and pass `onPanel` when the ground is navy.

### Colour budget per screen

- **Orange** — one primary action, the active tab, and the Vector mark. Nothing else.
- **One panel.** Two only when the second is a genuinely different claim.
- **State colours** appear only on skill meters, state labels and ACS rollups.
- Everything else is ink, paper and hairline.

---

## 3. Typography

One family: **Archivo** (variable, `--font-archivo`), already shipped. Native iOS
hierarchy, not web-page hierarchy.

| Role | Size / line | Weight | Notes |
|---|---|---|---|
| Page title | 34 / 1.1, `-0.02em` | 600 | One per screen. Nothing else this size. |
| Panel headline | 26–28 / 1.15, `-0.01em` | 600 | The claim the panel makes. |
| Skill name / row title | 17 | 500 | |
| Body | 17 / 1.6 | 400 | iOS HIG body. Never smaller for content. |
| Secondary body | 15 / 1.6 | 400 | `--foreground-soft` |
| Metadata | 13 | 400–500 | `--foreground-faint`. Never for content that changes a decision. |
| Section label | 13, `+0.08em`, uppercase | 600 | `--foreground-faint`. **Max two per screen.** |
| Eyebrow on panel | 13, `+0.1em`, uppercase | 600 | Orange or state colour. One per panel. |
| Numerals in a column | any | any | `tabular-nums`, always. |

The app's base scale is already nudged up (15/17/19 rather than 12/14/16) because
this is read at arm's length. Do not reintroduce 12px text.

**Avoid:** all-caps for anything longer than three words; letter-spacing on body;
paragraph blocks longer than three lines in a card; two competing title sizes.

---

## 4. Spacing, radius, elevation

Density 4/10 — standard. 4px base grid.

| Token | Value | Usage |
|---|---|---|
| `--space-xs` | 4px | icon-to-label |
| `--space-sm` | 8px | inline groups |
| `--space-md` | 16px | inside a card |
| `--space-lg` | 24px | screen gutter (`px-6`) |
| `--space-xl` | 32px | between sections (`gap-8`) |
| `--space-2xl` | 48px | above a terminal CTA |

**Radius:** panel `24px` (`rounded-3xl`) · card `16px` (`rounded-2xl`) · button
`16px` · pill/badge `full` · meter segment `full`. Nothing sharp; nothing rounder
than a panel.

**Elevation:** exactly three levels.

1. **Flat** — list rows, separated by hairline. The default. Most of the app.
2. **Card** — `bg-surface` + 1px hairline border. **No shadow in light mode.**
3. **Panel** — `--panel` + `shadow-lg shadow-black/10`. The only shadow on screen.

A shadow is how the panel earns its dominance. If everything has one, nothing does.

---

## 5. Card system

Six cards. There is no seventh.

| Card | Ground | Purpose |
|---|---|---|
| **Panel** | `--panel` | The one dominant claim: next flight, flight complete, Vector's recommendation. |
| **Skill card** | surface / flat row | skill · state · meter · ACS area · evidence preview |
| **Evidence** | none (left rule) | one attributed voice: instructor, student, Vector, FAA |
| **Vector card** | surface | structured AI output (§10) |
| **Quiz card** | surface | one question, one answer set |
| **Chair-fly card** | surface | one scenario step |

**Nesting: two levels maximum.** A panel may contain evidence. A card may contain
evidence. A card inside a card inside a card is a bug, not a layout. Prefer type
size, weight and whitespace to another border.

---

## 6. Buttons

| Level | Look | Height | Rule |
|---|---|---|---|
| Primary | `--brand` fill, `--on-brand` text, full width | 52px | **Exactly one per screen.** |
| On-panel primary | `--panel-foreground` fill, `--panel` text | 52px | The primary when it lives inside a panel. |
| Secondary | hairline border, ink text | 44px | Row of two or three. Never orange. |
| Quiet | text + chevron, hairline rule | 52px | Navigation, not action. |
| Destructive | `--danger` | 44px | Spatially separated from the primary. |

Never two orange buttons on one screen. Never an orange secondary. If a screen
seems to need two primaries, the screen is doing two jobs — split it.

---

## 7. Icons

`lucide-react` only. `size-4` (16) inline, `size-[22px]` in the tab bar, stroke
`1.7`–`2.2`. Never emoji. Never a second icon set.

Reserved meanings: `Sparkles` = Vector and nothing else. `PlaneTakeoff` = training
/ the next flight. `Mic` = capture. `ClipboardList` = debrief. `TrendingUp` =
progress. Decorative icons beside visible text get `aria-hidden`; an icon-only
control gets an `aria-label`.

---

## 8. Navigation

Four tabs, bottom, persistent: **Home · Train · Debrief · Progress**. Icon **and**
label, always. Active = `--brand`; inactive = `--foreground-faint`. No boxed tab
buttons, no pill background, no badge unless something genuinely needs action.

Bottom nav is for top-level screens only. Sub-screens (skill detail, debrief
capture) push on top and carry a back affordance in the top-left; the tab bar
stays visible so the user is never trapped. Every screen is deep-linkable.

Content clears the bar with `pb-24`; the bar itself uses `bg-surface/85` +
`backdrop-blur-xl` — the one place blur is allowed, because it signals content
passing underneath.

---

## 9. Skill scores and evidence

**Governing product rule, and it is not a design preference:**

> Skill-level scoring is allowed when it is clearly sourced, explainable, and tied
> to specific training evidence. Overall readiness verdicts are not.

Allowed: `Crosswind Landing · Improving · ▰▰▰▱`. Never allowed anywhere in this
product: an overall FlightScore, "72% solo ready", a checkride-readiness percentage,
or any number that aggregates across skills.

**Presentation.** The score renders as a four-segment **meter**, not a fraction.
A number makes a student do arithmetic before they know anything; four segments in
a state colour read in one glance. Segments rather than a continuous bar, because
the underlying assessment is a discrete four-level scale and a smooth bar would
imply precision the instructor never expressed. The value survives verbatim as the
accessible name (`"Improving, 3 of 4"`), so a screen reader gets exactly what the
sighted reader gets.

**Every score is accompanied by its evidence.** A skill row that cannot show the
instructor's own sentence should not show a score.

---

## 10. Vector — the AI trainer

**Vector is never an unexplained brand name.** Anywhere a student could meet it
first, the mark carries its descriptor:

```
✦ Vector
Your AI flight trainer
Vector knows your debriefs, what Jake flagged, your weak areas and Thursday's focus.
```

Contextual verbs throughout: *Train with Vector · Ask Vector about this · Review
with Vector · Chair-fly with Vector.*

**Output contract — never render raw model prose as a long answer.** Every response
is a `VectorCard` (`lib/ai/vector-schema.ts`) rendered as native UI:

```
TITLE
short summary (≤ 2 lines)
ATTRIBUTED EVIDENCE      ← whose words these are, always
3–5 KEY POINTS
ONE PRIMARY ACTION
[Explain more]           ← optional, collapsed
SOURCE                   ← FAA handbook / ACS, when grounded
```

`Explain more` is the only place long prose is legal, and only after a tap.

**Vector recommends; it does not present a tool tray.** Four equal buttons puts the
decision back on a student who opened the app precisely because they did not know
what to work on. Lead with one recommendation and its reason in the instructor's
words; demote quiz / chair-fly / ask to secondaries.

**Vector's voice is always labelled as Vector's.** It never speaks in the
instructor's voice, and it never issues a readiness verdict.

---

## 11. FAA ACS

ACS is a **quiet structural layer**, not a database the student browses.

- One metadata row on a skill: `FAA ACS · Takeoffs, Landings & Go-Arounds`.
- Area of Operation names in prose. Codes (`PA.IV.E`) only in the skill-detail
  source line, where a student who wants them will look.
- Progress offers an ACS grouping as a **second view**, never as the default.
- Never a matrix. Never an ACS code on a card the student sees ten times a day.

The job of ACS in the UI is to say *this is real flight training, not generic AI
coaching* — in one line, and then get out of the way.

---

## 12. Information architecture

```
Home        state-aware: "you just flew" → START DEBRIEF
                         "between flights" → TRAIN WITH VECTOR
Train       Vector's one recommendation → review / quiz / chair-fly / ask
Debrief     hub: START NEW DEBRIEF · latest · history
            └ new       role → record → processing → confirm → reflection
            └ latest    went well / work on / wants next / ACS / perception gap
Progress    Skills | ACS  →  skill detail (evidence, recurrence, trend, Vector)
```

Home always answers "what should I do now?" — it must never assume a debrief has
already happened.

---

## 13. States

**Empty.** Say what will fill it and give the action that fills it. "No debriefs
yet — record your first one after your next flight." Never a bare "No data".

**Loading.** Skeletons that match the final layout, never a centered spinner on a
blank screen. Reserve the space so nothing jumps.

**Processing (AI).** Named steps, not a progress bar that lies: *Transcribing →
Finding what mattered → Matching to ACS*. The student should be able to tell it
is working on *their* flight.

**Recording.** Minimal chrome, and only four things on screen: what is being
captured, a live timer (`tabular-nums`), a waveform that responds to input, and
one unmistakable stop control. No settings, no nav distraction, no confirmations
mid-recording. Target interaction: **tap → talk → stop → done.**

**Error.** Cause plus recovery path. "Couldn't reach the transcriber. Your
recording is still here — retry?" Never "Something went wrong."

---

## 14. Forms and inputs

Visible label above every field, never placeholder-as-label. Minimum 44px tall,
16px+ text (iOS zoom). Error below the field, tied with `aria-describedby`.
Validate on blur, not per keystroke. Long capture flows autosave. Confirm before
dismissing an in-progress recording.

---

## 15. Touch and accessibility

- **44×44 minimum** on every target; 8px between adjacent ones. List rows are 52–64px.
- Body text ≥ 4.5:1, large text ≥ 3:1 — verified per pair (§2), not assumed.
- Never colour alone: state carries a **label** and a **meter**, not just a hue.
- Visible focus ring (the app sets `:focus-visible` to a 2px brand outline).
- `prefers-reduced-motion` disables entrance motion and renders the final state.
- Keyboard order matches visual order; every disclosure carries `aria-expanded`.
- Safe areas: nothing interactive within 16px of the bottom bar or a notch.

---

## 16. Data visualisation

This app has almost no charts, and that is deliberate.

- **Skill meter** — four segments, state-coloured. The main "chart" in the product.
- **Trend** — a small sequence of lesson-level dots or bars showing the last few
  assessments of one skill. Direct-labelled with dates; no axes, no gridlines.
- No pies. No dashboards of tiles. No gauge that implies an aggregate — see §9.
- Every visual carries a text equivalent in its accessible name.

---

## 17. Motion

Tier: **Subtle** (generator-verified). 300–400ms, `power1.out` / `ease-out`,
translate offsets 8–16px. Transform and opacity only.

- Entering a sub-screen: slide up 12px + fade, 350ms.
- Disclosure: height/opacity, 200ms.
- Press: `active:opacity-90` or `scale(0.98)`; feedback inside 100ms.
- Exit ≈ 65% of enter.
- **Motion must mean something.** One or two animated elements per view, maximum.
- Everything above is skipped entirely under `prefers-reduced-motion`.

---

## 18. Copy

Write from the student's side of the screen. "Capture what mattered while it's
fresh", not "Initiate debrief session". A control says exactly what happens, and
the confirmation echoes it. Attribute quotes to the person who said them. No
defensive explanatory paragraphs — if the product needs a disclaimer, make it one
sentence with the reasoning one tap behind it.

---

## 19. Anti-patterns — do NOT use

Product-specific, and these are the ones this codebase has actually drifted into:

- ❌ **Wall-to-wall dark navy.** The canvas is light. Dark is a panel, not a mode.
- ❌ **A giant orange slab.** It reads as a banner ad and leaves the real button
     looking secondary. Panel + orange edge instead.
- ❌ **Orange doing six jobs** (action, tab, Vector, focus, recurrence, needs-work).
     A colour that means six things means nothing.
- ❌ **White text on orange.** 2.71:1. Measured, failing, non-negotiable.
- ❌ **Card inside card inside card.**
- ❌ **Six uppercase tracked labels per screen** — then none of them read as headings.
- ❌ **Raw LLM paragraphs** rendered as the answer.
- ❌ **Equal visual weight for every action** (the tool-tray problem).
- ❌ **Unexplained "Vector"** on first contact.
- ❌ **Hidden debrief creation.** If START DEBRIEF is not obvious, the product fails.
- ❌ **Invisible ACS**, and equally, ACS codes sprayed across every screen.
- ❌ **An aggregate score of any kind.**

Generic, from the generator's verified list:

- ❌ Emoji as icons · ❌ missing `cursor-pointer` · ❌ layout-shifting hovers
- ❌ instant state changes (0ms) · ❌ invisible focus states · ❌ low-contrast text
- ❌ excessive glassmorphism · ❌ gradient washes · ❌ neon "AI" effects
- ❌ robot/chatbot visual language · ❌ dashboard tiles · ❌ SaaS-console chrome
- ❌ bright neon · ❌ motion overload

---

## 20. Dark mode

Same information architecture, same layout, same components. Only the tokens move.

Canvas becomes deep midnight navy (`#101727`); the panel moves **above** the canvas
(`#1b283d`) rather than below it — same role, inverted relationship. Text is warm
white. Orange is unchanged. The state scale collapses onto its bright pair for both
grounds. **Do not redesign the screen between modes**, and do not naively invert:
each dark pair is contrast-checked on its own.

---

## 21. Per-screen review checklist

Run before declaring any screen done:

- [ ] Is the primary question obvious?
- [ ] Is there exactly one dominant action?
- [ ] Readable in 3 seconds?
- [ ] Does it feel native to mobile, not like a web page?
- [ ] Is hierarchy carried by size/weight/space, not just colour?
- [ ] Fewer than four cards?
- [ ] Is any LLM content longer than two lines before a tap?
- [ ] Is ACS present where useful and absent where not?
- [ ] Is Vector's role stated, not just its name?
- [ ] Is START DEBRIEF impossible to miss from Home and Debrief?
- [ ] Every target ≥ 44px?
- [ ] Contrast verified for each new pair?
- [ ] Does light mode look expensive?
- [ ] Does dark mode stay coherent without a redesign?

---

## 22. Pre-delivery checklist (generator, verified)

- [ ] No emojis used as icons
- [ ] All icons from one set (lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover/press transitions 150–300ms
- [ ] Light mode: text contrast ≥ 4.5:1
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive at 320 / 375 / 414 / 768
- [ ] No content hidden behind the fixed bottom bar
- [ ] No horizontal scroll

---

## 23. Where this system lives in code

| Concern | File |
|---|---|
| Tokens (light + dark) | `app/globals.css` |
| Shared components | `components/prototype/ui.tsx` |
| Bottom tab bar | `components/prototype/bottom-nav.tsx` |
| Vector output contract | `lib/ai/vector-schema.ts` |
| Screens | `app/prototype/vector/**` |

Anything visual belongs in `ui.tsx`. A screen that invents its own card, its own
quote treatment or its own padding is drift, and drift is what this file exists to
stop.
