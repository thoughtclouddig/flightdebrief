# AfterFlight V2 — Staging Release-Candidate Audit

Status: audit only. No product code changed except where explicitly noted in §17. Branch: `student-v2-clean-cutover` @ `0e5fe8b365a598c975ee2c8df1ad816b7bf11f6a` (the accepted Web V2 baseline through the School V2 demo-entry cutover).

**STAGING-RC-0 update:** the §15 P0 item "`/prototype/vector` pages have no environment-level gate" is **resolved** — `app/prototype/layout.tsx` now calls `notFound()` for any request where `isDevelopment()` is false, a single shared guard covering the entire `/prototype/**` route family (no other page routes sit outside it). This no longer depends on `SITE_ACCESS_CODE` at all; that gate remains in `proxy.ts` as an unrelated, now-redundant-for-correctness optional layer. §15/§16/§17 below are updated to reflect this; the rest of the audit is unchanged.

Release principle: **Development proves the product. Staging proves the release. Production receives only what Staging already proved. Staging should look like Production, not Development.**

---

## 1. Current environment behavior

`lib/env.ts`'s `getAppEnv()` is the canonical helper:

```ts
export function getAppEnv(): AppEnv {
  const explicit = (process.env.APP_ENV ?? "").trim().toLowerCase();
  if (explicit === "development" || explicit === "staging" || explicit === "production") return explicit;
  return process.env.REPLIT_DEPLOYMENT ? "production" : "development";
}
```

Development = explicit `APP_ENV=development`, or no `REPLIT_DEPLOYMENT` and no valid `APP_ENV`. Staging = explicit `APP_ENV=staging` only — nothing else infers it. Production = `REPLIT_DEPLOYMENT` set with no valid `APP_ENV`, or explicit `APP_ENV=production`.

**Critical finding: most dev-only/demo-only gates in this codebase do NOT go through `lib/env.ts` at all.** They read raw `process.env.REPLIT_DEPLOYMENT` directly. This creates a real inconsistency: a hypothetical Staging deployment reached by setting `APP_ENV=staging` on infrastructure that does *not* also set `REPLIT_DEPLOYMENT` would have `getAppEnv()` correctly report `"staging"` everywhere it's actually called, while five separate raw-`REPLIT_DEPLOYMENT` gates would stay wide open, believing they're still in Development.

### Gate-by-gate, verified fresh (not from memory)

| Surface | Development | Staging | Production |
|---|---|---|---|
| `/v2/**` (Student V2) | Open; fixture by default, real-data via `af_v2_real_data` cookie | Reachable if `SITE_ACCESS_CODE` unset or gate cookie present; **fixture-only** — `v2StagingUsesRealData()` hardcodes `return false` | **Hard 404** (`isProduction()` check, the sole guard — `proxy.ts` doesn't even list `/v2` in its matcher) |
| `/cfi-v2/**` | Open, real session + `instructor` role required | **Hard 404** (`!isDevelopment()`) | **Hard 404** |
| `/school-v2/**` | Open, real session + `admin`/superadmin role required | **Hard 404** (`!isDevelopment()`) | **Hard 404** |
| `/prototype/vector/**` (pages) | Open | **Resolved by STAGING-RC-0:** `app/prototype/layout.tsx` now calls `notFound()` unless `isDevelopment()` | **Resolved by STAGING-RC-0:** same code-level `notFound()`, independent of `SITE_ACCESS_CODE` |
| `/api/prototype/vector` (POST, backs the prototype's Ask/grade/chair-fly interactions) | Open | 404 if site gate configured and not passed | **Always 404**, unconditional `isProduction()` check |
| `/api/demo/start?persona=pilot\|cfi\|school` | Open | Open — real seeded org+session; `cfi`/`school` resolve to canonical `/cfi/today`/`/admin/overview` since `isDev` is false | Open **by design** — this is the marketing site's live "try it" demo, meant to run in real Production |
| `/api/demo/start?persona=pilot-real\|cfi-v2` | Open | **400** (`!isDevelopment()`) | **400** |
| `/api/demo/enter`, `/api/auth/dev-login`, `/api/demo/reset`, `/demo/overview`, `/dev/login` | Open | **404 only if `REPLIT_DEPLOYMENT` happens to be set** — raw signal, not `isDevelopment()` | 404, assuming `REPLIT_DEPLOYMENT` is set per Replit platform convention |
| Membership switcher | Always on | Always on | Always on — **not environment-gated at all**, a deliberate policy change (see below) |

**Two findings that need a decision before Staging is treated as production-like:**

1. ~~`/prototype/vector`'s ~19 page routes have no code-level environment gate whatsoever.~~ **Resolved by STAGING-RC-0** — `app/prototype/layout.tsx` now hard-gates the whole family with `notFound()` unless `isDevelopment()`, independent of whether `SITE_ACCESS_CODE` is configured.
2. **CFI V2 and School V2 are entirely unreachable in Staging today.** If the intent is to demo/QA them in Staging before a canonical cutover, this requires a deliberate decision (§16) — either temporarily widen the gate for Staging QA, or accept they stay Development-only until the canonical cutover itself happens directly in Production-adjacent Staging.

**Membership switcher is not a stale dev-only leak** — `isMembershipSwitcherEnabled()` in `lib/auth/membership-switcher.ts` hardcodes `return true`, with a doc comment explaining it used to be Development-only and was changed because that "quietly broke every multi-membership case the product actually supports." Safety is server-side re-verification of the caller's own memberships, not environment restriction. If prior documentation said otherwise, that's stale; the code has moved past it.

---

## 2. Route mapping

| Role | Canonical route today | Accepted V2 route | Status |
|---|---|---|---|
| Student | `app/(product)/{home,train,debrief,flights,progress,profile,dashboard}/**` | **Same routes — Student V2 already IS canonical.** There is a separate `app/v2/**` tree, but it is a newer, not-yet-real-data, not-yet-cutover-target build; the real V2 experience already lives at the canonical paths. | **Already cut over.** No further route work needed for Student. |
| CFI | `app/(product)/cfi/**` (V1 presentation, untouched, still the real default for every CFI signing in normally) | `app/cfi-v2/**` (Development-only) | **Not cut over.** Real users always land on canonical V1 `/cfi/today` in Staging/Production today. |
| School/Admin | `app/(product)/admin/**` (V1 presentation, untouched) | `app/school-v2/**` (Development-only) | **Not cut over.** Real users always land on canonical V1 `/admin/overview` in Staging/Production today. |

**What must be cut over for a genuine Staging release candidate, vs. what can remain temporary for the first pass:**

- **Must cut over eventually, but can remain temporary for STAGING-RC-1:** CFI V2 and School V2 staying under their current dev-only prefixes is *acceptable* for an initial Staging pass whose goal is proving Student V2 in Staging conditions — it does not block that goal, since Student is already canonical.
- **Must be decided before ANY CFI/School V2 promotion:** the two Development-only layout gates (`!isDevelopment() → notFound()`) are the only thing standing between "CFI V2/School V2 exist in the codebase" and "real CFI/School users are redirected there." This is a deliberate, single-line-per-file change (mirroring exactly how Student's own `/v2` real-data gate already reads `isStaging()`/`isProduction()` explicitly rather than a blanket dev-only check) — not a large migration, but a real product decision about readiness, not just a technical flip.
- **This audit does not perform the cutover.** It only reports the exact mapping and confirms what changing it would touch: `app/cfi-v2/layout.tsx:28`, `app/school-v2/layout.tsx:21`, and (once ready) `app/api/demo/start/route.ts`'s persona-to-redirect table (`lib/demo/demo-redirect.ts`) so `persona=cfi`/`persona=school` resolve to the V2 paths outside Development too.

---

## 3. Real-data adapter readiness by role

| Role | Screens audited | Verdict |
|---|---|---|
| **Student** | Home, Train, full Debrief lifecycle, Flights, Progress, Profile (`app/(product)/**`) | **REAL**, end to end. This is the canonical, currently-shipping product — every screen reads real Postgres data via `getRepository()`/`getViewer()`. (A handful of Train sub-features — Review/Quiz/conversational Ask Vector — are fixture-only and correctly rendered as disabled in the real product; this is documented, honest scope containment, not a readiness gap.) |
| **CFI** | Today, Students, Student Detail, full debrief lifecycle route family, Profile (`app/cfi-v2/**`) | **REAL**, independently re-verified this pass. Every page calls `getRepository()`/`getAuthorizedFlight()` and reuses the same shared business-logic modules (`lib/training-memory.ts`, `lib/debrief-progress.ts`, `lib/perception-gap.ts`) canonical `/cfi/**` uses. `app/cfi-v2/layout.tsx`'s own doc comment states outright: "CFI V2 has no fixture mode at all." **No mixed or fixture screens found.** |
| **School** | Overview/Insights, Students, Instructors, Student Detail, Instructor Detail, Aircraft, Settings, Data & Consent (`app/school-v2/**`) | **REAL**, independently re-verified this pass. Aircraft reuses the exact canonical `/api/admin/aircraft` CRUD routes; Settings reuses `RenameOrganization`/`ChangeEmailForm`/`AvatarUpload` against their existing real endpoints; Data & Consent reads the real `Organization.transcriptRetentionDays` via `lib/consent.ts`. Grepped `components/school-v2/**` and `lib/school-v2/**` for `prototype-fixtures`/`fixture` — zero real matches. **No mixed or fixture screens found.** |

**No accepted V2 UI (Student, CFI, or School) currently depends on fixture-only data or prototype assumptions.** Every accepted screen is genuinely real-data. The gap is exclusively **reachability** (§1/§2 — CFI/School V2 are dev-only), not data readiness.

---

## 4. Auth / session / role boundaries

- **Session mechanism:** signed HS256 JWT (`SESSION_SECRET`), 7-day flat expiry, in an httpOnly `fb_session` cookie. Purpose-bound (`purpose` claim baked into every JWT type — session, magic-link, signup-link, email-change — so one token type can never be replayed as another).
- **Login:** magic-link only (email → 15-minute JWT → `/api/auth/callback` verifies, mints a real session, redirects). No password exists anywhere in the system.
- **Student/CFI/School login is identical** — one magic-link flow, differentiated only by which `OrgRole` (`student`/`instructor`/`admin`) the resolved membership carries. There is no role-specific login path to separately verify.
- **Role redirects:** none of the sensitive role gates trust a client-supplied value. `authorize()`/`getViewer()` resolve `viewer.role` fresh from the database on every request. Spot-checked (consent submission, assessment submission, admin actions): all server-enforced, none bypassable by a forged client claim.
- **Same-device guest CFI handoff:** not a second login, not a client-side flag. It's a server-persisted `attribution` field (`"account_verified"` vs. `"guest_handoff"`) on the `DebriefAssessment` row, granted only when the caller is the flight's own student **and** their own assessment is already submitted. Every downstream gate re-checks this stored attribution. Fully portable, environment-agnostic — nothing here depends on Development.
- **Logout:** clears the cookie only. **There is no server-side session table or revocation list anywhere in the schema.** A token remains cryptographically valid until its 7-day expiry regardless of "logout." This is a real, standing architectural fact — true today in every environment, not something Staging changes or introduces.
- **Expired sessions:** flat expiry, re-login via a fresh magic link; no refresh-token concept exists.
- **Cross-role route protection:** confirmed server-side and consistent — canonical `/admin/**`, `/cfi/**`, and student routes all gate on `viewer.role` fetched fresh each request; `/cfi-v2`/`/school-v2` additionally gate on `isDevelopment()` first.
- **Anything that works only because of Development demo seeding:** the CFI-V2/School-V2 layouts' dev-only gate is the only auth-adjacent thing tied to environment; the underlying session/role/handoff mechanics themselves are identical in every environment and do not depend on demo seeding to function correctly.

**No auth/session mechanism is Development-specific in a way that would silently break in Staging** — the one real risk is the raw-`REPLIT_DEPLOYMENT` inconsistency noted in §1, which affects demo/dev-login surfaces, not the core session/role system.

---

## 5. Debrief lifecycle readiness

Traced end to end against real backend integration, not test-suite results:

| Step | Status | Basis |
|---|---|---|
| Student flight/lesson exists | **READY** | Real `Flight`/`flight_tasks` rows, real repository queries |
| Student assessment | **READY** | Real `POST .../assessments/[role]/ratings` + `/submit`, server-validated against real DB state |
| Same-device or authenticated CFI assessment | **READY** | Attribution mechanism above; server rejects instructor submission before the student's own is in, unconditionally |
| Consent | **READY** | Real `POST .../debrief/consent`, stores `{flightId, participantUserId, participantRole, status, policy_version}`; no browser-specific dependency |
| Recording | **READY, functionally** — live browser mic → Deepgram live STT directly, not a blob upload. **Requires `NEXT_PUBLIC_DEEPGRAM_API_KEY`** (client-exposed by design today) to be configured in whatever environment serves Staging, or recording silently falls back to a scripted mock transcript with no real STT at all |
| Transcription | Same as above — **requires the Deepgram key configured**, else mock |
| Structured debrief (analysis) | **READY**, contingent on a real transcript existing (i.e., contingent on the Deepgram key) — `POST /api/debrief/analyze` itself is a plain, real, working JSON endpoint regardless |
| Comparison/reveal | **READY** — real per-objective side-by-side rating, computed from real submitted assessments |
| Training signals | **READY** — `classifyTrainingSignals()` (`lib/taxonomy.ts`) derives real `TrainingSignal` rows from the real structured debrief's `needsWork`/`wentWell` text via keyword matching; no fixture path |
| Next-flight recommendations | **READY** — `computeNextLessonBrief`/Train's recommendation logic reads these same real signals |
| Progress updates | **READY** — `computeSkillProgression` reads real `TrainingSignal` history |

**Nothing in this lifecycle is fixture-only or blocked at the code level.** The **one real environment-configuration dependency** is `NEXT_PUBLIC_DEEPGRAM_API_KEY` (STT) and `DEEPGRAM_API_KEY` (TTS recap) — both must be set for Staging to exercise the real pipeline; without them, recording silently degrades to a mock transcript (STT) or the "Listen" UI simply doesn't render (TTS, gated by `Boolean(process.env.DEEPGRAM_API_KEY)`). This is a **configuration checklist item, not a code blocker.**

---

## 6. Recording / transcription / TTS

- **Browser recording:** `getUserMedia({audio:true})` → `MediaRecorder` (250ms chunks) → streamed live over a WebSocket directly to Deepgram (`listen.live`, `model: nova-2`, `diarize: true`). AfterFlight's own server is never in this data path.
- **Consent:** gates recording start via a real, already-portable API call (§5).
- **Deepgram transcription:** real, live, working — **but the STT credential (`NEXT_PUBLIC_DEEPGRAM_API_KEY`) is bundled into the client-side JS bundle by design**, with the code's own comment explicitly flagging this as a shortcut to fix "for a real deployment beyond a prototype" (swap for a server-minted short-lived key). This is a pre-existing, self-acknowledged issue, **not something Staging introduces** — but Staging is exactly the environment where this should be taken seriously as a release-readiness question, since Staging is meant to prove the release is production-ready, and this specific shortcut is explicitly labeled as not being production-ready as-is.
- **Structured summary generation:** `POST /api/debrief/analyze`, real, server-side, `authorize()`-gated.
- **Training signal generation:** real, keyword-based, deterministic (§5).
- **TTS recap:** real, server-side only (`DEEPGRAM_API_KEY`, never `NEXT_PUBLIC_`-prefixed), `https://api.deepgram.com/v2/speak`, cached per (flight, voice, script). Gated on the key being present; degrades to simply hiding the "Listen" UI if absent — a clean, honest degradation, not a broken button.
- **Error/retry behavior:** analysis failure reverts the recording screen to a resumable state rather than losing the recording; already-correct behavior, environment-independent.
- **Required env vars for Staging:** `NEXT_PUBLIC_DEEPGRAM_API_KEY`, `DEEPGRAM_API_KEY`. Without both, the debrief lifecycle still functions end-to-end on mock/absent transcription/TTS — degraded, not broken, but **not proving the real pipeline**, which defeats the purpose of a release-candidate pass through Staging.

---

## 7. Flight / FR24 / tracking

- **Add Flight:** real, both sub-flows (tail-number search, manual entry) — real DB writes either way.
- **Start Flight:** not built in the web product at all; every real call site renders it as a visibly disabled control. Not a Staging concern — it's an acknowledged, deliberate product gap (explicitly slated as native-iOS work per separate IOS-1 documentation), not something Staging needs to "fix" or work around.
- **FR24 import:** real, complete provider code (`lib/flight-data/fr24-provider.ts`) — **but contingent on `FR24_API_KEY` being configured.** As currently configured (unset), the app falls back to `MockFlightDataProvider`, which generates a **deterministic synthetic geometric pattern**, not real recorded ADS-B data, for every environment, demo and production alike. This is not a Staging-specific gap — it's the honest current state of FR24 integration everywhere.
- **`Flight.track`:** real, populated schema field either way (real ADS-B when `FR24_API_KEY` is set, synthetic pattern otherwise); the map component (`components/flight-map.tsx`) renders either honestly, with distinct empty-state copy for "no public ADS-B available" vs. "logged by hand."
- **Replay / analysis / moment evidence:** **do not exist as real routes anywhere** — `/flights/[id]/{analysis,replay,compare,moments}` have no production equivalent; these words correspond only to fixture routes under `/v2/**`/`/prototype/vector/**`. This is a genuine, already-documented capability gap, not something this Staging pass introduces or needs to solve.

**Required for Staging to prove real FR24 behavior:** `FR24_API_KEY`. Not required for the release candidate to be otherwise sound — the mock provider's synthetic-track behavior is consistent and non-broken either way, just not "real."

---

## 8. Email

Provider: **Resend**, via `lib/email.ts`'s shared `send()` helper. Prefers `RESEND_API_KEY` (portable across environments); falls back to Replit's workspace-scoped connector (`connectors.proxy("resend", ...)`) if unset — **the fallback is itself Replit-workspace-specific and should not be relied on for a genuine Staging/Production deployment target.**

**Four real email types, no more, no fewer** (grepped exhaustively): magic-link sign-in, signup confirmation, email-change confirmation, and one role-parametrized org-invite template (used identically for admin-inviting-CFI, admin-inviting-student, and student-inviting-their-own-CFI). **There is no separate school-invite template, no debrief-notification email, and no server-side support-request email** — support is a plain `mailto:` link in the UI.

**Graceful degradation, confirmed:** `send()` never throws; a failed send is logged and returns `false`, and every triggering action (invite created, signup token minted, etc.) completes its primary side effect regardless. **No environment can be broken by missing email credentials** — email failure is silently non-fatal everywhere, by design.

**Sender address:** falls back to Resend's own shared test domain (`onboarding@resend.dev`) if `INVITE_EMAIL_FROM` is unset; `.replit`'s workspace-level `[userenv.shared]` sets it to `debrief@getafterflight.com`, but per the same secrets-scope caveat as everything else, **a published Deployment does not automatically inherit workspace-level env vars** — this needs independent confirmation for whatever Staging target is used.

**What must be configured/tested in Staging:** `RESEND_API_KEY` (do not rely on the workspace connector fallback for a real deployment target), `INVITE_EMAIL_FROM`, and `APP_BASE_URL` or `REPLIT_DOMAINS` (required for `appOrigin()` to resolve — without it, invite emails explicitly bail with a logged error rather than sending a broken link; magic-link/signup/email-change emails have the same dependency).

---

## 9. Stripe / trial / subscription

- **Real, working Stripe Checkout + Customer Portal integration**, entirely server-side. Plan is derived from `viewer.organization.kind` server-side (never trusted from the request body) — `individual` → pilot plan, `school` (admin-only) → School Pro, `independent_cfi` → 400 (free forever, no checkout).
- Both billing routes return a **hosted Stripe URL** (Checkout session, Customer Portal session) — a link-out model, not an embedded native payment flow. No code change needed to open these from any environment.
- Webhook (`POST /api/webhooks/stripe`) verifies `stripe-signature` against `STRIPE_WEBHOOK_SECRET` and is the sole writer of `organizations.stripe_*`/`subscription_*` columns — Stripe is the explicit source of truth.
- **Staging test-mode readiness:** the integration itself is environment-agnostic — it will use whatever `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are configured. **Using Stripe test-mode keys for Staging is the correct, standard approach** and requires no code change — only configuring Staging's own test-mode secret pair (distinct from Production's live keys) and registering a webhook endpoint pointed at Staging's own URL.
- **No route assumes Production** — nothing in the billing code branches on `isProduction()`/`isStaging()` at all; it is entirely keyed off whichever Stripe keys are present in the environment.
- **No demo flow bypass exists for billing** — the demo/persona-seeding flows do not touch Stripe at all; demo orgs simply have no subscription and the billing page renders its own "demo, billing unavailable" state for them (unrelated to Staging readiness).

This audit does not change pricing or product strategy, per instruction, and found nothing suggesting either is embedded in code beyond the plan-derivation logic already described.

---

## 10. Consent / privacy / data handling

- **Signup consent:** none beyond the magic-link account-creation flow itself; no separate "I agree to terms" gate was found at signup (worth flagging as a genuine open question for a release reviewer, though outside this audit's scope to resolve).
- **Recording consent:** real, per-flight, per-participant (`consent_records`), stamped with `CONSENT_POLICY_VERSION` so an old recording always resolves to the terms shown at the time. No dual-device signing exists — "the person running the recorder acknowledges on behalf of the session," an already-documented, already-accepted product limitation, unchanged by Staging.
- **Privacy/Terms:** static marketing-site legal pages (`/privacy`, `/terms`), unrelated to environment.
- **Data handling / transcript retention:** `Organization.transcriptRetentionDays` is a real, stored, per-org field — but as this session's own prior audit work established, **there is currently no scheduled job anywhere that enforces retention** (`purgeExpiredTranscripts` exists as a repository method with zero call sites). This is a real, standing product-truthfulness fact (already corrected in School V2's own Data & Consent copy this session) — not a Staging-specific blocker, but worth re-stating here since a release-candidate audit is exactly the moment to confirm this hasn't quietly changed.
- **Audio handling:** genuinely never stored — no audio column exists in the schema anywhere; this is architectural, not configuration-dependent, and holds in every environment identically.
- **School access boundaries:** confirmed server-enforced via the same role/org-membership checks audited in §4 — a school admin's access is scoped to their own organization's data throughout, no cross-org leakage found in any School V2 route.

**No Staging-specific blocker identified in this section** beyond the standing, already-documented "no retention enforcement job" and "no self-serve deletion" facts, which are product-truthfulness matters independent of environment.

---

## 11. School management persistence

Re-verified directly (§3): Aircraft CRUD, organization rename, account settings, student roster, instructor roster, School Insights, continuity derivation, and attention logic are **all real**, all Postgres-backed, all reusing existing canonical repository methods and (for Aircraft/Settings) existing canonical `/api/admin/**` routes. No fixture-only assumption found anywhere in `app/school-v2/**`, `components/school-v2/**`, or `lib/school-v2/**`.

The one deliberately-scoped, honestly-disclosed gap: **continuity/attention logic explicitly does not include a "continuity-summary" aggregate rollup** (no invented score), and Insights explicitly omits any metric without a real backing computation (trend detection, low-coverage-as-curriculum-gap framing) — these are documented product-scope decisions from earlier this engagement, not readiness gaps.

---

## 12. Demo separation model

**Intended, and largely already-achieved, separation:**

| | Purpose | Mechanism |
|---|---|---|
| **Public curated demos** (Student = Mia, and the `persona=pilot`/`cfi`/`school` entries) | Marketing site's live "try it" experience, safe to run in real Production | `persona=pilot` is a pure static redirect (zero DB writes) to the curated `/demo/student` fixture. `persona=cfi`/`persona=school` provision a **real, isolated, time-boxed** ephemeral org (`DEMO_ORG_TTL_MS`) per visit — real data, but deliberately disposable and organizationally isolated from any real school's data |
| **Real Staging QA** | Verifying the release against real, persisted behavior | Requires real signed-in accounts in Staging's own isolated database — magic-link login, same as Production, against Staging's own `DATABASE_URL` |
| **Real Production users** | The actual product | Same login mechanism, Production's own database |

**Contamination risks identified:**

1. **`persona=cfi`/`persona=school` are reachable in Production today, by design** (§1) — this is intentional (the marketing demo must work in Production) but means Production's database receives real, if time-boxed and isolated, org/user/flight rows from anonymous demo traffic. This is already-accepted behavior, not a new Staging risk, but worth restating: Staging inherits the identical behavior, so Staging's database will also accumulate real demo-org rows from anyone hitting its own public demo entry — expected, and cleaned up by the existing `cleanupExpiredDemoOrgs()` TTL sweep, not a contamination risk against *real* Staging QA accounts as long as demo orgs and QA accounts are both just "real rows in the same real database," properly isolated by organization.
2. **No overlap found between the curated public demo and real QA accounts** — the curated Student demo makes zero DB writes at all, and the CFI/School demo seeds are organizationally isolated (their own org id, their own users) from any persisted QA account's organization.
3. **The one thing this audit could not verify from code alone:** whether Staging's actual deployed `DATABASE_URL` is genuinely a separate, isolated database from Production's — see §13.

---

## 13. Database safety

**There is exactly one `Pool` instantiation in the entire application** (`lib/db.ts`), reading a single `DATABASE_URL` env var, with **zero environment-aware branching in code** — `getAppEnv()`/`isStaging()`/`isProduction()` have no interaction whatsoever with which database gets connected to.

**Direct answer: the code has no built-in safety preventing a misconfigured Staging deployment from pointing at the same database Production uses.** If Staging's `DATABASE_URL` secret is ever set to Production's value, nothing here would detect, warn about, or block that. This is entirely an operational/Replit-Secrets-pane responsibility.

- `.replit` contains no `DATABASE_URL` entry in any committed section — it's supplied via Replit's Secrets pane (workspace and/or per-Deployment scope), not committed config.
- `.env.example` does not document `APP_ENV` or `DATABASE_URL` at all — an operator setting up a genuine Staging target for the first time would not learn `APP_ENV` exists as a lever from that file; its semantics live only in `lib/env.ts`'s source.
- **Explicit terminology confirmation, from what the repo can determine:** "DEV DB" = whatever `DATABASE_URL` the Replit workspace's own `postgresql-16` module auto-provisions. "LIVE PROD DB" = whatever `DATABASE_URL` is set on the real Cloud Run/Replit Deployment. **"STAGING PREVIEW DB" vs. "STAGING DEPLOY DB" as distinct concepts are not determinable from this repository at all** — `lib/env.ts`'s own doc comment states plainly, as of this reading, "staging does not exist as its own deployment yet." Whatever is currently called "Staging" is either a workspace session with `APP_ENV=staging` manually exported (in which case it likely shares the dev workspace's database unless a second `DATABASE_URL` secret is separately configured for that session) or needs to be a genuinely separate Cloud Run/Replit Deployment target with its own `DATABASE_URL` secret, distinct from both dev and Production.

**Recommended before any Staging release candidate is trusted with real data:** an explicit, operator-confirmed statement of which literal `DATABASE_URL` value backs "Staging" today, cross-checked against Production's, outside this document — this audit can name the risk precisely but cannot verify the actual configured values from source.

---

## 14. Build / release configuration

- **Build command:** `.replit`'s `[deployment]` block: `build = ["npm", "run", "build"]`, `run = ["npm", "run", "start"]`, `deploymentTarget = "cloudrun"`.
- `npm run build` = `db:init` (applies `db/schema.sql` idempotently against `DATABASE_URL`) then `AFTERFLIGHT_BUILD=1 NEXT_DIST_DIR=.next-build next build`.
- **`db:init` does not hard-fail if `DATABASE_URL` is unset** — it logs a warning and exits 0, skipping schema application silently. If `DATABASE_URL` *is* set but unreachable, it correctly fails hard at this earlier, more diagnosable step.
- **`/sitemap.xml` build-time failure, confirmed and explained:** `app/sitemap.ts` has no `dynamic = "force-dynamic"` export and makes an unguarded `getRepository()` call, so Next prerenders it at build time; `getDb()` throws synchronously if `DATABASE_URL` is unset, uncaught. **This is why `next build` fails without `DATABASE_URL`, and it will fail identically if `DATABASE_URL` is set but the database is unreachable at build time** — Staging's build pipeline needs a genuinely *reachable* Postgres instance at build time, not merely a non-empty env var.
- **One adjacent near-miss, not a build-failure risk:** `app/llms.txt/route.ts` has the identical unguarded-`getRepository()`-at-build-time shape but wraps it in a `try/catch`, so it degrades to stale/empty content instead of failing the build — worth knowing about but not a blocker.
- **Every marketing content page and every authenticated product page correctly opts out of static generation** (`dynamic = "force-dynamic"`, or forced dynamic implicitly via reading cookies through `getViewer()`) — `sitemap.ts` is the sole confirmed build-time DB hard-dependency found.
- **`next.config.ts`** has no environment-conditional logic tied to `APP_ENV`/`isStaging()`/`isProduction()` at all — its two conditionals (`NEXT_DIST_DIR`, `AFTERFLIGHT_BUILD`) are pure build-isolation mechanisms, not environment concepts, and apply identically regardless of which environment ultimately runs the built output.
- **How Development/Staging/Production are actually distinguished at deploy time is not fully determinable from this repository** — `.replit` sets no `APP_ENV` anywhere in committed config; this must live in Replit's Secrets pane or Cloud Run's own env configuration, outside this repo's visibility. This audit can confirm the code's *behavior* given a value, not what value is actually configured on any real deployment target.

---

## 15. Release blocker matrix

| Area | Current state | Staging requirement | Blocker? | Severity | Recommended fix |
|---|---|---|---|---|---|
| `/prototype/vector` pages have no environment-level gate | **Resolved (STAGING-RC-0)** — `app/prototype/layout.tsx` calls `notFound()` unless `isDevelopment()` | — | **No — resolved** | — | Shipped as STAGING-RC-0; see commit noted in §17 |
| Raw-`REPLIT_DEPLOYMENT` gates inconsistent with `isDevelopment()` on 5 surfaces (`demo/enter`, `dev-login`, `demo/reset`, `demo/overview`, `dev/login`) | Correct today only if Staging always sets `REPLIT_DEPLOYMENT` | Confirm Staging's deployment target actually sets `REPLIT_DEPLOYMENT`, or migrate these 5 call sites to `isDevelopment()` | **Conditional — yes if unconfirmed** | **P1** | Small, mechanical migration to the canonical helper once decided |
| `DATABASE_URL` isolation between Staging and Production is entirely operational, unverified from code | Single connection string, no code-level same-DB guard | Explicit operator confirmation of distinct `DATABASE_URL` values | **Yes, until confirmed** | **P0** | Not a code fix — a configuration verification step before any Staging QA touches real data |
| CFI V2 / School V2 unreachable in Staging | Development-only layout gate | A decision on whether Staging needs to QA these before the canonical cutover | **No** (Student V2 is the RC-1 scope; this is a later-phase decision) | **P1** | Widen the gate deliberately when ready, per §16's phased plan |
| Deepgram STT key client-exposed (`NEXT_PUBLIC_DEEPGRAM_API_KEY`) | Self-acknowledged prototype shortcut | Staging can still function with this as-is (identical to today's Development/Production posture) but it is not a "proven for real release" credential model | **No** for this RC pass specifically, but a standing item | **P1** | Server-minted short-lived scoped token (already recommended in the separate iOS architecture audit; applies to web too) |
| `FR24_API_KEY` unset everywhere | Falls back to synthetic mock tracks | Configure if Staging needs to prove real ADS-B behavior | **No** — mock behavior is honest and non-broken | **P2** | Configure when ready to prove this specific capability |
| Retention-enforcement job (`purgeExpiredTranscripts`) has zero call sites | Standing, already-documented gap | Not a Staging-introduced risk | **No** | **P3** | Out of this release's scope; a product decision, not a Staging blocker |
| `.env.example` doesn't document `APP_ENV`/`DATABASE_URL` | Documentation gap | Staging setup relies on tribal knowledge | **No**, but slows onboarding | **P3** | Add both to `.env.example` with the same care already given to every other var there |
| Resend email fallback relies on a Replit-workspace-specific connector | Works in a workspace, unverified for a genuine Deployment target | `RESEND_API_KEY` should be explicitly set for Staging, not relying on the connector fallback | **Yes, until confirmed** | **P1** | Set `RESEND_API_KEY` + `INVITE_EMAIL_FROM` + `APP_BASE_URL`/`REPLIT_DOMAINS` explicitly on the Staging deployment's own secrets scope |
| Stripe test-mode keys not yet confirmed configured for Staging | Code is environment-agnostic, ready either way | Staging's own test-mode key pair + its own webhook endpoint registration | **Yes, until configured** | **P1** | Standard Stripe test-mode setup, no code change |
| `next build` requires a genuinely reachable Postgres at build time (not just a set var) | Confirmed, `app/sitemap.ts`'s unguarded build-time query | Staging's build pipeline needs real DB reachability during build, not just deploy | **Yes, until confirmed** | **P0** | Verify the build environment can reach the intended Staging (or a build-only) database before the build step runs |

---

## 16. Recommended Staging plan

**STAGING-RC-1 — Operational environment verification + Staging publication + real-data lifecycle acceptance**
- **Goal:** confirm the already-canonical Student V2 product behaves correctly against a genuinely published Staging deployment with its own isolated database, real auth, real recording (Deepgram configured), and no Development-only surfaces leaking through. Absorbs the original RC-1 configuration checklist plus the one remaining RC-2 verification item (the prototype gate itself shipped in STAGING-RC-0, so it's no longer part of this milestone).
- **Areas involved:** environment/secrets configuration (§15's remaining P0/P1 items) — `DATABASE_URL` isolation confirmed, `NEXT_PUBLIC_DEEPGRAM_API_KEY`/`DEEPGRAM_API_KEY` set, `RESEND_API_KEY`/`INVITE_EMAIL_FROM`/`APP_BASE_URL` set, Stripe test-mode keys configured, and confirmation (or correction) of the raw-`REPLIT_DEPLOYMENT` vs. `isDevelopment()` inconsistency on the five demo/dev-login surfaces.
- **What remains unchanged:** all product code; CFI/School V2 stay Development-only; canonical `/cfi/**`/`/admin/**` (V1) remain the only reachable CFI/School experience in Staging, exactly as in Production today.
- **Browser acceptance required:** full Student debrief lifecycle (confirm → self-assess → handoff → instructor-assess → reveal → consent → real recording → real transcription → real analysis → review → results with real recap audio) against a real, non-demo Staging account; login/logout/session-expiry; the public `persona=pilot`/`cfi`/`school` demo entries still work and land on canonical routes; confirm `/prototype/vector/**` correctly 404s in the published Staging environment; confirm dev-only surfaces correctly 404 regardless of how Staging's deployment target sets its environment signals.
- **Rollback boundary:** configuration-only change; rollback is reverting secrets, no code to revert.

**STAGING-RC-2 — Decide and execute the CFI/School V2 Staging exposure**
- **Goal:** a deliberate decision on whether CFI V2 and School V2 need Staging QA before their own canonical cutover, and if so, widen their layout gates analogous to how Student's `/v2` gate already distinguishes `isStaging()` from `isProduction()` explicitly.
- **Areas involved:** `app/cfi-v2/layout.tsx`, `app/school-v2/layout.tsx`, and `lib/demo/demo-redirect.ts` if the demo entry should also route to them outside Development.
- **What remains unchanged:** canonical `/cfi/**`/`/admin/**` stay exactly as they are — this is additive reachability, not a cutover.
- **Browser acceptance required:** full CFI V2 and School V2 walkthroughs against real Staging accounts, mirroring the original Development acceptance passes already completed.
- **Rollback boundary:** single-line gate reverts per file if anything regresses.

**Explicitly not proposed in this plan:** the canonical V1→V2 cutover itself for CFI/School (making `/cfi/**`/`/admin/**` redirect to or render V2). That is a materially larger, higher-stakes decision this audit recommends treating as its own separate milestone, sequenced after STAGING-RC-2 proves CFI V2/School V2 sound in Staging first.

---

## 17. Exact first implementation task

**STAGING-RC-1's first concrete step is not a code change — it is a configuration checklist**, in this order:

1. Confirm (with whoever manages Replit/Cloud Run deployment secrets) that Staging's `DATABASE_URL` is a genuinely distinct value from Production's, and that it points at a real, build-time-reachable Postgres instance.
2. Set `NEXT_PUBLIC_DEEPGRAM_API_KEY` and `DEEPGRAM_API_KEY` on Staging's own secrets scope.
3. Set `RESEND_API_KEY`, `INVITE_EMAIL_FROM`, and `APP_BASE_URL` (or confirm `REPLIT_DOMAINS`) on Staging's own secrets scope.
4. Confirm (or migrate) the raw-`REPLIT_DEPLOYMENT` vs. `isDevelopment()` inconsistency on the five demo/dev-login surfaces named in §15.
5. Configure a Stripe test-mode key pair and register a webhook endpoint pointed at Staging's own URL.
6. Only after 1–5 are confirmed: run the full Student debrief-lifecycle browser acceptance pass against a real (non-demo) Staging account, confirm the public demo entries (`persona=pilot`/`cfi`/`school`) still resolve to canonical routes as expected, and confirm `/prototype/vector/**` 404s.

No product code changes were made to produce the original audit, consistent with the "documentation only" instruction. STAGING-RC-0 is the one exception: it closed the §15 P0 item on `/prototype/vector`'s page-level gate (`app/prototype/layout.tsx`, plus focused tests) ahead of this checklist, since that fix was small, isolated, and did not depend on any Staging secrets being configured first.

---

## Sources

This audit combines a fresh, skeptical code-level research pass (environment gates, database/build configuration, email, and independent re-verification of School V2/CFI V2 real-vs-fixture status) with findings already gathered earlier in this same session (auth/session architecture, the full API surface, the Deepgram credential/pipeline shape, FR24, Stripe, and consent) during a related native-iOS backend-readiness audit — the underlying codebase has not changed between those findings and this document, so they are reported here as current, not stale.
