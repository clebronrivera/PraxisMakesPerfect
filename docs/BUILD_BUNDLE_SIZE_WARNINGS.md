# Build Bundle Size Warnings

During `npm run verify:health`, Vite may emit a warning like:

`(!) Some chunks are larger than 500 kBs after minification`

This is a signal that our current build output includes large rollup chunks (often caused by top-level imports and not-yet-split routes/components). Large chunks can slow first load and degrade runtime performance on slower networks/devices.

## What to do

1. Prefer code-splitting over raising limits.
2. If we need to split further, consider:
   - adding `dynamic import()` boundaries for heavy routes/components
   - extending `vite.config.ts` `build.rollupOptions.output.manualChunks` beyond the current React/icon splits
   - ensuring feature code is not pulled into the initial bundle via top-level imports
3. Only adjust `build.chunkSizeWarningLimit` if we intentionally accept large chunks (and document why).

## When to check

Run `npm run verify:health` before release and treat new/recurring bundle-size warnings as an action item rather than ignoring them.

