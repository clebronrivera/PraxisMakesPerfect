import { useState } from 'react';
import { BarChart3, AlertTriangle, Lightbulb, Play, Layers } from 'lucide-react';
import { NASP_DOMAINS } from '../../knowledge-base';
import PraxisPerformanceView from './PraxisPerformanceView';
import { UserProfile } from '../hooks/useFirebaseProgress';

interface ResultsDashboardProps {
  userProfile: UserProfile;
  onStartPractice: (domainId?: number) => void;
  onRetakeAssessment: () => void;
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
  if (score >= 0.8) return 'text-emerald-400';
  if (score >= 0.6) return 'text-amber-400';
  return 'text-red-400';
};

export default function ResultsDashboard({
  userProfile,
  onStartPractice,
  onRetakeAssessment
}: ResultsDashboardProps) {
  const [viewMode, setViewMode] = useState<'praxis' | 'domains'>('praxis');

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-100">Your Progress</h2>
        <p className="text-slate-400">
          Based on {userProfile.practiceHistory.length} questions answered
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700 w-fit mx-auto">
        <button
          onClick={() => setViewMode('praxis')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            viewMode === 'praxis'
              ? 'bg-slate-700 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Praxis Sections
        </button>
        <button
          onClick={() => setViewMode('domains')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            viewMode === 'domains'
              ? 'bg-slate-700 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          NASP Domains
        </button>
      </div>

      {/* Praxis Performance View */}
      {viewMode === 'praxis' && (
        <PraxisPerformanceView
          userProfile={userProfile}
          onDomainSelect={onStartPractice}
        />
      )}

      {/* Domain Scores View */}
      {viewMode === 'domains' && (
        <>
          {/* Domain Scores */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-200 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              Domain Scores
            </h3>
            <div className="space-y-4">
              {(Object.entries(userProfile.domainScores) as [string, { correct: number; total: number }][])
                .filter(([_, score]) => score.total > 0)
                .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
                .map(([domain, score]) => {
                  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
                  const domainInfo = NASP_DOMAINS[parseInt(domain) as keyof typeof NASP_DOMAINS];
                  return (
                    <div key={domain} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">
                          {domainInfo?.shortName}: {domainInfo?.name}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(pct / 100)}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${pct}%`,
                            backgroundColor: getDomainColor(parseInt(domain))
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {score.correct} of {score.total} correct
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Focus Areas */}
          {userProfile.weakestDomains.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
              <h3 className="font-semibold text-amber-300 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Recommended Focus Areas
              </h3>
              <div className="space-y-3">
                {userProfile.weakestDomains.map(d => {
                  const domainInfo = NASP_DOMAINS[d as keyof typeof NASP_DOMAINS];
                  return (
                    <div key={d} className="p-4 bg-slate-800/50 rounded-xl">
                      <p className="font-medium text-slate-200">{domainInfo?.name}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Review: {domainInfo?.keyConcepts?.slice(0, 3).join(', ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Knowledge Gaps */}
          {userProfile.factualGaps.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                Concepts to Review
              </h3>
              <div className="flex flex-wrap gap-2">
                {userProfile.factualGaps.map((gap, i) => (
                  <span key={i} className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => onStartPractice()}
          className="w-full p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
        >
          <Play className="w-5 h-5" />
          Start Adaptive Practice
        </button>
        <button
          onClick={onRetakeAssessment}
          className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-slate-300 hover:bg-slate-700 transition-all"
        >
          Retake Assessment
        </button>
      </div>
    </div>
  );
}
