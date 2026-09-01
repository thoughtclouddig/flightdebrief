# Handoff — AfterFlight, as of `a4b1238`

Written to survive a session boundary. Read this and `design-system/afterflight/MASTER.md`
before touching the prototype, the flight-analysis stack, or the mobile app.

Everything below is verified against the tree, not recalled.

---

## Where things stand

Three bodies of work landed recently and none of them are finished in the same
sense:

| Area | State |
|---|---|
| Prototype (`/prototype/vector/**`) | Working, 18 routes, the main review surface. Debrief rebuilt in `68a4b39` — see below |
| Flight analysis + replay | Working on seeded data |
| Native recorder (`apps/mobile`) | Code complete, **never run** |
| Marketing site | Repositioned on continuity (`3bea1b0`); behind the shared-password gate |

Remote is clean at **`a4b1238`**, sandbox and Replit in sync, `pull.ff only`
set on Replit so the merge-commit pile-up documented below cannot recur. The
gate is live, the prototype sits behind it, and the rebuilt debrief flow is
deployed to Replit.

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

## The debrief — current architecture, shipped `68a4b39`

**Read this before touching anything under `app/prototype/vector/debrief/`.**
It replaced an earlier design, and several of the decisions below look like
things worth "tidying up" until you know why they are that way.

### The flow, and it does not branch

```
Lesson objectives → Student assessment → Device handoff →
Instructor assessment → Reveal comparison → Record conversation →
Debrief summary → Carry forward
```

There is **no longer a fork** between "Jake's debrief" and "My reflection."
That fork was the root cause of what V2 lost: it framed the two views as
alternative content, so the comparison between them was optional and therefore
skipped. One guided flow, no branch. The home screen's separate "My reflection"
entry point was removed for the same reason — a second door re-creates the
fork.

### The rules inside it

- **The lesson objective is the unit of assessment.** Both people rate the same
  list.
- **Both assess independently, before the recording starts.**
- **The student rates first and their answers stay hidden through the
  handoff.** An instructor who can see "Felt Solid" before rating produces an
  echo rather than a judgement, and comparing a judgement to its own echo is
  worthless. This is why the handoff screen exists.
- **The reveal shows agreements and gaps, at equal weight.** Agreement is
  meaningful data and must not be filtered out — "you both think this is solid"
  is what eventually lets a student trust their own read of a flight. A view
  that surfaces only gaps reads as a list of faults.
- **Recording comes last**, after the comparison, so the conversation has
  something specific to be about.

### Performance model — one scale, two vocabularies

The persisted model is unchanged and shared with the real product:
`LEARNING` · `NEEDS_COACHING` · `INDEPENDENT` (`lib/performance-levels.ts`,
FITS-derived). **Do not create a second scoring model.** Codes, order and
`performanceLevelRank` are the single source of truth; only the code is ever
persisted, which is what makes the wording below safe.

| Underlying code | Student sees | Instructor sees |
|---|---|---|
| `LEARNING` | Needs Work | Needs Work |
| `NEEDS_COACHING` | Improving | Improving |
| `INDEPENDENT` | **Felt Solid** | **Meets Standard** |

`Felt Solid` and `Meets Standard` are the **same underlying code**, deliberately.
The student is reporting *perceived* performance; the instructor is evaluating
against the *training standard*. A student cannot honestly report "Meets
Standard" against a standard nobody has shown them.

**Do not unify these labels without an explicit product decision.** They look
like an inconsistency and are not. The mapping lives in
`lib/prototype/assessment.ts`.

### Evidence treatment

- **No quotation marks around summaries or AI paraphrase.** Quotation marks
  require actual transcript.
- Both `studentView` and `instructorView` in the seed are summaries, so
  **neither is quoted.** Quoting the instructor while paraphrasing the student
  made one voice testimony and the other narration.
- Student and instructor evidence get **equal visual and epistemic treatment.**
- Verbatim material (`INSTRUCTOR_DEBRIEF`, `STUDENT_REFLECTION`) lives behind
  View transcript.

### Debrief Latest

Must render **both levels for every objective**, agreements included, iterating
`PERCEPTION_GAPS`. It previously carried three hardcoded strings describing one
objective — an assessment reduced to an anecdote, with the two agreeing
objectives silently dropped. **Do not revert to that.**

### Progress / Skill Detail

Shows the **latest** dual assessment (`objectiveForSkill` matches skill names to
objective names loosely, since the seed vocabularies drifted).

**Still open, and the next significant product task:** per-lesson student +
instructor assessment *history* over time. `SkillScore.trend` currently carries
instructor-side values only, so this needs a seed expansion and a `TrendStrip`
signature change. It is the natural progression from "here is how you both saw
this flight" to "here is how your judgement and your performance are developing
together" — which is the product's positioning made visible.

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

**Coverage was fixed in `11c0bc3`** and verified at runtime on Replit.
`proxy.ts` had gated a stale list: `/how-it-works`, `/data-handling`,
`/for-instructors-quickstart`, `/demo`, `/demo/overview` and all ~19
`/prototype/vector` routes were reachable by direct URL while the marketing
site in front of them was locked. The prototype — unreleased product — was the
serious one.

Measured with the gate on, `curl` against the running server:

| Route | | |
|---|---|---|
| `/`, `/how-it-works`, `/demo`, `/prototype/vector`, `/prototype/vector/progress` | `307` | gated |
| `/gate`, `/login` | `200` | reachable |
| `/invite/accept` | `307` → `/login` | its own no-token logic, **not** the gate |

That last row is the one to re-check if you ever touch this. `/invite/accept`
must never redirect to `/gate`, or an invited user cannot accept while the site
is hidden.

**The rule that will bite you:** the `matcher` and the
`MARKETING_PATHS` / `MARKETING_PREFIXES` sets must be edited together. A path
in the matcher alone falls through to the session check and redirects to
`/login` — the page looks broken rather than gated, which points debugging at
auth instead of at this file. Both ends of `proxy.ts` say so now.

`robots.ts` disallows everything and drops the sitemap link while the gate is
on; the sitemap was a complete public list of every URL, so a private site had
still been publishing its own map.

Two curl checks worth keeping. Note `localhost` resolves to `::1` on Replit and
the dev server binds IPv4 only, so `127.0.0.1` is required or everything reads
`000` and looks like the gate is broken when the server simply was not reached:

```bash
for p in / /prototype/vector; do curl -s -o /dev/null -w "$p %{http_code}\n" "http://127.0.0.1:3000$p"; done
```

**Still open:** a published Deployment may carry its own secrets scope. Setting
`SITE_ACCESS_CODE` on the workspace does not necessarily apply it to the
published site, and if it is missing there the site publishes fully public with
no error. Verify against the public URL after publishing, not just locally.

---

## Brand imagery — read the casting bible BEFORE generating anything

`ad-studio/afterflight/casting/consistency-tokens.md` is the source of truth for
people, aircraft and wardrobe, and it contains paste-verbatim prompt tokens.
`ad-studio/afterflight/storyboard/` holds ~39 already-approved frames (A/B/C/D
series). **Look there first — the shot you need probably exists.**

The cast, in short: **Mia**, student, mid-20s, navy quarter-zip. **Dave**, CFI,
mid-50s, salt-and-pepper, navy polo (plain in cockpit/exterior shots, AfterFlight
lockup only in the B3 lounge scene). Aircraft is the **Cirrus TRAC, NAV8RX**,
orange-and-black livery, all-black cabin, **side-sticks not a yoke**, red CAPS
handle. Seat convention is absolute and must be stated in every cockpit prompt:
**Mia LEFT and flying, Dave RIGHT.**

**Naming:** the CFI is **Dave** in casting/storyboard only. Everything
user-facing — app seed data, marketing copy — says **Jake**, and that is
correct. Do not "fix" one to match the other.

Three things that cost real time in the session that produced this section:

- Generating before reading the casting file produced a child at the controls of
  a Cessna. Nothing about it was reusable.
- **Next's image optimizer caches by URL.** Replacing a file at the same path in
  `public/` keeps serving the old image through hard reloads. Change the
  filename.
- `ffmpeg` here has **no AVIF muxer** and `avifenc` is not installed.
  `sips -s format avif -s formatOptions 65 -Z 2000 in.png --out out.avif` works.

---

## Next feature: guided Chair Flying (briefed, not started)

Full brief is in the session transcript; **ask for it to be re-pasted** rather
than working from this summary.

The defining rule: **Chair Flying is generated from what actually happened on
the student's last flight** — never a generic study library. The loop is
Flight → Debrief → specific training need → Chair Flying → Next Flight.

It lives inside **Train**, as one of Vector's recommended actions, with Vector
giving the reason from real debrief evidence. Not a new nav item, not a chatbot.

V1 is **one** guided rehearsal mode, 3–7 minutes, one objective. Scenario →
student thinks → brief coaching → continue, one prompt at a time. Lightweight
tap/reveal only — **do not make the student type answers**. Must include at
least one ADM/judgment moment (go-around as a legitimate option), and must end
by carrying 2–3 items into the Next Flight plan.

Seed it from the existing crosswind row, which is already the right shape:
student `INDEPENDENT` vs instructor `NEEDS_COACHING`, with Jake's rollout
evidence. That makes the reason for the drill self-evident.

Architect for later modes — Guided / Recall / Challenge, and a future spoken
mode — but **build none of them yet**. No speech analysis in this pass.

Guardrail: Chair Flying reinforces the CFI, POH/AFM and published procedures. It
never replaces them, and where detail is aircraft-specific it points back to the
student's own checklist and instructor rather than inventing numbers.

---

## Known-open, roughly in priority order

From the V2 prototype walk:

1. **Per-lesson dual-assessment history** in Progress / Skill Detail — the next
   significant product task, see the debrief section above
2. **Fold or remove Flight Analysis**, but only after verifying every inbound
   route and data dependency — it has links from Flight Detail, Compare's back
   link and Replay's back link
3. **Progress movement cues** — the list shows current state with no sense of
   travel
4. Literal `--` in the seed takeaway strings renders as two hyphens on
   `/debrief/latest`
5. Founder story has no photograph; the signature is set, the image is not
6. **Confirm the deployed environment carries `SITE_ACCESS_CODE` when
   publishing.** The workspace environment alone is not sufficient — a
   Deployment can hold its own secrets scope, and if it is missing there the
   site publishes fully public with no error

Longer-standing:

7. `apps/mobile` install → prebuild → dev build → device test
8. 3D flight path, subscribing to the same `t`
9. Telemetry-aware Vector answers; render the Picture This block
10. Onboarding/support as a swipeable sequence (asked for, never built)
11. Knowledge-check and chair-fly screens never got the premium pass — visible
    seam entering from Train
12. Deepgram "50% discount" claim in `lib/transcription/use-deepgram-transcription.ts`
    comments and `.env.example` is **unverified** and traces only to a
    competitor's blog. It should be corrected or removed.
13. `council/demo-story.md` still carries the Atlas framing and three claims
    that were later corrected
14. Tasks #156 (home progress rail), #157 (solo signup smoke test), #158
    (homepage stage-two positioning, held pending 20 CFI discovery calls)
15. `npm run build` has never been run successfully outside Replit
    (`DATABASE_URL`), so a publish is still its first real test

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
