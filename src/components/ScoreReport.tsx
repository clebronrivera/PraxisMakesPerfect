import { Trophy, Clock, Target, AlertTriangle, CheckCircle2, XCircle, BarChart3, Home, Timer, BookOpen, Zap, Layers } from 'lucide-react';
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
  onStartTeachMode?: (domains?: number[]) => void;
  onStartPracticeWithDomains?: (domains: number[]) => void;
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
  onGoHome,
  onStartTeachMode,
  onStartPracticeWithDomains
}: ScoreReportProps) {
  const [showDomainSelection, setShowDomainSelection] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<number[]>([]);
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
        question: question?.question || 'Unknown question',
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
                    <p className="text-sm text-slate-300 line-clamp-2">
                      {index + 1}. {item.question.substring(0, 100)}{item.question.length > 100 ? '...' : ''}
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
      {assessmentType === 'full-assessment' ? (
        <div className="space-y-4">
          {!showDomainSelection ? (
            <>
              <div className="space-y-3">
                <button
                  onClick={onStartPractice}
                  className="w-full p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                >
                  <Zap className="w-5 h-5" />
                  Recommended Practice (All Weak Areas)
                </button>
                
                {onStartTeachMode && (
                  <button
                    onClick={() => onStartTeachMode()}
                    className="w-full p-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                  >
                    <BookOpen className="w-5 h-5" />
                    Teach Mode (Guided Learning)
                  </button>
                )}
                
                <button
                  onClick={() => setShowDomainSelection(true)}
                  className="w-full p-6 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-center gap-3 font-semibold text-slate-300 hover:bg-slate-800 transition-all"
                >
                  <Layers className="w-5 h-5" />
                  Select Specific Areas
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
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-200 mb-4">Select Domains to Focus On</h3>
                <div className="space-y-2">
                  {domainArray.map(({ domain }) => {
                    const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
                    const isSelected = selectedDomains.includes(domain);
                    return (
                      <button
                        key={domain}
                        onClick={() => {
                          setSelectedDomains(prev => 
                            prev.includes(domain)
                              ? prev.filter(d => d !== domain)
                              : [...prev, domain]
                          );
                        }}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border border-amber-500/50'
                            : 'bg-slate-700/30 border border-slate-700/50 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-200">
                            {domainInfo?.shortName}: {domainInfo?.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (selectedDomains.length > 0) {
                      if (onStartPracticeWithDomains) {
                        onStartPracticeWithDomains(selectedDomains);
                      } else {
                        onStartPractice();
                      }
                    }
                  }}
                  disabled={selectedDomains.length === 0}
                  className="w-full p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-5 h-5" />
                  Practice Selected Areas ({selectedDomains.length})
                </button>
                
                {onStartTeachMode && selectedDomains.length > 0 && (
                  <button
                    onClick={() => onStartTeachMode(selectedDomains)}
                    className="w-full p-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                  >
                    <BookOpen className="w-5 h-5" />
                    Teach Mode: Selected Areas
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowDomainSelection(false);
                    setSelectedDomains([]);
                  }}
                  className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-slate-300 hover:bg-slate-700 transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}
