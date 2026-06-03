# Phase 2B — Test Selector + FTCE View Mockups

## Goal

Per `CLAUDE.md` mandatory mockup-first workflow, produce static HTML mockups for the test-selector onboarding step and the FTCE 036 dashboard/results screens before any React code is written.

## Scope

### Allowed files
- `public/mockup-test-selector.html`
- `public/mockup-ftce036-dashboard.html`
- `public/mockup-ftce036-results.html`
- `public/mockup-ftce036-login.html`
- `docs/mockups/ftce036-handoff.md` (handoff spec)

### Forbidden
- Any React component changes
- `src/` edits at all (mockups must be viewable without auth, no React, no build step)

## Hard blockers

None directly. B1/B2/B4 affect realism of FTCE content, but mockups can use placeholder content if needed and be revised once real Keystone content lands.

## Steps

### 2B.1 Build test-selector mockup
Allowed: `public/mockup-test-selector.html`
Acceptance:
- Tailwind CDN, no build step
- Renders cards for each available test (Praxis 5403, FTCE 036)
- Status badges (Available, Internal Preview, Coming Soon)
- **Loads at `http://localhost:8888/mockup-test-selector.html`** under `npm run dev:netlify` — verify the URL survives the Netlify SPA redirect (per the April 2026 `CLAUDE.md` note)
- If the URL is swallowed by the SPA redirect, update `netlify.toml` rewrite rules to exempt `/mockup-*.html`

### 2B.2 Build FTCE 036 dashboard mockup
Allowed: `public/mockup-ftce036-dashboard.html`
Acceptance: visual parity with the existing Atelier dashboard mockup but with FTCE skill names/domains (placeholders OK if Keystone content not finalized).

### 2B.3 Build FTCE 036 results mockup
Allowed: `public/mockup-ftce036-results.html`
Acceptance: visual parity with the existing Atelier results mockup but with FTCE content.

### 2B.4 Walk mockups with user
Acceptance: user explicitly approves each mockup (per `CLAUDE.md` workflow). Approval recorded in `HANDOFF_LOG.md` with timestamp.

### 2B.5 Write FTCE 036 handoff spec
Allowed: `docs/mockups/ftce036-handoff.md`
Acceptance: spec mirrors the structure of any existing `docs/mockups/*-handoff.md` (e.g., the BrainActivation handoff if present).

## Phase Exit Criteria

- All 4 mockup files load at `http://localhost:8888/mockup-*.html`
- User has approved each (recorded in `HANDOFF_LOG.md`)
- Handoff spec exists
- `STATE.md` updated to Phase 3 step 3.0

## Rollback

Mockups are static HTML, no runtime impact. Just delete files if the design direction changes.
