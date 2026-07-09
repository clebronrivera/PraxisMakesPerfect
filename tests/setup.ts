// Shared vitest setup. Runs for every test file (node and jsdom).
// - jest-dom matchers (toBeInTheDocument, toBeDisabled, …) for component tests.
// - RTL cleanup after each test (we don't enable vitest globals, so RTL's
//   auto-cleanup never registers on its own).
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
