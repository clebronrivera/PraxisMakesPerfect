// src/utils/focusItemExtractor.ts
//
// Pure function: extracts focus items (vocabulary, misconceptions, traps) from
// a StudyPlanDocumentV2 filtered to a specific skill/domain.
//
// Used by useFocusItems hook in the Study Center sidebar.

import type { StudyPlanDocumentV2 } from '../types/studyPlanTypes';
import { getProgressSkillDefinition } from './progressTaxonomy';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FocusItem {
  /** Stable ID = hash of type + key text */
  id: string;
  type: 'vocabulary' | 'misconception' | 'trap';
  /** Primary display text */
  text: string;
  /** Extra detail — e.g., VocabEntry.plainDefinition */
  detail?: string;
  /** Secondary context — e.g., "why it matters" or "where it shows up" */
  context?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stableId(type: string, key: string): string {
  // Simple hash — keeps IDs deterministic so Supabase checks stay consistent
  let h = 0;
  const s = `${type}::${key}`;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return `fi-${type[0]}-${Math.abs(h).toString(36)}`;
}

function getDomainIdForSkill(skillId: string): number | null {
  const def = getProgressSkillDefinition(skillId);
  return def?.domainId ?? null;
}

// ─── Main extractor ───────────────────────────────────────────────────────────

export function extractFocusItems(
  plan: StudyPlanDocumentV2,
  skillId: string
): FocusItem[] {
  const items: FocusItem[] = [];
  const seen = new Set<string>();

  const domainId = getDomainIdForSkill(skillId);

  // ── 1. Vocabulary from study plan ──
  // Pull from domainStudyMaps.keyVocabulary for this skill's domain,
  // then cross-reference with plan.vocabulary for definitions.
  const domainMap = domainId != null
    ? plan.domainStudyMaps?.find(d => d.domainId === domainId)
    : null;

  const domainVocab = new Set(domainMap?.keyVocabulary ?? []);

  // Also find the cluster this skill belongs to
  const skillCluster = plan.priorityClusters?.find(
    c => c.skills?.some(s => s.skillId === skillId)
  );

  if (plan.vocabulary) {
    for (const v of plan.vocabulary) {
      // Include if term is in this domain's key vocabulary, or if it appears
      // in whereItShowsUp matching the domain name
      const domainName = domainMap?.domainName?.toLowerCase() ?? '';
      const inDomain = domainVocab.has(v.term) ||
        (domainName && v.whereItShowsUp?.toLowerCase().includes(domainName));

      if (inDomain && !seen.has(v.term)) {
        seen.add(v.term);
        items.push({
          id: stableId('vocabulary', v.term),
          type: 'vocabulary',
          text: v.term,
          detail: v.plainDefinition,
          context: v.confusionRisk ?? v.whyItMatters,
        });
      }
    }
  }

  // Also add key vocabulary terms that don't have full VocabEntry definitions
  if (domainMap?.keyVocabulary) {
    for (const term of domainMap.keyVocabulary) {
      if (!seen.has(term)) {
        seen.add(term);
        items.push({
          id: stableId('vocabulary', term),
          type: 'vocabulary',
          text: term,
        });
      }
    }
  }

  // ── 2. Misconceptions from the skill's cluster ──
  // PriorityCluster doesn't have a retrievedMisconceptions field at the document
  // level (it's pre-computed data consumed by the AI prompt). Instead, pull from
  // casePatterns.commonMistake for patterns related to this domain.
  if (plan.casePatterns) {
    const domainName = domainMap?.domainName?.toLowerCase() ?? '';
    for (const pattern of plan.casePatterns) {
      if (pattern.commonMistake && !seen.has(pattern.commonMistake)) {
        const relatedToDomain = domainName &&
          pattern.domainContext?.toLowerCase().includes(domainName);
        if (relatedToDomain) {
          seen.add(pattern.commonMistake);
          items.push({
            id: stableId('misconception', pattern.commonMistake),
            type: 'misconception',
            text: pattern.commonMistake,
            context: pattern.patternName,
          });
        }
      }
    }
  }

  // Also pull skill-level misconceptions from the cluster's blocking notes
  if (skillCluster?.blockingNote && !seen.has(skillCluster.blockingNote)) {
    seen.add(skillCluster.blockingNote);
    items.push({
      id: stableId('misconception', skillCluster.blockingNote),
      type: 'misconception',
      text: skillCluster.blockingNote,
      context: skillCluster.clusterName,
    });
  }

  // ── 3. Common traps from domainStudyMaps ──
  if (domainMap?.commonTraps) {
    for (const trap of domainMap.commonTraps) {
      if (!seen.has(trap)) {
        seen.add(trap);
        items.push({
          id: stableId('trap', trap),
          type: 'trap',
          text: trap,
        });
      }
    }
  }

  return items;
}
