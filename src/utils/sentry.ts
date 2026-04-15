/**
 * Sentry initialization — environment-aware, no-op when DSN is absent.
 */
import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.DEV ? 'development' : 'production',
    release: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown',
    // Only send errors in production by default. Override in dev by setting
    // VITE_SENTRY_DSN — useful for testing the integration.
    enabled: true,
    // Sample 100% of errors (adjust for high traffic)
    sampleRate: 1.0,
  });

  initialized = true;
}

/**
 * Capture an exception with optional context.
 * No-ops gracefully when Sentry is not initialized.
 */
export function captureError(error: unknown, context?: { userId?: string; tags?: Record<string, string>; extra?: Record<string, unknown> }) {
  if (!initialized) {
    console.error('[Sentry not initialized]', error);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.userId) scope.setUser({ id: context.userId });
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
    if (context?.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}
