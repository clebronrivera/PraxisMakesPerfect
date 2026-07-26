// Static content for the PASS marketing landing page.
// Ported from public/mockup-pass-landing.html. Copy decisions (no fixed counts,
// no psychometric claims, qualitative time framing) are intentional — see
// docs/PASS_STORY.md and the landing-positioning memory.

import { PROGRESS_DOMAINS } from '../../utils/progressTaxonomy';

/** Auth modes the landing CTAs can open the modal into. */
export type AuthMode = 'login' | 'signup' | 'reset';

/** Callback every CTA uses to open the auth modal. */
export interface LandingAuthProps {
  onOpenAuth: (mode: AuthMode) => void;
}

export interface HowItWorksStep {
  step: string;
  iconGradient: string; // tailwind `from-… to-…`
  glyph: string;
  accentText: string; // tailwind text color for the "Step N" label
  title: string;
  body: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: '01',
    iconGradient: 'from-cyan-500 to-blue-600',
    glyph: '◎',
    accentText: 'text-cyan-300',
    title: 'Baseline',
    body: 'One adaptive sitting. Every answer — right, wrong, and how long it took — becomes diagnostic signal.',
  },
  {
    step: '02',
    iconGradient: 'from-violet-500 to-fuchsia-600',
    glyph: '⌖',
    accentText: 'text-fuchsia-300',
    title: 'Diagnose',
    body: 'Your responses are broken down across the four Praxis 5403 domains, then into the micro-skills underneath each one.',
  },
  {
    step: '03',
    iconGradient: 'from-amber-500 to-orange-600',
    glyph: '◉',
    accentText: 'text-amber-300',
    title: 'Target',
    body: "Gaps are ranked by how much they're costing you. Your plan starts where the payoff is highest — not at chapter one.",
  },
  {
    step: '04',
    iconGradient: 'from-emerald-500 to-teal-600',
    glyph: '↗',
    accentText: 'text-emerald-300',
    title: 'Monitor',
    body: 'Every practice session updates the map. Skills you master retire from your plan; weak spots stay in rotation until they don’t.',
  },
];

export interface MethodPractice {
  glyph: string;
  accentText: string; // tailwind text color for the icon
  title: string;
  body: string;
}

/** The founder's diagnostic practice — what the engine is built on (not "MTSS"). */
export const METHOD_PRACTICES: MethodPractice[] = [
  { glyph: '▦', accentText: 'text-indigo-300', title: 'Analyze performance data', body: 'Fifteen-plus years of decisions that had to be justified by data — not instinct.' },
  { glyph: '⌕', accentText: 'text-teal-300', title: 'Isolate the root cause', body: 'Finding why performance breaks down — not just where the score is low.' },
  { glyph: '⚖', accentText: 'text-amber-300', title: 'Match the smallest fix', body: 'Pairing each gap with the lightest intervention that actually closes it.' },
  { glyph: '↗', accentText: 'text-emerald-300', title: 'Monitor & adjust', body: 'Re-measuring response and regrouping until outcomes — not feelings — say it worked.' },
];

/** The diagnostic loop the engine runs (Adjust closes it). */
export const METHOD_LOOP: string[] = ['Baseline', 'Diagnose', 'Target', 'Monitor', 'Adjust'];

/** Roles behind the engine — credibility, the differentiator over "worked in MTSS". */
export const METHOD_ROLES: string[] = [
  'Teacher', 'Interventionist', 'Instructional Coach', 'Behavior Specialist', 'Educational Assessor', 'Special Education Advocate',
];

export type MasteryTier = 'strong' | 'developing' | 'critical';

export interface MicroSkillDomainRow {
  shortName: string;
  tiers: MasteryTier[];
}

/**
 * Illustrative content for the hero's "Your micro-skill map" panel — an example
 * of what the post-diagnostic map looks like, not a real user's data (no one has
 * signed up yet). Domain names/order come from PROGRESS_DOMAINS (the real 4
 * domains, single source of truth) so this can't drift from the actual product.
 * Tile *counts* per domain match PROGRESS_SKILLS' real per-domain totals
 * (13 / 12 / 8 / 12) for visual honesty, but the tier pattern itself is
 * hand-authored and illustrative. No counts or percentages are rendered from
 * this data — see landingData.ts's own "no fixed counts" rule above.
 */
export const MICRO_SKILL_MAP: MicroSkillDomainRow[] = PROGRESS_DOMAINS.map((domain) => {
  const tiersByDomain: Record<number, MasteryTier[]> = {
    1: ['strong', 'strong', 'developing', 'strong', 'strong', 'critical', 'strong', 'developing', 'strong', 'strong', 'strong', 'developing', 'strong'],
    2: ['strong', 'strong', 'strong', 'developing', 'strong', 'strong', 'critical', 'strong', 'strong', 'developing', 'strong', 'strong'],
    3: ['developing', 'strong', 'critical', 'strong', 'developing', 'strong', 'strong', 'critical'],
    4: ['strong', 'developing', 'strong', 'strong', 'critical', 'strong', 'developing', 'strong', 'strong', 'strong', 'developing', 'strong'],
  };
  return { shortName: domain.shortName, tiers: tiersByDomain[domain.id] ?? [] };
});

export interface PlanStat {
  value: string;
  label: string;
}

export const PLAN_STATS: PlanStat[] = [
  { value: 'Micro', label: 'skill targeting' },
  { value: '1:1', label: 'plan per learner' },
  { value: 'Spaced', label: 'for retention' },
];

export interface PlanQueueItem {
  iconGradient: string;
  glyph: string;
  label: string;
  time: string;
}

export const PLAN_QUEUE: PlanQueueItem[] = [
  { iconGradient: 'from-rose-500 to-pink-600', glyph: '↻', label: 'Redemption · 6 quarantined items', time: '~9 min' },
  { iconGradient: 'from-sky-500 to-cyan-600', glyph: '▦', label: 'Spaced review · 3 skills due', time: '~6 min' },
];
