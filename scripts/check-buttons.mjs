#!/usr/bin/env node
/**
 * Button guard — a debt ratchet that stops new hand-rolled buttons from creeping
 * back in after the app was migrated onto the shared <Button>/<IconButton>
 * primitives (src/components/ui/).
 *
 * It counts raw `<button` tags in src/**\/*.tsx (EXCLUDING src/components/ui/,
 * where the primitives legitimately render a real <button>) and fails if the
 * count RISES above the budget in scripts/button-budget.json.
 *
 * Why a ratchet, not zero: some raw buttons are intentional and don't belong in
 * the primitive — answer/selection tiles, nav tabs, segmented controls, and the
 * dark-themed landing/auth surface (its own theme). Those are the remaining
 * baseline. The ratchet just prevents NEW ones.
 *
 * When you legitimately add a raw button (a new answer tile, etc.): run this,
 * then RAISE `max` in scripts/button-budget.json by that many, with a note.
 * When you migrate more buttons to <Button>: LOWER `max` to the new count so the
 * ratchet keeps tightening. Run: `npm run scan:buttons`.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIR = 'src';
const EXCLUDE = ['src/components/ui']; // primitives render real <button>s — not violations
const BUDGET_FILE = 'scripts/button-budget.json';

const RAW_BUTTON = /<button[\s>]/g;

function walk(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  if (EXCLUDE.some((ex) => dir === ex || dir.startsWith(ex + '/'))) return [];
  if (statSync(abs).isDirectory()) {
    return readdirSync(abs).flatMap((f) => walk(join(dir, f)));
  }
  return dir.endsWith('.tsx') ? [dir] : [];
}

const files = walk(SCAN_DIR);
const perFile = [];
let total = 0;
for (const file of files) {
  const matches = readFileSync(join(ROOT, file), 'utf8').match(RAW_BUTTON);
  const n = matches ? matches.length : 0;
  if (n > 0) perFile.push([file, n]);
  total += n;
}

let max = Infinity;
if (existsSync(join(ROOT, BUDGET_FILE))) {
  try {
    max = JSON.parse(readFileSync(join(ROOT, BUDGET_FILE), 'utf8')).max ?? Infinity;
  } catch {
    console.error(`button guard: could not parse ${BUDGET_FILE}`);
    process.exit(1);
  }
}

if (total > max) {
  perFile.sort((a, b) => b[1] - a[1]);
  console.error(`✗ button guard: ${total} raw <button> tags, budget is ${max} (+${total - max}).`);
  console.error('  New hand-rolled buttons detected. Prefer <Button>/<IconButton> from src/components/ui/.');
  console.error('  If this raw button is intentional (answer tile, nav, segmented control, dark landing surface),');
  console.error(`  raise "max" in ${BUDGET_FILE} to ${total} with a one-line note.\n  Top files:`);
  for (const [file, n] of perFile.slice(0, 12)) {
    console.error(`    ${n}\t${relative(ROOT, join(ROOT, file))}`);
  }
  process.exit(1);
}

if (total < max && Number.isFinite(max)) {
  console.log(
    `button guard: clean (${total} raw <button> in ${files.length} files; budget ${max}). ` +
      `Progress — lower "max" in ${BUDGET_FILE} to ${total} to ratchet.`,
  );
} else {
  console.log(`button guard: clean (${total} raw <button> in ${files.length} files, budget ${max}).`);
}
