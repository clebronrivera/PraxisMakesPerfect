import { Trophy, Clock, Target, AlertTriangle, CheckCircle2, XCircle, BarChart3, Home } from 'lucide-react';
import { NASP_DOMAINS } from '../../knowledge-base';
import { UserResponse } from '../brain/weakness-detector';
import { AnalyzedQuestion } from '../brain/question-analyzer';

interface ScoreReportProps {
  responses: UserResponse[];
  questions: AnalyzedQuestion[];
  assessmentType: 'pre-assessment' | 'full-assessment';
  totalTime: number;
  onStartPractice: () => void;
  onRetakeAssessment: () => void;
  onGoHome: () => void;
}

const getDomainColor = (domain: number) => {
  const colors: Record<number, string> = {
    1: '#3B82F6', 2: '#3B82F6',
    3: '#10B981', 4: '#10B981',
    5: '#8B5CF6', 6: '#8B5CF6', 7: '#8B5CF6',
    8: '#F59E0B', 9: '#F59E0B', 10: '#F59E0B'
  };
  return colors[domain] || '#6B7280';
};

const getScoreColor = (score: number) => {
  if (score >= 0.8) return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
  if (score >= 0.6) return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' };
  return { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
};

export default function ScoreReport({
  responses,
  questions,
  assessmentType,
  totalTime,
  onStartPractice,
  onRetakeAssessment,
  onGoHome
}: ScoreReportProps) {
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
      question.domains.forEach(domain => {
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
          <h2 className="text-3xl font-bold text-slate-100">
            {assessmentType === 'full-assessment' ? 'Full Assessment Complete!' : 'Pre-Assessment Complete!'}
          </h2>
        </div>
        <p className="text-slate-400">
          {assessmentType === 'full-assessment' 
            ? 'You completed all 125 questions'
            : 'You completed 20 diagnostic questions'}
        </p>
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
            <Target className="w-5 h-5 text-purple-400" />
            <p className="text-sm text-slate-400">Avg Time/Question</p>
          </div>
          <p className="text-2xl font-bold text-slate-200">{formatTime(avgTimePerQuestion)}</p>
        </div>
      </div>

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
                    {domainInfo?.shortName}: {domainInfo?.name}
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
      <div className="space-y-3">
        <button
          onClick={onStartPractice}
          className="w-full p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
        >
          <Target className="w-5 h-5" />
          Start Adaptive Practice
        </button>
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
