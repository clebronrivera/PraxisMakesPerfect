import { Trophy, Clock, AlertTriangle, CheckCircle2, XCircle, BarChart3, Home, Timer, Zap, RotateCcw } from 'lucide-react';
import { useEngine } from '../hooks/useEngine';
import { detectWeaknesses, UserResponse } from '../brain/weakness-detector';
import { AnalyzedQuestion, getQuestionIdentifierLabel, getQuestionPrompt } from '../brain/question-analyzer';
import { getDomainColor } from '../utils/domainColors';
import { getDomainLabel } from '../utils/domainLabels';
import { useFirebaseProgress } from '../hooks/useFirebaseProgress';
import { downloadScoreReport } from '../utils/scoreReportGenerator';

interface ScoreReportProps {
  responses: UserResponse[];
  questions: AnalyzedQuestion[];
  totalTime: number;
  onStartPractice: (domainId?: number) => void;
  onRetakeAssessment: () => void;
  onGoHome: () => void;
}


const getScoreColor = (score: number) => {
  if (score >= 0.8) return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
  if (score >= 0.6) return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' };
  return { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
};

export default function ScoreReport({
  responses,
  questions,
  totalTime,
  onStartPractice,
  onRetakeAssessment,
  onGoHome
}: ScoreReportProps) {
  const engine = useEngine();
  const NASP_DOMAINS = engine.domains.reduce((acc, d) => ({ ...acc, [Number(d.id)]: d }), {} as Record<number, any>);


  const { profile } = useFirebaseProgress();

  // Safety check: Handle missing or corrupted data
  if (!responses || responses.length === 0 || !questions || questions.length === 0) {
    // Try to recover from session storage if available
    const tryRecalculate = () => {
      const { loadSession } = require('../utils/sessionStorage');
      const session = loadSession();
      if (session && session.responses && session.responses.length > 0) {
        // If we have raw responses, we could potentially recalculate
        // For now, just show recovery UI
        window.location.reload();
      } else {
        // No recovery possible, reset and go home
        const { clearSession } = require('../utils/sessionStorage');
        clearSession();
        onGoHome();
      }
    };

    return (
      <div className="space-y-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">Results Missing or Corrupted</h2>
            <p className="text-slate-400">
              We couldn't find your assessment results. This may happen if you refreshed the page or your session expired.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={tryRecalculate}
              className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Try to Recalculate
            </button>
            <button
              onClick={() => {
                const { clearSession } = require('../utils/sessionStorage');
                clearSession();
                onGoHome();
              }}
              className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Reset Attempt & Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overall score
  const totalQuestions = responses.length;
  const correctAnswers = responses.filter(r => r.isCorrect).length;
  const overallScore = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
  const scorePercentage = Math.round(overallScore * 100);

  // Calculate domain scores
  const domainScores: Record<number, { correct: number; total: number }> = {};
  const questionMap = new Map(questions.map(q => [q.id, q]));

  responses.forEach(response => {
    const question = questionMap.get(response.questionId);
    if (question) {
      question.domains?.forEach(domain => {
        if (!domainScores[domain]) {
          domainScores[domain] = { correct: 0, total: 0 };
        }
        domainScores[domain].total++;
        if (response.isCorrect) {
          domainScores[domain].correct++;
        }
      });
    }
  });

  // Find weakest domains
  const domainArray = Object.entries(domainScores)
    .map(([domain, score]) => ({
      domain: parseInt(domain),
      score: score.total > 0 ? score.correct / score.total : 0,
      ...score
    }))
    .sort((a, b) => a.score - b.score);

  const weakestDomains = domainArray.slice(0, 3).map(d => d.domain);

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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Trophy className={`w-10 h-10 ${scoreStyle.text}`} />
          <h2 className="text-3xl font-bold text-slate-100">Full Assessment Complete!</h2>
        </div>
        <p className="text-slate-400">
          {`You completed all ${responses.length} questions`}
        </p>
        <button
          onClick={() => {
            const { currentSkillScores } = detectWeaknesses(responses, questions);
            downloadScoreReport(responses, profile, currentSkillScores);
          }}
          className="mx-auto px-6 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
        >
          Download Detailed Report
        </button>
      </div>

      {/* Overall Score Card */}
      <div className={`bg-gradient-to-br ${scoreStyle.bg} border ${scoreStyle.border} rounded-2xl p-8 text-center`}>
        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-sm mb-2">Overall Score</p>
            <p className={`text-6xl font-bold ${scoreStyle.text}`}>
              {scorePercentage}%
            </p>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-300">{correctAnswers} Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-slate-300">{totalQuestions - correctAnswers} Incorrect</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-slate-400">Total Time</p>
          </div>
          <p className="text-2xl font-bold text-slate-200">{formatTime(totalTime)}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Timer className="w-5 h-5 text-purple-400" />
            <p className="text-sm text-slate-400">Avg Time/Question</p>
          </div>
          <p className="text-2xl font-bold text-slate-200">{formatTime(avgTimePerQuestion)}</p>
        </div>
      </div>

      {/* Longest Questions */}
      {longestQuestions.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Timer className="w-5 h-5 text-purple-400" />
            Questions That Took the Longest
          </h3>
          <div className="space-y-3">
            {longestQuestions.map((item, index) => (
              <div 
                key={item.questionId} 
                className={`p-4 rounded-xl border ${
                  item.isCorrect 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">
                      {index + 1}. {item.questionLabel}
                    </p>
                    <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                      {item.prompt
                        ? `${item.prompt.substring(0, 100)}${item.prompt.length > 100 ? '...' : ''}`
                        : 'Question text unavailable for this report.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-slate-300 whitespace-nowrap">
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
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-200 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          Performance by Domain
        </h3>
        <div className="space-y-4">
          {domainArray.map(({ domain, score, correct, total }) => {
            const pct = Math.round(score * 100);
            const domainStyle = getScoreColor(score);
            const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
            
            return (
              <div key={domain} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">
                    {getDomainLabel(domainInfo)}
                  </span>
                  <span className={`text-sm font-bold ${domainStyle.text}`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
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
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
          <h3 className="font-semibold text-amber-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Areas for Improvement
          </h3>
          <div className="space-y-3">
            {weakestDomains.map(domain => {
              const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
              const domainScore = domainArray.find(d => d.domain === domain);
              return (
                <div key={domain} className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-slate-200">{domainInfo?.name}</p>
                    <span className="text-sm text-amber-400 font-semibold">
                      {Math.round((domainScore?.score || 0) * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {domainInfo?.keyConcepts?.slice(0, 3).join(', ')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="space-y-3">
          <button
            onClick={() => onStartPractice(weakestDomains[0])}
            className="w-full p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
          >
            <Zap className="w-5 h-5" />
            Start Domain Review in Weakest Domain
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onRetakeAssessment}
            className="p-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-slate-300 hover:bg-slate-700 transition-all"
          >
            Retake Assessment
          </button>
          <button
            onClick={onGoHome}
            className="p-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-slate-300 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
