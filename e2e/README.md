# E2E tests (Playwright)

End-to-end browser tests for PASS. These complement the unit tests
(`tests/*.test.ts`) and component tests (`tests/*.test.tsx`) by exercising real
user flows in a real browser.

## Running

```bash
npm run test:e2e         # headless (all specs)
npm run test:e2e:ui      # interactive watch/debug UI
npm run test:e2e:headed  # headed browser
```

The config (`playwright.config.ts`) boots the Vite dev server itself and injects
**stub** Supabase creds, so the unauthenticated specs run with zero setup.
First time only: `npx playwright install chromium`.

## What's covered

| Spec | Auth | Runs by default | Covers |
|---|---|---|---|
| `landing.spec.ts` | none | ✅ yes | Landing hero + CTAs, auth modal opens, **Phase 6 guard: no `questions.json` fetch on the landing page** |
| `authenticated.spec.ts` | test account | ⏭️ skipped w/o creds | Sign-in → dashboard shell, **dashboard doesn't eagerly fetch the bank**, **Practice entry lazily loads the bank** (Phase 5 + 6 critical paths) |

## Running the authenticated specs

They need a **throwaway test account** on a real Supabase project (never a real
user). Supply both the creds and real Supabase env (the latter overrides the
config's stubs so auth actually succeeds):

```bash
E2E_EMAIL='e2e-bot@example.com' \
E2E_PASSWORD='...' \
VITE_SUPABASE_URL='https://<project>.supabase.co' \
VITE_SUPABASE_ANON_KEY='sb_publishable_...' \
npm run test:e2e
```

Without `E2E_EMAIL`/`E2E_PASSWORD` these specs `test.skip` cleanly.

> **Status:** `authenticated.spec.ts` is written against the current UI but has
> not yet been run against a live account (no test creds were available when it
> was authored). Expect to adjust a selector or two on the first real run — the
> assertions (bank-load timing, shell text) are the durable part; the
> navigation selectors are the likely-to-drift part.

## Not in CI (yet)

E2E is **not** part of `npm test` / `npm run check` — it needs a browser and a
running server, so it stays an explicit opt-in and doesn't slow the unit CI.
To add it to CI later: a separate job that runs `npx playwright install
--with-deps chromium` then `npm run test:e2e` (the landing specs need no
secrets; gate the authenticated ones on repo secrets for a test account).
