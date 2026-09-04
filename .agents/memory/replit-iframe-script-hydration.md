---
name: Replit iframe script hydration
description: Preventing root-layout script collisions and storage failures inside the Replit artifact iframe.
---

**Rule:** Do not render application-owned initialization scripts as direct
children of the root layout's `head`. Use a client initializer for browser
state, and guard access to storage APIs.

**Why:** Replit injects a preview-devtools script into `head` before React
hydrates. An application-owned head script can then be reconciled against the
injected node, producing a hydration error specific to the embedded artifact.
Privacy-restricted iframe contexts can also throw when reading `localStorage`.

**How to apply:** Keep browser initialization outside the hydrated head tree.
Run it from a client effect, tolerate unavailable storage, and reproduce layout
changes in a cross-origin iframe rather than validating only a top-level URL.