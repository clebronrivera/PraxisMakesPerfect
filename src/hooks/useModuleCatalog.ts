// src/hooks/useModuleCatalog.ts
//
// React adapter: turns live profile + Learning-Path progress into the inputs the pure
// `buildModuleCatalog` selector needs, then memoizes the result. See
// docs/PLAN_2026-06-07_modules-redesign-react.md and src/utils/moduleCatalog.ts.
//
// KNOWN CAVEATS (tracked in the plan / handoff, not hidden):
//   • Per-module status is a per-SKILL proxy (lpProgress is per-skill; true per-module
//     completion needs section_interactions — plan §5). Reviewed = skill demonstrating/
//     mastered; in_progress = lesson viewed; new = untouched.
//   • examWeight = SKILL_BLUEPRINT slots — provisional, not blueprint-validated (plan §10).
//   • trend / flagged are lightweight derivations from skillScores, not the full preprocessor.

import { useMemo } from 'react';
import { LEARNING_MODULES, getSkillForModule } from '../data/learningModules';
import { prereqGraph } from '../data/skillPrereqGraph';
import { getSkillProficiency } from '../utils/skillProficiency';
import {
  buildModuleCatalog,
  DEFAULT_MODULE_PRIORITY_CONFIG,
  type ModuleCatalogEntry,
  type ModulePriorityConfig,
  type ModuleProgressSignal,
  type SkillSignal,
  type Trend,
} from '../utils/moduleCatalog';
import type { SkillAttempt } from '../brain/learning-state';
import type { UserProfile } from './useProgressTracking';
import type { LearningPathProgressMap } from './useLearningPathSupabase';

/** Lightweight trend from the bounded attempt history (mirrors the preprocessor's
 *  ±15pp / ≥6-attempt rule without pulling in the whole study-plan pipeline). */
function computeTrend(history?: SkillAttempt[]): Trend {
  const h = history ?? [];
  if (h.length < 6) return 'insufficient_data';
  const mid = Math.floor(h.length / 2);
  const rate = (arr: SkillAttempt[]) => arr.filter(a => a.correct).length / (arr.length || 1);
  const delta = rate(h.slice(mid)) - rate(h.slice(0, mid));
  if (delta >= 0.15) return 'improving';
  if (delta <= -0.15) return 'declining';
  return 'flat';
}

/** prereqs met = every prerequisite skill is at Demonstrating; returns the first
 *  unmet prereq for the "Do X first" unblocker (routing, not just scoring). */
function prereqState(skillId: string, profile: UserProfile): { met: boolean; blocking: string | null } {
  for (const prereqId of prereqGraph[skillId] ?? []) {
    const perf = profile.skillScores?.[prereqId];
    const prof = getSkillProficiency(perf?.score ?? 0, perf?.attempts ?? 0, perf?.weightedAccuracy);
    if (prof !== 'proficient') return { met: false, blocking: prereqId };
  }
  return { met: true, blocking: null };
}

export function useModuleCatalog(
  profile: UserProfile,
  lpProgress: LearningPathProgressMap,
  config: ModulePriorityConfig = DEFAULT_MODULE_PRIORITY_CONFIG,
): ModuleCatalogEntry[] {
  return useMemo(() => {
    const skillSignals: Record<string, SkillSignal> = {};
    const moduleProgress: Record<string, ModuleProgressSignal> = {};

    for (const module of LEARNING_MODULES) {
      const skillId = getSkillForModule(module.id);
      if (!skillId) continue;

      if (!skillSignals[skillId]) {
        const perf = profile.skillScores?.[skillId];
        const { met, blocking } = prereqState(skillId, profile);
        skillSignals[skillId] = {
          score: perf?.score ?? 0,
          attempts: perf?.attempts ?? 0,
          weightedAccuracy: perf?.weightedAccuracy,
          trend: computeTrend(perf?.attemptHistory),
          prereqsMet: met,
          blockingPrereqSkillId: blocking,
          flagged: (perf?.recentHighConfidenceWrongCount ?? 0) > 0,
        };
      }

      // Per-skill → per-module status proxy (see caveat above).
      const lp = lpProgress[skillId];
      const reviewed = !!lp && (lp.status === 'mastered' || lp.status === 'demonstrating');
      moduleProgress[module.id] = {
        visited: lp?.lessonViewed ?? false,
        sectionsTotal: 1,
        sectionsSeen: reviewed ? 1 : 0,
        interactivesTotal: 1,
        interactivesDone: reviewed ? 1 : 0,
      };
    }

    return buildModuleCatalog({ modules: LEARNING_MODULES, skillSignals, moduleProgress, config });
  }, [profile, lpProgress, config]);
}
