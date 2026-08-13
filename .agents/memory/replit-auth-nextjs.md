---
name: Auth & identity conventions
description: Durable rules for keeping auth/identity consistent in this app.
---

- **Rule:** user and membership rows must exist in BOTH stores (Replit Postgres identity tables and the lib/data repository) with the SAME id; the repository generates the id first.
  **Why:** getViewer() authorizes from Postgres while roster/flight views read the repository — split ids leave invited users unable to access anything.
  **How to apply:** any new code path that creates/updates users, memberships, or roles must write both stores (see how invites do it).
- **Rule:** proxy.ts protects pages only; every API route must enforce its own auth/role via the shared guard.
  **Why:** review found unauthenticated admin mutations because routes relied on the page middleware.
- **Rule:** record-level authorization (owner, or instructor/admin in the record's org) is centralized in the shared auth guard/access helpers; every ID-addressed API route AND server-rendered page must use them and return a non-enumerating 404 when unauthorized.
  **Why:** review found students could read other students' flights/debriefs via direct page URLs even after API routes were locked down — page middleware only checks sign-in, never ownership.
- **Rule:** multi-user auth flows are verified through a loopback mock OIDC issuer (the `ISSUER_URL` test-claims bypass), never against real Replit Auth; insecure-http OIDC stays loopback-only.
  **Why:** Replit Auth can't mint arbitrary users, so owner-bootstrap/invite/deactivation coverage is impossible without a mock issuer.
  **How to apply:** rerun the auth e2e suite after any change to auth routes, session, store, or invite logic.
- **Rule:** dev DB schema is applied idempotently before the dev server starts; never run DDL in deployments — Replit's Publish flow migrates production from the dev schema.
