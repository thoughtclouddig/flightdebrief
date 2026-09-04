---
name: Development bundler stability
description: Why the Replit development preview uses Webpack instead of Turbopack.
---

**Rule:** Keep the main Replit development workflow on Next.js Webpack unless
the preview environment is proven stable with Turbopack.

**Why:** Turbopack served multiple HMR-client chunk generations to the embedded
preview after restarts and tree updates. The page rendered initially, then
failed with truncated-script syntax errors and chunk-load failures. Restarting
alone did not make the preview consistently reliable.

**How to apply:** Run `next dev --webpack` for the main preview. If changing
bundlers, clear the generated development cache before restarting so runtimes
from different bundlers cannot mix. Validate by keeping an embedded preview
open through HMR reconnects, not only by checking the first render.