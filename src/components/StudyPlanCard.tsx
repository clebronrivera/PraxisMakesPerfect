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
    <section className="editorial-surface overflow-hidden">
      {/* ── Hero header ── */}
      <div className="border-b border-slate-200 bg-[#fbfaf7] px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Study Guide</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Personalized plan from your performance data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:shrink-0">
            {/* Settings toggle */}
            {canGenerate && (
              <button
                onClick={() => setSettingsOpen(o => !o)}
                className="editorial-button-secondary px-3 py-2 text-xs"
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
                  ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                  : 'editorial-button-primary'
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
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-2">
            <p className="font-semibold">Complete the screener + full diagnostic to unlock your guide.</p>
            <p className="text-amber-700 leading-relaxed">Once unlocked, Claude analyzes your performance data and builds a fully personalized plan that includes:</p>
            <ul className="mt-1 space-y-1 text-amber-700">
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />Readiness snapshot with your current level (Early → Ready)</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />Priority skill clusters ranked by urgency</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />Domain-by-domain study maps with targeted tactics</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />Weekly study schedule based on your time budget</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />Key vocabulary, case patterns, and checkpoint logic</li>
            </ul>
          </div>
        )}

        {/* Generating status */}
        {isGenerating && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Generating your study plan — this takes about a minute…
          </div>
        )}
      </div>

      {/* ── Settings panel (collapsible) ── */}
      {canGenerate && settingsOpen && (
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <StudyConstraintsForm value={constraints} onChange={setConstraints} />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mx-5 mt-4 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-rose-700">{error}</p>
          </div>
          <button
            onClick={() => onGenerate(constraints)}
            disabled={!canGenerate || isGenerating}
            className="shrink-0 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-40"
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
                      ? 'border-amber-300 bg-amber-50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-slate-700'
                  }`}
                >
                  <span className={readinessBadgeCls(snap.readinessLevel)}>{readinessLabel(snap.readinessLevel)}</span>
                  <span>{date}</span>
                  {i === 0 && <span className="font-semibold text-amber-700">latest</span>}
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
                <Clock className="w-3.5 h-3.5 text-amber-700" />
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
