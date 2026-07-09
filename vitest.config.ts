import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // .ts = data/logic tests (node env). .tsx = React component tests — they
    // opt into jsdom per-file via a `// @vitest-environment jsdom` docblock.
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: [
      'tests/adaptive-coaching.test.ts',
      'tests/code-health.test.ts',
    ],
    setupFiles: ['tests/setup.ts'],
    // Stub Supabase creds so modules that eagerly instantiate the client
    // (e.g. vocabDrillService) import without throwing. Keeps the suite
    // hermetic — no real .env.local or CI secrets required. These values are
    // never used to make network calls in tests.
    env: {
      VITE_SUPABASE_URL: 'https://stub.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_stub_for_tests',
    },
  },
  resolve: {
    alias: {
      src: '/src',
    },
  },
});
