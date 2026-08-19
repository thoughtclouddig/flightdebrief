---
name: Membership switcher release policy
description: Product decision about where organization and role switching may be exposed.
---

**Rule:** Keep the organization/role membership switcher development-only. Do not expose or enable it in published builds unless the user explicitly decides to ship a real multi-school or dual-role experience.

**Why:** The user considers the current switcher a testing tool, not a public product feature, and wants to validate it in development before deciding whether real end users need it.

**How to apply:** New navigation, auth, membership, or signup work must preserve the production UI and API guard. Test role switching through the development environment only.