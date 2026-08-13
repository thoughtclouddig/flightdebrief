# FlightBrief

Next.js 16 (App Router, React 19) flight-training debrief app for students, CFIs, and flight-school admins.

## Running
- Workflow "Start application" runs `npm run dev` on port 3000.
- Production: `npm run build` + `npm run start` (configured in `.replit` `[deployment]`).

## Authentication (Replit Auth)
- OIDC against `https://replit.com/oidc` (client id = `REPL_ID`), PKCE public client via `openid-client`.
- Routes: `/api/auth/login`, `/api/auth/callback`, `/api/auth/logout`.
- Session: signed JWT cookie (`fb_session`, HS256 with `SESSION_SECRET`), 7 days — see `lib/auth/session.ts`.
- Route protection: `proxy.ts` (Next 16 middleware) verifies the session cookie on all (product) routes.
- Identity source of truth: Replit Postgres (`DATABASE_URL`) tables `users`, `organizations`, `organization_members` — see `lib/auth/store.ts`.
- Login linking: on first login, a Replit account is linked to a `users` row by matching email (invite-only). The very first Replit account to log in is auto-provisioned as admin of `org-falcon` if no account is linked yet.
- Invites (`lib/auth/invite.ts`) create a `users` row keyed by email; the invitee logs in with the Replit account using that email.

## Data
- All app data now lives in Replit Postgres (`DATABASE_URL`): identity (users/orgs/roles via `lib/auth/store.ts`) plus flights, debriefs, reservations, and training data via `PostgresRepository` (`lib/data/postgres-repository.ts`). Schema in `db/schema.sql` (applied idempotently by `scripts/init-db.mjs` before dev). The repository seeds the demo dataset from `lib/data/seed.ts` into empty domain tables on first use (idempotent, stable ids).
- Supabase is fully removed (auth scaffolding, `SupabaseRepository`, `lib/supabase/`, packages); the in-memory `MockRepository` is gone too — persistence requires `DATABASE_URL`.

## User preferences
- Keep the existing app structure; do not scaffold a new app.
