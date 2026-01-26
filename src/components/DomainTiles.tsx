import { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { NASP_DOMAINS } from '../../knowledge-base';
import { SKILL_MAP } from '../brain/skill-map';
import ETS_CONTENT_TOPICS from '../data/ets-content-topics.json';

interface DomainTilesProps {
  onDomainSelect?: (domainId: number) => void;
}

export default function DomainTiles({ onDomainSelect }: DomainTilesProps) {
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);

  const handleTileClick = (domainId: number) => {
    setSelectedDomain(domainId);
  };

  const handleCloseDetail = () => {
    setSelectedDomain(null);
  };

  const handleStartPractice = (domainId: number) => {
    handleCloseDetail();
    if (onDomainSelect) {
      onDomainSelect(domainId);
    }
  };

  const getDomainColor = (domain: number) => {
    const colors: Record<number, string> = {
      1: '#3B82F6', 2: '#3B82F6',
      3: '#10B981', 4: '#10B981',
      5: '#8B5CF6', 6: '#8B5CF6', 7: '#8B5CF6',
      8: '#F59E0B', 9: '#F59E0B', 10: '#F59E0B'
    };
    return colors[domain] || '#64748B';
  };

  const getDomainData = (domainId: number) => {
    const domainInfo = NASP_DOMAINS[domainId as keyof typeof NASP_DOMAINS];
    const skillData = SKILL_MAP[domainId as keyof typeof SKILL_MAP];
    const etsData = ETS_CONTENT_TOPICS.domains.find(d => d.id === domainId);

    // Extract all skills from skill clusters
    const allSkills = skillData?.clusters.flatMap(cluster => 
      cluster.skills.map(skill => ({
        name: skill.name,
        description: skill.description
      }))
    ) || [];

    // Extract keywords from multiple sources
    const keywords = new Set<string>();
    
    // From knowledge base
    if (domainInfo?.keyConcepts) {
      domainInfo.keyConcepts.forEach(kw => keywords.add(kw));
    }
    
    // From mustKnowTerms
    if (domainInfo?.mustKnowTerms) {
      Object.keys(domainInfo.mustKnowTerms).forEach(term => keywords.add(term));
    }

    // From ETS content topics
    if (etsData) {
      etsData.sections.forEach(section => {
        section.topics.forEach(topic => {
          topic.keywords?.forEach(kw => keywords.add(kw));
        });
      });
    }

    return {
      domainInfo,
      skills: allSkills,
      keywords: Array.from(keywords).sort(),
      etsData
    };
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">NASP Practice Domains</h2>
          <p className="text-slate-400 text-sm">Click on any domain to explore skills, concepts, and practice questions</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(domainId => {
            const domain = NASP_DOMAINS[domainId as keyof typeof NASP_DOMAINS];
            const color = getDomainColor(domainId);
            
            return (
              <button
                key={domainId}
                onClick={() => handleTileClick(domainId)}
                className="p-4 rounded-xl border-2 border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 transition-all group text-left"
                style={{
                  borderColor: selectedDomain === domainId ? color : undefined,
                  backgroundColor: selectedDomain === domainId ? `${color}10` : undefined
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: color }}
                  >
                    {domainId}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-200 text-sm leading-tight group-hover:text-white transition-colors">
                      {domain?.shortName || `Domain ${domainId}`}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-tight">
                  {domain?.name || `Domain ${domainId}`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Domain Detail Modal */}
      {selectedDomain && (() => {
        const { domainInfo, skills, keywords, etsData } = getDomainData(selectedDomain);
        const color = getDomainColor(selectedDomain);
        
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseDetail}
          >
            <div 
              className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-700 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: color }}
                    >
                      {selectedDomain}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-100">
                        {domainInfo?.name || `Domain ${selectedDomain}`}
                      </h3>
                      <p className="text-sm text-slate-400">{domainInfo?.shortName}</p>
                    </div>
                  </div>
                  {domainInfo?.description && (
                    <p className="text-slate-300 mt-2">{domainInfo.description}</p>
                  )}
                </div>
                <button
                  onClick={handleCloseDetail}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Skills Section */}
                {skills.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" style={{ color }} />
                      Skills ({skills.length})
                    </h4>
                    <div className="space-y-3">
                      {skills.map((skill, idx) => (
                        <div 
                          key={idx}
                          className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                        >
                          <p className="font-medium text-slate-200 mb-1">{skill.name}</p>
                          <p className="text-sm text-slate-400">{skill.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords/Vocabulary Section */}
                {keywords.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" style={{ color }} />
                      Keywords & Vocabulary ({keywords.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-full text-sm bg-slate-800 border border-slate-700 text-slate-300"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Must Know Terms */}
                {domainInfo?.mustKnowTerms && Object.keys(domainInfo.mustKnowTerms).length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" style={{ color }} />
                      Must Know Terms
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(domainInfo.mustKnowTerms).map(([term, info]: [string, any]) => (
                        <div 
                          key={term}
                          className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                        >
                          <p className="font-medium text-slate-200 mb-1">{term}</p>
                          <p className="text-sm text-slate-400 mb-2">{info.definition}</p>
                          {info.context && (
                            <p className="text-xs text-slate-500 italic">Context: {info.context}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-700 flex gap-3">
                <button
                  onClick={() => handleStartPractice(selectedDomain)}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors text-white"
                  style={{ backgroundColor: color }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  Start Domain Practice
                </button>
                <button
                  onClick={handleCloseDetail}
                  className="px-4 py-3 rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
