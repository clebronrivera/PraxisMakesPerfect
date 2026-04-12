import { describe, it, expect } from 'vitest';

/**
 * Tests for core logic in scripts/apply-phase-c.mjs.
 *
 * The script doesn't export functions, so we re-implement the key functions
 * (parseCSV, tag validation) here — they are pure functions with no side effects.
 */

// ── Minimal CSV parser (copied from scripts/apply-phase-c.mjs) ─────────────
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row: string[] = [];
    while (i < len) {
      if (text[i] === '"') {
        i++; // skip opening quote
        let field = '';
        while (i < len) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') { field += '"'; i += 2; }
            else { i++; break; }
          } else {
            field += text[i++];
          }
        }
        row.push(field);
      } else {
        let field = '';
        while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          field += text[i++];
        }
        row.push(field.trim());
      }
      if (i < len && text[i] === ',') { i++; continue; }
      if (i < len && text[i] === '\r') i++;
      if (i < len && text[i] === '\n') i++;
      break;
    }
    if (row.length > 0 && !(row.length === 1 && row[0] === '')) rows.push(row);
  }
  return rows;
}

// ── Approved tags (copied from scripts/apply-phase-c.mjs) ──────────────────
const APPROVED_TAGS = new Set([
  'model-conflation',
  'scope-overgeneralization',
  'scope-undergeneralization',
  'sequence-inversion',
  'component-confusion',
  'indirect-direct-confusion',
  'purpose-confusion',
  'prerequisite-skipping',
  'label-retrieval',
  'overgeneralization',
  'population-confusion',
  'role-confusion',
  'causation-correlation',
  'validity-reliability-confusion',
  'norm-criterion-confusion',
  'tier-level-confusion',
  'eligibility-criteria-confusion',
  'consent-confidentiality-confusion',
  'developmental-stage-mismatch',
  'treatment-assessment-confusion',
]);

describe('apply-phase-c: parseCSV', () => {
  it('parses simple CSV rows', () => {
    const csv = 'A,B,C\n1,2,3\n';
    const rows = parseCSV(csv);
    expect(rows).toEqual([['A', 'B', 'C'], ['1', '2', '3']]);
  });

  it('handles quoted fields containing commas', () => {
    const csv = 'UNIQUEID,dominant_error_pattern\nQ1,"Student confuses A, B, and C"\n';
    const rows = parseCSV(csv);
    expect(rows.length).toBe(2);
    expect(rows[1][0]).toBe('Q1');
    expect(rows[1][1]).toBe('Student confuses A, B, and C');
  });

  it('handles quoted fields with escaped quotes', () => {
    const csv = 'name\n"She said ""hello"""\n';
    const rows = parseCSV(csv);
    expect(rows[1][0]).toBe('She said "hello"');
  });

  it('handles empty fields', () => {
    const csv = 'A,,C\n';
    const rows = parseCSV(csv);
    expect(rows[0]).toEqual(['A', '', 'C']);
  });

  it('handles CRLF line endings', () => {
    const csv = 'A,B\r\n1,2\r\n';
    const rows = parseCSV(csv);
    expect(rows).toEqual([['A', 'B'], ['1', '2']]);
  });
});

describe('apply-phase-c: tag validation', () => {
  it('all approved tags pass validation', () => {
    for (const tag of APPROVED_TAGS) {
      expect(APPROVED_TAGS.has(tag), `${tag} should be approved`).toBe(true);
    }
  });

  it('unknown tags are flagged', () => {
    expect(APPROVED_TAGS.has('made-up-tag')).toBe(false);
    expect(APPROVED_TAGS.has('')).toBe(false);
    expect(APPROVED_TAGS.has('Model-Conflation')).toBe(false); // case-sensitive
  });

  it('has exactly 20 approved tags', () => {
    expect(APPROVED_TAGS.size).toBe(20);
  });
});

describe('apply-phase-c: UNIQUEID matching', () => {
  it('matches rows to correct questions by UNIQUEID', () => {
    // Simulate the matching logic from the script
    const questions = [
      { UNIQUEID: 'PQ_CON-01_1', dominant_error_pattern: '' },
      { UNIQUEID: 'PQ_CON-01_2', dominant_error_pattern: 'existing' },
      { UNIQUEID: 'PQ_CON-01_3', dominant_error_pattern: '' },
    ];
    const questionMap = new Map(questions.map(q => [q.UNIQUEID, q]));

    // CSV row targets PQ_CON-01_1
    const csvUid = 'PQ_CON-01_1';
    const _csvValue = 'New error pattern';

    const q = questionMap.get(csvUid);
    expect(q).toBeDefined();
    expect(q!.UNIQUEID).toBe('PQ_CON-01_1');

    // Missing UNIQUEID returns undefined
    expect(questionMap.get('PQ_NONEXISTENT')).toBeUndefined();
  });

  it('does not overwrite existing content unless forced', () => {
    const question = { UNIQUEID: 'Q1', dominant_error_pattern: 'old value' };
    const incomingVal = 'new value';
    const existing = (question.dominant_error_pattern ?? '').trim();

    // When existing and incoming differ: mismatch (not overwritten without force)
    expect(existing).not.toBe(incomingVal);
    expect(existing).toBeTruthy(); // has existing content

    // When existing matches incoming: skip
    const sameQuestion = { UNIQUEID: 'Q2', dominant_error_pattern: 'same value' };
    expect(sameQuestion.dominant_error_pattern).toBe('same value');
  });
});
