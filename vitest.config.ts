import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: [
      'tests/adaptive-coaching.test.ts',
      'tests/code-health.test.ts',
    ],
  },
  resolve: {
    alias: {
      src: '/src',
    },
  },
});
