import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // .claude/worktrees holds throwaway agent worktrees -- their stale copies
    // of a spec still resolve "@" to this repo's live source, so they fail on
    // any change made here. Never source of truth; never worth running.
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next*/**", "**/.claude/**"],
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
});
