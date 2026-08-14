---
name: Auth & identity conventions
description: Durable rules for keeping auth/identity consistent in this app.
---

- Auth is email magic links (no third-party accounts): normalized email = identity anchor in users.auth_user_id; magic-link JWTs share SESSION_SECRET with the session cookie but carry a distinct `purpose` claim — never interchangeable.
- **Rule:** user and membership rows must exist in BOTH the identity tables and the data repository with the SAME id (they now share the same Postgres users table, keep it that way).
  **Why:** a review found invited users could log in but had no membership → "not an active member" errors.
- **Rule:** proxy.ts protects pages only; every API route must enforce its own auth/role via lib/auth/guard.ts.
  **Why:** review found unauthenticated admin mutations because routes relied on the page middleware.
- **Rule:** links placed in outgoing emails must use the server-controlled appOrigin() (lib/email.ts), never request-header-derived origins.
  **Why:** forwarded-host headers are attacker-influenceable → phishing links delivered to real inboxes.
- **Rule:** dev DB schema is applied idempotently before the dev server starts; never run DDL in deployments — Replit's Publish flow migrates production from the dev schema.
- **Rule:** onboarding completion is enforced server-side in both layers — API guard rejects incomplete profiles (opt-out only for the onboarding endpoint itself) and the product layout redirects to /onboarding.
  **Why:** review found incomplete users could reach product routes/APIs when only the UI nudged them.
