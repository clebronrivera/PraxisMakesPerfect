import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, BarChart3, AlertTriangle } from 'lucide-react';
import { useEngine } from '../hooks/useEngine';
import type { Domain } from '../types/content';
import { UserProfile } from '../hooks/useProgressTracking';
import { getDomainColor } from '../utils/domainColors';
import { getDomainLabel } from '../utils/domainLabels';
import {
  DEMONSTRATING_THRESHOLD,
  APPROACHING_THRESHOLD,
  getSkillProficiency,
  PROFICIENCY_META,
  type SkillProficiencyLevel,
} from '../utils/skillProficiency';
import { PROGRESS_DOMAINS, PROGRESS_SKILLS } from '../utils/progressTaxonomy';

// ─── Skill grid types ────────────────────────────────────────────────────────

type SkillGridFilter = 'all' | 'proficient' | 'approaching' | 'emerging';
type SkillGridSort = 'domain' | 'weakest' | 'approaching-first' | 'by-domain';

const FILTER_STORAGE_KEY = 'skillMapFilter';

interface SkillCell {
  skillId: string;
  shortLabel: string;
  fullLabel: string;
  domainId: number;
  domainName: string;
  score: number | null;
  attempts: number;
  tier: SkillProficiencyLevel;
  lastPracticed: string | null;
}

function buildSkillCells(profile: UserProfile): SkillCell[] {
  return PROGRESS_SKILLS.map(s => {
    const perf = profile.skillScores?.[s.skillId];
    const attempts = perf?.attempts ?? 0;
    const score = attempts > 0 ? (perf?.score ?? 0) : null;
    const domain = PROGRESS_DOMAINS.find(d => d.id === s.domainId);
    return {
      skillId: s.skillId,
      shortLabel: s.shortLabel,
      fullLabel: s.fullLabel,
      domainId: s.domainId,
      domainName: domain?.name ?? '',
      score,
      attempts,
      tier: getSkillProficiency(score ?? 0, attempts, perf?.weightedAccuracy),
      lastPracticed: perf?.nextReviewDate ?? null,
    };
  });
}

function sortSkillCells(cells: SkillCell[], sort: SkillGridSort): SkillCell[] {
  const sorted = [...cells];
  switch (sort) {
    case 'weakest':
      return sorted.sort((a, b) => {
        if (a.score === null && b.score === null) return 0;
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return a.score - b.score;
      });
    case 'approaching-first':
      return sorted.sort((a, b) => {
        const aApproaching = a.tier === 'approaching' ? 1 : 0;
        const bApproaching = b.tier === 'approaching' ? 1 : 0;
        if (aApproaching !== bApproaching) return bApproaching - aApproaching;
        // Within approaching, closest to 80% first
        if (a.tier === 'approaching' && b.tier === 'approaching') {
          return (b.score ?? 0) - (a.score ?? 0);
        }
        return (a.score ?? 0) - (b.score ?? 0);
      });
    case 'by-domain':
      return sorted.sort((a, b) => {
        if (a.domainId !== b.domainId) return a.domainId - b.domainId;
        return (a.score ?? 0) - (b.score ?? 0);
      });
    case 'domain':
    default:
      return sorted; // already in domain order from PROGRESS_SKILLS
  }
}

const TIER_COLORS: Record<SkillProficiencyLevel, { bg: string; border: string; text: string }> = {
  proficient: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  approaching: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  emerging: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  unstarted: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500' },
};

function SkillMapGrid({ userProfile }: { userProfile: UserProfile }) {
  const [filter, setFilter] = useState<SkillGridFilter>(() => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved && ['all', 'proficient', 'approaching', 'emerging'].includes(saved)) {
        return saved as SkillGridFilter;
      }
    } catch { /* ignore */ }
    return 'all';
  });
  const [sort, setSort] = useState<SkillGridSort>('domain');

  useEffect(() => {
    try { localStorage.setItem(FILTER_STORAGE_KEY, filter); } catch { /* ignore */ }
  }, [filter]);

  const allCells = useMemo(() => buildSkillCells(userProfile), [userProfile]);
  const counts = useMemo(() => ({
    all: allCells.length,
    proficient: allCells.filter(c => c.tier === 'proficient').length,
    approaching: allCells.filter(c => c.tier === 'approaching').length,
    emerging: allCells.filter(c => c.tier === 'emerging').length,
  }), [allCells]);

  const displayed = useMemo(() => {
    let filtered = allCells;
    if (filter !== 'all') {
      filtered = allCells.filter(c => c.tier === filter);
    }
    return sortSkillCells(filtered, sort);
  }, [allCells, filter, sort]);

  const filterButtons: Array<{ id: SkillGridFilter; label: string; count: number; activeClass: string }> = [
    { id: 'all', label: 'All', count: counts.all, activeClass: 'bg-amber-50 border-amber-300 text-slate-900' },
    { id: 'proficient', label: PROFICIENCY_META.proficient.label, count: counts.proficient, activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
    { id: 'approaching', label: PROFICIENCY_META.approaching.label, count: counts.approaching, activeClass: 'bg-amber-50 border-amber-300 text-amber-700' },
    { id: 'emerging', label: PROFICIENCY_META.emerging.label, count: counts.emerging, activeClass: 'bg-rose-50 border-rose-300 text-rose-700' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-800">Skill Map</h3>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {PROFICIENCY_META.proficient.label} (80%+)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {PROFICIENCY_META.approaching.label} (60-79%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {PROFICIENCY_META.emerging.label} (&lt;60%)</span>
        </div>
      </div>

      {/* Filter + Sort bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {filterButtons.map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                filter === btn.id
                  ? btn.activeClass
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {btn.label} ({btn.count})
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SkillGridSort)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 bg-white"
        >
          <option value="domain">Default (domain order)</option>
          <option value="weakest">Weakest First</option>
          <option value="approaching-first">Approaching First (closest to 80%)</option>
          <option value="by-domain">By Domain</option>
        </select>
      </div>

      {/* 9-column grid */}
      <div className="grid grid-cols-9 gap-2">
        {displayed.map(cell => {
          const colors = TIER_COLORS[cell.tier];
          const pct = cell.score !== null ? Math.round(cell.score * 100) : null;
          return (
            <div
              key={cell.skillId}
              title={`${cell.fullLabel}\nDomain: ${cell.domainName}\nProficiency: ${PROFICIENCY_META[cell.tier].label}${pct !== null ? `\nAccuracy: ${pct}%` : ''}${cell.lastPracticed ? `\nLast practiced: ${cell.lastPracticed}` : ''}`}
              className={`rounded-xl border ${colors.border} ${colors.bg} p-2 text-center cursor-default transition-all hover:shadow-md hover:-translate-y-0.5`}
            >
              <div className={`text-[10px] font-bold leading-tight ${colors.text}`}>{cell.shortLabel}</div>
              {pct !== null && (
                <div className={`text-[9px] mt-0.5 ${colors.text} opacity-70`}>{pct}%</div>
              )}
            </div>
          );
        })}
      </div>

      {displayed.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-4">No skills match this filter.</p>
      )}
    </div>
  );
}

// ─── Existing Praxis section types ───────────────────────────────────────────

interface PraxisPerformanceViewProps {
  userProfile: UserProfile;
  onDomainSelect?: (domainId: number) => void;
  sortBy?: 'performance' | 'deficiencies';
}

interface PraxisSection {
  id: number;
  name: string;
  subtitle: string;
  domains: number[];
  color: string;
}

const PRAXIS_SECTIONS: PraxisSection[] = [
  { id: 1, name: 'Professional Practices', subtitle: 'Permeates all services — 32% of exam', domains: [1], color: '#3B82F6' },
  { id: 2, name: 'Student-Level Services', subtitle: 'Direct & Indirect — 23% of exam', domains: [2], color: '#10B981' },
  { id: 3, name: 'Systems-Level Services', subtitle: 'Direct & Indirect — 20% of exam', domains: [3], color: '#8B5CF6' },
  { id: 4, name: 'Foundations of School Psychology', subtitle: 'Service Delivery — 25% of exam', domains: [4], color: '#F59E0B' },
];

const getPerformanceLabel = (score: number): { label: string; color: string; bgColor: string } => {
  if (score >= DEMONSTRATING_THRESHOLD) return { label: 'Strong', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' };
  if (score >= APPROACHING_THRESHOLD) return { label: 'Developing', color: 'text-amber-400', bgColor: 'bg-amber-500/20' };
  return { label: 'Needs Improvement', color: 'text-red-400', bgColor: 'bg-red-500/20' };
};

export default function PraxisPerformanceView({
  userProfile,
  onDomainSelect,
  sortBy = 'performance',
}: PraxisPerformanceViewProps) {
  const engine = useEngine();
  type DomainWithExtras = Domain & { description?: string; keyConcepts?: string[] };
  const NASP_DOMAINS = engine.domains.reduce<Record<number, DomainWithExtras>>((acc, d) => ({ ...acc, [Number(d.id)]: d }), {});

  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<'performance' | 'deficiencies'>(sortBy);

  const sectionPerformance = useMemo(() => {
    return PRAXIS_SECTIONS.map(section => {
      let totalCorrect = 0;
      let totalQuestions = 0;
      const domainScores: Array<{ domain: number; score: number; correct: number; total: number }> = [];

      section.domains.forEach(domainId => {
        const domainScore = userProfile.domainScores[domainId];
        if (domainScore && domainScore.total > 0) {
          totalCorrect += domainScore.correct;
          totalQuestions += domainScore.total;
          domainScores.push({
            domain: domainId,
            score: domainScore.correct / domainScore.total,
            correct: domainScore.correct,
            total: domainScore.total,
          });
        }
      });

      const overallScore = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
      const deficiencyCount = domainScores.filter(d => d.score < APPROACHING_THRESHOLD).length;
      const totalDomainsWithData = domainScores.length;

      return {
        ...section,
        overallScore,
        totalCorrect,
        totalQuestions,
        domainScores: domainScores.sort((a, b) => a.score - b.score),
        deficiencyCount,
        totalDomainsWithData,
      };
    });
  }, [userProfile.domainScores]);

  const sortedSections = useMemo(() => {
    const sorted = [...sectionPerformance];
    if (sortMode === 'performance') {
      return sorted.sort((a, b) => {
        if (a.totalQuestions === 0 && b.totalQuestions === 0) return 0;
        if (a.totalQuestions === 0) return 1;
        if (b.totalQuestions === 0) return -1;
        return a.overallScore - b.overallScore;
      });
    }
    return sorted.sort((a, b) => {
      if (a.deficiencyCount !== b.deficiencyCount) return b.deficiencyCount - a.deficiencyCount;
      return a.overallScore - b.overallScore;
    });
  }, [sectionPerformance, sortMode]);

  const toggleSection = (sectionId: number) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="space-y-6">
      {/* ── Skill Map Grid (new) ──────────────────────────────────────── */}
      <SkillMapGrid userProfile={userProfile} />

      {/* ── Existing Section View ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Praxis Performance Overview</h2>
          <p className="text-slate-400 text-sm">View your performance across Praxis sections and drill down to NASP domains</p>
        </div>
        <div className="flex gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setSortMode('performance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortMode === 'performance' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Performance
          </button>
          <button
            onClick={() => setSortMode('deficiencies')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortMode === 'deficiencies' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Deficiencies
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedSections.map(section => {
          const perf = getPerformanceLabel(section.overallScore);
          const isExpanded = expandedSection === section.id;
          const hasData = section.totalQuestions > 0;
          const scorePercentage = hasData ? Math.round(section.overallScore * 100) : 0;

          return (
            <div key={section.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden transition-all hover:border-slate-600">
              <button onClick={() => toggleSection(section.id)} className="w-full p-6 text-left flex items-center justify-between group">
                <div className="flex-1 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ backgroundColor: section.color }}>
                    {section.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">{section.name}</h3>
                      {hasData && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${perf.color} ${perf.bgColor}`}>{perf.label}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{section.subtitle}</p>
                    {hasData && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-slate-300">{section.totalDomainsWithData} domain{section.totalDomainsWithData !== 1 ? 's' : ''} assessed</span>
                        {section.deficiencyCount > 0 && (
                          <span className="text-sm text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            {section.deficiencyCount} need{section.deficiencyCount !== 1 ? 's' : ''} improvement
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {hasData && (
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${perf.color}`}>{scorePercentage}%</div>
                        <div className="text-xs text-slate-500">{section.totalCorrect} / {section.totalQuestions}</div>
                      </div>
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${scorePercentage}%`, backgroundColor: section.color }} />
                      </div>
                    </div>
                  )}
                  <div className="ml-4 flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-700/50 p-6 bg-slate-900/50">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Domain Details</h4>
                  {section.domainScores.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No assessment data yet for domains in this section</p>
                      <p className="text-sm mt-1">Complete an assessment to see performance metrics</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {section.domainScores.map(({ domain, score, correct, total }) => {
                        const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
                        const domainPerf = getPerformanceLabel(score);
                        const domainPct = Math.round(score * 100);
                        const domainColor = getDomainColor(domain);
                        const isWeak = userProfile.weakestDomains.includes(domain);

                        return (
                          <div key={domain} className={`p-4 rounded-xl border transition-all ${isWeak ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/50 border-slate-700/50'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: domainColor }}>
                                  {domain}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-slate-200">{getDomainLabel(domainInfo)}</p>
                                    {isWeak && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                                  </div>
                                  <p className="text-xs text-slate-400 line-clamp-1">{domainInfo?.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                <div className="text-right">
                                  <div className={`text-lg font-bold ${domainPerf.color}`}>{domainPct}%</div>
                                  <div className="text-xs text-slate-500">{correct} / {total}</div>
                                </div>
                                <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${domainPct}%`, backgroundColor: domainColor }} />
                                </div>
                                {onDomainSelect && (
                                  <button onClick={() => onDomainSelect(domain)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-white hover:opacity-90" style={{ backgroundColor: domainColor }}>
                                    Practice
                                  </button>
                                )}
                              </div>
                            </div>
                            {domainInfo?.keyConcepts && domainInfo.keyConcepts.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-700/50">
                                <p className="text-xs text-slate-500 mb-2">Key Concepts:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {domainInfo.keyConcepts.slice(0, 5).map((concept: string, idx: number) => (
                                    <span key={idx} className="px-2 py-0.5 rounded text-xs bg-slate-800/50 text-slate-400 border border-slate-700/50">{concept}</span>
                                  ))}
                                  {domainInfo.keyConcepts.length > 5 && (
                                    <span className="px-2 py-0.5 rounded text-xs text-slate-500">+{domainInfo.keyConcepts.length - 5} more</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(userProfile.screenerComplete || userProfile.diagnosticComplete || userProfile.fullAssessmentComplete) && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="p-4 bg-slate-800/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-amber-400">{userProfile.totalQuestionsSeen}</p>
            <p className="text-xs text-slate-500 mt-1">Total Questions</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-emerald-400">{sortedSections.filter(s => s.overallScore >= DEMONSTRATING_THRESHOLD).length}</p>
            <p className="text-xs text-slate-500 mt-1">Strong Sections</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-red-400">{sortedSections.reduce((sum, s) => sum + s.deficiencyCount, 0)}</p>
            <p className="text-xs text-slate-500 mt-1">Areas Needing Work</p>
          </div>
        </div>
      )}
    </div>
  );
}
