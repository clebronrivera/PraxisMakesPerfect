import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import questions from '../src/data/questions.json';

// Approved error_cluster_tag values from content-authoring/TAG_GLOSSARY.md
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

const MISCONCEPTION_FIELDS = [
  'distractor_misconception_A',
  'distractor_misconception_B',
  'distractor_misconception_C',
  'distractor_misconception_D',
] as const;

describe('questions.json schema validation', () => {
  it('every question has a non-empty UNIQUEID', () => {
    for (const q of questions) {
      expect(q.UNIQUEID, `Question missing UNIQUEID`).toBeTruthy();
      expect(typeof q.UNIQUEID).toBe('string');
    }
  });

  it('every question has a non-empty current_skill_id', () => {
    for (const q of questions) {
      expect(
        q.current_skill_id,
        `Question ${q.UNIQUEID} missing current_skill_id`,
      ).toBeTruthy();
      expect(typeof q.current_skill_id).toBe('string');
    }
  });

  it('if error_cluster_tag is set, dominant_error_pattern is also set', () => {
    for (const q of questions) {
      const tag = (q as any).error_cluster_tag ?? '';
      if (tag) {
        const dep = (q as any).dominant_error_pattern ?? '';
        expect(
          dep,
          `Question ${q.UNIQUEID} has error_cluster_tag="${tag}" but no dominant_error_pattern`,
        ).toBeTruthy();
      }
    }
  });

  it('no distractor_misconception field contains literal "UNUSED"', () => {
    const violations: string[] = [];
    for (const q of questions) {
      for (const field of MISCONCEPTION_FIELDS) {
        const val = (q as any)[field] ?? '';
        if (val === 'UNUSED') {
          violations.push(`${q.UNIQUEID}.${field}`);
        }
      }
    }
    expect(violations, `Found "UNUSED" in: ${violations.join(', ')}`).toHaveLength(0);
  });

  it('no distractor_misconception field contains "believed that students believed" (double nesting)', () => {
    const violations: string[] = [];
    for (const q of questions) {
      for (const field of MISCONCEPTION_FIELDS) {
        const val: string = (q as any)[field] ?? '';
        if (val.includes('believed that students believed')) {
          violations.push(`${q.UNIQUEID}.${field}`);
        }
      }
    }
    expect(violations, `Double nesting in: ${violations.join(', ')}`).toHaveLength(0);
  });

  it('all error_cluster_tag values are from the approved list', () => {
    const unknownTags: string[] = [];
    for (const q of questions) {
      const tag = ((q as any).error_cluster_tag ?? '').trim();
      if (tag && !APPROVED_TAGS.has(tag)) {
        unknownTags.push(`${q.UNIQUEID}: "${tag}"`);
      }
    }
    expect(
      unknownTags,
      `Unknown tags found:\n${unknownTags.join('\n')}`,
    ).toHaveLength(0);
  });
});

// ─── Zod schema validation (added 2026-04-08) ───────────────────────────────
//
// Targets the drift fields documented in docs/ISSUE_LEDGER.md:
//   • Phase A: 47 questions with generic "Student may have confused…" framing
//     instead of the required "Student believed…" first-person belief format
//   • Phase A: 3 questions with duplicate distractor_misconception text within
//     a single question
//   • Phase B: 29 collapsed-template skills where construct_actually_tested
//     and complexity_rationale lost variety
//
// Failures here are not new bugs introduced by this walkthrough — they
// pre-date Phase C and reflect known content-authoring quality issues.
// They are surfaced loudly so the bank can be cleaned in a focused pass.

const COGNITIVE_COMPLEXITY = z
  .union([z.literal('Recall'), z.literal('Application'), z.literal('').optional()])
  .optional();

const NON_FRAMING_VIOLATING = z
  .string()
  .refine(
    (s) => s === '' || s === 'UNUSED' || !/^Student\s+may\s+have\s+confused\b/i.test(s.trim()),
    {
      message:
        'distractor_misconception must use first-person belief framing ' +
        '("Student believed…"), not generic "Student may have confused…"',
    },
  );

const QuestionDriftSchema = z.object({
  UNIQUEID: z.string().min(1),
  cognitive_complexity: COGNITIVE_COMPLEXITY,
  construct_actually_tested: z
    .union([z.string(), z.undefined()])
    .optional()
    .refine((v) => v === undefined || v === '' || v.length >= 10, {
      message: 'construct_actually_tested must be empty or ≥ 10 chars (collapsed templates)',
    }),
  complexity_rationale: z
    .union([z.string(), z.undefined()])
    .optional()
    .refine((v) => v === undefined || v === '' || v.length >= 10, {
      message: 'complexity_rationale must be empty or ≥ 10 chars (collapsed templates)',
    }),
  distractor_misconception_A: NON_FRAMING_VIOLATING.optional(),
  distractor_misconception_B: NON_FRAMING_VIOLATING.optional(),
  distractor_misconception_C: NON_FRAMING_VIOLATING.optional(),
  distractor_misconception_D: NON_FRAMING_VIOLATING.optional(),
});

describe('questions.json — drift field validation (Zod)', () => {
  it('every question parses against QuestionDriftSchema', () => {
    const failures: string[] = [];
    for (const q of questions as any[]) {
      const result = QuestionDriftSchema.safeParse(q);
      if (!result.success) {
        const issues = result.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join(' | ');
        failures.push(`${q.UNIQUEID}: ${issues}`);
      }
    }
    if (failures.length > 0) {
      console.warn(
        `[questionsJsonSchema] ${failures.length} questions failed drift validation:`,
      );
      failures.slice(0, 20).forEach((f) => console.warn('  ' + f));
      if (failures.length > 20) console.warn(`  …and ${failures.length - 20} more`);
    }
    expect(
      failures,
      `${failures.length} questions failed drift validation. ` +
        `See console output for details. These pre-date the 2026-04-08 walkthrough.`,
    ).toHaveLength(0);
  });

  it('no question has duplicate distractor_misconception text within itself', () => {
    const violations: Array<{ id: string; dupes: string }> = [];
    for (const q of questions as any[]) {
      const fields = ['A', 'B', 'C', 'D']
        .map((letter) => ({
          letter,
          text: (q[`distractor_misconception_${letter}`] ?? '').trim(),
        }))
        .filter((f) => f.text.length > 0 && f.text !== 'UNUSED');
      const seen = new Map<string, string[]>();
      for (const { letter, text } of fields) {
        const arr = seen.get(text) ?? [];
        arr.push(letter);
        seen.set(text, arr);
      }
      for (const [text, letters] of seen.entries()) {
        if (letters.length > 1) {
          violations.push({
            id: q.UNIQUEID,
            dupes: `${letters.join('+')} share: "${text.slice(0, 60)}…"`,
          });
        }
      }
    }
    if (violations.length > 0) {
      console.warn('[questionsJsonSchema] Duplicate distractor misconceptions:');
      violations.slice(0, 10).forEach((v) => console.warn(`  ${v.id} ${v.dupes}`));
    }
    expect(
      violations,
      `${violations.length} questions have duplicate distractor_misconception text within themselves`,
    ).toHaveLength(0);
  });
});
