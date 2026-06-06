import { ReactNode, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  Flag,
  Layers,
  Minus,
  Printer,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { StudyPlanDocumentV2 } from '../services/studyPlanService';
import type {
  ClusterUrgency,
  SessionType,
  StudentSkillStatus,
  TrendDirection,
} from '../types/studyPlanTypes';

interface StudyPlanViewerProps {
  plan: StudyPlanDocumentV2;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

function statusBadge(status: StudentSkillStatus): string {
  switch (status) {
    case 'unlearned':    return 'badge-slate';
    case 'misconception': return 'badge bg-[color:#e11d48]/10 text-[color:#e11d48] border-[color:#e11d48]/30';
    case 'unstable':     return 'badge bg-[color:#d97706]/10 text-[color:#d97706] border-[color:#d97706]/30';
    case 'developing':   return 'badge bg-[color:#d97706]/10 text-[color:#d97706] border-[color:#d97706]/30';
    case 'near_mastery': return 'badge badge-cyan';
    case 'mastered':     return 'badge badge-mint';
  }
}

function urgencyConfig(urgency: ClusterUrgency): { label: string; card: string; badge: string; accent: string } {
  switch (urgency) {
    case 'urgent_now':
      return {
        label: 'Urgent now',
        card: 'bg-[color:#e11d48]/10 border-[color:#e11d48]/30',
        badge: 'badge-coral',
        accent: 'bg-[color:#e11d48]/100',
      };
    case 'important_next':
      return {
        label: 'Build next',
        card: 'bg-[color:#d97706]/10 border-[color:#d97706]/30',
        badge: 'badge-amber',
        accent: 'bg-[color:#d97706]/100',
      };
    case 'maintain':
      return {
        label: 'Reinforce later',
        card: 'bg-[color:#059669]/10 border-[color:#059669]/30',
        badge: 'badge-mint',
        accent: 'bg-[color:#059669]/100',
      };
  }
}

function readinessConfig(level: 'early' | 'developing' | 'approaching' | 'ready'): {
  color: string; bg: string; bar: string; pct: number;
} {
  switch (level) {
    case 'early':      return { color: 'text-[color:#e11d48]',    bg: 'bg-[color:#e11d48]/10 border-[color:#e11d48]/30',    bar: 'bg-[color:#e11d48]/100',    pct: 15 };
    case 'developing': return { color: 'text-[color:#d97706]',   bg: 'bg-[color:#d97706]/10 border-[color:#d97706]/30',  bar: 'bg-[color:#d97706]/100',   pct: 40 };
    case 'approaching': return { color: 'text-[color:#0284c7]',   bg: 'bg-[color:#0284c7]/10 border-[color:#0284c7]/30',    bar: 'bg-[color:#0284c7]/100',    pct: 70 };
    case 'ready':      return { color: 'text-[color:#059669]', bg: 'bg-[color:#059669]/10 border-[color:#059669]/30', bar: 'bg-[color:#059669]/100', pct: 95 };
  }
}

function sessionTypeTag(type: SessionType): { label: string; cls: string } {
  switch (type) {
    case 'vocabulary':          return { label: 'Vocabulary',     cls: 'badge badge-violet' };
    case 'concept-review':      return { label: 'Concept',        cls: 'badge badge-cyan' };
    case 'case-practice':       return { label: 'Case Practice',  cls: 'badge badge-amber' };
    case 'mixed-retrieval':     return { label: 'Mixed',          cls: 'badge bg-[color:#059669]/10 text-[color:#059669] border-[color:#059669]/30' };
    case 'wrong-answer-review': return { label: 'Wrong Answers',  cls: 'badge badge-coral' };
  }
}

function TrendIcon({ trend }: { trend: TrendDirection }) {
  if (trend === 'improving') return <ArrowUp   className="w-3 h-3 text-[color:#059669]" />;
  if (trend === 'declining') return <ArrowDown className="w-3 h-3 text-[color:#e11d48]" />;
  if (trend === 'flat')      return <Minus     className="w-3 h-3 text-slate-500" />;
  return null;
}

// ─── Tab definition ────────────────────────────────────────────────────────────

type Tab = 'overview' | 'priorities' | 'domains' | 'concepts' | 'weekly' | 'milestones';

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'overview',   label: 'Overview',   icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'priorities', label: 'Priorities', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'domains',    label: 'Domains',    icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'concepts',   label: 'Concepts',   icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'weekly',     label: 'Weekly plan', icon: <CalendarDays className="w-3.5 h-3.5" /> },
  { id: 'milestones', label: 'Milestones', icon: <Flag className="w-3.5 h-3.5" /> },
];

// ─── Side rail ────────────────────────────────────────────────────────────────

function SideRail({ plan }: { plan: StudyPlanDocumentV2 }) {
  const snap = plan.readinessSnapshot;
  const rc = readinessConfig(snap.readinessLevel);

  return (
    <aside className="space-y-4">
      {/* Readiness card */}
      <div className={`p-4 rounded-2xl border ${rc.bg} space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <p className="overline">Readiness</p>
          <span className={`text-sm font-bold uppercase tracking-wide ${rc.color}`}>
            {snap.readinessLevel.replace('_', ' ')}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="editorial-progress-track">
            <div className={`${rc.bar} h-full rounded-full`} style={{ width: `${rc.pct}%` }} />
          </div>
          {snap.testTimeline && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {snap.testTimeline}
            </p>
          )}
        </div>
      </div>

      {/* Strongest area */}
      <div className="p-3 bg-[color:#059669]/10 border border-[color:#059669]/30 rounded-xl space-y-1">
        <p className="overline text-[color:#059669]">Strongest area</p>
        <p className="text-xs font-semibold text-[color:#059669]">{snap.strongestArea}</p>
      </div>

      {/* Next best move */}
      <div className="p-3 bg-[color:#0284c7]/10 border border-[color:#0284c7]/30 rounded-xl space-y-1">
        <p className="overline text-[color:#0284c7]">Next best move</p>
        <p className="text-xs font-semibold text-[color:#0284c7]">{snap.nextBestMove}</p>
      </div>

      {/* Blockers */}
      {snap.majorBlockers.length > 0 && (
        <div className="p-3 bg-[color:#e11d48]/10 border border-[color:#e11d48]/30 rounded-xl space-y-2">
          <p className="overline text-[color:#e11d48] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Blockers
          </p>
          <div className="flex flex-wrap gap-1.5">
            {snap.majorBlockers.map(blocker => (
              <span key={blocker} className="px-2 py-1 rounded-lg text-[11px] font-medium bg-[color:#e11d48]/20 text-[color:#e11d48] border border-[color:#e11d48]/30">
                {blocker}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <p className="overline">Plan summary</p>
        <div className="space-y-1.5 text-xs text-slate-500">
          <div className="flex justify-between">
            <span>Responses analyzed</span>
            <span className="font-semibold text-slate-700">{plan.sourceSummary.assessmentResponseCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Domains covered</span>
            <span className="font-semibold text-slate-700">{plan.sourceSummary.domainScoreCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Deficit skills</span>
            <span className="font-semibold text-[color:#e11d48]">{plan.sourceSummary.deficitSkillCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Priority clusters</span>
            <span className="font-semibold text-slate-700">{plan.priorityClusters.length}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Tab: Overview ─────────────────────────────────────────────────────────────

function TabOverview({ plan }: { plan: StudyPlanDocumentV2 }) {
  const snap = plan.readinessSnapshot;
  const interp = plan.dataInterpretation;
  const rc = readinessConfig(snap.readinessLevel);

  return (
    <div className="space-y-5">
      {/* Summary hero */}
      <div className={`p-5 rounded-2xl border ${rc.bg}`}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 mb-2">Readiness overview</p>
            <p className="text-sm text-slate-700 leading-relaxed">{snap.summary}</p>
          </div>
          <span className={`shrink-0 text-sm font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${rc.bg} ${rc.color}`}>
            {snap.readinessLevel.replace('_', ' ')}
          </span>
        </div>
        <div className="mt-4 editorial-progress-track">
          <div className={`${rc.bar} h-full rounded-full transition-all duration-700`} style={{ width: `${rc.pct}%` }} />
        </div>
      </div>

      {/* 3 insight cards */}
      {interp.urgentInsights.length > 0 && (
        <div className="space-y-2.5">
          <p className="overline">Key insights</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {interp.urgentInsights.slice(0, 3).map((insight, i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns accordion */}
      {interp.patterns.length > 0 && (
        <div className="space-y-2">
          <p className="overline">Observed patterns</p>
          <div className="space-y-2">
            {interp.patterns.map((pattern, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <TrendingUp className="w-3.5 h-3.5 text-[color:#0284c7] mt-0.5 shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">{pattern}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Priorities ──────────────────────────────────────────────────────────

function TabPriorities({ plan }: { plan: StudyPlanDocumentV2 }) {
  const tactical = plan.tacticalInstructions;

  return (
    <div className="space-y-6">
      {/* Priority board */}
      <div className="space-y-2.5">
        <p className="overline">Learning priorities</p>
        <div className="space-y-3">
          {plan.priorityClusters.map(cluster => {
            const uc = urgencyConfig(cluster.urgency);
            return (
              <div key={cluster.clusterName} className={`rounded-2xl border ${uc.card} overflow-hidden`}>
                <div className={`w-full h-0.5 ${uc.accent}`} />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{cluster.clusterName}</p>
                      {cluster.allocatedMinutes > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {cluster.allocatedMinutes} min allocated
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 ${uc.badge}`}>{uc.label}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{cluster.whyItMatters}</p>
                  {cluster.blockingNote && (
                    <p className="text-xs text-[color:#e11d48] bg-[color:#e11d48]/10 border border-[color:#e11d48]/30 rounded-lg px-3 py-2">
                      {cluster.blockingNote}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.skills.map(skill => (
                      <div
                        key={skill.skillId}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${statusBadge(skill.status)}`}
                        title={`${skill.skillId} · ${skill.accuracy !== null ? `${skill.accuracy}%` : 'No data'}`}
                      >
                        <TrendIcon trend={skill.trend} />
                        <span className="font-medium">{skill.skillName}</span>
                        <span className="opacity-50">{skill.accuracy !== null ? `${skill.accuracy}%` : '—'}</span>
                      </div>
                    ))}
                  </div>
                  {cluster.recommendedContentTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {cluster.recommendedContentTypes.map(ct => (
                        <span key={ct} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                          {ct}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action plan — 3 accent cards */}
      <div className="space-y-2.5">
        <p className="overline">Action plan</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {/* Do Right Now */}
          <div className="p-4 bg-[color:#e11d48]/10 border border-[color:#e11d48]/30 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[color:#e11d48]/20 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[color:#e11d48]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[color:#e11d48]">Do right now</p>
            </div>
            <ul className="space-y-2">
              {tactical.immediateActions.map(action => (
                <li key={action} className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-[color:#e11d48] mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-600 leading-relaxed">{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* This Week */}
          <div className="p-4 bg-[color:#0284c7]/10 border border-[color:#0284c7]/30 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[color:#0284c7]/20 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-3.5 h-3.5 text-[color:#0284c7]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[color:#0284c7]">This week</p>
            </div>
            <ul className="space-y-2">
              {tactical.thisWeekGoals.map(goal => (
                <li key={goal} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-[color:#0284c7] mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-600 leading-relaxed">{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Avoid */}
          <div className="p-4 bg-[color:#d97706]/10 border border-[color:#d97706]/30 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[color:#d97706]/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-[color:#d97706]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[color:#d97706]">Avoid</p>
            </div>
            <ul className="space-y-2">
              {tactical.avoidList.map(item => (
                <li key={item} className="flex items-start gap-2">
                  <Minus className="w-3 h-3 text-[color:#d97706] mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-600 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Domains ─────────────────────────────────────────────────────────────

function TabDomains({ plan }: { plan: StudyPlanDocumentV2 }) {
  const [activeDomainId, setActiveDomainId] = useState<number>(plan.domainStudyMaps[0]?.domainId ?? 1);
  const domain = plan.domainStudyMaps.find(d => d.domainId === activeDomainId) ?? plan.domainStudyMaps[0];

  if (!domain) return <p className="text-sm text-slate-500">No domain data available.</p>;

  const scoreColor = domain.domainScore !== null
    ? domain.domainScore >= 80 ? 'text-[color:#059669]'
    : domain.domainScore >= 60 ? 'text-[color:#d97706]'
    : 'text-[color:#e11d48]'
    : 'text-slate-500';

  return (
    <div className="space-y-4">
      {/* Domain selector tabs */}
      <div className="flex flex-wrap gap-2">
        {plan.domainStudyMaps.map(d => {
          const sc = d.domainScore !== null
            ? d.domainScore >= 80 ? 'border-[color:#059669]/50 text-[color:#059669]'
            : d.domainScore >= 60 ? 'border-[color:#d97706]/50 text-[color:#d97706]'
            : 'border-[color:#e11d48]/50 text-[color:#e11d48]'
            : 'border-slate-200 text-slate-500';
          const active = d.domainId === activeDomainId;
          return (
            <button
              key={d.domainId}
              onClick={() => setActiveDomainId(d.domainId)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
                active
                  ? 'bg-indigo-50 border-indigo-300 text-slate-900'
                  : `bg-slate-50 ${sc} hover:bg-slate-100`
              }`}
            >
              <span className="block">{d.domainName}</span>
              {d.domainScore !== null && (
                <span className={`block text-[10px] mt-0.5 ${sc}`}>{d.domainScore}%</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Domain panels */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Snapshot */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <p className="overline">Domain snapshot</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{domain.domainName}</p>
            <span className={`text-lg font-bold tabular-nums ${scoreColor}`}>
              {domain.domainScore !== null ? `${domain.domainScore}%` : 'N/A'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{domain.interpretation}</p>
        </div>

        {/* Must know */}
        {domain.contentToKnow.length > 0 && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <p className="overline text-[color:#0284c7]">Must know</p>
            <ul className="space-y-1.5">
              {domain.contentToKnow.slice(0, 5).map(item => (
                <li key={item} className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 text-[color:#0284c7] mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common traps */}
        {domain.commonTraps.length > 0 && (
          <div className="p-4 bg-[color:#e11d48]/10 border border-[color:#e11d48]/30 rounded-2xl space-y-2">
            <p className="overline text-[color:#e11d48]">Common traps</p>
            <ul className="space-y-1.5">
              {domain.commonTraps.map(trap => (
                <li key={trap} className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-[color:#e11d48] mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-600">{trap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Case types + vocabulary */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          {domain.caseTypesToRecognize.length > 0 && (
            <div className="space-y-1.5">
              <p className="overline text-[color:#d97706]">Case types</p>
              <ul className="space-y-1">
                {domain.caseTypesToRecognize.map(c => (
                  <li key={c} className="flex items-start gap-1.5">
                    <ArrowRight className="w-3 h-3 text-[color:#d97706] mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-600">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {domain.keyVocabulary.length > 0 && (
            <div className="space-y-1.5">
              <p className="overline text-[color:#7c3aed]">Key vocabulary</p>
              <div className="flex flex-wrap gap-1">
                {domain.keyVocabulary.map(term => (
                  <span key={term} className="badge badge-violet text-[10px]">{term}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mastery signal */}
      <div className="p-3 bg-[color:#059669]/10 border border-[color:#059669]/30 rounded-xl">
        <p className="text-xs text-[color:#059669]">
          <span className="font-semibold">Mastery signal: </span>{domain.masteryIndicator}
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Concepts (Vocabulary + Case Patterns) ───────────────────────────────

function TabConcepts({ plan }: { plan: StudyPlanDocumentV2 }) {
  const [subTab, setSubTab] = useState<'vocab' | 'cases'>('vocab');

  return (
    <div className="space-y-4">
      {/* Sub-tab toggle */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl w-fit">
        <button
          onClick={() => setSubTab('vocab')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
            subTab === 'vocab' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Vocabulary ({plan.vocabulary.length})
        </button>
        <button
          onClick={() => setSubTab('cases')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
            subTab === 'cases' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Case patterns ({plan.casePatterns.length})
        </button>
      </div>

      {/* Vocabulary */}
      {subTab === 'vocab' && (
        <div className="space-y-3">
          {plan.vocabulary.length === 0 && (
            <p className="text-sm text-slate-500">No vocabulary entries were generated.</p>
          )}
          {plan.vocabulary.map(entry => (
            <div key={entry.term} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-[color:#7c3aed]">{entry.term}</p>
                {entry.confusionRisk && (
                  <span className="shrink-0 badge badge-coral text-[10px]">Confusion risk</span>
                )}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{entry.plainDefinition}</p>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-500">
                <p><span className="text-slate-600">Why it matters: </span>{entry.whyItMatters}</p>
                <p><span className="text-slate-600">Where it shows up: </span>{entry.whereItShowsUp}</p>
              </div>
              {entry.confusionRisk && (
                <p className="text-xs text-[color:#e11d48] bg-[color:#e11d48]/10 border border-[color:#e11d48]/30 rounded-lg px-3 py-2 leading-relaxed">
                  {entry.confusionRisk}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Case patterns */}
      {subTab === 'cases' && (
        <div className="space-y-3">
          {plan.casePatterns.length === 0 && (
            <p className="text-sm text-slate-500">No case patterns were generated.</p>
          )}
          {plan.casePatterns.map(pattern => (
            <div key={pattern.patternName} className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="w-full h-0.5 bg-cyan-600" />
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{pattern.patternName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{pattern.domainContext}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="overline text-[color:#0284c7]">Clues in scenario</p>
                    <ul className="space-y-1">
                      {pattern.cluesInScenario.map(clue => (
                        <li key={clue} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-[color:#0284c7] mt-0.5 shrink-0" />
                          <span className="text-xs text-slate-600">{clue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <p className="overline text-[color:#d97706]">Likely question angle</p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{pattern.likelyQuestionAngle}</p>
                    </div>
                    <div>
                      <p className="overline text-[color:#e11d48]">Common mistake</p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{pattern.commonMistake}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Weekly plan ─────────────────────────────────────────────────────────

function TabWeekly({ plan }: { plan: StudyPlanDocumentV2 }) {
  const [activeWeek, setActiveWeek] = useState<number>(plan.weeklyStudyPlan[0]?.weekNumber ?? 1);
  const week = plan.weeklyStudyPlan.find(w => w.weekNumber === activeWeek) ?? plan.weeklyStudyPlan[0];

  if (!week) return <p className="text-sm text-slate-500">No weekly plan was generated.</p>;

  const totalWeekMinutes = week.sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="space-y-4">
      {/* Week selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {plan.weeklyStudyPlan.map(w => (
          <button
            key={w.weekNumber}
            onClick={() => setActiveWeek(w.weekNumber)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
              w.weekNumber === activeWeek
                ? 'bg-indigo-50 border-indigo-300 text-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Week {w.weekNumber}
          </button>
        ))}
      </div>

      {/* Week header card */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900">
              Week {week.weekNumber}
              {week.datesLabel && <span className="text-slate-500 font-normal"> · {week.datesLabel}</span>}
            </p>
            <p className="text-xs text-[color:#0284c7] mt-0.5">{week.clusterFocus}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-slate-600">{totalWeekMinutes} min</p>
            <p className="text-[10px] text-slate-600 mt-0.5">this week</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{week.weekGoal}</p>
      </div>

      {/* Sessions as day cards */}
      <div className="space-y-2">
        {week.sessions.map(session => {
          const tag = sessionTypeTag(session.sessionType);
          return (
            <div key={session.sessionLabel} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`${tag.cls} text-[10px]`}>{tag.label}</span>
                  <p className="text-xs font-semibold text-slate-700">{session.sessionLabel}</p>
                </div>
                <span className="text-xs text-slate-500 shrink-0">{session.durationMinutes} min</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{session.focus}</p>
              {session.tasks.length > 0 && (
                <ul className="space-y-1">
                  {session.tasks.map(task => (
                    <li key={task} className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" />
                      <span className="text-xs text-slate-500">{task}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Week checkpoint */}
      <div className="p-3 bg-[color:#7c3aed]/10 border border-[color:#7c3aed]/30 rounded-xl">
        <p className="text-xs text-[color:#7c3aed]">
          <span className="font-semibold">Checkpoint: </span>{week.checkpointQuestion}
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Milestones ──────────────────────────────────────────────────────────

function TabMilestones({ plan }: { plan: StudyPlanDocumentV2 }) {
  const cp = plan.checkpointLogic;

  const milestones = [
    { label: 'Week 2 check', content: cp.week2Check, color: 'cyan', icon: <Clock className="w-4 h-4 text-[color:#0284c7]" /> },
    { label: 'Midpoint assessment', content: cp.midpointAssessment, color: 'blue', icon: <BarChart3 className="w-4 h-4 text-blue-600" /> },
    { label: 'Shift signal', content: cp.shiftSignal, color: 'amber', icon: <AlertTriangle className="w-4 h-4 text-[color:#d97706]" /> },
    { label: 'Readiness signal', content: cp.readinessSignal, color: 'emerald', icon: <CheckCircle className="w-4 h-4 text-[color:#059669]" /> },
  ] as const;

  const colorMap: Record<string, string> = {
    cyan:    'bg-[color:#0284c7]/10 border-[color:#0284c7]/30',
    blue:    'bg-blue-50 border-blue-200',
    amber:   'bg-[color:#d97706]/10 border-[color:#d97706]/30',
    emerald: 'bg-[color:#059669]/10 border-[color:#059669]/30',
  };

  const lineMap: Record<string, string> = {
    cyan: 'bg-[color:#0284c7]/100', blue: 'bg-blue-500', amber: 'bg-[color:#d97706]/100', emerald: 'bg-[color:#059669]/100',
  };

  return (
    <div className="space-y-4">
      <p className="overline">Progress checkpoints</p>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-8 bottom-8 w-px bg-slate-200" />

        <div className="space-y-4">
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-4">
              <div className={`relative z-10 w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[m.color]}`}>
                {m.icon}
              </div>
              <div className={`flex-1 p-4 rounded-2xl border ${colorMap[m.color]} space-y-1.5`}>
                <div className={`w-16 h-0.5 rounded-full ${lineMap[m.color]}`} />
                <p className="overline">{m.label}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main viewer ───────────────────────────────────────────────────────────────

export default function StudyPlanViewer({ plan }: StudyPlanViewerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const generatedDate = new Date(plan.generatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="study-plan-viewer">
      <style>{`
        @media print {
          header, nav, aside, [role="navigation"], .sidebar,
          .study-plan-tab-bar, .study-plan-print-button {
            display: none !important;
          }
          main, .study-plan-viewer { display: block !important; max-width: none !important; overflow: visible !important; }
          body, main { background: white !important; color: black !important; }
          .study-plan-viewer { border: none !important; box-shadow: none !important; background: white !important; }
        }
      `}</style>

      {/* Plan sub-header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="text-xs text-slate-500">
          Generated {generatedDate} · {plan.sourceSummary.assessmentResponseCount} responses ·{' '}
          {plan.sourceSummary.deficitSkillCount} deficit skill{plan.sourceSummary.deficitSkillCount !== 1 ? 's' : ''}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="study-plan-print-button flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-slate-900 rounded-xl text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      </div>

      {/* Two-column layout: main + side rail */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tab bar */}
          <div className="study-plan-tab-bar overflow-x-auto">
            <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl min-w-max">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
                    activeTab === tab.id
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'overview'   && <TabOverview plan={plan} />}
            {activeTab === 'priorities' && <TabPriorities plan={plan} />}
            {activeTab === 'domains'    && <TabDomains plan={plan} />}
            {activeTab === 'concepts'   && <TabConcepts plan={plan} />}
            {activeTab === 'weekly'     && <TabWeekly plan={plan} />}
            {activeTab === 'milestones' && <TabMilestones plan={plan} />}
          </div>
        </div>

        {/* Side rail */}
        <div className="lg:w-64 xl:w-72 shrink-0">
          <SideRail plan={plan} />
        </div>
      </div>
    </div>
  );
}
