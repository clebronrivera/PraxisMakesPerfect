import { useMemo, useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Layers, Lock, X, RotateCcw } from 'lucide-react';
import type { Skill } from '../types/content';
import type { UserProfile } from '../hooks/useFirebaseProgress';
import { buildProgressSummary, type SkillProgressSummary, type SkillColorState } from '../utils/progressSummaries';
import { getDomainColor } from '../utils/domainColors';

interface ResultsDashboardProps {
  userProfile: UserProfile;
  skills: Skill[];
  onStartPractice: (domainId?: number) => void;
  onStartSkillPractice: (skillId: string) => void;
  fullAssessmentUnlocked: boolean;
  onRetakeAssessment: () => void;
  onResetProgress: () => void;
  /** Open the dashboard directly on this tab. Defaults to 'domain'. */
  defaultView?: 'domain' | 'skill';
}

function formatPercent(score: number | null): string {
  if (score === null) {
    return 'No data';
  }

  return `${Math.round(score * 100)}%`;
}

function getSkillTone(skill: SkillProgressSummary): { badge: string; tile: string; text: string } {
  const styles: Record<SkillColorState, { badge: string; tile: string; text: string }> = {
    gray: {
      badge: 'bg-slate-700/70 text-slate-300 border-slate-600/70',
      tile: 'border-slate-700 bg-slate-800/40 hover:border-slate-600',
      text: 'text-slate-300'
    },
    red: {
      badge: 'bg-rose-500/15 text-rose-200 border-rose-500/30',
      tile: 'border-rose-500/30 bg-rose-500/10 hover:border-rose-400/50',
      text: 'text-rose-200'
    },
    yellow: {
      badge: 'bg-amber-500/15 text-amber-100 border-amber-500/30',
      tile: 'border-amber-500/30 bg-amber-500/10 hover:border-amber-400/50',
      text: 'text-amber-100'
    },
    green: {
      badge: 'bg-emerald-500/15 text-emerald-100 border-emerald-500/30',
      tile: 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400/50',
      text: 'text-emerald-100'
    }
  };

  return styles[skill.colorState];
}

export default function ResultsDashboard({
  userProfile,
  skills,
  onStartPractice,
  onStartSkillPractice,
  fullAssessmentUnlocked,
  onRetakeAssessment,
  onResetProgress,
  defaultView = 'domain',
}: ResultsDashboardProps) {
  const [viewMode, setViewMode] = useState<'domain' | 'skill'>(defaultView);
  const [expandedDomainId, setExpandedDomainId] = useState<number | null>(1);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const progress = useMemo(() => buildProgressSummary(userProfile.skillScores, skills), [skills, userProfile.skillScores]);
  const selectedSkill = progress.skills.find((skill) => skill.skillId === selectedSkillId) || null;
  const weakestDomain = progress.domains
    .filter((domain) => domain.attempted > 0 && domain.score !== null)
    .sort((a, b) => {
      if (a.score !== null && b.score !== null && a.score !== b.score) {
        return a.score - b.score;
      }

      return b.weakSkillCount - a.weakSkillCount;
    })[0] || null;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-100">Your Progress</h2>
        <p className="text-slate-400">
          Based on {userProfile.totalQuestionsSeen ?? userProfile.practiceResponseCount ?? 0} answered exposures across the active 45 skills
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700 w-fit mx-auto">
        <button
          onClick={() => setViewMode('domain')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            viewMode === 'domain' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          By Domain
        </button>
        <button
          onClick={() => setViewMode('skill')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            viewMode === 'skill' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          By Skill
        </button>
      </div>

      {viewMode === 'domain' ? (
        <div className="space-y-4">
          {progress.domains.map((domain) => {
            const isExpanded = expandedDomainId === domain.domainId;
            const color = getDomainColor(domain.domainId);

            return (
              <div
                key={domain.domainId}
                className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40"
              >
                <button
                  onClick={() => setExpandedDomainId(isExpanded ? null : domain.domainId)}
                  className="w-full p-6 text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {domain.domainId}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-lg font-semibold text-slate-100">{domain.domainName}</p>
                          <p className="text-sm text-slate-400">{domain.subtitle}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-slate-300">
                            Accuracy: {formatPercent(domain.score)}
                          </span>
                          <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-slate-300">
                            Skills assessed: {domain.assessedSkillCount}/{domain.activeSkillCount}
                          </span>
                          <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-200">
                            Weak: {domain.weakSkillCount}
                          </span>
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-100">
                            Developing: {domain.developingSkillCount}
                          </span>
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            Stronger: {domain.strongerSkillCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onStartPractice(domain.domainId);
                        }}
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: color }}
                      >
                        Domain Review
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-700/50 bg-slate-900/40 p-6">
                    <div className="grid gap-3 md:grid-cols-2">
                      {domain.skills.map((skill) => {
                        const tone = getSkillTone(skill);
                        return (
                          <button
                            key={skill.skillId}
                            onClick={() => setSelectedSkillId(skill.skillId)}
                            className={`rounded-2xl border p-4 text-left transition-all ${tone.tile}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-100">{skill.skillId}</p>
                                <p className="text-sm text-slate-300">{skill.shortLabel}</p>
                              </div>
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
                                {skill.statusLabel}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                              <span>Correct: {skill.correct}</span>
                              <span>Attempts: {skill.attempted}</span>
                              <span>Accuracy: {formatPercent(skill.score)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {!fullAssessmentUnlocked && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Skill-specific practice unlocks after the full assessment. You can still open any tile to review progress and prerequisites.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {progress.skills.map((skill) => {
              const tone = getSkillTone(skill);
              return (
                <button
                  key={skill.skillId}
                  onClick={() => setSelectedSkillId(skill.skillId)}
                  className={`rounded-2xl border p-4 text-left transition-all ${tone.tile}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{skill.skillId}</p>
                      <p className={`mt-1 text-sm ${tone.text}`}>{skill.shortLabel}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
                      {skill.statusLabel}
                    </span>
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-slate-400">
                    <p>{skill.domainName}</p>
                    <p>{skill.correct} correct / {skill.attempted} attempts</p>
                    <p>Accuracy: {formatPercent(skill.score)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {weakestDomain && (
          <button
            onClick={() => onStartPractice(weakestDomain.domainId)}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            Start Domain Review in {weakestDomain.domainName}
          </button>
        )}
        <button
          onClick={onRetakeAssessment}
          className="w-full rounded-2xl border border-slate-600 bg-slate-700/50 p-4 text-slate-300 transition-all hover:bg-slate-700"
        >
          Retake Screener
        </button>
      </div>

      <div className="pt-8 border-t border-slate-700/50">
        <button
          onClick={onResetProgress}
          className="w-full p-4 bg-slate-800/30 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-medium">Reset All Progress</span>
        </button>
      </div>

      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{selectedSkill.domainName}</p>
                <h3 className="text-2xl font-bold text-slate-100">{selectedSkill.skillId}</h3>
                <p className="text-slate-300">{selectedSkill.fullLabel}</p>
              </div>
              <button
                onClick={() => setSelectedSkillId(null)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Attempts</p>
                <p className="mt-2 text-2xl font-bold text-slate-100">{selectedSkill.attempted}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Correct</p>
                <p className="mt-2 text-2xl font-bold text-slate-100">{selectedSkill.correct}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Accuracy</p>
                <p className="mt-2 text-2xl font-bold text-slate-100">{formatPercent(selectedSkill.score)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current State</p>
              <p className="mt-2 text-sm text-slate-200">{selectedSkill.statusLabel}</p>
              {selectedSkill.attempted === 0 && (
                <p className="mt-2 text-sm text-slate-400">
                  This skill is gray because you have not answered any questions tied to it yet.
                </p>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Prerequisites</p>
              {selectedSkill.prerequisiteNames.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSkill.prerequisiteNames.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-300"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No prerequisite links are stored for this skill yet.</p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => onStartPractice(selectedSkill.domainId)}
                className="flex-1 rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 font-semibold text-slate-100 transition-colors hover:bg-slate-700"
              >
                Domain Review in {selectedSkill.domainName}
              </button>
              <button
                onClick={() => onStartSkillPractice(selectedSkill.skillId)}
                disabled={!fullAssessmentUnlocked}
                className={`flex-1 rounded-2xl px-4 py-3 font-semibold transition-colors ${
                  fullAssessmentUnlocked
                    ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {fullAssessmentUnlocked ? 'Practice This Skill' : 'Full Assessment Required'}
              </button>
            </div>
            {!fullAssessmentUnlocked && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                <Lock className="w-4 h-4" />
                <span>Skill-specific review stays locked until the full assessment is complete.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
