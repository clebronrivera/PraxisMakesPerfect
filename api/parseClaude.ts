// api/parseClaude.ts
// Extracted parser for Claude tutor responses.
// Pure function — no HTTP, DB, or request-context dependencies.

import { z } from 'zod';
import type { ClaudeResponseShape } from '../src/types/tutorChat';

// ─── Canonical artifact type map ────────────────────────────────────────────

const CANONICAL_ARTIFACT_TYPES: Record<string, string> = {
  'fill_in_blank':       'fill-in-blank',
  'fill-in-blank':       'fill-in-blank',
  'matching_activity':   'matching-activity',
  'matching-activity':   'matching-activity',
  'vocabulary_list':     'vocabulary-list',
  'vocabulary-list':     'vocabulary-list',
  'practice_set':        'practice-set',
  'practice-set':        'practice-set',
  'weak_areas_summary':  'weak-areas-summary',
  'weak-areas-summary':  'weak-areas-summary',
};

// ─── Zod schemas for runtime validation ─────────────────────────────────────

const ArtifactSchema = z.object({
  type: z.string(),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});

const PoseQuestionSchema = z.object({
  questionId: z.string(),
  skillId: z.string(),
});

const ClaudeResponseSchema = z.object({
  content: z.union([z.string(), z.null()]).optional(),
  suggestedFollowUps: z.unknown().optional(),
  poseQuestion: z.unknown().optional(),
  artifact: z.unknown().optional(),
});

// ─── Default follow-ups ─────────────────────────────────────────────────────

const DEFAULT_FOLLOW_UPS = ['Quiz me', 'What are my weakest areas?', 'Explain a concept'];
const FALLBACK_FOLLOW_UPS = ['Tell me more', 'Quiz me', 'What should I focus on?'];

// ─── Artifact normalization ─────────────────────────────────────────────────

function normalizeArtifact(
  raw: unknown,
): { type: string; payload: Record<string, unknown> } | undefined {
  const parsed = ArtifactSchema.safeParse(raw);
  if (!parsed.success) return undefined;

  const { type, payload } = parsed.data;
  const normalizedType = String(type).toLowerCase().replace(/_/g, '-');

  // Unwrap "study-activity" wrapper where real type is nested
  if (normalizedType === 'study-activity' && payload?.activityType) {
    const inner = String(payload.activityType).toLowerCase().replace(/_/g, '-');
    return {
      type: CANONICAL_ARTIFACT_TYPES[inner] || inner,
      payload: payload,
    };
  }

  const canonical = CANONICAL_ARTIFACT_TYPES[normalizedType];
  return {
    type: canonical || normalizedType,
    payload: payload,
  };
}

// ─── Main parser ────────────────────────────────────────────────────────────

export function parseClaudeResponse(raw: string): ClaudeResponseShape {
  // Strip markdown fences if present
  let cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

  // Extract JSON object from surrounding text
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }

  try {
    const jsonParsed = JSON.parse(cleaned);

    // Validate shape with Zod
    const result = ClaudeResponseSchema.safeParse(jsonParsed);
    if (!result.success) {
      // Valid JSON but wrong shape — return content if string, else fallback
      return {
        content: typeof jsonParsed === 'string' ? jsonParsed : raw.trim(),
        suggestedFollowUps: FALLBACK_FOLLOW_UPS,
      };
    }

    const data = result.data;

    // Normalize content: null/undefined → empty string
    const content = typeof data.content === 'string' && data.content.length > 0
      ? data.content
      : '';

    // Normalize suggestedFollowUps: must be string[], else default
    const followUps =
      Array.isArray(data.suggestedFollowUps) &&
      data.suggestedFollowUps.length > 0 &&
      data.suggestedFollowUps.every((f: unknown) => typeof f === 'string')
        ? (data.suggestedFollowUps as string[])
        : DEFAULT_FOLLOW_UPS;

    // Normalize poseQuestion
    const poseQuestionResult = PoseQuestionSchema.safeParse(data.poseQuestion);
    const poseQuestion = poseQuestionResult.success ? poseQuestionResult.data : undefined;

    // Normalize artifact
    const artifact = data.artifact ? normalizeArtifact(data.artifact) : undefined;

    return { content, suggestedFollowUps: followUps, poseQuestion, artifact };
  } catch {
    // Not valid JSON — treat entire response as content
    return {
      content: raw.trim(),
      suggestedFollowUps: FALLBACK_FOLLOW_UPS,
    };
  }
}
