import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-build/**",
    ".next-e2e*/**",
    ".cache/**",
    ".local/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Agent worktrees are gitignored scratch copies of the repo. They are not
    // source and never deploy, but eslint was walking into them and reporting
    // 602 errors from vendored code -- which buried the handful of real
    // findings and made `npm run lint` useless as a gate.
    ".claude/**",
  ]),
]);

export default eslintConfig;
