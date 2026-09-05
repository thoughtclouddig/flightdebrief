# Environments — the release contract

Three environments, one canonical helper (`lib/env.ts`) deciding which one the
app thinks it's in. Read `lib/env.ts`'s own doc comment before changing any of
this — the fail-safe rule (an ambiguous deployed runtime resolves to
`production`, never `development`) is load-bearing.

## Development

**Purpose:** build and iterate. Local `npm run dev`, or a Replit workspace
that hasn't been published.

- `APP_ENV`: unset. `REPLIT_DEPLOYMENT` is also unset here, so `getAppEnv()`
  falls through to `"development"`.
- Database: whatever `DATABASE_URL` the workspace has. `SEED_DEMO_DATA=1` can
  seed the Falcon Aviation demo dataset (`lib/data/postgres-repository.ts`).
- Open: `/v2`, `/prototype/vector` (unless `SITE_ACCESS_CODE` happens to be
  set), `/dev/login`, `/api/demo/enter`, `/api/demo/reset`,
  `POST /api/prototype/vector`.
- Deploy trigger: none.
- Promotion: commit, push to `origin/main` when ready for staging.

## Staging — `flightdebrief-staging.replit.app`

**Purpose:** prove a release candidate behaves like production before any
real user sees it. Internal QA only, still fixture-backed Milestone 1B on
`/v2` — no production adapters yet.

- `APP_ENV=staging`, set explicitly in **both** the workspace Secrets and the
  deployment's own Secrets (Replit keeps these as two separate stores —
  setting one does not set the other).
- Database: its own Postgres, provisioned per-Repl, physically separate from
  production (confirmed empty before first `db:init`). The only rows present
  are the universal bootstrap admin identity every environment's
  `db/schema.sql` seeds (`org-falcon` / the app owner's account,
  `db/schema.sql:616-631`) — not demo content, not a leak from production.
  Realistic QA data comes from hitting `/api/demo/start?persona=...` against
  this deployment, never by copying real rows.
- `/v2` and `/prototype/vector`: reachable only behind the `SITE_ACCESS_CODE`
  gate (same mechanism as production's `/prototype/vector`, different code
  value from production's).
- `/dev/login`, `/api/demo/enter`, `/api/demo/reset`: blocked — these gate on
  raw `REPLIT_DEPLOYMENT`, which is truthy on any real deployment, staging
  included.
- **Known gap:** `POST /api/prototype/vector` is reachable here (correctly,
  per policy — it's only blocked in production), but it has no access control
  of its own beyond "not production." Anyone with the staging URL can hit it
  without passing the site gate first. Low stakes today (`grade`/`chair_fly`
  intents touch no external API; only `ask` calls Anthropic), but worth
  gating explicitly before staging traffic is less trusted than it is now.
- **Known gap:** no in-app visual marker distinguishes staging from
  production — separation today rests entirely on the hostname. A small
  "STAGING" banner would be a cheap follow-up if screenshots/recordings ever
  need to be told apart at a glance.
- Deploy trigger: manual Publish from this Repl's own Deployments pane, after
  pulling the target commit from `origin/main` into this workspace.
- Rollback: this Repl's own Deployments history, one-click to a prior build.

## Production — `getafterflight.com`

**Purpose:** real students, real CFIs, real data.

- `APP_ENV`: not set explicitly. `REPLIT_DEPLOYMENT` is truthy, so
  `getAppEnv()`'s fail-safe resolves it to `"production"` on its own — this
  is intentional, not a gap to fix.
- Database: its own Postgres, real user/flight/debrief data. Never share its
  `DATABASE_URL` with any other environment.
- Blocked outright: `/v2` (`notFound()` regardless of any gate cookie),
  `/dev/login`, `/api/demo/enter`, `/api/demo/reset`,
  `POST /api/prototype/vector`. Still gated (not blocked): `/prototype/vector`
  behind `SITE_ACCESS_CODE`, same as it's always been.
- Mutating one-off scripts (`scripts/reset-mia.mjs`,
  `scripts/clear-demo-data.mjs`, `scripts/seed-real-flights.mjs`,
  `scripts/stress-seed-flights.mjs`) refuse to run under `REPLIT_DEPLOYMENT`
  without an explicit `--confirm-production` (or refuse outright, for the
  seeding scripts).
- Deploy trigger: manual Publish from the production Repl's own Deployments
  pane — and only after the same commit has already been Published and
  browser-verified on staging first. Two independent Repls each needing their
  own Publish click is what makes this an explicit release action rather than
  something a push can trigger silently.
- Rollback: this Repl's own Deployments history, one-click to a prior build.

## Identifying what's actually deployed

Replit deployments are a snapshot of the workspace's file state at publish
time, not a git-ref checkout — there's no in-app version endpoint today. The
reliable way to know what's live in either Repl is `git log --oneline -1` in
that Repl's own shell, read past any empty `"Published your App"` marker
commit to the real content commit underneath it.

## The workspace/GitHub divergence trap

Each Repl's workspace is its own independent git checkout of the same GitHub
repo. Publishing does **not** push to GitHub, and pushing to GitHub does
**not** publish. A workspace can silently drift ahead of `origin/main` (real
commits made directly in that workspace, e.g. by Replit's own background
agent) or behind it (never pulled since the last GitHub push) — always check
`git log --oneline --stat origin/main..HEAD` for real, non-empty local-only
commits before ever resetting a workspace to match `origin/main`.
