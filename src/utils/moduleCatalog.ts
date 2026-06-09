// src/utils/moduleCatalog.ts
//
// Pure selector for the Modules redesign — see docs/PLAN_2026-06-07_modules-redesign-react.md.
// Turns static module data + per-skill / per-module signals into a ranked catalog that
// every view (Regular/Adaptive, by-domain/by-weakness, priority) reads from.
//
// LOAD-BEARING INVARIANTS (asserted in tests/moduleCatalog.test.ts — the review-held
// rules, made executable so a future change fails the suite rather than slipping past):
//   1. Gap/proficiency enters `priorityScore` via EXACTLY ONE term: `gapToThreshold`.
//      `examWeight` and `learnability` must be independent of `score`.
//   2. `learnability` is the CLAMPED composite [min,max] — it reorders within priority
//      clusters but can never overpower `examWeight × gap`.
//   3. `examWeight` is the blueprint-anchored weight from skillExamWeights.json (official
//      Praxis 5403 content-category weights ÷ skills-in-category, mean 1) — NOT slots.
//   4. All tuning constants live in `ModulePriorityConfig` — no inline magic numbers.

import { getSkillForModule, getPrimaryModuleForSkill, type LearningModule } from '../data/learningModules';
import { getSkillProficiency, type SkillProficiencyLevel } from './skillProficiency';
import skillExamWeights from '../data/skillExamWeights.json';
import { getProgressSkillDefinition, getProgressDomainDefinition } from './progressTaxonomy';

const SKILL_EXAM_WEIGHTS = (skillExamWeights as { skills: Record<string, { examWeight: number }> }).skills;

export const DEMONSTRATING_THRESHOLD = 0.8;

export interface ModulePriorityConfig {
  /** Mastery / eligibility threshold (proficiency at/above this is "mastered"). */
  threshold: number;
  /** learnability factor when the skill's trend is declining (< 1 = harder to move now). */
  trendDecliningFactor: number;
  /** learnability factor for non-declining trends. */
  trendImprovingFactor: number;
  /** learnability factor when prerequisites are unmet (< 1). */
  unmetPrereqFactor: number;
  /** Composite learnability clamp — keeps it from overpowering examWeight × gap. */
  learnabilityMin: number;
  learnabilityMax: number;
  /** Max items in "Close these first" (unpadded — see selectPriorityModules). */
  priorityCount: number;
  /** examWeight fallback when a skill is absent from SKILL_BLUEPRINT. */
  defaultExamWeight: number;
}

export const DEFAULT_MODULE_PRIORITY_CONFIG: ModulePriorityConfig = {
  threshold: 0.8,
  trendDecliningFactor: 0.8,
  trendImprovingFactor: 1.0,
  unmetPrereqFactor: 0.6,
  learnabilityMin: 0.2,
  learnabilityMax: 1.2,
  priorityCount: 3,
  defaultExamWeight: 1,
};

export type Trend = 'improving' | 'flat' | 'declining' | 'insufficient_data';

/** Per-skill dynamic signals (computed upstream from skillScores / preprocessor). */
export interface SkillSignal {
  score: number; // 0..1 accuracy
  attempts: number;
  weightedAccuracy?: number;
  trend?: Trend;
  prereqsMet?: boolean; // default true
  flagged?: boolean;
  blockingPrereqSkillId?: string | null; // for the "Do X first" unblocker (routing, not scoring)
}

/** Per-module engagement signals (derived from section_interactions / module visits). */
export interface ModuleProgressSignal {
  visited?: boolean;
  sectionsTotal?: number;
  sectionsSeen?: number;
  interactivesTotal?: number;
  interactivesDone?: number;
}

export type ModuleStatus = 'new' | 'in_progress' | 'reviewed';

export interface ModuleCatalogEntry {
  moduleId: string;
  title: string;
  skillId: string;
  domainId: number;
  domainName: string;
  proficiency: SkillProficiencyLevel;
  scorePct: number | null;
  mastered: boolean;
  eligible: boolean; // gate (= !mastered), NOT the recommendation
  flagged: boolean;
  status: ModuleStatus;
  examWeight: number; // blueprint-anchored (skillExamWeights.json), mean 1
  gapToThreshold: number; // the ONLY gap term
  learnability: number; // clamped composite
  priorityScore: number; // examWeight × gapToThreshold × learnability (0 if ineligible)
  estMinutes: number;
  activityCount: number;
  blockedByModuleId: string | null; // unblocker routing target when prereqs unmet
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/** examWeight = blueprint-anchored relative exam weight (src/data/skillExamWeights.json):
 *  the skill's official Praxis 5403 content-category weight (I 32% / II 23% / III 20% / IV 25%)
 *  divided equally among that category's skills, normalized to mean 1. Replaces the old
 *  SKILL_BLUEPRINT.slots proxy (slots = diagnostic question budget, not an exam weight). */
export function examWeightForSkill(skillId: string, cfg: ModulePriorityConfig = DEFAULT_MODULE_PRIORITY_CONFIG): number {
  return SKILL_EXAM_WEIGHTS[skillId]?.examWeight ?? cfg.defaultExamWeight;
}

/** The ONLY place gap/proficiency enters priorityScore. */
export function gapToThreshold(score: number, cfg: ModulePriorityConfig = DEFAULT_MODULE_PRIORITY_CONFIG): number {
  return Math.max(0, cfg.threshold - score);
}

/** Tractability ONLY — must not re-encode gap. Composite is clamped so it reorders
 *  within similar-priority clusters but never flips magnitude. */
export function learnability(signal: SkillSignal, cfg: ModulePriorityConfig = DEFAULT_MODULE_PRIORITY_CONFIG): number {
  const trendFactor = signal.trend === 'declining' ? cfg.trendDecliningFactor : cfg.trendImprovingFactor;
  const prereqFactor = signal.prereqsMet === false ? cfg.unmetPrereqFactor : 1;
  return clamp(trendFactor * prereqFactor, cfg.learnabilityMin, cfg.learnabilityMax);
}

function moduleStatus(p?: ModuleProgressSignal): ModuleStatus {
  if (!p || !p.visited) return 'new';
  const sectionsDone = (p.sectionsTotal ?? 0) > 0 ? (p.sectionsSeen ?? 0) >= (p.sectionsTotal ?? 0) : true;
  const interactivesDone = (p.interactivesTotal ?? 0) > 0 ? (p.interactivesDone ?? 0) >= (p.interactivesTotal ?? 0) : true;
  return sectionsDone && interactivesDone ? 'reviewed' : 'in_progress';
}

function activityCount(module: LearningModule): number {
  return module.sections.filter(s => s.type === 'interactive').length;
}

/** Rough estimate: ~0.75 min per read section + 1 min per interactive. */
function estMinutes(module: LearningModule): number {
  const interactives = activityCount(module);
  const reads = module.sections.length - interactives;
  return Math.max(1, Math.round(reads * 0.75 + interactives));
}

export interface BuildCatalogInputs {
  modules: LearningModule[];
  skillSignals: Record<string, SkillSignal>;
  moduleProgress?: Record<string, ModuleProgressSignal>;
  config?: ModulePriorityConfig;
}

export function buildModuleCatalog(inputs: BuildCatalogInputs): ModuleCatalogEntry[] {
  const cfg = inputs.config ?? DEFAULT_MODULE_PRIORITY_CONFIG;
  const out: ModuleCatalogEntry[] = [];
  for (const module of inputs.modules) {
    const skillId = getSkillForModule(module.id);
    if (!skillId) continue;
    const signal: SkillSignal = inputs.skillSignals[skillId] ?? { score: 0, attempts: 0 };

    const def = getProgressSkillDefinition(skillId);
    const domainId = def?.domainId ?? 0;
    const domainName = getProgressDomainDefinition(domainId)?.name ?? 'Unknown';

    const proficiency = getSkillProficiency(signal.score, signal.attempts, signal.weightedAccuracy);
    const mastered = proficiency === 'proficient';
    const eligible = !mastered;
    const scorePct = signal.attempts > 0 ? Math.round(signal.score * 100) : null;

    const ew = examWeightForSkill(skillId, cfg);
    const gap = gapToThreshold(signal.score, cfg);
    const learn = learnability(signal, cfg);
    const priorityScore = eligible ? ew * gap * learn : 0;

    const blockedByModuleId =
      signal.prereqsMet === false && signal.blockingPrereqSkillId
        ? (getPrimaryModuleForSkill(signal.blockingPrereqSkillId)?.id ?? null)
        : null;

    out.push({
      moduleId: module.id,
      title: module.title,
      skillId,
      domainId,
      domainName,
      proficiency,
      scorePct,
      mastered,
      eligible,
      flagged: signal.flagged ?? false,
      status: moduleStatus(inputs.moduleProgress?.[module.id]),
      examWeight: ew,
      gapToThreshold: gap,
      learnability: learn,
      priorityScore,
      estMinutes: estMinutes(module),
      activityCount: activityCount(module),
      blockedByModuleId,
    });
  }
  return out;
}

/** "Close these first": top `min(priorityCount, # genuinely-prioritized)` — UNPADDED,
 *  so a near-mastered student doesn't see filler. */
export function selectPriorityModules(
  entries: ModuleCatalogEntry[],
  cfg: ModulePriorityConfig = DEFAULT_MODULE_PRIORITY_CONFIG,
): ModuleCatalogEntry[] {
  return entries
    .filter(e => e.priorityScore > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, cfg.priorityCount);
}

/** Adaptive view: progress within the recommended (gap-closing / eligible) bucket. */
export function recommendedProgress(entries: ModuleCatalogEntry[]): { reviewed: number; total: number; pct: number } {
  const eligible = entries.filter(e => e.eligible);
  const reviewed = eligible.filter(e => e.status === 'reviewed').length;
  const total = eligible.length;
  return { reviewed, total, pct: total > 0 ? Math.round((reviewed / total) * 100) : 0 };
}
