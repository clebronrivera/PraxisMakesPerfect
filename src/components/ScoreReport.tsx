import { Trophy, Clock, AlertTriangle, CheckCircle2, XCircle, BarChart3, Home, Timer, Zap, RotateCcw, Lightbulb } from 'lucide-react';
import { useEngine } from '../hooks/useEngine';
import type { Domain } from '../types/content';
import { detectWeaknesses, UserResponse } from '../brain/weakness-detector';
import { AnalyzedQuestion, getQuestionIdentifierLabel, getQuestionPrompt } from '../brain/question-analyzer';
import { getDomainColor } from '../utils/domainColors';
import { getDomainLabel } from '../utils/domainLabels';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { DEMONSTRATING_THRESHOLD, APPROACHING_THRESHOLD } from '../utils/skillProficiency';
import { downloadScoreReport } from '../utils/scoreReportGenerator';
import { loadSession, clearSession } from '../utils/sessionStorage';
import type { DiagnosticSummary } from '../types/diagnosticSummary';

interface ScoreReportProps {
  responses: UserResponse[];
  questions: AnalyzedQuestion[];
  totalTime: number;
  onStartPractice: (domainId?: number) => void;
  onRetakeAssessment: () => void;
  onGoHome: () => void;
  /**
   * Pre-built diagnostic summary. Optional — component falls back to deriving
   * scores inline from `responses` and `questions` when absent.
   * Confidence signals (interpretation, totalHighWrong) and missed concept panels
   * are now rendered when present. Concept-level analytics (conceptGaps,
   * crossSkillConceptGaps) remain deferred — they are null in the current wiring.
   */
  diagnosticSummary?: DiagnosticSummary;
}


const getScoreColor = (score: number) => {
  if (score >= DEMONSTRATING_THRESHOLD) return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= APPROACHING_THRESHOLD) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
  return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
};

export default function ScoreReport({
  responses,
  questions,
  totalTime,
  onStartPractice,
  onRetakeAssessment,
  onGoHome,
  diagnosticSummary,
}: ScoreReportProps) {
  const engine = useEngine();
  type DomainWithExtras = Domain & { keyConcepts?: string[] };
  const NASP_DOMAINS = engine.domains.reduce<Record<number, DomainWithExtras>>((acc, d) => ({ ...acc, [Number(d.id)]: d }), {});


  const { profile } = useProgressTracking();
  const hideRetake = Boolean(profile.screenerComplete && profile.fullAssessmentComplete);

  // Safety check: Handle missing or corrupted data
  if (!responses || responses.length === 0 || !questions || questions.length === 0) {
    // Try to recover from session storage if available
    const tryRecalculate = () => {
      const session = loadSession();
      if (session && session.responses && session.responses.length > 0) {
        // If we have raw responses, we could potentially recalculate
        // For now, just show recovery UI
        window.location.reload();
      } else {
        // No recovery possible, reset and go home
        clearSession();
        onGoHome();
      }
    };

    return (
      <div className="space-y-8">
        <div className="editorial-surface space-y-6 p-8 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <AlertTriangle className="h-8 w-8 text-rose-700" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Results Missing or Corrupted</h2>
            <p className="text-slate-500">
              We couldn't find your assessment results. This may happen if you refreshed the page or your session expired.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={tryRecalculate}
              className="editorial-button-primary w-full"
            >
              <RotateCcw className="w-4 h-4" />
              Try to Recalculate
            </button>
            <button
              onClick={() => {
                clearSession();
                onGoHome();
              }}
              className="editorial-button-secondary w-full"
            >
              <Home className="w-4 h-4" />
              Reset Attempt & Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // questionMap is always needed for longestQuestions (current-session timing data).
  const questionMap = new Map(questions.map(q => [q.id, q]));

  // ── Scores ──────────────────────────────────────────────────────────────────
  // Use diagnosticSummary when provided; fall back to inline computation from responses.
  const totalQuestions = diagnosticSummary?.totalQuestions ?? responses.length;
  const correctAnswers = diagnosticSummary?.correctAnswers
    ?? responses.filter(r => r.isCorrect).length;
  const overallScore = diagnosticSummary?.overallScore
    ?? (totalQuestions > 0 ? correctAnswers / totalQuestions : 0);
  const scorePercentage = Math.round(overallScore * 100);

  // ── Domain scores ──────────────────────────────────────────────────────────
  // When diagnosticSummary is present, use its pre-sorted domainSummaries (score asc).
  // Fallback: compute from responses.
  const domainArray: Array<{ domain: number; score: number; correct: number; total: number }> =
    diagnosticSummary
      ? diagnosticSummary.domainSummaries.map(d => ({
          domain: d.id,
          score: d.score,
          correct: d.correct,
          total: d.total,
        }))
      : (() => {
          const domainScores: Record<number, { correct: number; total: number }> = {};
          responses.forEach(response => {
            const question = questionMap.get(response.questionId);
            if (question) {
              question.domains?.forEach(domain => {
                if (!domainScores[domain]) domainScores[domain] = { correct: 0, total: 0 };
                domainScores[domain].total++;
                if (response.isCorrect) domainScores[domain].correct++;
              });
            }
          });
          return Object.entries(domainScores)
            .map(([domain, score]) => ({
              domain: parseInt(domain),
              score: score.total > 0 ? score.correct / score.total : 0,
              ...score,
            }))
            .sort((a, b) => a.score - b.score);
        })();

  // weakestDomains: highestNeedDomains already sorted score-asc; slice to 3.
  const weakestDomains = diagnosticSummary
    ? diagnosticSummary.highestNeedDomains.map(d => d.id)
    : domainArray.slice(0, 3).map(d => d.domain);

  // Calculate average time per question
  const avgTimePerQuestion = totalQuestions > 0 
    ? Math.round(responses.reduce((sum, r) => sum + r.timeSpent, 0) / totalQuestions)
    : 0;

  // Find questions that took the longest
  const questionTimeMap = new Map<string, number>();
  responses.forEach(response => {
    const existing = questionTimeMap.get(response.questionId) || 0;
    questionTimeMap.set(response.questionId, existing + response.timeSpent);
  });

  const longestQuestions = Array.from(questionTimeMap.entries())
    .map(([questionId, totalTime]) => {
      const question = questionMap.get(questionId);
      const response = responses.find(r => r.questionId === questionId);
      return {
        questionId,
        questionLabel: question ? getQuestionIdentifierLabel(question) : questionId,
        prompt: question ? getQuestionPrompt(question) : '',
        timeSpent: totalTime,
        isCorrect: response?.isCorrect || false
      };
    })
    .sort((a, b) => b.timeSpent - a.timeSpent)
    .slice(0, 5); // Top 5 longest questions

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const scoreStyle = getScoreColor(overallScore);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-1 py-2 sm:px-0">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <Trophy className={`w-10 h-10 ${scoreStyle.text}`} />
          <h2 className="editorial-heading text-3xl sm:text-4xl">Diagnostic Complete!</h2>
        </div>
        <p className="editorial-copy">
          {`You completed all ${totalQuestions} questions`}
        </p>
        <button
          onClick={() => {
            const { currentSkillScores } = detectWeaknesses(responses, questions);
            downloadScoreReport(responses, profile, currentSkillScores);
          }}
          className="editorial-button-secondary mx-auto"
        >
          Download Detailed Report
        </button>
      </div>

      {/* Overall Score Card */}
      <div className="editorial-panel-dark p-8 text-center">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-slate-300">Overall Score</p>
            <p className={`text-6xl font-bold ${scoreStyle.text}`}>
              {scorePercentage}%
            </p>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-200">{correctAnswers} Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span className="text-slate-200">{totalQuestions - correctAnswers} Incorrect</span>
            </div>
          </div>

          {/* Readiness context — only when diagnosticSummary is present */}
          {diagnosticSummary && (
            <div className="border-t border-slate-600 pt-4 space-y-2">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                diagnosticSummary.readiness.tone === 'ready'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : diagnosticSummary.readiness.tone === 'building'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}>
                {diagnosticSummary.readiness.label}
              </span>
              <p className="text-sm text-slate-300">{diagnosticSummary.readiness.description}</p>
              <p className="text-xs text-slate-400 italic">{diagnosticSummary.readiness.nextAction}</p>
            </div>
          )}
        </div>
      </div>

      {/* Confidence callout — only when overconfidence pattern detected */}
      {diagnosticSummary?.confidence?.interpretation === 'possible_overconfidence' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Confidence Pattern Detected</p>
              <p className="mt-1 text-sm text-amber-800">
                {diagnosticSummary.confidence.totalHighWrong > 0
                  ? `${diagnosticSummary.confidence.totalHighWrong} high-confidence wrong answer${diagnosticSummary.confidence.totalHighWrong !== 1 ? 's' : ''} detected. `
                  : ''}
                These may indicate misconceptions rather than simple knowledge gaps. Your study plan will prioritize them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="editorial-stat-card">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-700" />
            <p className="text-sm text-slate-500">Total Time</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatTime(totalTime)}</p>
        </div>
        <div className="editorial-stat-card">
          <div className="flex items-center gap-3 mb-2">
            <Timer className="w-5 h-5 text-amber-700" />
            <p className="text-sm text-slate-500">Avg Time/Question</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatTime(avgTimePerQuestion)}</p>
        </div>
      </div>

      {/* Longest Questions */}
      {longestQuestions.length > 0 && (
        <div className="editorial-surface p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <Timer className="w-5 h-5 text-amber-700" />
            Questions That Took the Longest
          </h3>
          <div className="space-y-3">
            {longestQuestions.map((item, index) => (
              <div 
                key={item.questionId} 
                className={`p-4 rounded-xl border ${
                  item.isCorrect 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {index + 1}. {item.questionLabel}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                      {item.prompt
                        ? `${item.prompt.substring(0, 100)}${item.prompt.length > 100 ? '...' : ''}`
                        : 'Question text unavailable for this report.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {formatTime(item.timeSpent)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Scores */}
      <div className="editorial-surface p-6">
        <h3 className="mb-6 flex items-center gap-2 font-semibold text-slate-900">
          <BarChart3 className="w-5 h-5 text-amber-700" />
          Performance by Domain
        </h3>
        <div className="space-y-4">
          {domainArray.map(({ domain, score, correct, total }) => {
            const pct = Math.round(score * 100);
            const domainStyle = getScoreColor(score);
            const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
            
            return (
              <div key={domain} className="editorial-surface-soft space-y-2 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">
                    {getDomainLabel(domainInfo)}
                  </span>
                  <span className={`text-sm font-bold ${domainStyle.text}`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${pct}%`,
                      backgroundColor: getDomainColor(domain)
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {correct} of {total} correct
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weakest Areas */}
      {weakestDomains.length > 0 && (
        <div className="editorial-surface p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Areas for Improvement
          </h3>
          <div className="space-y-3">
            {weakestDomains.map(domain => {
              const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
              const domainScore = domainArray.find(d => d.domain === domain);
              return (
                <div key={domain} className="editorial-surface-soft p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-slate-900">{domainInfo?.name}</p>
                    <span className="text-sm text-amber-700 font-semibold">
                      {Math.round((domainScore?.score || 0) * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {domainInfo?.keyConcepts?.slice(0, 3).join(', ')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Key Concepts to Review */}
      {(diagnosticSummary?.missedConcepts?.length ?? 0) > 0 && (
        <div className="editorial-surface p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <Lightbulb className="w-5 h-5 text-amber-700" />
            Key Concepts to Review
          </h3>
          <div className="space-y-2">
            {diagnosticSummary!.missedConcepts.slice(0, 8).map((mc, i) => (
              <div
                key={`${mc.concept}-${mc.skillId}-${i}`}
                className="editorial-surface-soft flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{mc.concept}</p>
                  <p className="text-xs text-slate-500 truncate">{mc.skillName}</p>
                </div>
                <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  {mc.count}×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foundational Gaps */}
      {(diagnosticSummary?.foundationalGaps?.length ?? 0) > 0 && (
        <div className="editorial-surface p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Foundational Gaps
          </h3>
          <div className="space-y-3">
            {diagnosticSummary!.foundationalGaps.map((gap, i) => (
              <div key={`${gap.skillId}-${i}`} className="editorial-surface-soft p-4">
                <p className="font-medium text-slate-900">{gap.skillName}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Flagged by: {gap.triggeredBy.join(', ')}
                </p>
                {gap.reason && (
                  <p className="mt-1 text-xs text-slate-400 italic">{gap.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="space-y-3">
          <button
            onClick={() => onStartPractice(weakestDomains[0])}
            className="editorial-button-primary w-full p-6"
          >
            <Zap className="w-5 h-5" />
            Start Domain Review in Weakest Domain
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!hideRetake && (
            <button
              onClick={onRetakeAssessment}
              className="editorial-button-dark p-4"
            >
              Retake Assessment
            </button>
          )}
          <button
            onClick={onGoHome}
            className={`editorial-button-secondary p-4 ${hideRetake ? 'col-span-2' : ''}`}
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
