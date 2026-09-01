# Handoff — AfterFlight, as of `447fd8f`

Written to survive a session boundary. Read this and `design-system/afterflight/MASTER.md`
before touching the prototype, the flight-analysis stack, or the mobile app.

Everything below is verified against the tree, not recalled.

---

## Where things stand

Three bodies of work landed recently and none of them are finished in the same
sense:

| Area | State |
|---|---|
| Prototype (`/prototype/vector/**`) | Working, 19 routes, the main review surface. Debrief rebuilt in `68a4b39`; Chair Flying added — see below |
| Flight analysis + replay | Working on seeded data |
| Native recorder (`apps/mobile`) | Code complete, **never run** |
| Marketing site | Repositioned on continuity (`3bea1b0`); behind the shared-password gate |

Remote is clean at **`a4b1238`**, sandbox and Replit in sync, `pull.ff only`
set on Replit so the merge-commit pile-up documented below cannot recur. The
gate is live, the prototype sits behind it, and the rebuilt debrief flow is
deployed to Replit.

`npm run build` fails locally with `DATABASE_URL is not set` — expected without
the Replit DB, and unrelated to any of this. `tsc`, `eslint` and 376 tests pass.

**`npx eslint .` reports ~577 errors that are not yours.** They are all inside
`.claude/worktrees/**/node_modules`. The project's own tree has exactly one, a
pre-existing `react-hooks/purity` error in `apps/mobile/App.tsx`. Filter by path
before believing the count.

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
like judgment. Enforced in the data model, not just the UI.

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

19 routes under `app/prototype/vector/`. Standalone layout — deliberately
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
nothing to analyze. Returns null rather than an empty shell so callers can
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
  echo rather than a judgment, and comparing a judgment to its own echo is
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

**The student must never appear to self-certify against the ACS.** `Felt Solid`
is a student's report about their own experience; `Meets Standard` is a
judgment against the published standard, and only the instructor makes it.
That boundary is currently structural rather than conventional, and it is worth
keeping that way:

- `lib/prototype/acs.ts` imports `SKILL_SCORES` only. It never touches
  `PERCEPTION_GAPS`, which is where `studentLevel` lives — so no student rating
  can reach the ACS view at all.
- The ACS view renders `StateLabel`, which takes a `SkillState` and has **no
  `rater` parameter**. It cannot emit "Felt Solid" even by mistake.
- `levelLabel(code, "student")` exists in exactly three places, every one of
  them explicitly dual-attributed: the debrief assessment step,
  `ObjectiveComparison` ("You" vs the instructor's name), and the chair-fly
  reason line.

One internal wrinkle that is fine and looks wrong: `levelState()` maps
`INDEPENDENT` to the string `"Meets Standard"` for both raters, because that
string is the key into the shared color scale. It is never rendered for a
student — `ObjectiveComparison` takes the *color* from it and the *label* from
`levelLabel(code, "student")`. Do not "fix" that by rendering the state name.

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
this flight" to "here is how your judgment and your performance are developing
together" — which is the product's positioning made visible.

---

## Homepage reduction pass — 18 sections to 15

Shipped 2026-09-01. The page had accumulated individually strong sections that
added up to a catalogue rather than a story. This was a **subtraction pass**,
deliberately not a rebuild: an earlier proposal merged six sections into two
new ones and was rejected, on the grounds that the obvious cuts should be made
first and consolidation judged against the simplified page rather than against
assumptions. That order still stands for the next pass.

**Narrative spine:** `FLY -> DEBRIEF -> GET BETTER -> GET CHECKRIDE READY`.

**Cut from the homepage, files preserved and NOT deleted:**

| Component | Why | Where it lives now |
|---|---|---|
| `FlightRecordingPreview` | future functionality interrupting a story about today | unreferenced |
| `ForCfis` | speaks to the CFI mid-student-journey | `/instructors` exists, in nav |
| `WhoItsFor` | three ICPs stop the student story | `/instructors`, `/schools` |
| `FounderStory` | provenance, not part of the journey | **unreferenced, no About page** |
| `TrainingCostCalculator` | ROI machinery for a one-sentence argument | unreferenced; `TrainingEconomics` keeps the copy |

`FounderStory` and `TrainingCostCalculator` are intentionally orphaned. Do not
delete them as dead code -- both are candidates for dedicated pages, and that
is a product decision rather than a cleanup.

**Kept as-is, explicitly:** `DebriefReplay`, `PerceptionGap`,
`PersonalizedTraining`, `VectorSection`, `NextFlight`, `SkillProgress`,
`DebriefDoctrine`, `Proof`, `Pricing`. These had already been refined and were
not to be reworked while the page was being shortened. No ACS beat was added to
`SkillProgress` for the same reason.

**Added:** `Capabilities`, and it is deliberately tiny -- 450px against a
median section height of 1139px. Four items, no cards, no screenshots, the
hairline-and-label treatment from `BrandMoment` rather than a new one. It lists
**Recommended Study, Chair Flying, Instructor Continuity, ACS Readiness** and
deliberately omits Vector and Debrief Replay: both still have full sections
above it, so listing them again would re-add length to repeat what the page
already said. Chair Flying and ACS readiness appear nowhere else; Instructor
Continuity left the page entirely with `ForCfis` and `WhoItsFor`.

### The hero is measured, and the rule is the orphan rule

`Get to your checkride sooner — with confidence.` is 46 characters against the
old headline's 35, and the old comment's "two lines" was a property of that
shorter copy rather than a design choice. The stated rule -- **no line may ever
hold a single word** -- is what sets the size.

Measured in the real face at 60px against the 576px column: a two-line split
makes `sooner — with confidence.` 956px wide and caps the type at **36px**, a
third smaller than the 54px it had. Splitting three ways makes
`checkride sooner —` the longest line at 718px, which allows 48px.

Shipped at `clamp(1.375rem, 7vw, 2.875rem)` — 46px rather than 48 for real
headroom, since 48px left four pixels in a 576px column and would wrap on any
rendering variance. Verified 320 / 375 / desktop: 22.4px / 26.3px / 46px, three
lines, no orphan at any width.

**7vw, and the first attempt got this wrong.** Tuning the vw term to reach the
desktop ceiling gave 4.6vw, which is 17px at 375 -- the clamp floor took over
and the hero rendered smaller than the body copy beneath it. The small end is
the binding case, not the large one.

### Two responsive faults found while measuring

**Fixed:** `PhotoVisual`'s label in `app-screen.tsx` was `whitespace-nowrap` and
unbounded. Fine while labels were short, broken the moment one grew --
`Step 4: Get Checkride Ready` rendered 330px wide inside a 320px viewport and
pushed the whole page into horizontal scroll. Now `max-w-full` and allowed to
wrap.

**Not fixed, pre-existing:** the `Pricing` cards overflow at 320px — six
elements reaching 339px in a 320px viewport, causing horizontal scroll.
`pricing.tsx` was untouched by this pass. Worth a look; it is the only
remaining horizontal-scroll source on the homepage.

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

## The database, and the trap that looks like data loss

**Production is Replit's managed Postgres**, whose host resolves to `helium`.
That is what the deployed site has always used, and as of 2026-09-01 it is what
the workspace uses too.

It did not used to be. Six credentials — `DATABASE_URL` plus `PGHOST`,
`PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — had been set **by hand** in
Replit Secrets, pointing at a *different* Neon database
(`ep-holy-frog-ayvh6m5d…`, database `neondb`). A manually-set secret shadows the
managed integration, so:

- the workspace read and wrote `ep-holy-frog`
- the deployment, which had **no** database keys in its own secrets scope, read
  and wrote `helium`
- the two diverged for weeks, and local work never touched production

Replit reports this as *"External database detected"* and **refuses to publish**
until the six secrets are removed. Removing them is correct.

### Why this reads as catastrophe and is not

Deleting the six and restarting makes the counts change:

| | users | orgs | flights | debriefs |
|---|---|---|---|---|
| `ep-holy-frog` (was in the workspace) | 27 | 7 | 83 | 79 |
| `helium` (production) | 31 | 9 | 154 | 82 |

Nothing was deleted. **Deleting a secret removes a password, not data** — both
databases still exist, intact. The numbers move because you stopped reading the
wrong one.

**The check that actually settles which database is production is not the data.
It is the Deployment's own secrets scope.** If `DATABASE_URL`/`PG*` are absent
there, the live site uses the managed database, and the managed one is
production by definition. Row counts cannot tell you this — the stale copy had
*more* recent-looking data in some tables.

Do not trust Replit's Database panel to answer it either. While the secrets are
in place the panel reports the shadowed value, so it will happily confirm a host
that is not the one the deployment uses. That confirmation is what sent this
session down the wrong path.

### If you ever do this again

```bash
# 1. Is a file overriding too? Secrets are not the only shadow.
grep -nE "DATABASE_URL|^PG" .env.local || echo clean

# 2. Back up somewhere that SURVIVES A RESTART. /home/runner does not --
#    `kill 1` wipes it, and a dump written there is gone. ~/workspace persists.
pg_dump "$DATABASE_URL" -f ~/workspace/backup.sql

# 3. Keep it out of git. ~/workspace IS the repo and *.sql was not ignored.
echo "*-backup.sql" >> .gitignore

# 4. Delete the six secrets, restart the CONTAINER (env is injected at start,
#    restarting the dev server inherits the old values), then verify.
node -e "const u=new URL(process.env.DATABASE_URL); console.log(u.hostname)"
```

Then download the dump off Replit. A file on a container is not a backup.

`SEED_DEMO_DATA` and `FORCE_RESEED` sit in the deployment secrets and are inert:
`postgres-repository.ts:1615` returns `false` on `REPLIT_DEPLOYMENT` before
either is read. Dead config, not a risk.

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
| **`/`** | **`200`** | **gated — see below, this is NOT a hole** |
| `/how-it-works`, `/demo`, `/prototype/vector`, `/prototype/vector/progress` | `307` → `/gate` | gated |
| `/gate`, `/login` | `200` | reachable |
| `/invite/accept` | `307` → `/login` | its own no-token logic, **not** the gate |

**`/` returns 200 when the gate is ON, and an earlier version of this table said
`307`.** That wrong row cost an hour on 2026-09-01: the live site was checked
after publishing, `/` came back `200`, and it was read as the gate having
failed. `proxy.ts:55` **rewrites** the root rather than redirecting it —

```js
if (pathname === "/") return NextResponse.rewrite(gateUrl);
return NextResponse.redirect(gateUrl);
```

— so the gate page is served *at* your domain without exposing the marketing
page underneath. Confirm by title, not status code:

```bash
curl -s "$APP_BASE_URL/" | grep -oE "<title>[^<]*</title>"
```

`<title>AfterFlight</title>` is the gate (`app/gate/page.tsx`). The real homepage
says `AfterFlight — Make every flight build on the last.` The decisive check is
that `/prototype/vector` redirects to `/gate?next=…`, since that whole branch
only runs when `isSiteGateEnabled()` is true.

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

**Resolved 2026-09-01.** `SITE_ACCESS_CODE` *is* in the Deployment's own secrets
scope, and the gate was verified live at `getafterflight.com` after publishing:
`/` serves the gate page, `/prototype/vector` redirects to `/gate?next=…`. The
principle still holds for any future secret — a Deployment carries its own
scope, and the database keys in the section above were the proof.

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

## Progress — Skills and ACS are two different questions

**Read this before editing `lib/prototype/acs.ts` or the Progress tabs.** They
used to be the same four rows regrouped under an Area heading, which made the
ACS tab look like a relabeled Skills tab because that is exactly what it was.

|  | Answers | Shape |
|---|---|---|
| **Skills** | "What am I getting better at?" | Flat, tappable list in the student's own vocabulary. Unchanged. |
| **ACS** | "How am I tracking against what I'll have to demonstrate?" | Published Area of Operation → Task, led by a readiness summary. |

**The load-bearing difference is the rows with no score.** A skills list can
only ever contain what has been assessed; the checkride question is mostly
about what has *not* been. Five of the eight tasks show **Not assessed yet**
with **no meter** — a 0-of-4 meter would claim the instructor assessed this and
found nothing, when the lesson simply has not happened. Do not "fill in" those
rows.

**No second scoring model.** A task sits at the *lowest* level of the skills
assessed under it, on the same three-state scale — a task is not at standard
while a component of it is not. That is an ACS rollup, which MASTER.md §2
already sanctions as one of the three places a state color may appear.

**The readiness summary is counts, not a verdict.** "2 of 3 assessed tasks
meeting standard", and the not-assessed count is rendered directly beneath it
in the same panel. That pairing is deliberate and a test enforces it: without
the denominator being *assessed* and the remainder stated, the number reads as
"two-thirds ready", which is precisely the aggregate readiness verdict this
product does not make. No percentage. The signoff is still Jake's, and the
InfoTip says so.

### Task codes were wrong and are now single-sourced

The seed had crosswind at `PA.IV.E`, stabilized approach at `PA.IV.A` and
short-field at `PA.IV.G`, and `PA.IV.E` was additionally hardcoded into
`/compare` and `/profile/guide`. None of it matched the published task letters,
and adding real task names would have made the two views contradict each other
on screen.

Corrected to the tasks the skills actually sit under: crosswind **and**
stabilized approach are both `PA.IV.B` *Normal Approach and Landing* — crosswind
is a **condition** of that task in the ACS, not a task of its own — and
short-field is `PA.IV.F`. `acs.test.ts` asserts every skill's own `acsCode` and
`acsArea` match the task claiming it, so they cannot drift apart again.

`ACS_AREAS.airport` was renamed to the published **"Airport & Seaplane Base
Operations"**. It looks odd above a land trainer's radio work and it is correct;
`PA.III.A` already belonged to that Area.

`skillsByAcsArea()` is gone — the ACS view is built from the task structure now
and nothing else called it.

Keep the published Area names and task codes here. They are not to be
simplified back into the friendlier Skills taxonomy — the formality is what
makes this view read as checkride preparation rather than as the Skills list
with a different tab selected. And see the vocabulary boundary in the debrief
section: nothing student-rated belongs on this screen.

---

## A whole screen was throwing, and nothing caught it

`components/prototype/assessment-comparison.tsx` called `stateTone()` — which
lives in the client-only `ui.tsx` — without carrying `"use client"` itself. On
`/debrief/latest` that worked, because a client page pulls the component into
the client graph. Every **server-rendered** skill-detail route
(`/progress/crosswind-landing` and its three siblings) threw *"Attempted to call
stateTone() from the server"* and returned 500.

It shipped in the dual-assessment work and survived because the browser pane has
been unreliable, so nobody loaded those routes. Fixed by adding the directive.

**The lesson worth keeping:** `tsc`, `eslint` and the whole vitest suite pass on
this bug. Nothing in the test setup renders a route. A curl sweep over every
prototype route is currently the only thing that would have caught it — worth
running before declaring a prototype pass done:

```bash
for p in $(grep -rho '/prototype/vector[a-z0-9/-]*' app components | sort -u); do printf "%-52s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000$p)"; done
```

---

## Two gaps that are easy to miss because the surface looks finished

**The marketing site now describes a debrief flow that only exists in the
prototype.** `68a4b39` rebuilt the guided dual-assessment debrief under
`app/prototype/vector/**`, and the homepage was reframed to match. The real
`(product)` app was **not** touched. A visitor reading the homepage and a user
signing in are currently promised different things. This matters before any
pilot, and it is invisible if you only ever look at `/` and `/prototype`.

**Homepage card two under-sells its own point.** The "Compare how you both saw
it" card shows two ratings whose meters render at similar lengths, so the
*difference* between them reads mostly as a color change -- and showing that
difference is the entire reason the card exists. Worth judging at full size.

---

## Chair Flying — shipped

**Read this before touching `lib/prototype/chair-fly.ts` or anything under
`app/prototype/vector/train/`.**

The defining rule, and it is enforced by tests: **a drill is generated from what
actually happened on the student's last flight.** Not a study library with a
crosswind chapter. The loop it closes is Flight → Debrief → specific training
need → Chair Flying → Next Flight.

### The selection rule is the product

`contestedObjective()` picks the objective where **the student rated themselves
above the instructor** — largest gap first. That is deliberate and it is the
part no competitor can copy, because it needs both assessments:

- The weakest open skill is the one she already knows about. Jake said it, it is
  on the debrief, she would pick it herself.
- The contested one is the one she thinks went **fine**, which is exactly why
  she would never choose to rehearse it.

Falls back to whatever the instructor left open, so Train always has something
to say. Returns null when nothing is contested and nothing is open, and
`recommendedDrill()` returns null when the chosen objective has no authored
scenario — `/train/chair-fly` 404s rather than serving generic content. **That
is the correct failure. Do not add a default drill.**

### Chair Flying is NOT an assessment layer

There is exactly one performance model in this product
(`lib/performance-levels.ts`) and Chair Flying only ever **reads** it. No
correctness scores, no percentages, no pass/fail, no points, no stars, no
mastery levels, no separate proficiency scale. Choosing an option produces
coaching and then the next situation.

`ChairFlyOption` has **no `correct` flag**, and `chair-fly.test.ts` asserts the
option keys are exactly `id / response / text`. That is not tidiness — a boolean
is the thing a future session would count, and a count is a score. If Chair
Flying activity ever needs tracking, track completion separately and do not let
it touch the performance model.

The step UI carries no right/wrong coloring for the same reason: the chosen
option is marked as chosen and Vector's words carry whether the reasoning holds
up. If that ever reads as too soft, the fix is the wording, not a color.

### What is derived vs authored

Derived from the seed: which objective, both ratings, the instructor's evidence,
the carry-forward list (`CONCEPTS[...].nextTime`), the next-flight link, and the
stated duration (from step count, so the claim cannot drift from the content).

Authored: the six scenario beats, keyed by objective in `SCENARIOS`. The
prototype has no generation pipeline and the brief was explicit about not adding
one.

### Rules inside the drill

- **Six beats:** scene → control inputs → flare → touchdown → **rollout** →
  judgment. The rollout beat is the one from Jake's debrief and it is the only
  step carrying `instructorNote`, so his name appears on his own words and
  Vector never speaks in the instructor's voice. Asserted in tests.
- **At least one `kind: "judgment"` beat**, with the go-around offered as
  legitimate rather than as failure. A rehearsal that is only procedure teaches
  sequence, not decision.
- **No typing.** Tap and reveal, one situation on screen, the previous prompt
  gone. The old `components/prototype/chair-fly.tsx` was a growing chat log with
  a text input; it was deleted, because composing sentences for a machine is not
  sitting in the airplane.
- Conditions come from the flight that produced the note — KSQL, Runway 30, left
  crosswind ~12 kt, the C172S. **Wind from the left means the upwind wing is the
  LEFT wing and any drift is to the RIGHT.** The old seed had a beat drifting the
  wrong way; the new ones are written to this and were reviewed for it.
- The guardrail line points back to the checklist, the POH and the instructor,
  and no number is invented — the only figures used are ones Jake already said.

### Later modes are architected, not built

`ChairFlyMode = "guided" | "recall" | "challenge"`, and only `guided` exists.
`looksFor` / `idealAnswer` survive on every step as the free-text seam for
`recall` — `evaluateChairFly()` in `lib/ai/vector.ts` and the `chair_fly` intent
on `/api/prototype/vector` still consume them. A spoken mode is a delivery change
on top of `recall`, not a fourth mode. **No speech analysis was built.**

`CHAIR_FLY` moved out of `vector-data.ts` into `lib/prototype/chair-fly.ts`;
there is one dataset, and the old export is a getter over the drill so the API
route keeps working.

### Where it lives

One route added: `/prototype/vector/train/chair-fly`, server-rendered from the
seed. Quiz and Ask are still in-page modes on Train; this one is not, because
the rehearsal needs the whole screen and every screen here is deep-linkable.
Train's recommendation panel now leads with **Start chair flying** and states
both ratings above Jake's evidence; Review / Quiz / Ask are demoted to
secondaries. A Vector card whose `nextAction.target` is `chair-fly` navigates
there from any surface — that is handled once in `vector-panel.tsx`.

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
11. Knowledge-check never got the premium pass — visible seam entering from
    Train. (The chair-fly half of this is resolved: it is built on `ui.tsx`
    now. `knowledge-check.tsx` still uses shadcn `Card` and its own button
    styles.)
12. Deepgram "50% discount" claim in `lib/transcription/use-deepgram-transcription.ts`
    comments and `.env.example` is **unverified** and traces only to a
    competitor's blog. It should be corrected or removed.
13. `council/demo-story.md` still carries the Atlas framing and three claims
    that were later corrected
14. Tasks #156 (home progress rail), #157 (solo signup smoke test), #158
    (homepage stage-two positioning, held pending 20 CFI discovery calls)
15. ~~`npm run build` has never been run successfully outside Replit~~
    **Resolved 2026-09-01.** It builds clean on Replit: 108 static pages, no
    errors. Note what that proves — the four `/prototype/vector/progress/[skill]`
    routes are prerendered (SSG), so the build *executes* their render. Before
    the `"use client"` fix on `assessment-comparison.tsx` they threw, which means
    a green build is now independent evidence that fix holds.

---

## Things a fresh session will get wrong without being told

- **The browser pane's failures in the Chair Flying session were the
  ENVIRONMENT, not the app.** Clicks via `computer` timed out with "the pane may
  be stuck", `_next` chunks returned 403 inside the pane while curl got 200 for
  the same URLs, and the page would not scroll past ~37px. React was hydrated
  and healthy throughout: dispatching clicks with `javascript_tool` drove every
  state transition correctly. Chair Flying was verified that way plus
  server-rendered curl checks — so the *logic and rendering* are confirmed, but
  the real mouse-input and scroll path was never exercised. **Repeat a normal
  visual interaction pass on `/train/chair-fly` when the browser environment is
  healthy**, including the below-the-fold portion of a step screen.
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
