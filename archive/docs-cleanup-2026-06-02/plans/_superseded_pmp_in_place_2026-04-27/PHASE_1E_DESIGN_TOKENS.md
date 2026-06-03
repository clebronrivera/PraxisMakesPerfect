# Phase 1E — Design Token Consolidation + Shared Components

## Goal

Resolve the 3-way color conflict (Atelier vs Editorial in `src/utils/domainColors.ts` vs inline emerald/amber/rose at `src/components/ScreenerResults.tsx:22-25,67`). Extract `DomainCard` and `ResultTemplate` to dedupe 3+ inline implementations. Medium scope per `DECISIONS.md` #9 — no i18n, no Storybook.

## Scope

### Allowed files
- `src/design/tokens.ts` (new)
- `src/components/shared/DomainCard.tsx` (new)
- `src/components/shared/ResultTemplate.tsx` (new)
- `src/components/LoginScreen.tsx` (consume tokens; remove `DOMAIN_COLORS` at line 12, `DOMAIN_NODE_COLORS` at line 29)
- `src/components/ResultsDashboard.tsx` (consume tokens, use `ResultTemplate`)
- `src/components/ScreenerResults.tsx` (consume tokens, use `ResultTemplate`)
- `src/components/StudyModesSection.tsx` (consume `LIGHT_BADGE` from tokens)
- `src/components/DomainTiles.tsx` (use `DomainCard`)
- `tailwind.config.js` (extend theme with token references — Atelier CSS vars)
- Delete: `src/utils/domainColors.ts`

### Forbidden
- New tests (Phase 2A)
- Onboarding UX changes (Phase 4A)
- Storybook, i18n, theme switcher (out of scope per `DECISIONS.md` #9)

## Hard blockers

None.

## Steps

### 1E.1 Create `src/design/tokens.ts`
Allowed: `src/design/tokens.ts`, `tailwind.config.js`
Acceptance:
- Exports `tokens.domain[id]`, `tokens.proficiency[level]`, `tokens.tone[tone]`, `tokens.proficiencyTiers`
- All values reference Atelier CSS vars defined in `tailwind.config.js`
- `tailwind.config.js` `theme.extend.colors` references the same vars
Verification: typecheck.

### 1E.2 Migrate ScreenerResults.tsx tone styles
Allowed: `src/components/ScreenerResults.tsx`
Acceptance:
- `toneStyles` (emerald/amber/rose at lines 22–25) replaced with `tokens.tone[tone]` (Atelier vars)
- Inline amber on line 67 (`bg-amber-50`) and similar inline color usages migrated to tokens
- Visual result: closer to Atelier; verify with screenshot vs mockup `public/mockup-results-atelier.html` if it exists, else the post-Phase-1D baseline
Verification: dev:netlify, manual screenshot.

### 1E.3 Delete `src/utils/domainColors.ts`
Allowed: `src/utils/domainColors.ts` (delete), all importers
Acceptance:
- File deleted
- All importers refactored to use `tokens.domain[id]`
- Visual unchanged where Atelier was already winning; consistent everywhere now
Verification: `find src/utils -name domainColors.ts` empty; build passes.

### 1E.4 Migrate LoginScreen.tsx domain color maps
Allowed: `src/components/LoginScreen.tsx`
Acceptance:
- `DOMAIN_COLORS` (line 12) and `DOMAIN_NODE_COLORS` (line 29) replaced with `tokens.domain[id]` lookup
- Boot grid + engine nodes render identically
- The `?? '#fcd5b4'` fallback at line 46 now reads from a token default
Verification: screenshot match.

### 1E.5 Extract `DomainCard` component
Allowed: `src/components/shared/DomainCard.tsx`, `src/components/DomainTiles.tsx`, `src/components/ResultsDashboard.tsx`, `src/components/LoginScreen.tsx`
Acceptance:
- `DomainCard` supports variants `tile | chip | compact`
- 3+ inline implementations replaced
- Visual unchanged on each surface
Verification: screenshot match across all 3+ usage sites.

### 1E.6 Extract `ResultTemplate` component
Allowed: `src/components/shared/ResultTemplate.tsx`, `src/components/ScreenerResults.tsx`, `src/components/ResultsDashboard.tsx`
Acceptance:
- Single component renders both result variants, parameterized by tone
- Both old screens become thin wrappers
Verification: screenshot match for screener results and dashboard results.

## Phase Exit Criteria

- `src/utils/domainColors.ts` deleted
- All color/proficiency tokens flow through `src/design/tokens.ts`
- `DomainCard` + `ResultTemplate` extracted
- All surfaces visually unchanged compared to post-Phase-1D baseline
- `STATE.md` updated to Phase 2A step 2A.1
- Capture post-Phase-1E screenshot baseline

## Rollback

Each step is its own commit and isolated to one component or token group. Revert individually if a screenshot regression appears.
