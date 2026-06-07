import { describe, it, expect } from 'vitest';
import {
  buildModuleCatalog,
  selectPriorityModules,
  recommendedProgress,
  examWeightForSkill,
  gapToThreshold,
  learnability,
  DEFAULT_MODULE_PRIORITY_CONFIG,
  type SkillSignal,
  type ModulePriorityConfig,
} from '../src/utils/moduleCatalog';
import { LEARNING_MODULES, getSkillForModule } from '../src/data/learningModules';
import { SKILL_BLUEPRINT } from '../src/utils/assessment-builder';

// Use a real module so getSkillForModule resolves to a real skill in SKILL_BLUEPRINT.
const MOD = LEARNING_MODULES.find(m => m.id === 'MOD-D2-01')!;
const SKILL = getSkillForModule('MOD-D2-01')!; // 'CON-01'
const cfg = DEFAULT_MODULE_PRIORITY_CONFIG;

function sig(over: Partial<SkillSignal> = {}): SkillSignal {
  return { score: 0.5, attempts: 10, trend: 'flat', prereqsMet: true, ...over };
}

describe('moduleCatalog — INVARIANT 1: gap enters priorityScore in exactly one term', () => {
  it('examWeight is independent of score', () => {
    // examWeightForSkill takes no score — structurally cannot depend on it.
    expect(examWeightForSkill(SKILL)).toBe(examWeightForSkill(SKILL));
  });

  it('learnability is independent of score (only trend + prereqs)', () => {
    expect(learnability(sig({ score: 0.4 }))).toBe(learnability(sig({ score: 0.6 })));
  });

  it('only gapToThreshold changes with score; priorityScore = examWeight × gap × learnability', () => {
    const low = buildModuleCatalog({ modules: [MOD], skillSignals: { [SKILL]: sig({ score: 0.4 }) } })[0];
    const high = buildModuleCatalog({ modules: [MOD], skillSignals: { [SKILL]: sig({ score: 0.6 }) } })[0];
    expect(low.examWeight).toBe(high.examWeight);
    expect(low.learnability).toBe(high.learnability);
    expect(low.gapToThreshold).toBeCloseTo(0.4, 6);
    expect(high.gapToThreshold).toBeCloseTo(0.2, 6);
    expect(low.priorityScore).toBeCloseTo(low.examWeight * low.gapToThreshold * low.learnability, 6);
    expect(high.priorityScore).toBeCloseTo(high.examWeight * high.gapToThreshold * high.learnability, 6);
  });
});

describe('moduleCatalog — INVARIANT 2: learnability composite is clamped', () => {
  it('clamps the product below to learnabilityMin', () => {
    const tiny: ModulePriorityConfig = { ...cfg, trendDecliningFactor: 0.1, unmetPrereqFactor: 0.1 };
    // raw 0.1 × 0.1 = 0.01 → clamped to 0.2
    expect(learnability(sig({ trend: 'declining', prereqsMet: false }), tiny)).toBe(tiny.learnabilityMin);
  });

  it('clamps the product above to learnabilityMax', () => {
    const big: ModulePriorityConfig = { ...cfg, trendImprovingFactor: 5 };
    // raw 5 × 1 = 5 → clamped to 1.2
    expect(learnability(sig({ trend: 'improving', prereqsMet: true }), big)).toBe(big.learnabilityMax);
  });

  it('default extremes stay within [0.2, 1.2]', () => {
    const worst = learnability(sig({ trend: 'declining', prereqsMet: false }));
    expect(worst).toBeGreaterThanOrEqual(cfg.learnabilityMin);
    expect(worst).toBeLessThanOrEqual(cfg.learnabilityMax);
  });
});

describe('moduleCatalog — INVARIANT 3: examWeight === SKILL_BLUEPRINT slots (provisional)', () => {
  it('uses slots for a known skill', () => {
    const entry = buildModuleCatalog({ modules: [MOD], skillSignals: { [SKILL]: sig() } })[0];
    expect(entry.examWeight).toBe(SKILL_BLUEPRINT[SKILL]!.slots);
  });

  it('falls back to defaultExamWeight for an unknown skill', () => {
    expect(examWeightForSkill('ZZZ-99')).toBe(cfg.defaultExamWeight);
  });
});

describe('moduleCatalog — INVARIANT 4: tuning constants are externalized', () => {
  it('changing unmetPrereqFactor changes learnability', () => {
    const a = learnability(sig({ prereqsMet: false }), { ...cfg, unmetPrereqFactor: 0.6 });
    const b = learnability(sig({ prereqsMet: false }), { ...cfg, unmetPrereqFactor: 0.3 });
    expect(a).not.toBe(b);
    expect(b).toBeCloseTo(0.3, 6);
  });
});

describe('moduleCatalog — behavior', () => {
  it('mastered skill (≥80%) is ineligible with priorityScore 0', () => {
    const e = buildModuleCatalog({ modules: [MOD], skillSignals: { [SKILL]: sig({ score: 0.9 }) } })[0];
    expect(e.mastered).toBe(true);
    expect(e.eligible).toBe(false);
    expect(e.priorityScore).toBe(0);
  });

  it('derives status from module progress', () => {
    const mk = (mp: object) =>
      buildModuleCatalog({ modules: [MOD], skillSignals: { [SKILL]: sig() }, moduleProgress: { [MOD.id]: mp } })[0].status;
    expect(mk({ visited: false })).toBe('new');
    expect(mk({ visited: true, sectionsTotal: 4, sectionsSeen: 2, interactivesTotal: 1, interactivesDone: 0 })).toBe('in_progress');
    expect(mk({ visited: true, sectionsTotal: 4, sectionsSeen: 4, interactivesTotal: 1, interactivesDone: 1 })).toBe('reviewed');
  });

  it('selectPriorityModules is unpadded — returns min(priorityCount, eligible count)', () => {
    // one eligible module → exactly one priority item, not 3
    const one = buildModuleCatalog({ modules: [MOD], skillSignals: { [SKILL]: sig({ score: 0.5 }) } });
    expect(selectPriorityModules(one)).toHaveLength(1);
    // a mastered-only catalog → zero priority items
    const none = buildModuleCatalog({ modules: [MOD], skillSignals: { [SKILL]: sig({ score: 0.95 }) } });
    expect(selectPriorityModules(none)).toHaveLength(0);
  });

  it('recommendedProgress counts reviewed within the eligible bucket only', () => {
    const entries = buildModuleCatalog({
      modules: [MOD],
      skillSignals: { [SKILL]: sig({ score: 0.5 }) },
      moduleProgress: { [MOD.id]: { visited: true, sectionsTotal: 4, sectionsSeen: 4, interactivesTotal: 1, interactivesDone: 1 } },
    });
    expect(recommendedProgress(entries)).toEqual({ reviewed: 1, total: 1, pct: 100 });
  });

  it('surfaces an unblocker module when prereqs are unmet (routing, not just scoring)', () => {
    const e = buildModuleCatalog({
      modules: [MOD],
      skillSignals: { [SKILL]: sig({ prereqsMet: false, blockingPrereqSkillId: 'DBD-01' }) },
    })[0];
    // DBD-01 has modules in SKILL_MODULE_MAP, so an unblocker target should resolve.
    expect(e.blockedByModuleId).toBeTruthy();
  });

  it('gapToThreshold never negative', () => {
    expect(gapToThreshold(0.95)).toBe(0);
  });
});
