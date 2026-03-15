import { AlertTriangle, BookOpen, RefreshCw, Sparkles } from 'lucide-react';
import { StudyPlanDocument } from '../services/studyPlanService';
import StudyPlanViewer from './StudyPlanViewer';

interface StudyPlanCardProps {
  plan: StudyPlanDocument | null;
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;
  canGenerate: boolean;
  onGenerate: () => void;
}

export default function StudyPlanCard({
  plan,
  isGenerating,
  isLoading,
  error,
  canGenerate,
  onGenerate
}: StudyPlanCardProps) {
  const buttonLabel = isGenerating
    ? 'Generating Study Guide...'
    : plan
      ? 'Regenerate Study Guide'
      : 'Generate Study Guide';

  return (
    <section className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-6 shadow-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">AI Study Guide</h3>
              <p className="text-sm text-slate-400">
                Generate a personalized plan with vocabulary gaps, foundational review, study resources, and a mastery checklist from your screener, full assessment, and global score data.
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
          onClick={onGenerate}
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

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-300 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-rose-200">{error}</p>
          </div>
          <button
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-400 disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && !plan && !error && (
        <div className="p-5 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-sm text-slate-400">
          Loading your most recent study guide...
        </div>
      )}

      {plan && <StudyPlanViewer plan={plan} />}
    </section>
  );
}
