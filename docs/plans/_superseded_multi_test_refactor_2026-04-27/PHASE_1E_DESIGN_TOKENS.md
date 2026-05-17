# Phase 1E — Design Token Consolidation + Shared Components

## Goal

Resolve the 3-way color conflict (Atelier vs Editorial vs inline emerald/amber/rose). Extract `DomainCard` and `ResultTemplate` to dedupe 3+ inline implementations. Medium scope per `DECISIONS.md` item 9 — no i18n, no Storybook.

## Scope

### Allowed files (create / modify)

- `src/design/tokens.ts` (new)
- `src/components/shared/DomainCard.tsx` (new)
- `src/components/shared/ResultTemplate.tsx` (new)
- `src/components/LoginScreen.tsx` (consume tokens; remove `DOMAIN_COLORS`, `DOMAIN_NODE_COLORS`)
- `src/components/ResultsDashboard.tsx` (consume tokens, use `ResultTemplate`)
- `src/components/ScreenerResults.tsx` (consume tokens, use `ResultTemplate`)
- `src/components/StudyModesSection.tsx` (consume `LIGHT_BADGE` from tokens)
- `src/components/DomainTiles.tsx` (use `DomainCard`)
- Delete: `src/utils/domainColors.ts`

### Forbidden files (no modification)

- New tests (Phase 2A scope)
- Onboarding UX changes (Phase 4A scope)
- Storybook, i18n, theme switcher (out of scope per `DECISIONS.md` #9)

## Hard blockers preventing this phase

- B4 (mockup file presence) — if active, this phase falls back to before/after baseline comparison instead of mockup-vs-implementation comparison. See `BLOCKERS.md`.

## Steps

### 1E.1 — Create src/design/tokens.ts

Allowed: `src/design/tokens.ts`

Acceptance:
- Exports `tokens.domain[id]`, `tokens.proficiency[level]`, `tokens.tone[tone]`, `tokens.proficiencyTiers`
- All values reference Atelier CSS vars from `tailwind.config.js`
- TypeScript types prevent accidental string-color usage at consumer sites

Verification: `npm run typecheck`.

### 1E.2 — Migrate ScreenerResults.tsx tone styles

Allowed: `src/components/ScreenerResults.tsx`

Acceptance:
- `toneStyles` (emerald/amber/rose) replaced with `tokens.tone[tone]` (Atelier vars)
- Visual result: closer to Atelier
- If B4 resolved: verify with screenshot vs mockup `public/mockup-results-atelier.html`
- If B4 active: verify with before/after vs Phase -1.2 baseline (regression-free, but visual change to Atelier expected here)

Verification: dev:netlify, manual screenshot match.

### 1E.3 — Delete src/utils/domainColors.ts

Allowed: `src/utils/domainColors.ts` (delete), all importers

Acceptance:
- File deleted
- All importers refactored to use `tokens.domain[id]`
- Visual unchanged on surfaces where Atelier was already winning

Verification: typecheck, build, visual smoke on every surface that previously imported `domainColors.ts`.

### 1E.4 — Migrate LoginScreen.tsx domain color maps

Allowed: `src/components/LoginScreen.tsx`

Acceptance:
- `DOMAIN_COLORS` (around lines 12–17) and `DOMAIN_NODE_COLORS` (around lines 29–34) replaced with `tokens.domain[id]` lookup
- Boot grid + engine nodes render identically vs Phase -1.2 baseline

Verification: visual smoke; capture login boot animation final frame, compare to baseline.

### 1E.5 — Extract DomainCard component

Allowed: `src/components/shared/DomainCard.tsx`, `src/components/DomainTiles.tsx`, `src/components/ResultsDashboard.tsx`, `src/components/LoginScreen.tsx`

Acceptance:
- `DomainCard` supports variants `tile | chip | compact`
- 3+ inline implementations replaced
- Visual unchanged on each surface vs Phase -1.2 baseline

Verification: typecheck, build, visual smoke on Dashboard, Results, Login.

### 1E.6 — Extract ResultTemplate component

Allowed: `src/components/shared/ResultTemplate.tsx`, `src/components/ScreenerResults.tsx`, `src/components/ResultsDashboard.tsx`

Acceptance:
- Single component renders both result variants, parameterized by tone
- Both old screens become thin wrappers around `<ResultTemplate>`
- Visual matches mockup (B4 resolved) or baseline (B4 active)

Verification: visual smoke on screener results and adaptive results.

## Phase Exit Criteria

- `src/utils/domainColors.ts` deleted
- All color/proficiency tokens flow through `src/design/tokens.ts`
- `DomainCard` + `ResultTemplate` extracted; the 3+ duplicated inline implementations removed
- All surfaces visually unchanged vs Phase -1.2 baseline (or, where Atelier replaced Editorial, intentionally changed and approved by operator)
- `STATE.md` updated to next phase
- Phase branch `refactor/multi-test/phase-1e` squash-merged to main

## Rollback procedure

Default per `SESSION_RULES.md`: `git revert <SHA>` for each step. Because steps 1E.1–1E.6 are independent commits, partial rollback (e.g., revert only the `ResultTemplate` extraction) is supported.
