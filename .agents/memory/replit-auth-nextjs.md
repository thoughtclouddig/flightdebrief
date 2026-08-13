---
name: Auth & identity conventions
description: Durable rules for keeping auth/identity consistent in this app.
---

- **Rule:** user and membership rows must exist in BOTH stores (Replit Postgres identity tables and the lib/data repository) with the SAME id; the repository generates the id first.
  **Why:** getViewer() authorizes from Postgres while roster/flight views read the repository — split ids leave invited users unable to access anything.
  **How to apply:** any new code path that creates/updates users, memberships, or roles must write both stores (see how invites do it).
- **Rule:** proxy.ts protects pages only; every API route must enforce its own auth/role via the shared guard.
  **Why:** review found unauthenticated admin mutations because routes relied on the page middleware.
- **Rule:** dev DB schema is applied idempotently before the dev server starts; never run DDL in deployments — Replit's Publish flow migrates production from the dev schema.
