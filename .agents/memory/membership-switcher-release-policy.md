---
name: Membership switcher release policy
description: Product decision about where organization and role switching may be exposed.
---

**Rule:** The organization/role membership switcher is enabled in production. `lib/auth/membership-switcher.ts`'s `isMembershipSwitcherEnabled()` returns `true` unconditionally.

**Why:** Development-only quietly broke every real multi-membership case the product supports -- `getViewer()` falls back to the first active membership, so a student invited to a new school landed back in the old org, a CFI teaching at two schools could never reach the second, and a freelance CFI (admin + instructor in one org) could reach only one of their two roles. Superseded by commit `1df6969` ("Let students leave an independent CFI, and turn the membership switcher on", 2026-08-28), which judged it safe to expose because `POST /api/auth/switch-membership` re-reads the caller's own memberships server-side and refuses anything that isn't theirs and active -- the only client input is an id checked against their own list.

**How to apply:** New navigation, auth, membership, or signup work should treat the switcher as a real production feature, not a dev-only test aid. Do not reintroduce a `NODE_ENV`/environment gate on it without a new explicit product decision superseding `1df6969`.
