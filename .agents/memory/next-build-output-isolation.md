---
name: Next.js build output isolation
description: Why production builds use a separate Next.js output directory while the Replit preview is running.
---

**Rule:** Keep production builds on a separate Next.js `distDir` from the live
development workflow.

**Why:** Replit validation can run `next build` while `next dev` is still
serving preview. If both write to `.next`, their generated route validators can
interleave and fail TypeScript with malformed generated code even though the
application source is valid.

**How to apply:** Preserve the same dedicated output setting in both build and
production-start scripts when changing package scripts or Next.js
configuration, and ignore every generated output directory in Git and ESLint.