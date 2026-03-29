import { describe, it, expect } from 'vitest';
import { parseClaudeResponse } from '../api/parseClaude';

describe('parseClaudeResponse', () => {
  // ── Valid JSON with all fields ───────────────────────────────────────────
  it('parses valid JSON with all fields correctly', () => {
    const raw = JSON.stringify({
      content: 'Here is your answer.',
      suggestedFollowUps: ['Quiz me', 'Explain more'],
      poseQuestion: { questionId: 'q1', skillId: 's1' },
      artifact: { type: 'vocabulary-list', payload: { terms: [] } },
    });

    const result = parseClaudeResponse(raw);
    expect(result.content).toBe('Here is your answer.');
    expect(result.suggestedFollowUps).toEqual(['Quiz me', 'Explain more']);
    expect(result.poseQuestion).toEqual({ questionId: 'q1', skillId: 's1' });
    expect(result.artifact?.type).toBe('vocabulary-list');
  });

  // ── JSON with content: null returns fallback content ─────────────────────
  it('returns empty string when content is null', () => {
    const raw = JSON.stringify({
      content: null,
      suggestedFollowUps: ['A', 'B'],
    });

    const result = parseClaudeResponse(raw);
    expect(result.content).toBe('');
    expect(result.suggestedFollowUps).toEqual(['A', 'B']);
  });

  // ── suggestedFollowUps as string (wrong type) normalizes to default ─────
  it('normalizes suggestedFollowUps to default when it is a string', () => {
    const raw = JSON.stringify({
      content: 'Hello',
      suggestedFollowUps: 'this is a string not an array',
    });

    const result = parseClaudeResponse(raw);
    expect(result.content).toBe('Hello');
    expect(Array.isArray(result.suggestedFollowUps)).toBe(true);
    expect(result.suggestedFollowUps.length).toBeGreaterThan(0);
  });

  // ── Completely malformed string returns safe fallback ────────────────────
  it('returns safe fallback for completely malformed input', () => {
    const raw = 'this is not json at all {{ broken }}';

    const result = parseClaudeResponse(raw);
    expect(result.content).toBe(raw.trim());
    expect(Array.isArray(result.suggestedFollowUps)).toBe(true);
    expect(result.suggestedFollowUps.length).toBeGreaterThan(0);
    expect(result.artifact).toBeUndefined();
    expect(result.poseQuestion).toBeUndefined();
  });

  // ── Artifact with unknown type is preserved (not stripped) ──────────────
  it('preserves artifact with unknown type using normalized form', () => {
    const raw = JSON.stringify({
      content: 'Here you go',
      artifact: { type: 'some_unknown_type', payload: { data: 'test' } },
    });

    const result = parseClaudeResponse(raw);
    expect(result.artifact).toBeDefined();
    expect(result.artifact?.type).toBe('some-unknown-type'); // underscores → hyphens
    expect(result.artifact?.payload).toEqual({ data: 'test' });
  });

  // ── study-activity wrapper is unwrapped correctly ───────────────────────
  it('unwraps study-activity wrapper to inner type', () => {
    const raw = JSON.stringify({
      content: 'Activity ready',
      artifact: {
        type: 'study_activity',
        payload: {
          activityType: 'vocabulary_list',
          terms: [{ term: 'FAPE', definition: 'Free Appropriate Public Education' }],
        },
      },
    });

    const result = parseClaudeResponse(raw);
    expect(result.artifact?.type).toBe('vocabulary-list');
    expect(result.artifact?.payload?.activityType).toBe('vocabulary_list');
    expect(result.artifact?.payload?.terms).toBeDefined();
  });

  // ── Canonical type normalization (underscore → hyphen) ──────────────────
  it('normalizes underscore artifact types to canonical hyphen form', () => {
    const cases: [string, string][] = [
      ['fill_in_blank', 'fill-in-blank'],
      ['matching_activity', 'matching-activity'],
      ['vocabulary_list', 'vocabulary-list'],
      ['practice_set', 'practice-set'],
      ['weak_areas_summary', 'weak-areas-summary'],
    ];

    for (const [input, expected] of cases) {
      const raw = JSON.stringify({
        content: 'test',
        artifact: { type: input, payload: {} },
      });
      const result = parseClaudeResponse(raw);
      expect(result.artifact?.type).toBe(expected);
    }
  });

  // ── Markdown-fenced JSON is extracted correctly ─────────────────────────
  it('strips markdown fences before parsing', () => {
    const raw = '```json\n{"content": "fenced response", "suggestedFollowUps": ["A"]}\n```';

    const result = parseClaudeResponse(raw);
    expect(result.content).toBe('fenced response');
  });

  // ── poseQuestion with missing fields is dropped ─────────────────────────
  it('drops poseQuestion when fields are missing', () => {
    const raw = JSON.stringify({
      content: 'test',
      poseQuestion: { questionId: 'q1' }, // missing skillId
    });

    const result = parseClaudeResponse(raw);
    expect(result.poseQuestion).toBeUndefined();
  });

  // ── artifact with non-object payload defaults to empty object ───────────
  it('defaults artifact payload to empty object when missing', () => {
    const raw = JSON.stringify({
      content: 'test',
      artifact: { type: 'practice-set' },
    });

    const result = parseClaudeResponse(raw);
    expect(result.artifact?.payload).toEqual({});
  });
});
