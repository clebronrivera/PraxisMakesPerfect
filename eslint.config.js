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
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Security plugin: initial audit in warn mode to measure findings before enforcement
    files: ["**/*.{js,cjs,mjs,ts,tsx}"],
    plugins: {
      security,
    },
    rules: {
      "security/detect-bidi-characters": "warn",
      "security/detect-buffer-noassert": "warn",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "warn",
      "security/detect-eval-with-expression": "warn",
      "security/detect-new-buffer": "warn",
      "security/detect-no-csrf-before-method-override": "warn",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-non-literal-require": "warn",
      "security/detect-object-injection": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "warn",
      "security/detect-unsafe-regex": "warn",
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
      "*.config.js",
      "*.config.ts",
    ],
  }
);
