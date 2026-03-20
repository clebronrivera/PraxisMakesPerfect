export type ConfidenceLevel = 'low' | 'medium' | 'high';

// Keep stored values stable while allowing learner-facing wording to evolve.
export const CONFIDENCE_DISPLAY_ORDER: ConfidenceLevel[] = ['low', 'medium', 'high'];

export const CONFIDENCE_DISPLAY_LABELS: Record<ConfidenceLevel, string> = {
  low: 'Guess',
  medium: 'Unsure',
  high: 'Sure'
};

export function getConfidenceDisplayLabel(level: ConfidenceLevel): string {
  return CONFIDENCE_DISPLAY_LABELS[level];
}
