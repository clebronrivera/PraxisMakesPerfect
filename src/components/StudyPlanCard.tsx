import { useState } from 'react';
import { AlertTriangle, BookOpen, ChevronDown, ChevronRight, ChevronUp, Clock, RefreshCw, Sparkles } from 'lucide-react';
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

function readinessBadgeCls(level: StudyPlanDocumentV2['readinessSnapshot']['readinessLevel']): string {
  switch (level) {
    case 'early':      return 'badge badge-coral';
    case 'developing': return 'badge badge-amber';
    case 'approaching': return 'badge badge-cyan';
    case 'ready':      return 'badge badge-mint';
  }
}

export default function StudyPlanCard({
  history,
  isGenerating,
  isLoading,
  error,
  canGenerate,
  onGenerate,
}: StudyPlanCardProps) {
  const [constraints, setConstraints] = useState<StudyConstraints>({
    studyDaysPerWeek:  5,
    minutesPerSession: 45,
    weekendMinutes:    60,
    intensity:         'moderate',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(true);

  const activePlan = history.find(e => e.id === selectedId)?.plan ?? history[0]?.plan ?? null;

  const buttonLabel = isGenerating
    ? 'Generating…'
    : history.length > 0
      ? 'Regenerate'
      : 'Generate study guide';

  return (
    <section className="border border-slate-800/50 rounded-3xl overflow-hidden shadow-card">
      {/* ── Hero header ── */}
      <div className="bg-gradient-to-br from-navy-800 to-navy-900 px-6 py-5 border-b border-slate-800/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">AI Study Guide</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Personalized plan from your performance data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:shrink-0">
            {/* Settings toggle */}
            {canGenerate && (
              <button
                onClick={() => setSettingsOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium transition-colors"
              >
                Settings
                {settingsOpen
                  ? <ChevronUp className="w-3.5 h-3.5" />
                  : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Generate / Regenerate */}
            <button
              onClick={() => onGenerate(constraints)}
              disabled={!canGenerate || isGenerating || isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                !canGenerate || isGenerating || isLoading
                  ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-700/40'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-glow-cyan'
              }`}
            >
              {isGenerating
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <BookOpen className="w-3.5 h-3.5" />}
              {buttonLabel}
            </button>
          </div>
        </div>

        {/* Unlock notice */}
        {!canGenerate && (
          <p className="mt-3 text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/15 rounded-lg px-3 py-2">
            Complete the screener and at least one full assessment to unlock this guide.
          </p>
        )}

        {/* Generating status */}
        {isGenerating && (
          <div className="mt-3 flex items-center gap-2 text-xs text-cyan-300">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Generating your study plan — this takes about a minute…
          </div>
        )}
      </div>

      {/* ── Settings panel (collapsible) ── */}
      {canGenerate && settingsOpen && (
        <div className="px-6 py-4 bg-navy-900/60 border-b border-slate-800/40">
          <StudyConstraintsForm value={constraints} onChange={setConstraints} />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mx-5 mt-4 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-xs text-rose-200 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => onGenerate(constraints)}
            disabled={!canGenerate || isGenerating}
            className="px-3 py-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {isLoading && history.length === 0 && !error && (
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Loading your study guides…
          </div>
        </div>
      )}

      {/* ── History selector (when multiple) ── */}
      {history.length > 1 && (
        <div className="px-5 pt-4 space-y-2">
          <p className="overline">Past generations</p>
          <div className="flex flex-wrap gap-2">
            {history.map((entry, i) => {
              const snap = entry.plan.readinessSnapshot;
              const isActive = entry.id === (selectedId ?? history[0]?.id);
              const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric',
              });
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedId(entry.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                    isActive
                      ? 'bg-slate-800 border-cyan-500/30 text-slate-100'
                      : 'bg-navy-800/60 border-slate-800/50 text-slate-500 hover:text-slate-300 hover:border-slate-700/60'
                  }`}
                >
                  <span className={readinessBadgeCls(snap.readinessLevel)}>{readinessLabel(snap.readinessLevel)}</span>
                  <span>{date}</span>
                  {i === 0 && <span className="text-cyan-500 font-semibold">latest</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active plan viewer ── */}
      {activePlan && (
        <div className="px-5 py-5">
          {/* Plan header with toggle */}
          <div
            className="flex items-center justify-between gap-3 mb-4 cursor-pointer group"
            onClick={() => setPlanOpen(o => !o)}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-500">
                  {new Date(activePlan.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <span className={readinessBadgeCls(activePlan.readinessSnapshot.readinessLevel)}>
                {readinessLabel(activePlan.readinessSnapshot.readinessLevel)}
              </span>
            </div>
            <button className="text-slate-600 group-hover:text-slate-400 transition-colors">
              {planOpen
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {planOpen && <StudyPlanViewer plan={activePlan} />}
        </div>
      )}
    </section>
  );
}
