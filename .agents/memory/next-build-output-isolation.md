---
name: Next.js build output isolation
description: Why production builds use a separate Next.js output directory while the Replit preview is running.
---

**Rule:** Keep both production output and production TypeScript route validation
isolated from every live development and E2E cache.

**Why:** Replit validation can run `next build` while `next dev` is still
serving preview. Generated route validators can interleave and fail TypeScript
with malformed code even when output directories differ, because broad
TypeScript includes can still read a concurrently-written dev validator.

**How to apply:** Preserve the dedicated production output setting in both build
and production-start scripts. Production builds must use a TypeScript config
that excludes development/E2E caches while admitting only production-generated
types. Ignore every generated output directory in Git and ESLint.