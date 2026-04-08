// src/components/DomainPickerModal.tsx
//
// Modal overlay for selecting a practice domain.
// Shows 4 domain cards with proficiency stats and a progress bar.

import { X } from 'lucide-react';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';
import {
  getSkillProficiency,
  PROFICIENCY_META,
  DEMONSTRATING_THRESHOLD,
  APPROACHING_THRESHOLD,
} from '../utils/skillProficiency';
import { SkillProgressBar } from './SkillProgressBar';
import type { UserProfile } from '../hooks/useProgressTracking';

interface DomainPickerModalProps {
  profile: UserProfile;
  onSelectDomain: (domainId: number) => void;
  onClose: () => void;
}

type DomainTier = 'proficient' | 'approaching' | 'emerging' | 'unstarted';

interface DomainStat {
  id: number;
  name: string;
  subtitle: string;
  totalSkills: number;
  activeSkillCount: number;
  overallAccuracy: number | null;
  baselineAccuracy: number | null;
  tier: DomainTier;
}

function buildDomainStats(profile: UserProfile): DomainStat[] {
  return PROGRESS_DOMAINS.map((domain) => {
    const skills = getProgressSkillsForDomain(domain.id);
    let totalCorrect = 0;
    let totalAttempts = 0;
    let baselineCorrect = 0;
    let baselineAttempts = 0;
    let activeSkillCount = 0;

    for (const s of skills) {
      const perf = profile.skillScores?.[s.skillId];
      const attempts = perf?.attempts ?? 0;
      const tier = getSkillProficiency(perf?.score ?? 0, attempts, perf?.weightedAccuracy);
      if (tier !== 'proficient') activeSkillCount++;
      totalCorrect += perf?.correct ?? 0;
      totalAttempts += attempts;

      // Baseline from baselineSnapshot
      const bSnap = (profile as any).baselineSnapshot;
      if (bSnap?.skillScores?.[s.skillId]) {
        const b = bSnap.skillScores[s.skillId];
        baselineCorrect += b.correct ?? 0;
        baselineAttempts += b.attempts ?? 0;
      }
    }

    const overallAccuracy = totalAttempts > 0
      ? (totalCorrect / totalAttempts)
      : null;

    const baselineAccuracy = baselineAttempts > 0
      ? (baselineCorrect / baselineAttempts)
      : null;

    let tier: DomainTier = 'unstarted';
    if (overallAccuracy !== null) {
      tier = overallAccuracy >= DEMONSTRATING_THRESHOLD ? 'proficient'
        : overallAccuracy >= APPROACHING_THRESHOLD ? 'approaching'
        : 'emerging';
    }

    return {
      id: domain.id,
      name: domain.name,
      subtitle: domain.subtitle,
      totalSkills: skills.length,
      activeSkillCount,
      overallAccuracy,
      baselineAccuracy,
      tier,
    };
  });
}

const TIER_BADGE: Record<DomainTier, string> = {
  proficient:  'rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700',
  approaching: 'rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-700',
  emerging:    'rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-rose-700',
  unstarted:   'rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-500',
};

export default function DomainPickerModal({ profile, onSelectDomain, onClose }: DomainPickerModalProps) {
  const stats = buildDomainStats(profile);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-0.5">Practice</p>
            <h2 className="text-xl font-bold text-slate-900">Practice by Domain</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Domain cards */}
        <div className="space-y-3">
          {stats.map((stat) => (
            <button
              key={stat.id}
              type="button"
              onClick={() => { onSelectDomain(stat.id); onClose(); }}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 leading-snug">
                    Domain {stat.id} &middot; {stat.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{stat.subtitle}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={TIER_BADGE[stat.tier]}>
                    {PROFICIENCY_META[stat.tier]?.label ?? 'Not started'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {stat.activeSkillCount} of {stat.totalSkills} active
                  </span>
                </div>
              </div>

              {stat.overallAccuracy !== null && (
                <SkillProgressBar
                  label=""
                  current={stat.overallAccuracy}
                  baseline={stat.baselineAccuracy}
                  showMasteryLine={true}
                  size="sm"
                />
              )}

              <p className="mt-2.5 text-xs font-semibold text-amber-600">
                Practice this domain →
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
