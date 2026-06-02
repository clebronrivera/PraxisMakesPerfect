// Static content for the PASS marketing landing page.
// Ported from public/mockup-pass-landing.html. Copy decisions (no fixed counts,
// no psychometric claims, qualitative time framing) are intentional — see
// docs/PASS_STORY.md and the landing-positioning memory.

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
    step: 'Step 1',
    iconGradient: 'from-cyan-500 to-blue-600',
    glyph: '◎',
    accentText: 'text-cyan-300',
    title: 'Take an adaptive baseline',
    body: 'An adaptive set that grows with you — one question per skill, plus targeted follow-ups exactly where you slip. No fixed-length slog.',
  },
  {
    step: 'Step 2',
    iconGradient: 'from-violet-500 to-fuchsia-600',
    glyph: '⌖',
    accentText: 'text-fuchsia-300',
    title: 'See your micro-skill map',
    body: 'The algorithm isolates the precise micro-skills and error patterns behind your misses — not "weak in assessment," but the actual gap.',
  },
  {
    step: 'Step 3',
    iconGradient: 'from-emerald-500 to-teal-600',
    glyph: '↗',
    accentText: 'text-emerald-300',
    title: 'Study what moves readiness',
    body: 'A personalized plan + adaptive practice, sequenced by what raises your readiness fastest and spaced so it actually sticks.',
  },
];

export interface WeakMicroSkill {
  title: string;
  context: string;
  barGradient: string; // tailwind `from-… to-…`
  tier: string;
  tierClass: string; // tailwind bg/text for the tier pill
}

export const WEAK_MICRO_SKILLS: WeakMicroSkill[] = [
  {
    title: 'Norm- vs. criterion-referenced interpretation',
    context: 'Assessment & Data Use · 28%',
    barGradient: 'from-rose-500 to-pink-600',
    tier: 'Tier 2',
    tierClass: 'bg-rose-500/20 text-rose-200',
  },
  {
    title: 'Function vs. topography in FBA',
    context: 'Behavioral Assessment · 33%',
    barGradient: 'from-rose-500 to-pink-600',
    tier: 'Tier 2',
    tierClass: 'bg-rose-500/20 text-rose-200',
  },
  {
    title: 'Screening vs. evaluation consent',
    context: 'Ethics & Law · 55%',
    barGradient: 'from-amber-500 to-orange-600',
    tier: 'Tier 1',
    tierClass: 'bg-amber-500/20 text-amber-200',
  },
];

export interface MethodStep {
  n: string;
  iconGradient: string;
  title: string;
  detail: string;
}

export const METHOD_WORKFLOW: MethodStep[] = [
  { n: '1', iconGradient: 'from-cyan-500 to-blue-600', title: 'Baseline', detail: '— adaptive diagnostic' },
  { n: '2', iconGradient: 'from-violet-500 to-fuchsia-600', title: 'Pinpoint', detail: '— micro-skill + error analysis' },
  { n: '3', iconGradient: 'from-rose-500 to-pink-600', title: 'Target', detail: '— tiered, sequenced practice' },
  { n: '4', iconGradient: 'from-emerald-500 to-teal-600', title: 'Progress-monitor', detail: '— spaced review + re-check' },
];

export const METHOD_CHIPS: string[] = [
  '~2 decades educator · MTSS',
  'Spacing',
  'Retrieval practice',
  'Interleaving',
];

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
