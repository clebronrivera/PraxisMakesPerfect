#!/usr/bin/env node
/**
 * Color guard — prevents the warm "old palette" from drifting back into new work.
 *
 * The indigo/violet re-theme is COOL (see docs/DESIGN_TOKENS.md). The warm hexes
 * below are legacy ("off-yellow") echoes still present in src/index.css + ~13
 * legacy components; copying them into new mockups/components is the regression
 * this guard blocks. Run: `npm run scan:colors`.
 *
 * Scope: GUARDED list only (new/active work), so legacy files don't fail the build.
 * Add new Track-A files (mockups, components) to GUARDED as they're created.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

// Forbidden warm "old palette" hexes → cool replacement (see docs/DESIGN_TOKENS.md)
const FORBIDDEN = {
  '#e6dfd4': '#e2e8f0 (slate-200)',
  '#fbfaf7': '#f8fafc (slate-50)',
  '#ece4d7': '#eef2f6',
  '#ece8df': '#f1f5f9 (slate-100)',
  '#f4f1ea': '#f7f6f8 (--page-bg)',
  '#faf8f3': '#f7f6f8 (--page-bg)',
};

// Files/dirs to guard. Keep scoped to current/active design work.
const GUARDED = [
  'public/mockup-track-a-engagement.html',
  'public/mockup-modules-redesign.html',
  'public/mockup-modules-redesign-v2.html',
  // Add Track-A React files here as they are built, e.g.:
  // 'src/components/ModuleEngagementCard.tsx',
  // 'src/components/ActionItemsCard.tsx',
];

function expand(entry) {
  const abs = join(ROOT, entry);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isDirectory()) {
    return readdirSync(abs).flatMap((f) => expand(join(entry, f)));
  }
  return [entry];
}

const files = [...new Set(GUARDED.flatMap(expand))];
const forbiddenHexes = Object.keys(FORBIDDEN);
const re = new RegExp(forbiddenHexes.join('|'), 'gi');

let violations = 0;
for (const file of files) {
  const lines = readFileSync(join(ROOT, file), 'utf8').split('\n');
  lines.forEach((line, i) => {
    const matches = line.match(re);
    if (matches) {
      for (const m of matches) {
        const key = m.toLowerCase();
        console.error(
          `✗ ${relative(ROOT, file)}:${i + 1}  forbidden warm hex ${m} → use ${FORBIDDEN[key] ?? 'a cool token (see docs/DESIGN_TOKENS.md)'}`
        );
        violations++;
      }
    }
  });
}

if (violations > 0) {
  console.error(`\ncolor guard: ${violations} forbidden warm hex(es) found. See docs/DESIGN_TOKENS.md.`);
  process.exit(1);
}
console.log(`color guard: clean (${files.length} file${files.length === 1 ? '' : 's'} scanned, 0 forbidden hexes).`);
