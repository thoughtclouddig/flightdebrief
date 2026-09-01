# Handoff — AfterFlight, as of `c04850e`

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
