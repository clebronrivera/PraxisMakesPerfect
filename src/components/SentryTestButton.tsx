/**
 * Dev-only: Sentry onboarding-style test (uncaught exception from an event handler).
 * Rendered from the admin dashboard “Testing Shortcuts” panel; hidden in production builds.
 */
export function SentryTestButton() {
  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      title="Send a test error to Sentry"
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      className="rounded-lg border border-amber-300/80 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900 hover:bg-amber-100"
    >
      Break the world
    </button>
  );
}
