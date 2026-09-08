# AfterFlight Web — Staging RC-1 Configuration Manifest

Status: audit only, traced from source. No product code changed. Branch: `student-v2-clean-cutover` @ `0c1dbc1` (STAGING-RC-0 complete; `APP_ENV=staging` independently confirmed set on the Staging Repl).

Every variable below is cited to the exact file(s)/line(s) that read it as of this commit — nothing here is inferred from naming or from `.env.example` alone. Two places where `.env.example` itself is now stale are flagged explicitly, since a "no guesses" manifest has to say so rather than repeat them.

No secret values appear anywhere in this document.

---

## 1. Deepgram

### `NEXT_PUBLIC_DEEPGRAM_API_KEY`
- **Used by:** live browser-to-Deepgram speech-to-text streaming during debrief recording.
- **File(s):** `lib/transcription/use-transcription.ts:13`, `lib/transcription/use-deepgram-transcription.ts` (consumes the key passed in).
- **Required / Optional:** Required for real recording. Optional in the sense that the app doesn't crash without it.
- **Server / Client / Both:** Client — by design, this is Deepgram's documented browser-streaming pattern; the key is genuinely exposed to anyone who opens dev tools.
- **Missing-behavior:** `useTranscription()` silently falls back to `useMockTranscription()` (`lib/transcription/use-transcription.ts:14-17`), which plays back one hardcoded canned transcript (`lib/transcription/use-mock-transcription.ts:6-7`) instead of the student's actual words. **There is no error, warning, or visual difference in the recording UI** — a debrief recorded in this state produces a fabricated transcript that looks identical to a real one.
- **Staging requirement:** **Must be set.** This is the single highest-consequence missing-variable case in the whole manifest for a "real-data lifecycle acceptance" pass — every downstream artifact (transcript, AI analysis, evidence quotes, skill scores) inherits from this one input.
- **Security note:** Client-exposed key is the accepted architecture today (documented in the code's own comments and in `.env.example` as a known shortcut, and already flagged in IOS-1/the Staging audit as a future hardening item — not something to fix here).

### `NEXT_PUBLIC_DEEPGRAM_ALLOW_MIP`
- **Used by:** opts debrief audio back into Deepgram's Model Improvement Program (which restores a pricing discount but lets Deepgram retain/train on submitted audio).
- **File(s):** `lib/transcription/use-deepgram-transcription.ts:121`.
- **Required / Optional:** Optional. Default (unset) is the privacy-preserving opt-out.
- **Server / Client / Both:** Client.
- **Missing-behavior:** Unset = opted out (the correct default). Setting it to `"true"` changes what `/data-handling` and `/how-it-works` promise school owners — `.env.example` itself says to fix those pages first if this is ever set.
- **Staging requirement:** Leave unset. There is no reason to change consent posture for a release candidate.
- **Security note:** Not a secret — a policy flag. Flagged here because setting it wrong is a real consent-truthfulness regression, not a config nicety.

### `DEEPGRAM_API_KEY`
- **Used by:** server-side text-to-speech (debrief/lesson-recap "Listen" audio) — the recap on Results, Review, Next Lesson, and Profile pages, the voice-sample endpoint, and radio-practice audio.
- **File(s):** `app/api/flights/[id]/debrief/audio/route.ts:16`, `app/api/debrief/analyze/route.ts:238` (pre-warm, never blocks the request), `app/api/next-lesson/audio/route.ts:13`, `app/api/radio-practice/[id]/audio/route.ts:23`, `app/api/tts/sample/route.ts:37`, `app/api/admin/radio-audio/warm/route.ts:36`, `lib/demo/live-demo-seed.ts:344` (demo pre-warm), and the UI gates that decide whether to render a "Listen" button at all: `app/(product)/flights/[id]/debrief/{results,review}/page.tsx`, `app/(product)/next-lesson/page.tsx`, `app/(product)/profile/page.tsx`, `app/cfi-v2/flights/[id]/debrief/{results,review}/page.tsx`, `app/v2/flights/[id]/debrief/{results,review}/page.tsx`, `app/v2/profile/page.tsx`.
- **Required / Optional:** Optional — every consumer degrades gracefully.
- **Server / Client / Both:** Server-only. Never sent to the browser (unlike the streaming key above).
- **Missing-behavior:** Every TTS route returns `501`/`503` with a plain JSON error instead of throwing; the server components that gate the "Listen" button (`ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY)`) simply don't render it. No broken UI, just a missing feature.
- **Staging requirement:** Should be set to exercise the real recap-audio path during acceptance testing, but Staging is not blocked without it.
- **Security note:** None — correctly server-only, unlike the streaming key.

---

## 2. Resend / Email

### `RESEND_API_KEY`
- **Used by:** all outbound email (invite, magic-link sign-in, signup confirmation, email-change confirmation).
- **File(s):** `lib/email.ts:18`.
- **Required / Optional:** Optional — see fallback below, but the fallback is itself a Staging risk (see Staging requirement).
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** Falls back to `connectors.proxy("resend", ...)` (`lib/email.ts:26-30`) — the Replit **workspace's** Resend connection, not a portable credential. This connector is tied to the interactive Repl workspace; whether it resolves at all from a published Deployment (Staging or Production) is not something this code can confirm.
- **Staging requirement:** **Must set explicitly.** Relying on the connector fallback for a genuine Staging Deployment is untested and was already flagged as a P1 risk in the original Staging audit — don't carry that ambiguity into RC-1.
- **Security note:** None beyond normal API-key handling.

### `INVITE_EMAIL_FROM`
- **Used by:** the `From:` address on every outbound email.
- **File(s):** `lib/email.ts:11`.
- **Required / Optional:** Optional.
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** Defaults to `"AfterFlight <onboarding@resend.dev>"` — Resend's shared test sender. Emails still send, but from a generic Resend domain rather than AfterFlight's own.
- **Staging requirement:** Should be set to a Resend-verified sender for a realistic acceptance pass, but not a hard blocker — the default doesn't break sending.
- **Security note:** Must be a Resend-**verified** domain address or sends will fail at Resend's layer, not this app's.

### `APP_BASE_URL` (shared with Stripe/sitemap — see §4)
- **Used by:** the origin baked into every emailed link (magic-link, signup-confirm, email-change-confirm, invite).
- **File(s):** `lib/email-origin.ts:12-14` (`appOrigin()`), consumed by `lib/email.ts:61`, `app/api/auth/login/route.ts:29`, `app/api/auth/signup/route.ts:36`, `app/api/auth/change-email/route.ts:52`.
- **Required / Optional:** Optional — falls back to `REPLIT_DOMAINS` (platform-provided). See §4 for the full picture; listed here because it's the reason a missing origin silently kills email links specifically.
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** If **neither** `APP_BASE_URL` nor `REPLIT_DOMAINS` resolves, login and signup **fail silently** — the route logs an error and returns its normal "check your email" response anyway (`app/api/auth/login/route.ts:30-31`, `app/api/auth/signup/route.ts:37-38`), so a user sees success but never receives a link. `change-email` is the one exception: it returns a real `500` (`app/api/auth/change-email/route.ts:53-56`).
- **Staging requirement:** Must verify (see §4) — this is almost certainly fine automatically via `REPLIT_DOMAINS` on any real Deployment, but the silent-failure mode above means it's worth one real login-email test rather than trusting it blind.
- **Security note:** `appOrigin()` deliberately never reads request headers (`lib/auth/origin.ts`'s own doc comment: forwarded-host is attacker-influenceable) — this is a correct, existing safeguard, not something to touch.

---

## 3. Stripe

### `STRIPE_SECRET_KEY`
- **Used by:** every Stripe API call (checkout session creation, Customer Portal, webhook event fetch).
- **File(s):** `lib/stripe.ts:13`.
- **Required / Optional:** Required for billing to function at all.
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** `getStripeClient()` throws (`lib/stripe.ts:14`) the moment any billing route is invoked (`app/api/billing/checkout/route.ts`, `app/api/billing/portal/route.ts`, the webhook route). Every other part of the app is unaffected — this is contained to the three billing endpoints, not a boot-time failure.
- **Staging requirement:** Must be set for billing to be testable at all in Staging.
- **Security note:** **No publishable key exists anywhere in this codebase** — confirmed by a full-repo trace, not assumed. This app uses Stripe-hosted Checkout redirects exclusively, never Stripe.js/Elements client-side, so there is nothing client-exposed to audit here.

### `STRIPE_WEBHOOK_SECRET`
- **Used by:** verifying that inbound `/api/webhooks/stripe` requests actually came from Stripe before trusting them to write subscription state.
- **File(s):** `app/api/webhooks/stripe/route.ts:15`.
- **Required / Optional:** Required for the webhook to do anything.
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** Route returns `500` and refuses to process every event (`app/api/webhooks/stripe/route.ts:16-19`) — fails loudly, never silently accepts unverified events.
- **Staging requirement:** Must be set **and** a webhook endpoint must actually be registered in the Stripe dashboard pointed at Staging's own URL, or subscription state never updates after a successful checkout even though the checkout itself appears to work.
- **Security note:** None — this is exactly the fail-loud behavior you want from a webhook secret.

### `STRIPE_PRICE_PILOT_MONTHLY`, `STRIPE_PRICE_PILOT_ANNUAL`, `STRIPE_PRICE_SCHOOL_MONTHLY`, `STRIPE_PRICE_SCHOOL_ANNUAL`
- **Used by:** mapping a plan + billing period to the Stripe Price ID passed to Checkout, and the reverse mapping when a webhook reports which price a subscription is actually on.
- **File(s):** `lib/stripe.ts:28-40` (`getStripePriceId`), `lib/stripe.ts:54-65` (`planForStripePriceId`).
- **Required / Optional:** Each is required only for the specific (plan, period) combination a user selects.
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** `getStripePriceId()` throws naming the exact missing env var (`lib/stripe.ts:38`) the moment that specific plan/period is requested — the other three combinations keep working. `planForStripePriceId()` returns `null` for an unrecognized price rather than guessing, so a webhook for a price with no matching env var leaves the org's stored plan untouched instead of corrupting it (`lib/stripe.ts:50-53`'s own comment).
- **Staging requirement:** All four must be set to test every plan/period combination; Staging's own Price IDs, not Production's, unless the intent is deliberately sharing a Stripe account across both (see the live-mode note below).
- **Security note:** Not secrets (Price IDs are not sensitive), but see the live-mode implication below.

### Live vs. test mode — traced, not guessed
There is **no live/test-mode detection anywhere in this codebase** — no key-prefix check, no `STRIPE_MODE` variable, nothing. Confirmed by a full-repo search for `sk_live`/`sk_test`/`livemode`/similar. Whichever `STRIPE_SECRET_KEY` value is set **is** the mode, entirely by Stripe's own key semantics, with zero app-level awareness or guardrail.

**You've said Stripe stays in live mode rather than shuffling keys — this document reports the implication, not a recommendation to change it:** if Staging is configured with the same live `STRIPE_SECRET_KEY` (and matching live `STRIPE_WEBHOOK_SECRET`, live Price IDs) as Production, then any checkout or subscription action taken in Staging for QA purposes is a **real charge against the real Stripe account**, indistinguishable from Production traffic in the Stripe dashboard except by whatever metadata or test customer email you use to tell them apart afterward. There is no code-level separation to fall back on — the separation, if any, is entirely which key value gets pasted into which environment's secrets.

### Whether the app functions without Stripe configured at all
Yes. Confirmed by trace: nothing outside the three billing routes (`checkout`, `portal`, the webhook) reads any Stripe variable. An org with `demoExpiresAt` set is explicitly blocked from checkout regardless (`app/api/billing/checkout/route.ts:23-24`), and `independent_cfi` orgs are free-forever with no checkout path at all (`app/api/billing/checkout/route.ts:34-36`) — billing is already an edge, not a spine, of the real Student/CFI/School V2 flows this RC is meant to prove.

---

## 4. Session / Auth

### `APP_ENV`
- **Used by:** `getAppEnv()`, the one canonical Development/Staging/Production resolver every environment-aware call site is supposed to read.
- **File(s):** `lib/env.ts:19-25`.
- **Required / Optional:** Optional — falls back to `REPLIT_DEPLOYMENT` truthy → production, else development. Staging **only** exists if this is set explicitly to `"staging"`; nothing else can produce it.
- **Server / Client / Both:** Server-only (read at request/render time; not exposed to the client bundle since it isn't `NEXT_PUBLIC_`-prefixed).
- **Missing-behavior:** Unset on a deployed runtime (i.e., `REPLIT_DEPLOYMENT` set) resolves to **production**, not development — a deliberate fail-safe (`lib/env.ts:11-15`'s own comment), not a gap.
- **Staging requirement:** Already confirmed set (`APP_ENV=staging`) per this task's own premise. **What still needs separate verification:** six call sites gate dev-only behavior on the **raw** `process.env.REPLIT_DEPLOYMENT` instead of going through `getAppEnv()`/`isDevelopment()` at all — `app/(product)/layout.tsx:32`, `app/api/auth/dev-login/route.ts:24`, `app/api/demo/enter/route.ts:25`, `app/api/demo/reset/route.ts:6`, `app/demo/overview/page.tsx:12`, `app/dev/login/page.tsx:77`, plus `lib/data/postgres-repository.ts:1628-1629` (`shouldSeedDemoData()`, gates real demo-data writes). These are correct **only if** Staging's deployment target also sets `REPLIT_DEPLOYMENT` — true for any genuine Replit Deployment, but not guaranteed for every possible way `APP_ENV=staging` could be set. **This is the one item in this manifest worth a direct verification step, not just a config paste:** confirm the Staging Repl is a real Deployment (not just workspace secrets) so `REPLIT_DEPLOYMENT` is present alongside `APP_ENV=staging` — otherwise `dev-login`, `/dev/login`, `/demo/overview`, demo-enter/reset, and demo-data seeding stay reachable in "Staging."
- **Security note:** Confirmed the whole gate chain: `/v2`, `/cfi-v2`, `/school-v2`, and (as of STAGING-RC-0) `/prototype/vector` all correctly go through `isProduction()`/`isDevelopment()` from `lib/env.ts` directly — only the six sites above bypass it.

### `SESSION_SECRET`
- **Used by:** signing/verifying the httpOnly session JWT (`fb_session` cookie) that every authenticated request depends on.
- **File(s):** `lib/auth/session.ts:22-25`.
- **Required / Optional:** Required, unconditionally.
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** `getSecret()` throws (`lib/auth/session.ts:23`) the instant any session JWT is created or verified — meaning login, session validation, and every `(product)` route relying on `proxy.ts`'s cookie check would fail hard. This is effectively an app-down condition for the entire authenticated product, not a contained failure like the others above.
- **Staging requirement:** **Must be set**, and must be a **Staging-specific value distinct from Production's** — sharing this secret would let a Staging-issued session cookie be replayed as valid on Production and vice versa, which is a real security boundary, not a formality.
- **Security note:** See above — this is the one secret in this manifest where reuse across environments is an actual cross-environment session-forgery risk, not just cleanliness.

### `APP_BASE_URL` / `REPLIT_DOMAINS`
- **Used by:** the one server-controlled public origin (`appOrigin()`) used for emailed links, Stripe `success_url`/`cancel_url`/portal `return_url`, and site metadata (sitemap, robots, canonical URLs).
- **File(s):** `lib/email-origin.ts:11-15`, re-exported from `lib/email.ts:6` and consumed across `lib/stripe.ts:68-70` (`getAppBaseUrl()`), every `app/(marketing)/**` page, `app/api/auth/*`, `app/api/gate/route.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt/route.ts`.
- **Required / Optional:** Optional — `APP_BASE_URL` is an explicit override; `REPLIT_DOMAINS` (platform-provided on any Replit Deployment) is the fallback, taking the first of a comma-separated list.
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** If both are absent, `appOrigin()` returns `null` and every consumer degrades per its own logic — see the email-specific silent-failure behavior in §2, and `lib/stripe.ts:69`'s own fallback to `http://localhost:3000` for `getAppBaseUrl()` specifically (meaning a misconfigured Staging with no origin at all would send users to a broken `success_url` after checkout, not fail the checkout itself).
- **Staging requirement:** Must verify — expected to resolve automatically via `REPLIT_DOMAINS` on a real Deployment, but confirm it resolves to Staging's actual public URL, not a stale or unexpected domain, since it's baked into every emailed link and every Stripe return URL.
- **Security note:** Deliberately never derived from request headers (`lib/auth/origin.ts`'s own doc comment) — `requestOrigin(request)` is a separate, narrower helper explicitly marked unsafe for emails/redirects precisely because forwarded-host headers are attacker-influenceable. This separation is correct and should not be collapsed.

### Cookie security — traced, not environment-conditional
Every session-related cookie set in this codebase (`fb_session`, `fb_active_membership`, `fb_site_gate`, the demo/v2-real-data cookies) is set with `secure: true, sameSite: "lax"` **unconditionally** — confirmed across all ten call sites (`app/api/auth/callback/route.ts:81-82`, `confirm-email-change/route.ts:80-81`, `dev-login/route.ts:51-52`, `leave-organization/route.ts:77-78`, `switch-membership/route.ts:36-37`, `demo/enter/route.ts:46-54`, `demo/start/route.ts:113-129`, `gate/route.ts:32-33`, `v2/enter-real-data/route.ts:23-24`). There is no environment branch to configure here — cookie security posture is identical in Development, Staging, and Production by construction.

---

## 5. Site Access

### `SITE_ACCESS_CODE`
- **Used by:** the optional shared-password gate in front of the public marketing site, `/demo/**`, and (until STAGING-RC-0) `/prototype/**` — `proxy.ts`'s `MARKETING_PATHS`/`MARKETING_PREFIXES`.
- **File(s):** `lib/auth/session.ts:192-199` (`isSiteGateEnabled()`, `getSiteAccessCode()`), consumed by `proxy.ts`.
- **Required / Optional:** Optional by design — unset means the gate is off and the site is fully public, with **no warning either way** (`.env.example`'s own note).
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** Gate simply doesn't apply; every marketing/demo route is public.
- **Staging requirement:** **Does not affect Staging release-candidate correctness** as of STAGING-RC-0 — `/prototype/vector/**` now hard-gates to Development-only at the code level (`app/prototype/layout.tsx`), independent of this variable entirely. Whether to set `SITE_ACCESS_CODE` for Staging is now purely an "internal-QA-only vs. publicly-reachable marketing preview" product decision, not a correctness requirement.
- **Security note:** Deliberately a separate secret from `SESSION_SECRET` specifically so a misconfigured site gate can never break a real login (`.env.example`'s own comment) — correct as-is.

---

## 6. Database

### `DATABASE_URL`
- **Used by:** the single Postgres connection pool backing every real read/write in the app — identity (users, organizations, memberships), flights, debriefs, assessments, billing state. There is no in-memory or mock fallback for this one.
- **File(s):** `lib/db.ts:9-19`.
- **Required / Optional:** Required, unconditionally, for anything beyond the marketing pages.
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** `getDb()` throws immediately (`lib/db.ts:12-13`) the first time any database access is attempted — this is also the confirmed root cause of `next build` failing in a sandbox with no reachable Postgres (`app/sitemap.ts` prerenders at build time with no guard).
- **Staging requirement:** Must be set to a genuinely reachable Postgres instance, both at **build time** (not just deploy/runtime) and at runtime. Whether Replit's Preview and Deploy environments are supplied **distinct** `DATABASE_URL` values automatically, or the same one, **is not determinable from this repository** — there is exactly one variable name, no code-level branching by environment, and no second DB-related variable anywhere in the codebase. This must be confirmed operationally in Replit's own database/deployment configuration, same open item the original Staging audit already flagged.
- **Security note:** If Staging and Production ever resolved to the **same** `DATABASE_URL`, there is **zero code-level guard against it** — no environment check anywhere compares the two or refuses to run. This is worth an explicit, positive confirmation (not an assumption) before any Staging QA writes real data.

### `SEED_DEMO_DATA` (+ the `AFTERFLIGHT_BUILD` / `REPLIT_DEPLOYMENT` guards around it)
- **Used by:** whether to seed the sample Falcon Aviation demo dataset into an empty database on first use.
- **File(s):** `lib/data/postgres-repository.ts:1621-1630` (`shouldSeedDemoData()`).
- **Required / Optional:** Optional, and opt-in only.
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** Unset = no seeding, clean start. Even if set, seeding is additionally blocked whenever `AFTERFLIGHT_BUILD` is set (the build script sets this itself — `package.json:8` — not an operator-facing variable) or whenever `REPLIT_DEPLOYMENT` is set, i.e., **seeding never runs inside a real deployment regardless of this variable** — a second, independent safeguard against accidentally seeding demo rows into Staging or Production.
- **Staging requirement:** Leave unset — Staging's whole purpose per the RC-1 plan is real, non-demo accounts; this variable being a no-op inside any real Deployment is a feature, not a gap, for that goal.
- **Security note:** None — this is a write-suppression guard, and it's doubled up correctly.

### `.env.example` correction — Supabase (documentation drift, not a live risk)
`.env.example` currently documents `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` as an alternate data-repository backend. **Traced and confirmed stale:** `lib/data/index.ts:24-28`'s `getRepository()` unconditionally constructs `PostgresRepository(getDb())` — there is no Supabase branch left in the code to select. Setting these two variables currently has **no effect at all**. Flagged here rather than silently treated as real, per this task's "no guesses" instruction; not something this docs-only pass corrects in `.env.example` itself.

---

## 7. External Integrations

### `ANTHROPIC_API_KEY`
- **Used by:** real AI debrief analysis (the structured wentWell/needsWork/action-items/study-references output every Student/CFI debrief screen is built from) and radio-call grading in radio practice. Also powers unrelated admin content-pipeline article generation (out of scope for Student/CFI/School V2).
- **File(s):** `lib/ai/index.ts:15` (debrief analysis — the primary Student/CFI/School V2-relevant consumer), `lib/ai/radio-judge.ts:83` (radio practice grading); also `lib/ai/vector.ts:123` (the `/prototype/vector` chat endpoint, now Development-only as of STAGING-RC-0 and therefore irrelevant to Staging), `lib/ai/editorial.ts`, `lib/ai/generate-article.ts`, `lib/ai/generate-article-ideas.ts`, `lib/ai/image-prompt.ts`, `lib/ai/research.ts` (all admin content pipeline, unrelated to the real product flows this manifest is scoped to).
- **Required / Optional:** Optional in the sense that nothing throws — but see missing-behavior.
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** `analyzeDebrief()` silently falls back to `analyzeMock()`, a **deterministic local heuristic analyzer** (`lib/ai/index.ts:14-29`) — every real debrief would be "analyzed" by a canned heuristic instead of Claude, with only a `console.log` (`lib/ai/index.ts:28`) as any trace of it. **This is the same class of silent-degradation risk as the Deepgram STT key** — nothing in the UI distinguishes a Claude-analyzed debrief from a mock-analyzed one.
- **Staging requirement:** **Must be set.** Alongside `NEXT_PUBLIC_DEEPGRAM_API_KEY`, this is the other variable a real "real-data lifecycle acceptance" pass cannot skip without silently testing fake content instead of the real product.
- **Security note:** Correctly server-only.

### `FR24_API_KEY`
- **Used by:** live Flightradar24 ADS-B lookups for tail-number-based flight matching.
- **File(s):** `lib/flight-data/index.ts:9-16`.
- **Required / Optional:** Optional.
- **Server / Client / Both:** Server-only.
- **Missing-behavior:** Falls back to `MockFlightDataProvider`, generating synthetic candidate flights/tracks, logged plainly (`lib/flight-data/index.ts:14`).
- **Staging requirement:** Feature-specific — set only if this RC pass needs to prove real ADS-B matching; the mock behavior is honest (clearly a generated track, not passed off as real) and doesn't block anything else.
- **Security note:** None.

### `NEXT_PUBLIC_MAPBOX_TOKEN` — `.env.example` correction (not currently used)
`.env.example` documents this as gating the flight-track map. **Traced and confirmed stale:** `components/flight-map.tsx` now renders via a free, keyless CARTO/MapLibre basemap (`components/flight-map.tsx:8-14`, explicit comment: "no Mapbox token required") — a full-repo search finds **zero** references to `process.env.NEXT_PUBLIC_MAPBOX_TOKEN` or any Mapbox env var anywhere in the current code. Setting this variable has no effect. Not a Staging blocker or requirement in either direction.

### Not covered here (outside the seven requested categories, noted for completeness only)
`CONTENT_PIPELINE_SECRET` (admin article-generation pipeline auth), `SUPERADMIN_EMAILS` (platform-staff access list) — real variables, traced, but neither affects the real Student/CFI/School V2 flows this manifest is scoped to. Omitted from the checklist below on that basis, not overlooked.

---

## Staging checklist

### MUST SET BEFORE PUBLISH
- `DATABASE_URL` — Staging's own, confirmed reachable at build time, not just deploy time
- `SESSION_SECRET` — a value distinct from Production's
- `NEXT_PUBLIC_DEEPGRAM_API_KEY` — without it, every debrief silently uses a canned transcript
- `ANTHROPIC_API_KEY` — without it, every debrief silently uses a mock heuristic analysis
- `RESEND_API_KEY` — don't rely on the workspace-connector fallback for a real Deployment
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and all four `STRIPE_PRICE_*` variables — plus a webhook endpoint actually registered against Staging's URL in the Stripe dashboard

### MUST VERIFY
- `REPLIT_DEPLOYMENT` is actually set on the Staging Deployment (not just `APP_ENV=staging` on a workspace) — six raw-`REPLIT_DEPLOYMENT` call sites (§4) depend on this independently of `APP_ENV`
- `APP_BASE_URL` / `REPLIT_DOMAINS` resolves to Staging's real public URL — confirm with one actual login-email round trip, since the failure mode on this is silent
- `DATABASE_URL` is genuinely distinct from Production's (no code-level guard exists against them being the same)
- Stripe is in **live** mode by your own stated choice — confirm every person who might touch Staging billing during this RC understands that a Staging checkout is a real charge, not a rehearsal

### OPTIONAL / FEATURE-SPECIFIC
- `DEEPGRAM_API_KEY` (server) — recap "Listen" audio; degrades to a hidden button, nothing breaks
- `INVITE_EMAIL_FROM` — cosmetic sender address; defaults to Resend's shared test sender
- `FR24_API_KEY` — real ADS-B matching; mock fallback is honest and functional
- `NEXT_PUBLIC_DEEPGRAM_ALLOW_MIP` — leave unset; do not change consent posture for this RC
- `SITE_ACCESS_CODE` — no longer a correctness requirement for `/prototype/vector` as of STAGING-RC-0; purely a "should the marketing preview be public" call
- `SEED_DEMO_DATA` — leave unset; also a no-op inside any real Deployment regardless

### DO NOT SET / DO NOT EXPOSE
- Do not set `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` expecting an effect — the code path that read them no longer exists; setting them changes nothing and risks confusing future debugging with a name that looks load-bearing
- Do not set `NEXT_PUBLIC_MAPBOX_TOKEN` expecting an effect — same situation, dead in current code
- Do not introduce a client-side Stripe publishable key — the app has no Stripe.js/Elements surface to use one, and adding one without a corresponding code path would be a pure new exposure with no benefit
- Do not reuse `SESSION_SECRET` between Staging and Production — the one variable in this manifest where reuse is a direct session-forgery risk, not just a hygiene preference

---

## Sources

Every file/line citation above was read directly from `student-v2-clean-cutover` @ `0c1dbc1` for this pass — none carried over from the earlier `STAGING-V2-RELEASE-CANDIDATE-AUDIT.md` without independent re-verification, though several findings (raw-`REPLIT_DEPLOYMENT` sites, `DATABASE_URL` isolation being unverifiable from code, Resend's connector fallback) corroborate that document's own conclusions.
