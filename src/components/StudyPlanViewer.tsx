import { ReactNode, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Layers,
  Minus,
  Printer,
  Sparkles,
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

function statusColor(status: StudentSkillStatus): string {
  switch (status) {
    case 'unlearned':    return 'bg-slate-700/60 text-slate-400 border-slate-600/50';
    case 'misconception': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    case 'unstable':     return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'developing':   return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'near_mastery': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    case 'mastered':     return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
}


function urgencyColor(urgency: ClusterUrgency): string {
  switch (urgency) {
    case 'urgent_now':    return 'bg-rose-500/15 text-rose-300 border-rose-500/25';
    case 'important_next': return 'bg-amber-500/15 text-amber-300 border-amber-500/25';
    case 'maintain':      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25';
  }
}

function urgencyLabel(urgency: ClusterUrgency): string {
  switch (urgency) {
    case 'urgent_now':    return 'Urgent';
    case 'important_next': return 'Important';
    case 'maintain':      return 'Maintain';
  }
}

function readinessColor(level: 'early' | 'developing' | 'approaching' | 'ready'): string {
  switch (level) {
    case 'early':      return 'text-rose-300';
    case 'developing': return 'text-amber-300';
    case 'approaching': return 'text-cyan-300';
    case 'ready':      return 'text-emerald-300';
  }
}

function readinessBg(level: 'early' | 'developing' | 'approaching' | 'ready'): string {
  switch (level) {
    case 'early':      return 'bg-rose-500/10 border-rose-500/25';
    case 'developing': return 'bg-amber-500/10 border-amber-500/25';
    case 'approaching': return 'bg-cyan-500/10 border-cyan-500/25';
    case 'ready':      return 'bg-emerald-500/10 border-emerald-500/25';
  }
}

function sessionTypeLabel(type: SessionType): string {
  switch (type) {
    case 'vocabulary':       return 'Vocabulary';
    case 'concept-review':   return 'Concept Review';
    case 'case-practice':    return 'Case Practice';
    case 'mixed-retrieval':  return 'Mixed Retrieval';
    case 'wrong-answer-review': return 'Wrong-Answer Review';
  }
}

function sessionTypeColor(type: SessionType): string {
  switch (type) {
    case 'vocabulary':       return 'bg-violet-500/15 text-violet-300';
    case 'concept-review':   return 'bg-blue-500/15 text-blue-300';
    case 'case-practice':    return 'bg-amber-500/15 text-amber-300';
    case 'mixed-retrieval':  return 'bg-cyan-500/15 text-cyan-300';
    case 'wrong-answer-review': return 'bg-rose-500/15 text-rose-300';
  }
}

function TrendIcon({ trend }: { trend: TrendDirection }) {
  if (trend === 'improving')  return <ArrowUp   className="w-3.5 h-3.5 text-emerald-400" />;
  if (trend === 'declining')  return <ArrowDown className="w-3.5 h-3.5 text-rose-400" />;
  if (trend === 'flat')       return <Minus     className="w-3.5 h-3.5 text-slate-400" />;
  return null; // insufficient_data
}

// ─── Section shell ─────────────────────────────────────────────────────────────

type SectionKey =
  | 'snapshot'
  | 'interpretation'
  | 'clusters'
  | 'tactical'
  | 'domains'
  | 'vocabulary'
  | 'casePatterns'
  | 'weeklyPlan'
  | 'checkpoints';

interface SectionProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  sectionKey: SectionKey;
  isOpen: boolean;
  onToggle: (key: SectionKey) => void;
  children: ReactNode;
}

function ViewerSection({ title, subtitle, icon, sectionKey, isOpen, onToggle, children }: SectionProps) {
  return (
    <section className="study-plan-section border border-slate-700/40 bg-slate-800/40 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="study-plan-section-toggle w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-slate-400">{icon}</span>
          <div>
            <p className="text-base font-semibold text-slate-100">{title}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {isOpen
          ? <ChevronUp   className="w-4 h-4 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>
      <div className={`study-plan-section-content ${isOpen ? 'block' : 'hidden'} px-5 pb-5`}>
        {children}
      </div>
    </section>
  );
}

// ─── Main viewer ───────────────────────────────────────────────────────────────

export default function StudyPlanViewer({ plan }: StudyPlanViewerProps) {
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    snapshot:       true,
    interpretation: true,
    clusters:       true,
    tactical:       true,
    domains:        false,
    vocabulary:     false,
    casePatterns:   false,
    weeklyPlan:     false,
    checkpoints:    false,
  });

  const toggle = (key: SectionKey) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const generatedDate = new Date(plan.generatedAt).toLocaleString();

  const { readinessSnapshot: snap, dataInterpretation: interp } = plan;

  return (
    <div className="study-plan-viewer space-y-5">
      <style>{`
        @media print {
          header, nav, aside, [role="navigation"], .sidebar,
          .study-plan-section-toggle, .study-plan-print-button,
          .study-plan-app-actions { display: none !important; }

          main, .study-plan-viewer, .study-plan-section,
          .study-plan-section-content {
            display: block !important;
            max-width: none !important;
            overflow: visible !important;
          }

          body, main { background: white !important; color: black !important; }

          .study-plan-viewer, .study-plan-section, .study-plan-print-surface {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }

          .study-plan-section { page-break-inside: avoid; margin-bottom: 16px !important; }
          .study-plan-section-content { padding: 0 0 8px 0 !important; }
        }
      `}</style>

      {/* Header */}
      <div className="study-plan-print-surface flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Personalized Study Plan</p>
              <p className="text-xs text-slate-500">Generated {generatedDate}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 pl-[52px]">
            Based on {plan.sourceSummary.assessmentResponseCount} responses across {plan.sourceSummary.domainScoreCount} domains
            · {plan.sourceSummary.deficitSkillCount} deficit skill{plan.sourceSummary.deficitSkillCount !== 1 ? 's' : ''} identified
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="study-plan-print-button px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 transition-colors flex items-center gap-2 text-sm"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* 1 — Readiness Snapshot */}
      <ViewerSection
        title="Readiness Snapshot"
        subtitle={snap.testTimeline ?? undefined}
        icon={<Target className="w-4 h-4" />}
        sectionKey="snapshot"
        isOpen={openSections.snapshot}
        onToggle={toggle}
      >
        <div className="pt-1 space-y-4">
          <div className={`p-4 rounded-2xl border ${readinessBg(snap.readinessLevel)}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-200 leading-6">{snap.summary}</p>
              <span className={`shrink-0 text-sm font-bold uppercase tracking-wider ${readinessColor(snap.readinessLevel)}`}>
                {snap.readinessLevel.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl space-y-1">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Strongest Area</p>
              <p className="text-sm font-semibold text-emerald-300">{snap.strongestArea}</p>
            </div>
            <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl space-y-1">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Next Best Move</p>
              <p className="text-sm font-semibold text-cyan-300">{snap.nextBestMove}</p>
            </div>
          </div>

          {snap.majorBlockers.length > 0 && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Major Blockers
              </p>
              <ul className="space-y-1">
                {snap.majorBlockers.map(blocker => (
                  <li key={blocker} className="text-sm text-slate-300 flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                    {blocker}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ViewerSection>

      {/* 2 — Data Interpretation */}
      <ViewerSection
        title="What Your Data Suggests"
        subtitle={interp.headline}
        icon={<Brain className="w-4 h-4" />}
        sectionKey="interpretation"
        isOpen={openSections.interpretation}
        onToggle={toggle}
      >
        <div className="pt-1 space-y-4">
          {interp.urgentInsights.length > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Needs Immediate Attention
              </p>
              <ul className="space-y-1.5">
                {interp.urgentInsights.map(insight => (
                  <li key={insight} className="text-sm text-slate-200 flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Observed Patterns</p>
            <ul className="space-y-2">
              {interp.patterns.map(pattern => (
                <li key={pattern} className="p-3 bg-slate-800/50 border border-slate-700/40 rounded-xl text-sm text-slate-300 flex items-start gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                  {pattern}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ViewerSection>

      {/* 3 — Priority Clusters */}
      <ViewerSection
        title="Learning Priorities"
        subtitle={`${plan.priorityClusters.length} cluster${plan.priorityClusters.length !== 1 ? 's' : ''} · sorted by urgency`}
        icon={<Layers className="w-4 h-4" />}
        sectionKey="clusters"
        isOpen={openSections.clusters}
        onToggle={toggle}
      >
        <div className="pt-1 space-y-4">
          {plan.priorityClusters.map(cluster => (
            <div key={cluster.clusterName} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{cluster.clusterName}</p>
                  {cluster.allocatedMinutes > 0 && (
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {cluster.allocatedMinutes} min allocated
                    </p>
                  )}
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${urgencyColor(cluster.urgency)}`}>
                  {urgencyLabel(cluster.urgency)}
                </span>
              </div>

              <p className="text-sm text-slate-300">{cluster.whyItMatters}</p>

              {cluster.blockingNote && (
                <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                  {cluster.blockingNote}
                </p>
              )}

              {/* Skills grid */}
              <div className="flex flex-wrap gap-2">
                {cluster.skills.map(skill => (
                  <div
                    key={skill.skillId}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs ${statusColor(skill.status)}`}
                    title={`${skill.skillId} · ${skill.accuracy !== null ? `${skill.accuracy}%` : 'No data'}`}
                  >
                    <TrendIcon trend={skill.trend} />
                    <span className="font-medium">{skill.skillName}</span>
                    <span className="opacity-60">
                      {skill.accuracy !== null ? `${skill.accuracy}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>

              {cluster.recommendedContentTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {cluster.recommendedContentTypes.map(ct => (
                    <span key={ct} className="px-2 py-0.5 rounded-full text-xs bg-slate-700/60 text-slate-400 border border-slate-600/40">
                      {ct}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ViewerSection>

      {/* 4 — Tactical Instructions (shown early, high value) */}
      <ViewerSection
        title="Action Plan"
        subtitle="What to do right now"
        icon={<Flag className="w-4 h-4" />}
        sectionKey="tactical"
        isOpen={openSections.tactical}
        onToggle={toggle}
      >
        <div className="pt-1 grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-rose-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Do Right Now
            </p>
            <ul className="space-y-1.5">
              {plan.tacticalInstructions.immediateActions.map(action => (
                <li key={action} className="text-sm text-slate-300 flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-400 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              This Week's Goals
            </p>
            <ul className="space-y-1.5">
              {plan.tacticalInstructions.thisWeekGoals.map(goal => (
                <li key={goal} className="text-sm text-slate-300 flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                  {goal}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Avoid
            </p>
            <ul className="space-y-1.5">
              {plan.tacticalInstructions.avoidList.map(item => (
                <li key={item} className="text-sm text-slate-300 flex items-start gap-2">
                  <Minus className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ViewerSection>

      {/* 5 — Domain Study Maps */}
      <ViewerSection
        title="Domain Study Maps"
        subtitle={`${plan.domainStudyMaps.length} domain${plan.domainStudyMaps.length !== 1 ? 's' : ''}`}
        icon={<BookOpen className="w-4 h-4" />}
        sectionKey="domains"
        isOpen={openSections.domains}
        onToggle={toggle}
      >
        <div className="pt-1 space-y-4">
          {plan.domainStudyMaps.map(domain => (
            <div key={domain.domainId} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{domain.domainName}</p>
                  <p className="text-xs text-slate-500">Domain {domain.domainId}</p>
                </div>
                <span className="text-sm font-bold text-cyan-300">
                  {domain.domainScore !== null ? `${domain.domainScore}%` : 'N/A'}
                </span>
              </div>

              <p className="text-sm text-slate-300">{domain.interpretation}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                {domain.contentToKnow.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase tracking-[0.12em]">Content to Know</p>
                    <ul className="space-y-1">
                      {domain.contentToKnow.map(item => (
                        <li key={item} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <ArrowRight className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {domain.commonTraps.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-rose-400 uppercase tracking-[0.12em]">Common Traps</p>
                    <ul className="space-y-1">
                      {domain.commonTraps.map(trap => (
                        <li key={trap} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
                          {trap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {domain.caseTypesToRecognize.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-amber-400 uppercase tracking-[0.12em]">Case Types to Recognize</p>
                    <ul className="space-y-1">
                      {domain.caseTypesToRecognize.map(c => (
                        <li key={c} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <ArrowRight className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {domain.keyVocabulary.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-violet-400 uppercase tracking-[0.12em]">Key Vocabulary</p>
                    <div className="flex flex-wrap gap-1">
                      {domain.keyVocabulary.map(term => (
                        <span key={term} className="px-2 py-0.5 rounded-full text-xs bg-violet-500/15 text-violet-300 border border-violet-500/20">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                <span className="font-semibold">Mastery signal: </span>{domain.masteryIndicator}
              </p>
            </div>
          ))}
        </div>
      </ViewerSection>

      {/* 6 — Vocabulary */}
      <ViewerSection
        title="Vocabulary to Master"
        subtitle={`${plan.vocabulary.length} term${plan.vocabulary.length !== 1 ? 's' : ''}`}
        icon={<BookOpen className="w-4 h-4" />}
        sectionKey="vocabulary"
        isOpen={openSections.vocabulary}
        onToggle={toggle}
      >
        <div className="pt-1 space-y-3">
          {plan.vocabulary.length === 0 && (
            <p className="text-sm text-slate-400">No vocabulary entries were generated.</p>
          )}
          {plan.vocabulary.map(entry => (
            <div key={entry.term} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-violet-300">{entry.term}</p>
                {entry.confusionRisk && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-xs bg-rose-500/15 text-rose-300 border border-rose-500/20">
                    Confusion risk
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-200">{entry.plainDefinition}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <p className="text-xs text-slate-400">
                  <span className="text-slate-500">Why it matters: </span>{entry.whyItMatters}
                </p>
                <p className="text-xs text-slate-400">
                  <span className="text-slate-500">Where it shows up: </span>{entry.whereItShowsUp}
                </p>
              </div>
              {entry.confusionRisk && (
                <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                  {entry.confusionRisk}
                </p>
              )}
            </div>
          ))}
        </div>
      </ViewerSection>

      {/* 7 — Case Patterns */}
      <ViewerSection
        title="Case Patterns to Recognize"
        subtitle={`${plan.casePatterns.length} pattern${plan.casePatterns.length !== 1 ? 's' : ''}`}
        icon={<Brain className="w-4 h-4" />}
        sectionKey="casePatterns"
        isOpen={openSections.casePatterns}
        onToggle={toggle}
      >
        <div className="pt-1 space-y-4">
          {plan.casePatterns.length === 0 && (
            <p className="text-sm text-slate-400">No case patterns were generated.</p>
          )}
          {plan.casePatterns.map(pattern => (
            <div key={pattern.patternName} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">{pattern.patternName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{pattern.domainContext}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-cyan-400 uppercase tracking-[0.12em]">Clues in Scenario</p>
                  <ul className="space-y-1">
                    {pattern.cluesInScenario.map(clue => (
                      <li key={clue} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                        {clue}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-amber-400 uppercase tracking-[0.12em]">Likely Question Angle</p>
                    <p className="text-xs text-slate-300 mt-1">{pattern.likelyQuestionAngle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-rose-400 uppercase tracking-[0.12em]">Common Mistake</p>
                    <p className="text-xs text-slate-300 mt-1">{pattern.commonMistake}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ViewerSection>

      {/* 8 — Weekly Study Plan */}
      <ViewerSection
        title="Weekly Study Plan"
        subtitle={`${plan.weeklyStudyPlan.length} week${plan.weeklyStudyPlan.length !== 1 ? 's' : ''}`}
        icon={<CalendarDays className="w-4 h-4" />}
        sectionKey="weeklyPlan"
        isOpen={openSections.weeklyPlan}
        onToggle={toggle}
      >
        <div className="pt-1 space-y-5">
          {plan.weeklyStudyPlan.length === 0 && (
            <p className="text-sm text-slate-400">No weekly plan was generated.</p>
          )}
          {plan.weeklyStudyPlan.map(week => (
            <div key={week.weekNumber} className="border border-slate-700/40 rounded-2xl overflow-hidden">
              {/* Week header */}
              <div className="px-4 py-3 bg-slate-800/70 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Week {week.weekNumber}
                    {week.datesLabel && <span className="text-slate-400 font-normal"> · {week.datesLabel}</span>}
                  </p>
                  <p className="text-xs text-cyan-300 mt-0.5">{week.clusterFocus}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">{week.allocatedMinutes} min</p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-300">{week.weekGoal}</p>

                {/* Sessions */}
                <div className="space-y-2">
                  {week.sessions.map(session => (
                    <div key={session.sessionLabel} className="p-3 bg-slate-800/60 border border-slate-700/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sessionTypeColor(session.sessionType)}`}>
                            {sessionTypeLabel(session.sessionType)}
                          </span>
                          <p className="text-xs font-medium text-slate-300">{session.sessionLabel}</p>
                        </div>
                        <span className="text-xs text-slate-500 shrink-0">{session.durationMinutes} min</span>
                      </div>
                      <p className="text-xs text-slate-400">{session.focus}</p>
                      {session.tasks.length > 0 && (
                        <ul className="space-y-0.5">
                          {session.tasks.map(task => (
                            <li key={task} className="text-xs text-slate-400 flex items-start gap-1.5">
                              <ArrowRight className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                  <p className="text-xs text-violet-300">
                    <span className="font-semibold">Checkpoint: </span>{week.checkpointQuestion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ViewerSection>

      {/* 9 — Checkpoint Logic */}
      <ViewerSection
        title="Progress Checkpoints"
        subtitle="How to know when to adjust"
        icon={<CheckCircle className="w-4 h-4" />}
        sectionKey="checkpoints"
        isOpen={openSections.checkpoints}
        onToggle={toggle}
      >
        <div className="pt-1 grid gap-3 sm:grid-cols-2">
          <div className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-400">Week 2 Check</p>
            <p className="text-sm text-slate-300">{plan.checkpointLogic.week2Check}</p>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-400">Midpoint Assessment</p>
            <p className="text-sm text-slate-300">{plan.checkpointLogic.midpointAssessment}</p>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-amber-400">Shift Signal</p>
            <p className="text-sm text-slate-300">{plan.checkpointLogic.shiftSignal}</p>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-emerald-400">Readiness Signal</p>
            <p className="text-sm text-slate-300">{plan.checkpointLogic.readinessSignal}</p>
          </div>
        </div>
      </ViewerSection>
    </div>
  );
}
