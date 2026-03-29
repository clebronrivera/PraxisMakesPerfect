// src/utils/skillProficiency.ts
// Defines the three-tier skill proficiency system used across all UI surfaces.
//
// ── Thresholds ───────────────────────────────────────────────────────────────
//   Demonstrating ≥ 80% accuracy — meeting the threshold with consistent application
//   Approaching  60–79%          — nearing the threshold with room to strengthen
//   Emerging     < 60%           — foundational remediation is still needed
//   Unstarted    0 attempts      — no data yet
// ─────────────────────────────────────────────────────────────────────────────

export type SkillProficiencyLevel = 'proficient' | 'approaching' | 'emerging' | 'unstarted';
export const DEMONSTRATING_THRESHOLD = 0.8;
export const APPROACHING_THRESHOLD = 0.6;

/**
 * Return the proficiency tier from a skill's accuracy score and attempt count.
 * When weightedAccuracy is provided (real confidence-weighted data), it takes
 * precedence over the raw score. Falls back to raw score for legacy data.
 */
export function getSkillProficiency(
  score: number,
  attempts: number,
  weightedAccuracy?: number,
): SkillProficiencyLevel {
  if (attempts === 0) return 'unstarted';
  const effective = weightedAccuracy ?? score;
  if (effective >= DEMONSTRATING_THRESHOLD) return 'proficient';
  if (effective >= APPROACHING_THRESHOLD) return 'approaching';
  return 'emerging';
}

export interface ProficiencyMeta {
  label: string;
  description: string; // shown in hover / helper text
  textCss: string;     // Tailwind text colour class
  badgeCss: string;    // Tailwind bg + text for pill badges
  barCss: string;      // Tailwind bg for progress bars
}

export const PROFICIENCY_META: Record<SkillProficiencyLevel, ProficiencyMeta> = {
  proficient: {
    label: 'Demonstrating',
    description: 'Meeting the threshold and applying foundational knowledge consistently in practice.',
    textCss: 'text-emerald-400',
    badgeCss: 'bg-emerald-500/15 text-emerald-300',
    barCss: 'bg-emerald-400',
  },
  approaching: {
    label: 'Approaching',
    description: 'Near the threshold, with opportunities to strengthen foundational knowledge and apply it more consistently.',
    textCss: 'text-amber-400',
    badgeCss: 'bg-amber-500/15 text-amber-300',
    barCss: 'bg-amber-400',
  },
  emerging: {
    label: 'Emerging',
    description: 'Foundational gaps are still getting in the way, so targeted remediation is needed before performance is consistent.',
    textCss: 'text-rose-400',
    badgeCss: 'bg-rose-500/15 text-rose-300',
    barCss: 'bg-rose-400',
  },
  unstarted: {
    label: 'Not started',
    description: 'No practice data recorded yet',
    textCss: 'text-slate-600',
    badgeCss: 'bg-slate-700/40 text-slate-500',
    barCss: 'bg-slate-700',
  },
};
