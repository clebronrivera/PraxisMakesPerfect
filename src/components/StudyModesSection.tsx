import { Lock, ChevronRight, Layers, Target, TrendingUp } from 'lucide-react';
import { getDomainColor } from '../utils/domainColors';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';
import type { UserProfile } from '../hooks/useFirebaseProgress';

interface StudyModesSectionProps {
  profile: UserProfile;
  onDomainSelect: (domainId: number) => void;
  onSkillReviewOpen: () => void;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function domainPct(
  domainScores: UserProfile['domainScores'],
  domainId: number
): number | null {
  const d = domainScores[domainId];
  if (!d || d.total === 0) return null;
  return Math.round((d.correct / d.total) * 100);
}

function pctColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-400';
  if (pct >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

function pctBar(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

// ─── Domain Review Panel ─────────────────────────────────────────────────────

interface DomainPanelProps {
  profile: UserProfile;
  isLocked: boolean;
  onDomainSelect: (domainId: number) => void;
}

function DomainReviewPanel({ profile, isLocked, onDomainSelect }: DomainPanelProps) {
  return (
    <div
      className={`rounded-2xl border transition-all ${
        isLocked
          ? 'border-slate-700/40 bg-slate-800/20'
          : 'border-slate-700/60 bg-slate-800/40'
      }`}
    >
      {/* Panel header */}
      <div className="p-5 border-b border-slate-700/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isLocked ? 'bg-slate-700/50' : 'bg-blue-500/20'
            }`}
          >
            {isLocked ? (
              <Lock className="w-4 h-4 text-slate-500" />
            ) : (
              <Layers className="w-4 h-4 text-blue-400" />
            )}
          </div>
          <div>
            <h3
              className={`font-bold text-base ${
                isLocked ? 'text-slate-500' : 'text-slate-100'
              }`}
            >
              Domain Review
            </h3>
            <p className="text-xs text-slate-500">4 domains · by Praxis section</p>
          </div>
        </div>
        {isLocked && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-500 border border-slate-700/40">
            Locked
          </span>
        )}
      </div>

      {/* Body */}
      {isLocked ? (
        <div className="p-6 text-center space-y-3">
          <Lock className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-sm text-slate-500 leading-relaxed">
            Complete the <span className="text-slate-300 font-medium">Skills Screener</span> to
            unlock focused domain practice.
          </p>
          <p className="text-xs text-slate-600">
            The screener identifies your baseline across all 4 Praxis domains.
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {PROGRESS_DOMAINS.map((domain) => {
            const color = getDomainColor(domain.id);
            const skillCount = getProgressSkillsForDomain(domain.id).length;
            const pct = domainPct(profile.domainScores, domain.id);

            return (
              <button
                key={domain.id}
                onClick={() => onDomainSelect(domain.id)}
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-left transition-all hover:border-slate-600 hover:bg-slate-800/60 group"
              >
                <div className="flex items-center gap-3">
                  {/* Domain badge */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {domain.id}
                  </div>

                  {/* Name + skills */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">
                      {domain.name}
                    </p>
                    <p className="text-xs text-slate-500">{skillCount} skills</p>
                  </div>

                  {/* Score + chevron */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {pct !== null ? (
                      <div className="text-right">
                        <span className={`text-sm font-bold ${pctColor(pct)}`}>{pct}%</span>
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pctBar(pct)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 italic">No data</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Skill Review Panel ──────────────────────────────────────────────────────

interface SkillPanelProps {
  profile: UserProfile;
  isLocked: boolean;
  onSkillReviewOpen: () => void;
}

function SkillReviewPanel({ profile, isLocked, onSkillReviewOpen }: SkillPanelProps) {
  // Compute quick stats from skillScores
  const allSkillEntries = Object.entries(profile.skillScores ?? {});
  const attempted = allSkillEntries.filter(([, s]) => s.attempts > 0);
  const totalSkills = 45; // canonical count

  // Top 3 weakest attempted skills for the preview
  const weakest = [...attempted]
    .filter(([, s]) => s.attempts > 0)
    .sort(([, a], [, b]) => (a.correct / a.attempts) - (b.correct / b.attempts))
    .slice(0, 3);

  const masteredCount = attempted.filter(
    ([, s]) => s.attempts > 0 && s.correct / s.attempts >= 0.8
  ).length;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isLocked
          ? 'border-slate-700/40 bg-slate-800/20'
          : 'border-slate-700/60 bg-slate-800/40'
      }`}
    >
      {/* Panel header */}
      <div className="p-5 border-b border-slate-700/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isLocked ? 'bg-slate-700/50' : 'bg-purple-500/20'
            }`}
          >
            {isLocked ? (
              <Lock className="w-4 h-4 text-slate-500" />
            ) : (
              <Target className="w-4 h-4 text-purple-400" />
            )}
          </div>
          <div>
            <h3
              className={`font-bold text-base ${
                isLocked ? 'text-slate-500' : 'text-slate-100'
              }`}
            >
              Skill Review
            </h3>
            <p className="text-xs text-slate-500">{totalSkills} skills · targeted practice</p>
          </div>
        </div>
        {isLocked && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-500 border border-slate-700/40">
            Locked
          </span>
        )}
      </div>

      {/* Body */}
      {isLocked ? (
        <div className="p-6 text-center space-y-3">
          <Lock className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-sm text-slate-500 leading-relaxed">
            Complete the{' '}
            <span className="text-slate-300 font-medium">Full Assessment</span> to unlock
            skill-by-skill targeted review.
          </p>
          <p className="text-xs text-slate-600">
            The full assessment maps your performance across all 45 NASP skills.
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Summary stats row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/50 rounded-lg px-2 py-2.5">
              <p className="text-lg font-bold text-slate-100">{attempted.length}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Attempted</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg px-2 py-2.5">
              <p className="text-lg font-bold text-emerald-400">{masteredCount}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Strong (≥80%)</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg px-2 py-2.5">
              <p className="text-lg font-bold text-rose-400">
                {attempted.filter(([, s]) => s.correct / s.attempts < 0.6).length}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Need Work</p>
            </div>
          </div>

          {/* Weakest skills preview */}
          {weakest.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">
                <TrendingUp className="w-3 h-3 inline mr-1 text-rose-500" />
                Focus Areas
              </p>
              {weakest.map(([skillId, skill]) => {
                const pct = Math.round((skill.correct / skill.attempts) * 100);
                return (
                  <div
                    key={skillId}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20"
                  >
                    <span className="text-xs text-slate-300 truncate max-w-[140px]">
                      {skillId}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-bold ${pctColor(pct)}`}>{pct}%</span>
                      <span className="text-[10px] text-slate-600">
                        {skill.correct}/{skill.attempts}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={onSkillReviewOpen}
            className="w-full py-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Browse All Skills
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function StudyModesSection({
  profile,
  onDomainSelect,
  onSkillReviewOpen,
}: StudyModesSectionProps) {
  const screenerComplete = Boolean(profile.screenerComplete);
  const fullAssessmentComplete = Boolean(profile.fullAssessmentComplete);

  return (
    <section className="space-y-4">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Practice & Review</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Two study modes — complete each assessment to unlock.
          </p>
        </div>
        {/* Unlock progress pills */}
        <div className="hidden sm:flex items-center gap-2">
          <span
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
              screenerComplete
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-700/50 text-slate-500 border-slate-700/40'
            }`}
          >
            {screenerComplete ? '✓ Screener done' : 'Screener needed'}
          </span>
          <span
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
              fullAssessmentComplete
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-700/50 text-slate-500 border-slate-700/40'
            }`}
          >
            {fullAssessmentComplete ? '✓ Full assessment done' : 'Full assessment needed'}
          </span>
        </div>
      </div>

      {/* Two panels */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DomainReviewPanel
          profile={profile}
          isLocked={!screenerComplete}
          onDomainSelect={onDomainSelect}
        />
        <SkillReviewPanel
          profile={profile}
          isLocked={!fullAssessmentComplete}
          onSkillReviewOpen={onSkillReviewOpen}
        />
      </div>
    </section>
  );
}
