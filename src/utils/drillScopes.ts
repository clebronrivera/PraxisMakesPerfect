/**
 * drillScopes — builds the selectable scopes for the Vocabulary Fluency Drill.
 *
 * Pure utility. Given a user's skill scores it produces the scope list the setup
 * screen renders: "Weak areas" / "Sharpen" (derived from proficiency tiers),
 * "All terms", and one scope per content area (cluster). Each scope carries its
 * skill IDs and a live, drillable term count (from `vocabSkillIndex`).
 *
 * A scope is only offered if it has at least MIN_TERMS drillable terms (the quiz
 * generator needs ≥ 4 to build multiple-choice questions).
 */

import { skillMetadataV1 } from '../data/skill-metadata-v1';
import { CONTENT_CLUSTER_LABELS, type ContentCluster } from '../types/studyPlanTypes';
import { getSkillProficiency } from './skillProficiency';
import { termsForSkills, allDrillSkillIds } from './vocabSkillIndex';

export interface DrillScope {
  id: string;
  label: string;
  sublabel: string;
  skillIds: string[];
  termCount: number;
}

export interface SkillScoreLike {
  score: number;
  attempts: number;
  weightedAccuracy?: number;
}

/** Minimum drillable terms for a scope to be offered (MCQ needs ≥ 4). */
export const MIN_TERMS = 4;

export function buildDrillScopes(
  skillScores: Record<string, SkillScoreLike | undefined>,
): DrillScope[] {
  const drillSkills = allDrillSkillIds();

  const weak: string[] = [];
  const sharpen: string[] = [];
  for (const id of drillSkills) {
    const s = skillScores[id];
    const prof = getSkillProficiency(s?.score ?? 0, s?.attempts ?? 0, s?.weightedAccuracy);
    if (prof === 'emerging') weak.push(id);
    else if (prof === 'approaching') sharpen.push(id);
  }

  const primary: DrillScope[] = [];

  const weakCount = termsForSkills(weak).length;
  if (weakCount >= MIN_TERMS) {
    primary.push({
      id: 'weak',
      label: 'Weak areas',
      sublabel: 'Terms from your lowest-scoring skills',
      skillIds: weak,
      termCount: weakCount,
    });
  }

  const sharpenCount = termsForSkills(sharpen).length;
  if (sharpenCount >= MIN_TERMS) {
    primary.push({
      id: 'sharpen',
      label: 'Sharpen',
      sublabel: 'Almost-there skills (60–80%)',
      skillIds: sharpen,
      termCount: sharpenCount,
    });
  }

  primary.push({
    id: 'all',
    label: 'All terms',
    sublabel: 'Everything across every area',
    skillIds: drillSkills,
    termCount: termsForSkills(drillSkills).length,
  });

  // One scope per content area (cluster) that has enough terms.
  const byCluster = new Map<ContentCluster, string[]>();
  for (const meta of Object.values(skillMetadataV1)) {
    const arr = byCluster.get(meta.contentCluster) ?? [];
    arr.push(meta.skillId);
    byCluster.set(meta.contentCluster, arr);
  }

  const areas: DrillScope[] = [];
  for (const [cluster, ids] of byCluster) {
    const count = termsForSkills(ids).length;
    if (count >= MIN_TERMS) {
      areas.push({
        id: `area:${cluster}`,
        label: CONTENT_CLUSTER_LABELS[cluster],
        sublabel: 'Practice area',
        skillIds: ids,
        termCount: count,
      });
    }
  }
  areas.sort((a, b) => a.label.localeCompare(b.label));

  return [...primary, ...areas];
}
