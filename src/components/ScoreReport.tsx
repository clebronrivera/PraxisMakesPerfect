import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { useEngine } from '../hooks/useEngine';
import { detectWeaknesses, UserResponse } from '../brain/weakness-detector';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
// getQuestionIdentifierLabel, getQuestionPrompt removed — not needed in redesigned layout
import { getDomainLabel } from '../utils/domainLabels';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { DEMONSTRATING_THRESHOLD, APPROACHING_THRESHOLD } from '../utils/skillProficiency';
import { downloadScoreReport } from '../utils/scoreReportGenerator';
import { loadSession, clearSession } from '../utils/sessionStorage';
import type { DiagnosticSummary } from '../types/diagnosticSummary';

const EXAM_WEIGHTS: Record<number, number> = {
  1: 36, // Professional Practices
  2: 21, // Student-Level Services
  3: 19, // Systems-Level Services
  4: 24, // Foundations of School Psychology
};

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


export default function ScoreReport({
  responses,
  questions,
  totalTime,
  onStartPractice: _onStartPractice,
  onRetakeAssessment: _onRetakeAssessment,
  onGoHome,
  diagnosticSummary,
}: ScoreReportProps) {
  // Keep handler refs accessible for potential future use
  void _onStartPractice;
  void _onRetakeAssessment;

  const engine = useEngine();
  const NASP_DOMAINS = engine.domains.reduce((acc, d) => ({ ...acc, [Number(d.id)]: d }), {} as Record<number, any>);

  const { profile } = useProgressTracking();

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

  // questionMap is needed for fallback domain score computation.
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

  // ── Skill tier counts ───────────────────────────────────────────────────────
  const { currentSkillScores } = detectWeaknesses(responses, questions);
  const skillEntries = Object.values(currentSkillScores).filter(s => s.total > 0);
  let demonstratingCount = 0;
  let approachingCount = 0;
  let emergingCount = 0;
  for (const s of skillEntries) {
    const ratio = s.correct / s.total;
    if (ratio >= DEMONSTRATING_THRESHOLD) demonstratingCount++;
    else if (ratio >= APPROACHING_THRESHOLD) approachingCount++;
    else emergingCount++;
  }

  // ── Top priority (weakest) skills ──────────────────────────────────────────
  const prioritySkills = diagnosticSummary
    ? diagnosticSummary.weaknesses.slice(0, 3)
    : Object.entries(currentSkillScores)
        .filter(([, s]) => s.total > 0)
        .map(([id, s]) => ({
          skillId: id,
          skillName: id,
          score: s.correct / s.total,
          attempted: s.total,
          correct: s.correct,
          incorrect: s.total - s.correct,
          missedConcepts: [],
        }))
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);

  // ── Domain bar color helper ────────────────────────────────────────────────
  const getDomainBarColor = (score: number) => {
    if (score >= DEMONSTRATING_THRESHOLD) return 'rgb(16,185,129)';  // emerald
    if (score >= APPROACHING_THRESHOLD) return 'rgb(245,158,11)';   // amber
    return 'rgb(244,63,94)';                                         // rose
  };

  const getDomainPctColor = (score: number) => {
    if (score >= DEMONSTRATING_THRESHOLD) return 'text-emerald-600';
    if (score >= APPROACHING_THRESHOLD) return 'text-amber-600';
    return 'text-rose-500';
  };

  const totalMinutes = Math.round(totalTime / 60);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 pb-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="text-4xl">🎉</span>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">Diagnostic Complete</h2>
        <p className="mt-1 text-sm text-slate-500">
          Here's your baseline across all 4 exam domains and 45 skills.
        </p>
      </div>

      {/* Overall Accuracy */}
      <div className="editorial-surface mb-5 p-6 text-center">
        <p className="editorial-overline mb-2">Overall Accuracy</p>
        <div className="mb-1 text-5xl font-black text-indigo-600">{scorePercentage}%</div>
        <p className="text-sm text-slate-500">
          {correctAnswers} of {totalQuestions} questions correct · {totalMinutes} minutes
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
            {demonstratingCount} Demonstrating
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700">
            {approachingCount} Approaching
          </span>
          <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase text-rose-700">
            {emergingCount} Emerging
          </span>
        </div>
      </div>

      {/* Domain Breakdown */}
      <div className="editorial-surface mb-5 p-6">
        <p className="editorial-overline mb-4">Domain Breakdown</p>
        <div className="space-y-4">
          {domainArray.map(({ domain, score }) => {
            const pct = Math.round(score * 100);
            const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
            const weight = EXAM_WEIGHTS[domain] ?? 0;
            return (
              <div key={domain}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    D{domain} · {getDomainLabel(domainInfo)} ({weight}%)
                  </span>
                  <span className={`font-bold ${getDomainPctColor(score)}`}>{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: getDomainBarColor(score) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Priority Skills */}
      {prioritySkills.length > 0 && (
        <div className="editorial-surface mb-5 p-6">
          <p className="editorial-overline mb-3">Top Priority Skills</p>
          <div className="space-y-2">
            {prioritySkills.map(skill => {
              const pct = Math.round(skill.score * 100);
              const isEmerging = skill.score < APPROACHING_THRESHOLD;
              return (
                <div
                  key={skill.skillId}
                  className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
                    isEmerging
                      ? 'border-rose-100 bg-rose-50'
                      : 'border-amber-100 bg-amber-50'
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-700">{skill.skillName}</span>
                  <span className={`text-xs font-bold ${isEmerging ? 'text-rose-600' : 'text-amber-600'}`}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Go to Dashboard button */}
      <button
        onClick={onGoHome}
        className="w-full rounded-full bg-amber-500 px-6 py-3 text-base font-bold text-slate-900 transition hover:bg-amber-600"
      >
        Go to Dashboard →
      </button>

      {/* Download report link (secondary) */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            downloadScoreReport(responses, profile, currentSkillScores);
          }}
          className="text-sm font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
        >
          Download Detailed Report
        </button>
      </div>
    </div>
  );
}
