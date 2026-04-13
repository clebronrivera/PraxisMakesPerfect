// src/utils/distractorPatterns.ts
// Normalises distractor pattern data that may arrive as either an array or a
// keyed object (legacy shape from earlier DB schema).  Used by PracticeSession
// and ExplanationPanel before handing patterns to DiagnosticFeedback.

export interface DistractorPatternLike {
  id?: string;
  description?: string;
}

export function normalizeDistractorPatterns(
  distractorPatterns?: Record<string, DistractorPatternLike> | DistractorPatternLike[]
): DistractorPatternLike[] {
  if (Array.isArray(distractorPatterns)) {
    return distractorPatterns.filter(Boolean);
  }

  if (!distractorPatterns || typeof distractorPatterns !== 'object') {
    return [];
  }

  return Object.entries(distractorPatterns).map(([id, pattern]) => ({
    id,
    ...(pattern && typeof pattern === 'object' ? pattern : {})
  }));
}
