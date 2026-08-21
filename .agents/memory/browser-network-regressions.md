---
name: Browser network regressions
description: Why lazy-loaded browser bundle assertions must use a production Next.js build.
---

Run browser tests that assert a dynamically imported chunk is not requested initially against a production build, not the Next.js development server.

**Why:** Turbopack's development loader can request a dynamic dependency chunk before application code invokes the import, producing a false performance regression that does not occur in the shipped bundle.

**How to apply:** Build into a dedicated test output directory, serve it with `next start`, and identify hashed production chunks from their built contents when request filenames are opaque.