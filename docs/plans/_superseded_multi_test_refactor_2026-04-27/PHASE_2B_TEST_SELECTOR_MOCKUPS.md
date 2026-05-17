# Phase 2B — Test Selector + FTCE View Mockups

## Goal

Per `CLAUDE.md` mandatory mockup-first workflow: produce static HTML mockups for the test-selector onboarding step and the FTCE 036 dashboard/results screens *before* any React code is written.

**Dependency note.** Phase 2B depends on Phase 1E (design tokens consolidated) but NOT on Phase 2A. Mockups may use placeholder FTCE content (skill names, domain weights) drawn from public FDOE blueprint pages or invented for layout purposes. This decouples design work from Keystone authoring (B1/B2). React implementation that consumes a real FTCE TestPackage still waits for Phase 2A and Phase 3.

## Scope

### Allowed files (create / modify)

- `public/mockup-test-selector.html`
- `public/mockup-ftce036-dashboard.html`
- `public/mockup-ftce036-results.html`
- `public/mockup-ftce036-login.html`
- `docs/mockups/ftce036-handoff.md` (handoff spec)

### Forbidden files (no modification)

- Any React component changes
- `src/` edits at all (mockups must be viewable without auth, no React)

## Hard blockers preventing this phase

None. Placeholder content is explicitly allowed — B1/B2 affect package authoring (Phase 2A), not mockups.

## Steps

### 2B.1 — Build test-selector mockup

Allowed: `public/mockup-test-selector.html`

Acceptance:
- Tailwind CDN, no build step
- Renders 2 cards (Praxis 5403, FTCE 036) using the Atelier tokens established in Phase 1E
- Status badges (Available, Internal Preview, etc.)
- Viewable at `http://localhost:5173/mockup-test-selector.html`

Verification: file loads in a clean browser tab; cards render correctly.

### 2B.2 — Build FTCE 036 dashboard mockup

Allowed: `public/mockup-ftce036-dashboard.html`

Acceptance: visual parity with `mockup-dashboard-atelier.html` but FTCE skill names/domains. Placeholder content acceptable.

Verification: side-by-side comparison with the Praxis Atelier dashboard mockup; visual differences limited to content (test name, skill labels), not structure.

### 2B.3 — Build FTCE 036 results mockup

Allowed: `public/mockup-ftce036-results.html`

Acceptance: visual parity with `mockup-results-atelier.html` but FTCE content.

Verification: side-by-side comparison.

### 2B.4 — Build FTCE 036 login mockup

Allowed: `public/mockup-ftce036-login.html`

Acceptance: visual parity with the existing Atelier login mockup; FTCE-specific marketing copy and boot animation labels.

### 2B.5 — Walk mockups with operator

Acceptance: operator explicitly approves each mockup (per `CLAUDE.md` workflow). Approval recorded in `HANDOFF_LOG.md`.

### 2B.6 — Write FTCE 036 handoff spec

Allowed: `docs/mockups/ftce036-handoff.md`

Acceptance: spec mirrors the structure of any existing handoff spec in `docs/mockups/` (e.g., `BrainActivation_handoff.md` if present); covers layout, design tokens, component props, interaction states, responsive breakpoints, edge cases, and animation details.

Verification: peer-read by operator; spec is implementation-ready.

## Phase Exit Criteria

- 4 mockup files load in browser
- Operator has approved each
- Handoff spec exists
- `STATE.md` updated to next phase
- Phase branch `refactor/multi-test/phase-2b` squash-merged to main

## Rollback procedure

Default per `SESSION_RULES.md`: `git revert <SHA>`. Mockups are static HTML in `public/`; reverting removes them without runtime impact.
