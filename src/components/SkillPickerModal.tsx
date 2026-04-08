// src/components/SkillPickerModal.tsx
//
// Modal overlay for selecting a practice skill.
// Shows all 45 skills as a scrollable list with filter pills.

import { useState } from 'react';
import { X } from 'lucide-react';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';
import {
  getSkillProficiency,
  PROFICIENCY_META,
} from '../utils/skillProficiency';
import type { UserProfile } from '../hooks/useProgressTracking';

interface SkillPickerModalProps {
  profile: UserProfile;
  onSelectSkill: (skillId: string) => void;
  onClose: () => void;
}

type SkillFilter = 'all' | 'emerging' | 'approaching' | 'proficient';

interface SkillRow {
  skillId: string;
  fullLabel: string;
  shortLabel: string;
  domainId: number;
  domainShortName: string;
  accuracyPct: number | null;
  tier: ReturnType<typeof getSkillProficiency>;
}

function buildSkillRows(profile: UserProfile): SkillRow[] {
  const rows: SkillRow[] = [];
  for (const domain of PROGRESS_DOMAINS) {
    for (const s of getProgressSkillsForDomain(domain.id)) {
      const perf = profile.skillScores?.[s.skillId];
      const attempts = perf?.attempts ?? 0;
      const score = attempts > 0 ? (perf?.score ?? 0) : null;
      rows.push({
        skillId: s.skillId,
        fullLabel: s.fullLabel,
        shortLabel: s.shortLabel,
        domainId: domain.id,
        domainShortName: domain.shortName,
        accuracyPct: score !== null ? Math.round(score * 100) : null,
        tier: getSkillProficiency(score ?? 0, attempts, perf?.weightedAccuracy),
      });
    }
  }
  // Sort: lowest accuracy first; unstarted last
  return rows.sort((a, b) => {
    if (a.accuracyPct === null && b.accuracyPct === null) return a.skillId.localeCompare(b.skillId);
    if (a.accuracyPct === null) return 1;
    if (b.accuracyPct === null) return -1;
    return a.accuracyPct - b.accuracyPct;
  });
}

const TIER_BADGE: Record<ReturnType<typeof getSkillProficiency>, string> = {
  proficient:  'rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700',
  approaching: 'rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700',
  emerging:    'rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase text-rose-700',
  unstarted:   'rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-400',
};

const PCT_COLOR: Record<ReturnType<typeof getSkillProficiency>, string> = {
  proficient:  'text-emerald-600',
  approaching: 'text-amber-600',
  emerging:    'text-rose-500',
  unstarted:   'text-slate-400',
};

export default function SkillPickerModal({ profile, onSelectSkill, onClose }: SkillPickerModalProps) {
  const [filter, setFilter] = useState<SkillFilter>('all');
  const allRows = buildSkillRows(profile);

  const assessedRows = allRows.filter(r => r.accuracyPct !== null);
  const emergingCount = assessedRows.filter(r => r.tier === 'emerging').length;
  const approachingCount = assessedRows.filter(r => r.tier === 'approaching').length;
  const proficientCount = assessedRows.filter(r => r.tier === 'proficient').length;

  const displayed = filter === 'all'
    ? allRows
    : allRows.filter(r => r.tier === filter);

  const filterPills: Array<{ id: SkillFilter; label: string; count: number; activeCss: string }> = [
    { id: 'all',        label: 'All',                               count: allRows.length,  activeCss: 'bg-amber-50 border-amber-300 text-slate-900' },
    { id: 'emerging',   label: PROFICIENCY_META.emerging.label,     count: emergingCount,   activeCss: 'bg-rose-50 border-rose-300 text-rose-700' },
    { id: 'approaching',label: PROFICIENCY_META.approaching.label,  count: approachingCount,activeCss: 'bg-amber-50 border-amber-300 text-amber-700' },
    { id: 'proficient', label: PROFICIENCY_META.proficient.label,   count: proficientCount, activeCss: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-0.5">Practice</p>
            <h2 className="text-xl font-bold text-slate-900">Practice by Skill</h2>
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

        {/* Filter pills */}
        <div className="flex gap-1.5 flex-wrap mb-4 shrink-0">
          {filterPills.map(pill => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilter(pill.id)}
              className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
                filter === pill.id
                  ? pill.activeCss
                  : 'bg-transparent border-slate-200 text-slate-500 hover:opacity-80'
              }`}
            >
              {pill.label}
              {pill.count > 0 && (
                <span className="ml-1 opacity-60">({pill.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Skill list */}
        <div className="overflow-y-auto flex-1 space-y-1.5 max-h-[60vh] pr-0.5">
          {displayed.length === 0 ? (
            <p className="py-8 text-center text-sm italic text-slate-500">No skills in this category yet.</p>
          ) : (
            displayed.map(row => (
              <button
                key={row.skillId}
                type="button"
                onClick={() => { onSelectSkill(row.skillId); onClose(); }}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all duration-150 hover:border-amber-200 hover:bg-amber-50/30 active:scale-[0.99]"
              >
                {/* Skill info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{row.fullLabel}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    D{row.domainId} &middot; {row.domainShortName}
                  </p>
                </div>

                {/* Right side: accuracy + badge */}
                <div className="shrink-0 flex items-center gap-2">
                  {row.accuracyPct !== null && (
                    <span className={`text-sm font-bold tabular-nums ${PCT_COLOR[row.tier]}`}>
                      {row.accuracyPct}%
                    </span>
                  )}
                  <span className={TIER_BADGE[row.tier]}>
                    {PROFICIENCY_META[row.tier]?.label ?? 'Not started'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
