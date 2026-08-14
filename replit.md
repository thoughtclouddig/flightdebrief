# FlightBrief

Next.js 16 (App Router, React 19) flight-training debrief app for students, CFIs, and flight-school admins.

## Running
- Workflow "Start application" runs `npm run dev` on port 3000.
- Production: `npm run build` + `npm run start` (configured in `.replit` `[deployment]`).

## Authentication (email magic links)
- Passwordless sign-in: `POST /api/auth/login` with `{ email }` emails a short-lived (15 min) signed magic-link token (via Resend); `GET /api/auth/callback?token=...` verifies it and establishes the session. No third-party accounts required.
- The normalized (lowercased) email is the stable identity anchor (`users.auth_user_id`).
- Session: signed JWT cookie (`fb_session`, HS256 with `SESSION_SECRET`), 7 days — see `lib/auth/session.ts`. Magic-link tokens use the same secret with a distinct `purpose` claim.
- Route protection: `proxy.ts` (Next 16 middleware) verifies the session cookie on all (product) routes; every API route authorizes itself via `lib/auth/guard.ts`.
- Identity source of truth: Replit Postgres (`DATABASE_URL`) tables `users`, `organizations`, `organization_members` — see `lib/auth/store.ts`.
- Login linking (`resolveUserOnLogin`): invited emails link on first login; the very first email to log in is auto-provisioned as admin of `org-falcon` if no account is linked yet; anything else is rejected (invite-only).
- First login redirects to `/onboarding` (one-time name confirmation, `users.profile_completed`); returning users go straight to `/app`.
- Invites (`lib/auth/invite.ts`) create a `users` row keyed by email and send an invite email; the invitee requests a magic link with that email.
- Login-request endpoint always responds success (no account-existence leak) and has a per-email cooldown.
- E2E: `npm run test:e2e:auth` (mints magic-link tokens directly; isolated Postgres schema).

## Data
- All app data now lives in Replit Postgres (`DATABASE_URL`): identity (users/orgs/roles via `lib/auth/store.ts`) plus flights, debriefs, reservations, and training data via `PostgresRepository` (`lib/data/postgres-repository.ts`). Schema in `db/schema.sql` (applied idempotently by `scripts/init-db.mjs` before dev). The repository seeds the demo dataset from `lib/data/seed.ts` into empty domain tables on first use (idempotent, stable ids).
- Supabase is fully removed (auth scaffolding, `SupabaseRepository`, `lib/supabase/`, packages); the in-memory `MockRepository` is gone too — persistence requires `DATABASE_URL`.

## User preferences
- Keep the existing app structure; do not scaffold a new app.
