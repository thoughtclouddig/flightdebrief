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
- Flight/roster/debrief data still goes through the repository in `lib/data` (in-memory `MockRepository` by default; `SupabaseRepository` if Supabase data keys are set). User/org/role identity now lives in Replit Postgres, seeded with the same ids as `lib/data/seed.ts` so cross-references line up.
- Supabase auth scaffolding was removed (login page, invite acceptance, session client); `lib/supabase/server.ts` remains only for the optional data repository.

## User preferences
- Keep the existing app structure; do not scaffold a new app.
