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
    "out/**",
    "build/**",
    "next-env.d.ts",
    // n8n Code-node bodies (top-level return/await) — not ES modules; tested
    // by scripts/arbitrage/n8n/test/code-nodes.test.mjs instead.
    "scripts/arbitrage/n8n/code/**",
  ]),
]);

export default eslintConfig;
