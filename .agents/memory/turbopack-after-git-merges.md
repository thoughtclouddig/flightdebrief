---
name: Turbopack after Git merges
description: How to distinguish and clear a stale Turbopack HMR panic after a large Git tree update.
---

Restart the development workflow after completing a Git merge or applying a large synchronized tree update while `next dev` is running.

**Why:** Replacing many files under a live Next.js development process can invalidate Turbopack's internal HMR cells and produce a fatal `Cell ... no longer exists` panic even though tests, production builds, and server-rendered requests are healthy. A clean workflow restart clears that stale bundler state.

**How to apply:** After merges or task reconciliation, restart `Start application` before evaluating fresh runtime logs. Treat the issue as code-related only if it returns after the clean restart.