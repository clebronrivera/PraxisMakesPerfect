import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { UserProfile } from '../hooks/useFirebaseProgress';
import { useEngine } from '../hooks/useEngine';

// Interface removed

const getReadinessLevel = (score: number) => {
  if (score >= 0.85) return { label: 'Ready', color: 'text-emerald-400', stroke: '#10B981' };
  if (score >= 0.70) return { label: 'Approaching', color: 'text-blue-400', stroke: '#3B82F6' };
  if (score >= 0.50) return { label: 'Emerging', color: 'text-amber-400', stroke: '#F59E0B' };
  return { label: 'Not Ready', color: 'text-red-400', stroke: '#EF4444' };
};

interface ScreenerResultsProps {
  profile: UserProfile;
  onStartPractice?: (domainId?: number) => void;
  onTakeFullDiagnostic?: () => void;
  onGoHome?: () => void;
}

export default function ScreenerResults({
  profile,
  onStartPractice,
  onTakeFullDiagnostic,
  onGoHome
}: ScreenerResultsProps) {
  const engine = useEngine();

  const performanceData = useMemo(() => {
    const assessmentScores = Object.entries(profile.domainScores ?? {})
      .map(([id, rawScore]) => {
        const score = rawScore as { correct: number; total: number };
        if (typeof score?.correct !== 'number' || typeof score?.total !== 'number' || score.total <= 0) {
          return null;
        }

        const domain = engine.domains.find(d => String(d.id) === id);
        if (!domain) {
          return null;
        }

        return {
          id,
          name: domain.name || `Domain ${id}`,
          score: score.correct / score.total
        };
      })
      .filter((score): score is { id: string; name: string; score: number } => score !== null);

    if (assessmentScores.length > 0) {
      const sorted = [...assessmentScores].sort((a, b) => b.score - a.score);
      const overallScore = assessmentScores.reduce((acc, curr) => acc + curr.score, 0) / assessmentScores.length;
      
      return {
        overallScore,
        strongest: sorted[0],
        weakest: sorted[sorted.length - 1],
        readiness: getReadinessLevel(overallScore)
      };
    }

    const screenerScores = Object.entries(profile.screenerResults?.domain_scores ?? {})
      .map(([id, rawScore]) => {
        const score = Number(rawScore);
        const domain = engine.domains.find(d => String(d.id) === id);
        if (!domain || Number.isNaN(score)) {
          return null;
        }

        return {
          id,
          name: domain.name || `Domain ${id}`,
          score: score / 100
        };
      })
      .filter((score): score is { id: string; name: string; score: number } => score !== null);

    if (screenerScores.length === 0) {
      return null;
    }

    const sorted = [...screenerScores].sort((a, b) => b.score - a.score);
    const overallScore = screenerScores.reduce((acc, curr) => acc + curr.score, 0) / screenerScores.length;
    
    return {
      overallScore,
      strongest: sorted[0],
      weakest: sorted[sorted.length - 1],
      readiness: getReadinessLevel(overallScore)
    };
  }, [engine.domains, profile.domainScores, profile.screenerResults]);

  if (!performanceData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <Activity className="w-12 h-12 text-slate-500" />
        <p className="text-slate-300">Readiness data is not available for this assessment yet.</p>
        <p className="text-sm text-slate-500">Try returning home and reopening the report, or continue with practice.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {onStartPractice && (
            <button
              onClick={() => onStartPractice()}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all"
            >
              Start Practice
            </button>
          )}
          <button
            onClick={() => {
              if (onGoHome) {
                onGoHome();
                return;
              }

              window.location.reload();
            }}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-all border border-slate-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const { readiness, overallScore } = performanceData;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Diagnostic Snapshot</h2>
        <p className="text-slate-400">Your initial assessment is complete</p>
      </div>

      {/* Readiness Gauge */}
      <div className="relative flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden group">
        {/* Glow effect */}
        <div 
          className="absolute inset-0 opacity-[0.03] blur-3xl transition-opacity duration-1000 group-hover:opacity-[0.07]"
          style={{ backgroundColor: readiness.stroke }}
        />
        
        <div className="relative w-56 h-56">
          <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
            {/* Background circle */}
            <circle
              cx="112"
              cy="112"
              r="94"
              fill="none"
              stroke="#1e293b"
              strokeWidth="16"
            />
            {/* Progress circle */}
            <circle
              cx="112"
              cy="112"
              r="94"
              fill="none"
              stroke={readiness.stroke}
              strokeWidth="16"
              strokeDasharray={590.6}
              strokeDashoffset={590.6 * (1 - overallScore)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-4xl font-black uppercase tracking-tighter ${readiness.color}`}>
              {readiness.label}
            </span>
          </div>
        </div>
        
        <p className="mt-8 text-slate-400 text-sm font-medium uppercase tracking-widest">Overall Readiness</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-3 pt-8">
        {onStartPractice && (
          <button
            onClick={() => onStartPractice()}
            className="w-full max-w-sm py-5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
          >
            Start Practice
          </button>
        )}
        {onTakeFullDiagnostic && (
          <button
            onClick={onTakeFullDiagnostic}
            className="w-full max-w-sm py-4 px-6 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-2xl font-bold transition-all border border-slate-700"
          >
            Take Full Assessment
          </button>
        )}
        <button
          onClick={() => {
            if (onGoHome) {
              onGoHome();
              return;
            }

            window.location.reload();
          }}
          className="w-full max-w-sm py-5 px-6 bg-white text-slate-950 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-100 hover:shadow-xl hover:shadow-white/5 transition-all active:scale-[0.98]"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}
