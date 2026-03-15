export interface DistractorPatternLike {
  id?: string;
  description?: string;
}

export function normalizeDistractorPatterns(
  distractorPatterns?: Record<string, any> | any[]
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
