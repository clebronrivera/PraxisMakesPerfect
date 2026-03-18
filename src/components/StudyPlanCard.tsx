import { useState } from 'react';
import { AlertTriangle, BookOpen, ChevronRight, Clock, RefreshCw, Sparkles } from 'lucide-react';
import { StudyPlanDocumentV2, StudyConstraints, StudyPlanHistoryEntry } from '../services/studyPlanService';
import StudyConstraintsForm from './StudyConstraintsForm';
import StudyPlanViewer from './StudyPlanViewer';

interface StudyPlanCardProps {
  history: StudyPlanHistoryEntry[];
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;
  canGenerate: boolean;
  onGenerate: (constraints: StudyConstraints) => void;
}

function readinessLabel(level: StudyPlanDocumentV2['readinessSnapshot']['readinessLevel']): string {
  switch (level) {
    case 'early':      return 'Early';
    case 'developing': return 'Developing';
    case 'approaching': return 'Approaching';
    case 'ready':      return 'Ready';
  }
}

function readinessBadgeClass(level: StudyPlanDocumentV2['readinessSnapshot']['readinessLevel']): string {
  switch (level) {
    case 'early':      return 'bg-rose-500/15 text-rose-300 border-rose-500/25';
    case 'developing': return 'bg-amber-500/15 text-amber-300 border-amber-500/25';
    case 'approaching': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25';
    case 'ready':      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25';
  }
}

export default function StudyPlanCard({
  history,
  isGenerating,
  isLoading,
  error,
  canGenerate,
  onGenerate
}: StudyPlanCardProps) {
  const [constraints, setConstraints] = useState<StudyConstraints>({
    studyDaysPerWeek:  5,
    minutesPerSession: 45,
    weekendMinutes:    60,
    intensity:         'moderate',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default to the most recent plan
  const activePlan = history.find(e => e.id === selectedId)?.plan ?? history[0]?.plan ?? null;

  const buttonLabel = isGenerating
    ? 'Generating Study Guide...'
    : history.length > 0
      ? 'Regenerate Study Guide'
      : 'Generate Study Guide';

  return (
    <section className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-6 shadow-lg">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">AI Study Guide</h3>
              <p className="text-sm text-slate-400">
                Evidence-based study plan built from your performance data — clusters, vocabulary, case patterns, and a real weekly schedule.
              </p>
            </div>
          </div>
          {!canGenerate && (
            <p className="text-sm text-amber-300">
              Complete the screener and at least one full assessment to unlock this guide.
            </p>
          )}
        </div>

        <button
          onClick={() => onGenerate(constraints)}
          disabled={!canGenerate || isGenerating || isLoading}
          className={`px-5 py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 min-w-[220px] ${
            !canGenerate || isGenerating || isLoading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-white text-slate-950 hover:bg-slate-100'
          }`}
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
          <span>{buttonLabel}</span>
        </button>
      </div>

      {/* Study settings — always optional, collapsed by default */}
      {canGenerate && (
        <StudyConstraintsForm value={constraints} onChange={setConstraints} />
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-300 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-rose-200">{error}</p>
          </div>
          <button
            onClick={() => onGenerate(constraints)}
            disabled={!canGenerate || isGenerating}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-400 disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && history.length === 0 && !error && (
        <div className="p-5 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-sm text-slate-400">
          Loading your study guides...
        </div>
      )}

      {/* History list — shown when there are multiple entries */}
      {history.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Past Generations</p>
          <div className="space-y-1.5">
            {history.map((entry, i) => {
              const snap = entry.plan.readinessSnapshot;
              const isActive = entry.id === (selectedId ?? history[0]?.id);
              const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });
              const time = new Date(entry.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit',
              });
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedId(entry.id)}
                  className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between gap-3 transition-all text-left ${
                    isActive
                      ? 'bg-slate-800/80 border-cyan-500/40'
                      : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${readinessBadgeClass(snap.readinessLevel)}`}>
                      {readinessLabel(snap.readinessLevel)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {date}
                        {i === 0 && <span className="ml-2 text-xs text-cyan-400">latest</span>}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {time} · {entry.plan.sourceSummary.deficitSkillCount} deficit skill{entry.plan.sourceSummary.deficitSkillCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active plan viewer */}
      {activePlan && <StudyPlanViewer plan={activePlan} />}
    </section>
  );
}
