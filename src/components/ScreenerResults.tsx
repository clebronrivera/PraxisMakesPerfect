import { AlertTriangle, BarChart3, BookOpen, CheckCircle2, ChevronRight, Layers, Target } from 'lucide-react';
import { useMemo } from 'react';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
import type { UserResponse } from '../brain/weakness-detector';
import { useEngine } from '../hooks/useEngine';
import { getDomainColor } from '../utils/domainColors';
import {
  buildAssessmentReportModel,
  DOMAIN_BUILDING_THRESHOLD,
  DOMAIN_READY_THRESHOLD,
  OVERALL_BUILDING_THRESHOLD,
  OVERALL_READY_THRESHOLD,
  type ReadinessTone
} from '../utils/assessmentReport';
import { PROFICIENCY_META } from '../utils/skillProficiency';

interface ScreenerResultsProps {
  responses: UserResponse[];
  questions: AnalyzedQuestion[];
  flow: 'screener' | 'archived-short-assessment';
  onStartPractice?: (domainId?: number) => void;
  onTakeFullAssessment?: () => void;
  onGoHome?: () => void;
}

const toneStyles: Record<ReadinessTone, string> = {
  ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  building: 'border-amber-200 bg-amber-50 text-amber-700',
  priority: 'border-rose-200 bg-rose-50 text-rose-700'
};

function formatPercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function domainStatusLabel(score: number): string {
  if (score >= DOMAIN_READY_THRESHOLD) {
    return PROFICIENCY_META.proficient.label;
  }
  if (score >= DOMAIN_BUILDING_THRESHOLD) {
    return PROFICIENCY_META.approaching.label;
  }
  return PROFICIENCY_META.emerging.label;
}

function overallMeaning(score: number): string {
  if (score >= OVERALL_READY_THRESHOLD) {
    return 'You are meeting the threshold overall. Keep your strongest areas steady and tighten the domains that still lag.';
  }
  if (score >= OVERALL_BUILDING_THRESHOLD) {
    return 'You are approaching the threshold overall, but some weak spots are still large enough to slow you down on a mixed assessment.';
  }
  return 'The biggest gain will come from remediating foundational concepts before you spend time on harder mixed sets.';
}

export default function ScreenerResults({
  responses,
  questions,
  flow,
  onStartPractice,
  onTakeFullAssessment,
  onGoHome
}: ScreenerResultsProps) {
  const engine = useEngine();

  const report = useMemo(() => (
    buildAssessmentReportModel(responses, questions, engine.domains, engine.skills)
  ), [engine.domains, engine.skills, questions, responses]);

  if (report.totalQuestions === 0 || report.domainSummaries.length === 0) {
    return (
      <div className="editorial-surface flex min-h-[400px] flex-col items-center justify-center space-y-4 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="h-7 w-7 text-amber-700" />
        </div>
        <p className="text-lg font-semibold text-slate-900">Result data is not available for this assessment yet.</p>
        <p className="max-w-xl text-sm text-slate-500">
          Try returning home and reopening the report, or continue with practice.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {onStartPractice && (
            <button
              onClick={() => onStartPractice()}
              className="editorial-button-primary"
            >
              Start Domain Review
            </button>
          )}
          <button
            onClick={() => {
              if (onGoHome) {
                onGoHome();
                return;
              }

              window.location.reload();
            }}
            className="editorial-button-secondary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const primaryDomain = report.highestNeedDomains[0];
  const title = flow === 'screener' ? 'Screener Report' : 'Archived Short-Assessment Report';
  const subtitle = flow === 'screener'
    ? `Completed the skills screener (${report.totalQuestions} questions).`
    : `Completed an archived short assessment (${report.totalQuestions} questions).`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-1 py-2 sm:px-0">
      <div className="space-y-2 px-1">
        <p className="editorial-overline">
          Practical Study Guidance
        </p>
        <h2 className="editorial-heading text-3xl sm:text-4xl">{title}</h2>
        <p className="editorial-copy">{subtitle}</p>
      </div>

      <section className="editorial-panel-dark overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${toneStyles[report.readiness.tone]}`}>
                {report.readiness.label}
              </span>
              <span className="text-sm text-slate-300">
                {report.correctAnswers} correct out of {report.totalQuestions}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-bold text-white">{formatPercent(report.overallScore)}</p>
              <p className="text-slate-200">{report.readiness.description}</p>
              <p className="text-sm text-slate-400">{overallMeaning(report.overallScore)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-amber-500/20 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Best Next Step</p>
              <p className="mt-2 text-sm text-slate-100">{report.readiness.nextAction}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Highest-Need Domains</p>
              <div className="mt-4 space-y-3">
                {report.highestNeedDomains.map((domain) => (
                  <div key={domain.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-100">{domain.name}</p>
                      <span className="text-sm font-bold" style={{ color: getDomainColor(domain.id) }}>
                        {formatPercent(domain.score)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{domain.correct} correct out of {domain.total} attempted</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Foundational Concepts To Review</p>
              <div className="mt-4 space-y-3">
                {report.foundationalGaps.length > 0 ? (
                  report.foundationalGaps.map((gap) => (
                    <div key={gap.skillId} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                      <p className="text-sm font-semibold text-amber-100">{gap.skillName}</p>
                      <p className="mt-1 text-xs text-amber-50/80">
                        Linked to misses in {gap.triggeredBy.slice(0, 2).join(' and ')}.
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-300">
                    No prerequisite links were surfaced from this attempt, so start with your weakest domains below.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="editorial-surface p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-700" />
            <h3 className="text-lg font-semibold text-slate-900">Performance by Domain</h3>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            These percentages are based on the questions you actually saw in each domain for this assessment.
          </p>
          <div className="mt-6 space-y-4">
            {report.domainSummaries.map((domain) => (
              <div key={domain.id} className="editorial-surface-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{domain.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{domain.correct} correct out of {domain.total} attempted</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: getDomainColor(domain.id) }}>
                      {formatPercent(domain.score)}
                    </p>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneStyles[domain.tone]}`}>
                      {domainStatusLabel(domain.score)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(domain.score * 100)}%`,
                      backgroundColor: getDomainColor(domain.id)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="editorial-surface p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-700" />
              <h3 className="text-lg font-semibold text-slate-900">Study Next</h3>
            </div>
            <div className="mt-5 space-y-3">
              {report.highestNeedDomains.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => onStartPractice?.(domain.id)}
                  className="editorial-surface-soft w-full p-4 text-left transition-colors hover:border-amber-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{domain.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Start mixed review here first to address the biggest score drag.
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="editorial-surface p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">Current Strengths</h3>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {report.strengths.length > 0 ? (
                report.strengths.map((skill) => (
                  <span
                    key={skill.skillId}
                    className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700"
                  >
                    {skill.skillName}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  This attempt did not surface strong repeat signals yet. Use a few more practice items to sharpen the picture.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-surface p-6">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-amber-700" />
          <h3 className="text-lg font-semibold text-slate-900">Domain Drilldown</h3>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Open a domain to see strengths, likely gaps, linked prerequisites, and the clearest next focus.
        </p>
        <div className="mt-6 space-y-4">
          {report.domainSummaries.map((domain, index) => (
            <details
              key={domain.id}
              open={index === 0}
              className="group rounded-[1.5rem] border border-slate-200 bg-[#fbfaf7] p-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{domain.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatPercent(domain.score)} • {domain.correct}/{domain.total} correct
                  </p>
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneStyles[domain.tone]}`}>
                  {domainStatusLabel(domain.score)}
                </span>
              </summary>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Strengths</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {domain.strengths.length > 0 ? (
                        domain.strengths.map((skill) => (
                          <span
                            key={skill.skillId}
                            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700"
                          >
                            {skill.skillName}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No clear strengths surfaced in this domain yet.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Weaknesses</p>
                    <div className="mt-3 space-y-2">
                      {domain.weaknesses.length > 0 ? (
                        domain.weaknesses.map((skill) => (
                          <div key={skill.skillId} className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                            <p className="text-sm font-semibold text-rose-700">{skill.skillName}</p>
                            <p className="mt-1 text-xs text-rose-600">
                              Missed {skill.incorrect} time{skill.incorrect === 1 ? '' : 's'} in this assessment.
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No repeated misses surfaced in this domain.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Foundational Refresh</p>
                    <div className="mt-3 space-y-2">
                      {domain.foundationalGaps.length > 0 ? (
                        domain.foundationalGaps.map((gap) => (
                          <div key={gap.skillId} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <p className="text-sm font-semibold text-amber-700">{gap.skillName}</p>
                            <p className="mt-1 text-xs text-amber-700">
                              Review this before harder work in {gap.triggeredBy.slice(0, 2).join(' and ')}.
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No prerequisite-linked refresh areas were surfaced here.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Recommended Focus</p>
                    <div className="mt-3 space-y-2">
                      {domain.recommendations.map((recommendation) => (
                        <div key={recommendation} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          {recommendation}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => onStartPractice?.(domain.id)}
                      className="editorial-button-secondary mt-4"
                    >
                      Practice This Domain
                    </button>
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        {onStartPractice && (
          <button
            onClick={() => onStartPractice(primaryDomain?.id)}
            className="editorial-button-primary flex-1"
          >
            Start Domain Review
          </button>
        )}
        {onTakeFullAssessment && (
          <button
            onClick={onTakeFullAssessment}
            className="editorial-button-dark flex-1"
          >
            Take Full Assessment
          </button>
        )}
        <button
          onClick={() => {
            if (onGoHome) {
              onGoHome();
              return;
            }

            window.location.reload();
          }}
          className="editorial-button-secondary"
        >
          Return Home
        </button>
      </div>

      <div className="editorial-surface-soft p-4 text-sm text-slate-500">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
          <p>
            Domain readiness here is a practical study signal, not a formal scaled score. Each domain uses the questions you actually saw in this assessment, and prerequisite review is only surfaced when linked metadata exists for the missed skill.
          </p>
        </div>
      </div>
    </div>
  );
}
