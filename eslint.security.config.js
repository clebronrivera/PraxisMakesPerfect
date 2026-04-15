/**
 * Security audit ESLint config — runs separately from the main lint gate.
 *
 * Run with: npm run lint:security
 *
 * This config is intentionally NOT included in eslint.config.js because the
 * main lint script uses --max-warnings 0. Merging security rules there would
 * break CI until every finding is resolved.
 *
 * Current baseline (2026-04-13):
 *   - detect-object-injection:   286 warnings (mostly false positives — safe dict lookups)
 *   - detect-unsafe-regex:        19 warnings (tutorIntentClassifier.ts — review for ReDoS)
 *   - detect-non-literal-regexp:   2 warnings (both properly escaped, safe to suppress)
 *
 * Promotion path:
 *   1. Audit the 19 detect-unsafe-regex findings in src/utils/tutorIntentClassifier.ts
 *   2. Suppress the 2 detect-non-literal-regexp cases with eslint-disable-next-line
 *   3. Decide whether detect-object-injection should be permanently disabled (known noisy)
 *   4. Promote any confirmed findings to "error" and move them into eslint.config.js
 */

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import security from "eslint-plugin-security";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,cjs,mjs,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{js,cjs,mjs,ts,tsx}"],
    plugins: {
      security,
    },
    rules: {
      // High-noise, mostly false positives on TypeScript dict lookups.
      // Leave at warn until object-injection risk is confirmed in a specific location.
      "security/detect-object-injection": "warn",

      // 19 findings — review src/utils/tutorIntentClassifier.ts for ReDoS risk before promoting.
      "security/detect-unsafe-regex": "warn",

      // 2 findings — both properly escape user input before passing to RegExp constructor.
      // Suppress inline when touching those files.
      "security/detect-non-literal-regexp": "warn",

      // These rules found zero findings in the baseline scan.
      // Keeping them active so new violations are caught going forward.
      "security/detect-bidi-characters": "warn",
      "security/detect-buffer-noassert": "warn",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "warn",
      "security/detect-eval-with-expression": "warn",
      "security/detect-new-buffer": "warn",
      "security/detect-no-csrf-before-method-override": "warn",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-non-literal-require": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "warn",
    },
  },
  {
    ignores: [
      "**/*.json",
      ".claude/**",
      ".husky/**",
      ".netlify/**",
      "dist/**",
      "node_modules/**",
      "scratch/**",
      "archive/**",
      "content-authoring/**",
      "scripts/**",
      "src/scripts/**",
      "supabase/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      "e2e/**",
    ],
  }
);
