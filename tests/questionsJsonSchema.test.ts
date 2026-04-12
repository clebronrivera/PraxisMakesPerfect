import { describe, it, expect } from 'vitest';
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
      const tag = q.error_cluster_tag ?? '';
      if (tag) {
        const dep = q.dominant_error_pattern ?? '';
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
        const val = q[field] ?? '';
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
        const val: string = q[field] ?? '';
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
      const tag = (q.error_cluster_tag ?? '').trim();
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
