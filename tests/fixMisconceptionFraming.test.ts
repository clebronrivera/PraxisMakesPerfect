import { describe, it, expect } from 'vitest';

/**
 * Tests for the reframing logic in scripts/fix-misconception-framing.mjs.
 *
 * The script doesn't export functions, so we extract the core `classifyAndReframe`
 * function here (it's a pure function with no side effects).
 */

// ── Action verbs (subset matching the script's ACTION_VERBS set) ────────────
const ACTION_VERBS = new Set([
  'frames', 'equates', 'treats', 'misses', 'labels', 'confuses', 'assumes',
  'attributes', 'misreads', 'judges', 'chooses', 'reverses', 'overgeneralizes',
  'applies', 'ignores', 'conflates', 'mistakes', 'uses', 'selects', 'prioritizes',
  'associates', 'interprets', 'dismisses', 'defaults', 'underestimates',
  'overestimates', 'skips', 'focuses', 'fails', 'elevates', 'extends', 'narrows',
  'maps', 'links', 'relies', 'bases', 'substitutes', 'transfers', 'classifies',
  'assigns', 'places', 'reduces', 'sees', 'views', 'reads', 'takes', 'draws',
  'expects', 'requires', 'identifies', 'targets', 'designs', 'connects',
  'replaces', 'inverts', 'limits', 'separates', 'positions',
  'claims', 'treated', 'defines', 'explains', 'calls', 'stops', 'attributed',
  'chose', 'mislabels', 'eliminates', 'discards', 'states', 'collapses',
  'equated', 'reduced', 'used', 'proposed', 'does', 'adds', 'restates',
  'duplicates', 'misclassifies', 'offers', 'predicts', 'withdraws', 'denies',
  'prematurely', 'plans', 'makes', 'escapes', 'pairs', 'invokes', 'disputes',
  'describes', 'splits', 'underuses', 'addresses', 'fragments', 'rejects',
  'concludes', 'centers', 'imports', 'proposes', 'credits', 'tags', 'scores',
  'keeps', 'imagines', 'merges', 'allows', 'defers', 'asserting', 'shelves',
  'invents', 'blames', 'recommends', 'praises', 'declares', 'promises',
  'projects', 'schedules', 'anchors', 'forces', 'recasts', 'implies', 'infers',
  'reframes', 'hijacks', 'asks', 'starts', 'leads', 'emphasizes', 'cites',
  'compares', 'overgeneralized', 'reversed', 'collapsed', 'misread', 'conflated',
  'privately', 'declared', 'over-individualized', 'set', 'shortcut', 'bypassed',
  'sidelined', 'defaulted', 'inverted', 'assigned', 'exported', 'split',
  'located', 'explained', 'reframed', 'operationalized', 'delayed', 'dismissed',
  'avoided', 'forced', 'applied', 'invented', 'lowered', 'dropped', 'withheld',
  'relied', 'approved', 'deferred', 'pathologized', 'generalized', 'left',
  'substituted', 'stereotyped', 'pitted', 'restricted', 'having',
  'partial', 'names', 'reframes', 'rejects', 'restates', 'reduced',
]);

function lowercaseFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function classifyAndReframe(value: string): { result: string; rule: string } {
  const v = value.trim();

  // Already compliant
  if (!v) return { result: v, rule: 'skip_empty' };
  if (v === 'UNUSED') return { result: v, rule: 'skip_unused' };
  if (/^the student/i.test(v)) return { result: v, rule: 'skip_compliant' };

  // Rule 3: CORRECT placeholder
  if (/^CORRECT$/i.test(v)) return { result: '', rule: 'rule3' };

  // Identify first word
  const firstWord = v.split(/[\s,]/)[0].toLowerCase();

  if (ACTION_VERBS.has(firstWord)) {
    // Rule 1: verb-first
    return { result: 'The student ' + lowercaseFirst(v), rule: 'rule1' };
  } else {
    // Rule 2: noun/clause-first
    return { result: 'The student believed that ' + lowercaseFirst(v), rule: 'rule2' };
  }
}

describe('fixMisconceptionFraming: classifyAndReframe', () => {
  // ── Rule 1: Verb-first ────────────────────────────────────────────────────
  it('Rule 1: verb-first prepends "The student "', () => {
    const { result, rule } = classifyAndReframe('Frames FBA as a punishment tool');
    expect(rule).toBe('rule1');
    expect(result).toBe('The student frames FBA as a punishment tool');
  });

  it('Rule 1: lowercases the first letter of the original', () => {
    const { result } = classifyAndReframe('Confuses validity with reliability');
    expect(result).toBe('The student confuses validity with reliability');
  });

  // ── Rule 2: Noun/clause-first ─────────────────────────────────────────────
  it('Rule 2: noun-first prepends "The student believed that "', () => {
    const { result, rule } = classifyAndReframe('Transition planning must start in elementary school');
    expect(rule).toBe('rule2');
    expect(result).toBe('The student believed that transition planning must start in elementary school');
  });

  it('Rule 2: subordinate clause gets "believed that" prefix', () => {
    const { result, rule } = classifyAndReframe('All assessments require parental consent');
    expect(rule).toBe('rule2');
    expect(result).toBe('The student believed that all assessments require parental consent');
  });

  // ── Rule 3: CORRECT clearing ──────────────────────────────────────────────
  it('Rule 3: "CORRECT" clears to empty string', () => {
    const { result, rule } = classifyAndReframe('CORRECT');
    expect(rule).toBe('rule3');
    expect(result).toBe('');
  });

  it('Rule 3: case-insensitive CORRECT', () => {
    const { result, rule } = classifyAndReframe('correct');
    expect(rule).toBe('rule3');
    expect(result).toBe('');
  });

  // ── Skip: already compliant ───────────────────────────────────────────────
  it('skip: already starts with "The student"', () => {
    const { result, rule } = classifyAndReframe('The student believed that FBA is optional');
    expect(rule).toBe('skip_compliant');
    expect(result).toBe('The student believed that FBA is optional');
  });

  it('skip: case-insensitive "the student" detection', () => {
    const { result, rule } = classifyAndReframe('the student already knows this');
    expect(rule).toBe('skip_compliant');
    expect(result).toBe('the student already knows this');
  });

  // ── Skip: empty ───────────────────────────────────────────────────────────
  it('skip: empty string', () => {
    const { result, rule } = classifyAndReframe('');
    expect(rule).toBe('skip_empty');
    expect(result).toBe('');
  });

  // ── Skip: UNUSED ──────────────────────────────────────────────────────────
  it('skip: UNUSED stays as-is', () => {
    const { result, rule } = classifyAndReframe('UNUSED');
    expect(rule).toBe('skip_unused');
    expect(result).toBe('UNUSED');
  });
});
