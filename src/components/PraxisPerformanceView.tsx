import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, TrendingDown, TrendingUp, BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { NASP_DOMAINS } from '../../knowledge-base';
import { UserProfile } from '../hooks/useFirebaseProgress';

interface PraxisPerformanceViewProps {
  userProfile: UserProfile;
  onDomainSelect?: (domainId: number) => void;
  sortBy?: 'performance' | 'deficiencies';
}

interface PraxisSection {
  id: number;
  name: string;
  subtitle: string;
  domains: number[];
  color: string;
}

const PRAXIS_SECTIONS: PraxisSection[] = [
  {
    id: 1,
    name: 'Professional Practices',
    subtitle: 'Permeates all services',
    domains: [1, 2],
    color: '#3B82F6' // Blue
  },
  {
    id: 2,
    name: 'Student-Level Services',
    subtitle: 'Direct & Indirect',
    domains: [3, 4],
    color: '#10B981' // Green
  },
  {
    id: 3,
    name: 'Systems-Level Services',
    subtitle: 'Direct & Indirect',
    domains: [5, 6, 7],
    color: '#8B5CF6' // Purple
  },
  {
    id: 4,
    name: 'Foundations',
    subtitle: 'Service Delivery',
    domains: [8, 9, 10],
    color: '#F59E0B' // Orange
  }
];

const getDomainColor = (domain: number) => {
  const colors: Record<number, string> = {
    1: '#3B82F6', 2: '#3B82F6',
    3: '#10B981', 4: '#10B981',
    5: '#8B5CF6', 6: '#8B5CF6', 7: '#8B5CF6',
    8: '#F59E0B', 9: '#F59E0B', 10: '#F59E0B'
  };
  return colors[domain] || '#6B7280';
};

const getPerformanceLabel = (score: number): { label: string; color: string; bgColor: string } => {
  if (score >= 0.8) {
    return { 
      label: 'Strong', 
      color: 'text-emerald-400', 
      bgColor: 'bg-emerald-500/20' 
    };
  }
  if (score >= 0.6) {
    return { 
      label: 'Developing', 
      color: 'text-amber-400', 
      bgColor: 'bg-amber-500/20' 
    };
  }
  return { 
    label: 'Needs Improvement', 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20' 
  };
};

export default function PraxisPerformanceView({ 
  userProfile, 
  onDomainSelect,
  sortBy = 'performance' 
}: PraxisPerformanceViewProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<'performance' | 'deficiencies'>(sortBy);

  // Calculate performance for each Praxis section
  const sectionPerformance = useMemo(() => {
    return PRAXIS_SECTIONS.map(section => {
      let totalCorrect = 0;
      let totalQuestions = 0;
      const domainScores: Array<{ domain: number; score: number; correct: number; total: number }> = [];

      section.domains.forEach(domainId => {
        const domainScore = userProfile.domainScores[domainId];
        if (domainScore && domainScore.total > 0) {
          totalCorrect += domainScore.correct;
          totalQuestions += domainScore.total;
          const score = domainScore.correct / domainScore.total;
          domainScores.push({
            domain: domainId,
            score,
            correct: domainScore.correct,
            total: domainScore.total
          });
        }
      });

      const overallScore = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
      const deficiencyCount = domainScores.filter(d => d.score < 0.6).length;
      const totalDomainsWithData = domainScores.length;

      return {
        ...section,
        overallScore,
        totalCorrect,
        totalQuestions,
        domainScores: domainScores.sort((a, b) => a.score - b.score), // Sort domains by score ascending
        deficiencyCount,
        totalDomainsWithData
      };
    });
  }, [userProfile.domainScores]);

  // Sort sections based on sort mode
  const sortedSections = useMemo(() => {
    const sorted = [...sectionPerformance];
    if (sortMode === 'performance') {
      return sorted.sort((a, b) => {
        // Sort by overall score (ascending - lowest first)
        if (a.totalQuestions === 0 && b.totalQuestions === 0) return 0;
        if (a.totalQuestions === 0) return 1;
        if (b.totalQuestions === 0) return -1;
        return a.overallScore - b.overallScore;
      });
    } else {
      // Sort by deficiencies (most deficiencies first)
      return sorted.sort((a, b) => {
        if (a.deficiencyCount !== b.deficiencyCount) {
          return b.deficiencyCount - a.deficiencyCount;
        }
        // If same deficiency count, sort by score
        return a.overallScore - b.overallScore;
      });
    }
  }, [sectionPerformance, sortMode]);

  const toggleSection = (sectionId: number) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Praxis Performance Overview</h2>
          <p className="text-slate-400 text-sm">
            View your performance across Praxis sections and drill down to NASP domains
          </p>
        </div>
        
        {/* Sort Toggle */}
        <div className="flex gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setSortMode('performance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortMode === 'performance'
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Performance
          </button>
          <button
            onClick={() => setSortMode('deficiencies')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortMode === 'deficiencies'
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Deficiencies
          </button>
        </div>
      </div>

      {/* Praxis Sections */}
      <div className="space-y-4">
        {sortedSections.map(section => {
          const perf = getPerformanceLabel(section.overallScore);
          const isExpanded = expandedSection === section.id;
          const hasData = section.totalQuestions > 0;
          const scorePercentage = hasData ? Math.round(section.overallScore * 100) : 0;

          return (
            <div
              key={section.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden transition-all hover:border-slate-600"
            >
              {/* Section Header - Clickable */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-6 text-left flex items-center justify-between group"
              >
                <div className="flex-1 flex items-center gap-4">
                  {/* Section Number Badge */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: section.color }}
                  >
                    {section.id}
                  </div>

                  {/* Section Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                        {section.name}
                      </h3>
                      {hasData && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${perf.color} ${perf.bgColor}`}>
                          {perf.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{section.subtitle}</p>
                    {hasData && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-slate-300">
                          {section.totalDomainsWithData} domain{section.totalDomainsWithData !== 1 ? 's' : ''} assessed
                        </span>
                        {section.deficiencyCount > 0 && (
                          <span className="text-sm text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            {section.deficiencyCount} need{section.deficiencyCount !== 1 ? 's' : ''} improvement
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Score Display */}
                  {hasData && (
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${perf.color}`}>
                          {scorePercentage}%
                        </div>
                        <div className="text-xs text-slate-500">
                          {section.totalCorrect} / {section.totalQuestions}
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${scorePercentage}%`,
                            backgroundColor: section.color
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expand Icon */}
                  <div className="ml-4 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Domain Details */}
              {isExpanded && (
                <div className="border-t border-slate-700/50 p-6 bg-slate-900/50">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
                    NASP Domains
                  </h4>
                  
                  {section.domainScores.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No assessment data yet for domains in this section</p>
                      <p className="text-sm mt-1">Complete an assessment to see performance metrics</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {section.domainScores.map(({ domain, score, correct, total }) => {
                        const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
                        const domainPerf = getPerformanceLabel(score);
                        const domainPct = Math.round(score * 100);
                        const domainColor = getDomainColor(domain);
                        const isWeak = userProfile.weakestDomains.includes(domain);

                        return (
                          <div
                            key={domain}
                            className={`p-4 rounded-xl border transition-all ${
                              isWeak
                                ? 'bg-red-500/10 border-red-500/30'
                                : 'bg-slate-800/50 border-slate-700/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                  style={{ backgroundColor: domainColor }}
                                >
                                  {domain}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-slate-200">
                                      {domainInfo?.shortName}: {domainInfo?.name}
                                    </p>
                                    {isWeak && (
                                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 line-clamp-1">
                                    {domainInfo?.description}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                <div className="text-right">
                                  <div className={`text-lg font-bold ${domainPerf.color}`}>
                                    {domainPct}%
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {correct} / {total}
                                  </div>
                                </div>
                                <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${domainPct}%`,
                                      backgroundColor: domainColor
                                    }}
                                  />
                                </div>
                                {onDomainSelect && (
                                  <button
                                    onClick={() => onDomainSelect(domain)}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-white hover:opacity-90"
                                    style={{ backgroundColor: domainColor }}
                                  >
                                    Practice
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Key Concepts Preview */}
                            {domainInfo?.keyConcepts && domainInfo.keyConcepts.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-700/50">
                                <p className="text-xs text-slate-500 mb-2">Key Concepts:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {domainInfo.keyConcepts.slice(0, 5).map((concept, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded text-xs bg-slate-800/50 text-slate-400 border border-slate-700/50"
                                    >
                                      {concept}
                                    </span>
                                  ))}
                                  {domainInfo.keyConcepts.length > 5 && (
                                    <span className="px-2 py-0.5 rounded text-xs text-slate-500">
                                      +{domainInfo.keyConcepts.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {userProfile.preAssessmentComplete && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="p-4 bg-slate-800/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-amber-400">
              {userProfile.totalQuestionsSeen}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Questions</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {sortedSections.filter(s => s.overallScore >= 0.8).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Strong Sections</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-red-400">
              {sortedSections.reduce((sum, s) => sum + s.deficiencyCount, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Areas Needing Work</p>
          </div>
        </div>
      )}
    </div>
  );
}
