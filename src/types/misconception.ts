// src/types/misconception.ts
// Types and constants for misconceptions and their relationships to distractor patterns.

// PatternId mirrors the 28 values declared in src/brain/distractor-patterns.ts.
// They are defined here because distractor-patterns.ts does not export PatternId.
// If distractor-patterns.ts ever exports PatternId, this definition should be removed
// and replaced with a re-export from that module.
export type PatternId =
  | 'premature-action'
  | 'role-confusion'
  | 'similar-concept'
  | 'data-ignorance'
  | 'extreme-language'
  | 'context-mismatch'
  | 'incomplete-response'
  | 'legal-overreach'
  | 'correlation-as-causation'
  | 'function-confusion'
  | 'case-confusion'
  | 'sequence-error'
  | 'function-mismatch'
  | 'model-confusion'
  | 'instruction-only'
  | 'adult-criteria'
  | 'inclusion-error'
  | 'optimal-education'
  | 'general-concerns'
  | 'investigation'
  | 'delay'
  | 'punishment-focus'
  | 'absolute-rules'
  | 'law-confusion'
  | 'no-access'
  | 'insufficient-hours'
  | 'full-release'
  | 'definition-error';

/**
 * Categories that organize misconceptions for pedagogical purposes.
 */
export type MisconceptionFamily =
  | 'assessment-tool-confusion'
  | 'professional-scope'
  | 'decision-sequence'
  | 'legal-ethical-boundary'
  | 'behavioral-science-reasoning'
  | 'conceptual-precision'
  | 'instructional-procedural'
  | 'context-specificity';

/**
 * Branded string type for misconception identifiers.
 * Ensures type safety when referencing specific misconceptions.
 */
export type MisconceptionId = string & { readonly __brand: 'MisconceptionId' };

/**
 * A misconception entry links a common student misunderstanding to:
 * - The skill it relates to
 * - The broader category it belongs to
 * - Which distractor patterns typically express it
 * - Which questions test understanding of it
 */
export interface MisconceptionEntry {
  id: MisconceptionId;
  skillId: string;
  text: string;
  family: MisconceptionFamily;
  relatedPatternIds: PatternId[];
  questionIds: string[];
}

/**
 * All valid misconception families, for validation and iteration.
 */
export const MISCONCEPTION_FAMILIES = [
  'assessment-tool-confusion',
  'professional-scope',
  'decision-sequence',
  'legal-ethical-boundary',
  'behavioral-science-reasoning',
  'conceptual-precision',
  'instructional-procedural',
  'context-specificity',
] as const;
