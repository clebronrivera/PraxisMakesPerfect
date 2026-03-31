// src/utils/misconceptionRegistry.ts
// Accessor functions for querying misconceptions by various criteria.

import {
  MisconceptionEntry,
  MisconceptionFamily,
  MisconceptionId,
  PatternId,
} from '../types/misconception';
import { MISCONCEPTION_TAXONOMY } from '../data/misconception-taxonomy';
import { toMetadataId } from '../data/skillIdMap';

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
 * Retrieve all misconceptions for a progress skill ID (e.g., 'PSY-02').
 * Resolves through skillIdMap to the corresponding metadata skill ID,
 * then matches against the taxonomy (which uses metadata IDs).
 * Falls back to a direct match if the ID is already a metadata ID.
 */
export function getMisconceptionsByProgressSkill(
  progressSkillId: string
): MisconceptionEntry[] {
  const metaId = toMetadataId(progressSkillId);
  if (metaId) {
    return MISCONCEPTION_TAXONOMY.filter(entry => entry.skillId === metaId);
  }
  // Fallback: try direct match (caller may have passed a metadata ID)
  return getMisconceptionsBySkill(progressSkillId);
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

// ─── Text bridge ─────────────────────────────────────────────────────────────

// Pre-compute a normalized-text → entry index for O(1) lookups.
const _textIndex = new Map<string, MisconceptionEntry>();
for (const entry of MISCONCEPTION_TAXONOMY) {
  _textIndex.set(entry.text.toLowerCase().trim(), entry);
}

/**
 * Find a misconception entry by matching its free-text description.
 *
 * Since taxonomy entries were derived from skill-metadata-v1.ts
 * commonMisconceptions, exact-match resolution (case-insensitive)
 * works for all entries. Returns undefined if no match.
 */
export function findMisconceptionByText(
  text: string
): MisconceptionEntry | undefined {
  return _textIndex.get(text.toLowerCase().trim());
}
