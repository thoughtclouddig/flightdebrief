import { defineConfig } from "vitest/config";

const runLiveTtsIntegration = process.env.LIVE_TTS_INTEGRATION === "1";

export default defineConfig({
  test: {
    // .claude/worktrees holds throwaway agent worktrees -- their stale copies
    // of a spec still resolve "@" to this repo's live source, so they fail on
    // any change made here. Never source of truth; never worth running.
    include: runLiveTtsIntegration
      ? ["lib/deepgram-tts.integration.test.ts"]
      : ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next*/**",
      "**/.claude/**",
      ...(runLiveTtsIntegration ? [] : ["**/*.integration.test.ts"]),
    ],
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
});
