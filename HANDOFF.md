# Handoff — AfterFlight, as of `8aceee7`

Written to survive a session boundary. Read this and `design-system/afterflight/MASTER.md`
before touching the prototype, the flight-analysis stack, or the mobile app.

Everything below is verified against the tree, not recalled.

---

## Where things stand

Three bodies of work landed recently and none of them are finished in the same
sense:

| Area | State |
|---|---|
| Prototype (`/prototype/vector/**`) | Working, 18 routes, the main review surface |
| Flight analysis + replay | Working on seeded data |
| Native recorder (`apps/mobile`) | Code complete, **never run** |

`npm run build` fails locally with `DATABASE_URL is not set` — expected without
the Replit DB, and unrelated to any of this. `tsc`, `eslint` and 351 tests pass.

---

## The rules that are not preferences

These are enforced in code and tests. Changing one means changing a guard test,
which is the signal to stop and ask rather than proceed.

**Scoring.** Skill-level scores are allowed when sourced, explainable and tied
to specific training evidence. Overall readiness verdicts are not — no
FlightScore, no "72% solo ready", no aggregate of any kind. The instructor owns
the signoff.

**Evidence classes stay distinct** — instructor, student, flight data, Vector,
FAA ACS. Vector inference must never look measured; telemetry must never look
like judgement. Enforced in the data model, not just the UI.

**Vector does not draw.** `lib/ai/media.ts` has five source classes and there is
deliberately no `GENERATED_DIAGRAM`. `source` is required by the schema, so a
visual with no provenance cannot be represented. Only `ACTIVE` assets surface;
both seeded ones are `DRAFT` on purpose, because nobody has produced or reviewed
them. Tests assert all of this.

**ADS-B is not avionics.** The capability model (`lib/prototype/telemetry.ts`)
says groundspeed yes, indicated airspeed no, heading no — ground track is not
heading, and in a crosswind that difference is the lesson. Unavailable values
render as a dash, never zero.

**Post-flight remarks anchor to a segment, never a timestamp.** Jake said
everything on the ramp. `SEGMENT_ASSOCIATION` vs `EXACT_TIMESTAMP` exists so a
quotation mark never lands on a second that did not happen.

**Tracked hours are not logbook hours.** `TRACKED_HOURS_DISCLAIMER` is a single
constant so the wording cannot drift. Session / airborne / tracked durations
stay separate; collapsing them inflates a student's hours by however long they
sat on the ground.

---

## Prototype

18 routes under `app/prototype/vector/`. Standalone layout — deliberately
outside `(product)`, which requires a session and a database.

Design language lives in `components/prototype/ui.tsx`; a screen that invents
its own card or quote treatment is drift. Sections are grouped cards on a
sunken canvas (the iOS Settings shape) because whitespace cannot separate
sections on a screen that is already mostly whitespace.

**Demo states** are driven by query params, switchable from the banner:
`?state=landed` (flew, nothing recorded), `?state=flown` (needs debrief), no
param (between flights). The banner collapses — it sits where the real header
goes.

**Seeded data** is `lib/prototype/vector-data.ts` (Mia/Jake) and
`lib/prototype/flights.ts` (5 flights, one solo, one hand-entered with no
track). The hand-entered one exists to exercise the "logged by hand" empty
state, which is a different sentence from "ADS-B was sparse".

---

## Flight analysis

`lib/prototype/telemetry.ts` — normalized `TelemetryPoint`, capability model,
provenance, `Quality`, approach segmentation from altitude structure (carrying
confidence out rather than thresholding it away), `FlightMoment`,
`EvidenceAnchor`, `compareSegments`.

`lib/prototype/moments.ts` — analysis for a flight, or `null` when there is
nothing to analyse. Returns null rather than an empty shell so callers can
decline to offer the entry point.

Replay's whole design is one number: `t`, ms from engine start. Nothing holds
its own clock — that is what lets cockpit audio or POV video subscribe later
instead of forcing a redesign.

**Not built:** 3D path, telemetry-aware Vector answers, the Picture This block
rendered in `VectorCardView` (schema + retrieval + tests exist, the UI does
not).

---

## Native recorder — the honest status

`apps/mobile` is a real Expo project. It has **never been installed, built or
run.** Nothing about it is verified.

```bash
cd apps/mobile && npm install && npx expo prebuild
```

Three decisions worth not undoing:

1. The background task registers at **module scope**, not in an effect. iOS
   relaunches the app into the background to deliver updates, and at that
   moment no React tree exists. Registration in a component means the fix
   arrives with no handler and vanishes.
2. **SQLite is the write path; the network is not in it.** Fixes stay local
   until the server acknowledges. Marking them sent would mean a lost response
   discards data that never arrived.
3. The **idempotency key is derived** (`session:firstT-lastT`), not random, so
   a retry after a crash regenerates the same key.

### Credential boundary — cannot proceed without you

- Apple Developer account for `eas build --profile development --platform ios`
- Bundle id `com.getafterflight.app` is a placeholder
- Sign-in is a token stub; device OIDC is the next real piece

### The release gate is NOT passed

Background recording is **configured, not verified**. It requires a real
iPhone, a real hour, a locked screen and ForeFlight in the foreground. Battery
and thermal are unmeasured for the same reason. Do not let anyone record this
as done.

---

## Homepage messaging reframe — shipped `a3b73c4`

The brief that the previous handoff recorded as briefed-but-unstarted has now
been implemented. It was delivered as a **surgical messaging pass, not a
rebuild** — the user's own scope clarification was "keep 80–90%, change
10–20%", and that is what happened.

**Changed:** hero copy; `TrainingEconomics` headline plus a working cost
calculator; `FinalCta` headline and a secondary CTA; `nav.tsx` made
student-first; `BrandMoment` problem cards moved below the video with the
scrim rebalanced; page order and metadata.

**Added:** `training-cost-calculator.tsx`, `founder-story.tsx`,
`flight-recording-preview.tsx`.

**Preserved unchanged, deliberately:** HowItWorks, Vector, NextFlight,
PersonalizedTraining, PerceptionGap, SkillProgress, DebriefReplay,
DebriefDoctrine, Proof, WhoItsFor, Pricing, and the ForCfis copy itself.
These already said the right thing. Do not "improve" them into drift.

### The recorder copy is deliberately in future tense

The brief asked for a Start Flight product-proof section and one was built —
four states, mocked screens, brand-orange `Start Flight` and `Start Debrief`
buttons. **It was then replaced** by `flight-recording-preview.tsx`, on the
user's explicit decision, because `apps/mobile` has still never run on a
device and the locked-screen / ForeFlight-in-front case that section
advertised is precisely the one the release gate has not tested.

Three things carry that constraint, and all three matter:

- **Tense.** Every verb is future. Changing it before a device test passes is
  wrong, and the file's header comment says so.
- **Position.** It sits after every shipped section. What ships outranks what
  is coming.
- **No buttons.** An orange `Start Flight` fill reads as shippable UI whatever
  label sits above it.

The file is named `flight-recording-preview.tsx` rather than `start-flight.tsx`
for exactly this reason — a future session opening a file called "start flight"
will assume it documents something that ships.

A sweep of `components/marketing` for `records your flight | flight path |
telemetry | ADS-B` returns nothing. Keep it that way until the gate passes.

### Type sized by measurement, not by eye

Both hero clamp ends and the `BrandMoment` display lines are set from measured
string widths, and the reasoning is in the code comments. The new copy is
materially wider than what it replaced; at the old sizes the hero broke to four
lines on desktop and five on mobile and pushed the CTA toward the fold.

**Measuring gotcha, cost an hour:** a probe span must copy `font-stretch`.
Without it Archivo measures about a fifth narrower than it renders, which
produces a confidently wrong number.

---

## Git direction was backwards — fixed `8aceee7`

Worth knowing, because it silently invalidated local verification.

`origin` had been **33 commits behind Replit**, including
`3007297 Separate live Deepgram TTS checks from the deterministic test suite`.
The documented loop is push-from-sandbox / pull-on-Replit, but Replit had been
the source of truth in practice, so every pull produced another merge commit —
which is why the history has so many.

A sandbox clone was therefore missing real work, including a `vitest.config.mts`
change, so any local test run was being made against a tree that did not match
the repo. Resolved by pushing **from Replit** on 2026-09-01; all three now sit
at `8aceee7` with zero divergence. `git config pull.ff only` on Replit is what
keeps it from recurring, and it only works now that both sides match.

Default assumption for a fresh session: **verify `git rev-list --left-right
--count origin/main...HEAD` before trusting a local test run.**

---

## Site gate

Code-complete and untouched. One secret drives it: `SITE_ACCESS_CODE`, unset or
blank means off (`lib/auth/session.ts`). The value is both the password and the
JWT signing key, so changing it revokes every existing 30-day `fb_site_gate`
cookie.

The secret was added to Replit Secrets on 2026-09-01. **Not published yet** —
adding a secret to the repl does not apply it to an already-published
deployment.

**Open, and not yet approved:** `proxy.ts` gates a stale list. Even with the
gate on, these stay reachable to anyone holding a direct URL — `/demo`,
`/demo/overview`, `/how-it-works`, `/data-handling`,
`/for-instructors-quickstart`, and all 19 `/prototype/vector/**` routes. The
prototype is the unreleased product review surface and is entirely ungated.

If you fix it: the matcher and the `MARKETING_PATHS` / `MARKETING_PREFIXES`
sets must be updated **together**. A path in the matcher but not the marketing
sets falls through to the session check and redirects to `/login` — the page
breaks rather than being gated. `SITE_ACCESS_CODE` is also still undocumented
in `.env.example`, which is likely why it was easy to lose.

---

## Known-open, roughly in priority order

1. `apps/mobile` install → prebuild → dev build → device test
2. 3D flight path, subscribing to the same `t`
3. Telemetry-aware Vector answers; render the Picture This block
4. Onboarding/support as a swipeable sequence (asked for, never built)
5. Knowledge-check and chair-fly screens never got the premium pass — visible
   seam entering from Train
6. Deepgram "50% discount" claim in `lib/transcription/use-deepgram-transcription.ts`
   comments and `.env.example` is **unverified** and traces only to a
   competitor's blog. It should be corrected or removed.
7. `council/demo-story.md` still carries the Atlas framing and three claims
   that were later corrected
8. Tasks #156 (home progress rail), #157 (solo signup smoke test), #158
   (homepage stage-two positioning, held pending 20 CFI discovery calls)
9. `proxy.ts` gate coverage — see the Site gate section above
10. Founder story has no photograph; the signature is set, the image is not

---

## Things a fresh session will get wrong without being told

- **The browser pane drops paths on `navigate`** and has been unreliable for
  several sessions. Recent screens were verified by server-rendered content
  checks plus tsc/eslint/tests. If you need visual proof, say which screens
  were not visually verified rather than implying they were.
- Moment Detail and Compare Attempts have **never been seen rendered.**
- `npm run build` failing locally is `DATABASE_URL`, not your change.
- The user corrects real errors directly and expects them fixed, not defended.
  Two examples worth learning from: the ADS-B "we found your flight" claim
  (a product cannot know which student was in a shared trainer), and the
  over-broad "no scores anywhere" constraint. Both were my errors.
