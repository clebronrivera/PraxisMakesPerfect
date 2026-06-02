/**
 * vocabSkillIndex — shared term↔skill mapping for the Vocabulary Fluency Drill.
 *
 * Sources the term→skill relationship from `skill-metadata-v1.ts` (the authoritative
 * content layer the study guide already uses), intersected with the master glossary
 * so every count and scope only references DRILLABLE terms — i.e. terms that have a
 * real definition the quiz generator can build a question from. Using the metadata as
 * the source of truth (rather than `skill-vocabulary-map.json`) avoids drift between
 * the two mappings.
 *
 * Pure utility — no React, no side effects. Built once at module load.
 */

import { skillMetadataV1 } from '../data/skill-metadata-v1';
import glossaryData from '../data/master-glossary.json';

interface GlossaryEntry {
  term: string;
  definition: string;
}

/**
 * Drillable terms = glossary terms with a usable definition.
 * Mirrors the eligibility filter in `vocabQuizGenerator.ts` (definition.length > 10)
 * so scope counts match what the drill can actually generate.
 */
const DRILLABLE_TERMS = new Set<string>(
  (glossaryData as { terms: GlossaryEntry[] }).terms
    .filter((t) => t.definition && t.definition.length > 10)
    .map((t) => t.term.toLowerCase()),
);

/** skillId → its drillable vocabulary terms (original casing, de-duped within the skill). */
const skillToTerms = new Map<string, string[]>();
/** termLower → skillIds that list it as vocabulary. */
const termToSkills = new Map<string, string[]>();

for (const meta of Object.values(skillMetadataV1)) {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const term of meta.vocabulary) {
    const lower = term.toLowerCase();
    if (!DRILLABLE_TERMS.has(lower)) continue; // skip terms absent from the glossary
    if (!seen.has(lower)) {
      seen.add(lower);
      terms.push(term);
    }
    const owners = termToSkills.get(lower);
    if (owners) {
      if (!owners.includes(meta.skillId)) owners.push(meta.skillId);
    } else {
      termToSkills.set(lower, [meta.skillId]);
    }
  }
  skillToTerms.set(meta.skillId, terms);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Skill IDs that list `term` as vocabulary (case-insensitive). Empty if none. */
export function skillsForTerm(term: string): string[] {
  return termToSkills.get(term.toLowerCase()) ?? [];
}

/** Drillable vocabulary terms for a single skill (original casing). Empty if none. */
export function termsForSkill(skillId: string): string[] {
  return skillToTerms.get(skillId) ?? [];
}

/** Unique drillable terms across a set of skills (original casing, de-duped across skills). */
export function termsForSkills(skillIds: Iterable<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of skillIds) {
    for (const term of skillToTerms.get(id) ?? []) {
      const lower = term.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        out.push(term);
      }
    }
  }
  return out;
}

/** Live count of distinct drillable terms for a scope (a set of skill IDs). */
export function countTermsForScope(skillIds: Iterable<string>): number {
  return termsForSkills(skillIds).length;
}

/** All skill IDs that have at least one drillable term. */
export function allDrillSkillIds(): string[] {
  const out: string[] = [];
  for (const [id, terms] of skillToTerms) {
    if (terms.length > 0) out.push(id);
  }
  return out;
}

/** Every distinct drillable term across all skills (original casing). */
export const ALL_DRILL_TERMS: string[] = termsForSkills(
  Array.from(skillToTerms.keys()),
);
