import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

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
