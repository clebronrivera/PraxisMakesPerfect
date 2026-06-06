# Build Bundle Size Warnings

During `npm run verify:health` or `npm run build`, Vite may emit a warning like:

`(!) Some chunks are larger than 500 kBs after minification`

This is a signal that our current build output includes large rollup chunks (often caused by top-level imports and not-yet-split routes/components). Large chunks can slow first load and degrade runtime performance on slower networks/devices.

## Current state (2026-04-15, post-`hotfix/launch-gate-p0`)

| Chunk | Raw | Gzipped | When loaded |
|---|---:|---:|---|
| `index-*.js` (main) | ~530 kB | ~132 kB | First paint |
| `react-vendor-*.js` | ~143 kB | ~46 kB | First paint |
| `supabase-vendor-*.js` | ~176 kB | ~46 kB | First paint |
| `icons-vendor-*.js` | ~17 kB | ~6 kB | First paint |
| `ScoreReport-*.js` | ~414 kB | ~120 kB | Lazy (after diagnostic) |
| `questions-*.js` | ~5.3 MB | ~925 kB | Lazy (study-plan generation only) |
| `questions-*.json` | 5.9 MB | — | Lazy (adaptive engine runtime fetch) |
| `AdminDashboard-*.js` | ~88 kB | ~21 kB | Lazy (admin route only) |

Historical reference — before `hotfix/launch-gate-p0` (2026-04-15), `index-*.js` was **6,122,205 bytes raw / 1,057 kB gzipped** because [src/utils/studyPlanPreprocessor.ts](../src/utils/studyPlanPreprocessor.ts) statically imported the 5.9 MB questions.json at top level. That import was switched to dynamic `import()`, moving the JSON into its own chunk and shrinking the main bundle by ~91%.

## Known duplication — not yet resolved

`questions-*.json` (5.9 MB) and `questions-*.js` (5.3 MB) both ship as separate artifacts serving the same data:

- `questions.json` is fetched at runtime via [App.tsx:109](../App.tsx:109) (used by the adaptive engine).
- `questions.js` is the dynamically-imported chunk emitted by Vite for the preprocessor.

Browsers therefore cache two copies of the same data. Unifying these paths (passing already-loaded questions into the preprocessor) would remove the duplication but requires touching App.tsx → useStudyPlanManager → studyPlanService → preprocessor and augmenting `RawQuestion` with raw-JSON fields like `error_cluster_tag`. Deferred as a cleanup, not a launch gate.

## What to do when bundle warnings appear

1. Prefer code-splitting over raising limits.
2. If we need to split further, consider:
   - adding `dynamic import()` boundaries for heavy routes/components
   - extending `vite.config.ts` `build.rollupOptions.output.manualChunks` beyond the current React/icon splits
   - ensuring feature code is not pulled into the initial bundle via top-level imports
3. Only adjust `build.chunkSizeWarningLimit` if we intentionally accept large chunks (and document why).

## When to check

Run `npm run build` before release and treat new/recurring bundle-size warnings as an action item rather than ignoring them. If `index-*.js` grows back above ~1 MB raw, investigate what was pulled into the main chunk — the preprocessor regression pattern (static JSON import at top of a widely-imported module) is the usual culprit.
