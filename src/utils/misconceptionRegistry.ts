// src/utils/misconceptionRegistry.ts
// Accessor functions for querying misconceptions by various criteria.

import {
  MisconceptionEntry,
  MisconceptionFamily,
  MisconceptionId,
  PatternId,
} from '../types/misconception';
import { MISCONCEPTION_TAXONOMY } from '../data/misconception-taxonomy';

/**
 * Retrieve a misconception by its unique identifier.
 */
export function getMisconceptionById(
  id: MisconceptionId
): MisconceptionEntry | undefined {
  return MISCONCEPTION_TAXONOMY.find(entry => entry.id === id);
}

/**
 * Retrieve all misconceptions associated with a given skill.
 */
export function getMisconceptionsBySkill(
  skillId: string
): MisconceptionEntry[] {
  return MISCONCEPTION_TAXONOMY.filter(entry => entry.skillId === skillId);
}

/**
 * Retrieve all misconceptions in a given family.
 */
export function getMisconceptionsByFamily(
  family: MisconceptionFamily
): MisconceptionEntry[] {
  return MISCONCEPTION_TAXONOMY.filter(entry => entry.family === family);
}

/**
 * Retrieve all misconceptions that use a given distractor pattern.
 */
export function getMisconceptionsByPatternId(
  patternId: PatternId
): MisconceptionEntry[] {
  return MISCONCEPTION_TAXONOMY.filter(entry =>
    entry.relatedPatternIds.includes(patternId)
  );
}
