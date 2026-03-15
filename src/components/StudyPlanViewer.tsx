import { ReactNode, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckSquare,
  ExternalLink,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Library,
  Printer,
  Sparkles,
  Target
} from 'lucide-react';
import { StudyPlanDocument } from '../services/studyPlanService';

interface StudyPlanViewerProps {
  plan: StudyPlanDocument;
}

type SectionKey =
  | 'summary'
  | 'domainAnalysis'
  | 'prioritySkills'
  | 'vocabularyGaps'
  | 'foundationalReview'
  | 'studyResources'
  | 'masteryChecklist'
  | 'studyPlan'
  | 'weeklySchedule';

interface SectionProps {
  title: string;
  sectionKey: SectionKey;
  isOpen: boolean;
  onToggle: (sectionKey: SectionKey) => void;
  children: ReactNode;
}

function formatAsOfDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'an unknown date';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatGeneratedDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleString();
}

function getUrgencyClasses(urgency: 'high' | 'medium' | 'low'): string {
  if (urgency === 'high') {
    return 'bg-rose-500/15 text-rose-300 border-rose-500/20';
  }

  if (urgency === 'medium') {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/20';
  }

  return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
}

function ViewerSection({
  title,
  sectionKey,
  isOpen,
  onToggle,
  children
}: SectionProps) {
  return (
    <section className="study-plan-section border border-slate-700/40 bg-slate-800/40 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="study-plan-section-toggle w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-800/60 transition-colors"
      >
        <span className="text-base font-semibold text-slate-100">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </button>
      <div className={`study-plan-section-content ${isOpen ? 'block' : 'hidden'} px-5 pb-5`}>
        {children}
      </div>
    </section>
  );
}

export default function StudyPlanViewer({ plan }: StudyPlanViewerProps) {
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    summary: true,
    domainAnalysis: true,
    prioritySkills: true,
    vocabularyGaps: true,
    foundationalReview: true,
    studyResources: true,
    masteryChecklist: true,
    studyPlan: true,
    weeklySchedule: true
  });

  const asOfDate = useMemo(() => formatAsOfDate(plan.generatedAt), [plan.generatedAt]);
  const generatedDate = useMemo(() => formatGeneratedDate(plan.generatedAt), [plan.generatedAt]);

  const handleToggle = (sectionKey: SectionKey) => {
    setOpenSections(current => ({
      ...current,
      [sectionKey]: !current[sectionKey]
    }));
  };

  return (
    <div className="study-plan-viewer space-y-5">
      <style>
        {`
          @media print {
            header,
            nav,
            aside,
            [role="navigation"],
            .sidebar,
            .study-plan-section-toggle,
            .study-plan-print-button,
            .study-plan-app-actions {
              display: none !important;
            }

            main,
            .study-plan-viewer,
            .study-plan-section,
            .study-plan-section-content {
              display: block !important;
              max-width: none !important;
              overflow: visible !important;
            }

            body,
            main {
              background: white !important;
              color: black !important;
            }

            .study-plan-viewer,
            .study-plan-section,
            .study-plan-print-surface {
              border: none !important;
              box-shadow: none !important;
              background: white !important;
            }

            .study-plan-print-surface {
              padding: 0 !important;
            }

            .study-plan-section {
              page-break-inside: avoid;
              margin-bottom: 16px !important;
            }

            .study-plan-section-content {
              padding: 0 0 8px 0 !important;
            }

            .study-plan-grid,
            .study-plan-card-grid {
              display: block !important;
            }

            .study-plan-card-grid > * {
              margin-bottom: 12px !important;
            }
          }
        `}
      </style>

      <div className="study-plan-print-surface space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Study Plan Viewer</p>
                <p className="text-xs text-slate-500">Generated {generatedDate}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              This plan is based on your results as of {asOfDate}. Regenerate after completing more practice.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="study-plan-print-button px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>

        <ViewerSection
          title="Overall Summary"
          sectionKey="summary"
          isOpen={openSections.summary}
          onToggle={handleToggle}
        >
          {plan.plan.finalAssessmentGate && (
            <div className={`mb-4 p-4 rounded-2xl border ${
              plan.plan.finalAssessmentGate.unlocked
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Planned Final Full Assessment Gate</p>
              <p className="text-sm font-semibold text-slate-100">
                {plan.plan.finalAssessmentGate.unlocked
                  ? `Unlocked by current data (${plan.plan.finalAssessmentGate.thresholdPercent}% threshold met).`
                  : `${plan.plan.finalAssessmentGate.remainingSkillCount} tracked deficit skills still need to reach ${plan.plan.finalAssessmentGate.thresholdPercent}%.`}
              </p>
              <p className="mt-2 text-sm text-slate-300">{plan.plan.finalAssessmentGate.guidance}</p>
              {plan.plan.finalAssessmentGate.remainingSkills.length > 0 && (
                <div className="mt-3 space-y-1">
                  {plan.plan.finalAssessmentGate.remainingSkills.map(skill => (
                    <p key={skill} className="text-xs text-slate-400">{skill}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="study-plan-card-grid grid gap-4 lg:grid-cols-3 pt-1">
            <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Readiness</p>
              <p className="text-lg font-semibold text-slate-100">{plan.plan.summary.readiness}</p>
            </div>
            <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl lg:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Next Best Move</p>
              <p className="text-sm text-slate-200">{plan.plan.summary.nextBestMove}</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-slate-800/30 border border-slate-700/40 rounded-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Overview</p>
            <p className="text-sm text-slate-300 leading-6">{plan.plan.summary.overview}</p>
          </div>
        </ViewerSection>

        <ViewerSection
          title="Domain Analysis"
          sectionKey="domainAnalysis"
          isOpen={openSections.domainAnalysis}
          onToggle={handleToggle}
        >
          <div className="study-plan-card-grid grid gap-4 md:grid-cols-2 pt-1">
            {plan.plan.domainAnalysis.map(domain => (
              <div key={`${domain.domainId}-${domain.domainName}`} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{domain.domainName}</p>
                    <p className="text-xs text-slate-500">Domain {domain.domainId}</p>
                  </div>
                  <span className="text-sm font-bold text-cyan-300">
                    {domain.score === null ? 'N/A' : `${domain.score}%`}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{domain.analysis}</p>
                <div className="space-y-2">
                  {domain.nextSteps.map(step => (
                    <p key={step} className="text-sm text-slate-400">
                      {step}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ViewerSection>

        <ViewerSection
          title="Priority Skills"
          sectionKey="prioritySkills"
          isOpen={openSections.prioritySkills}
          onToggle={handleToggle}
        >
          <div className="space-y-3 pt-1">
            {plan.plan.prioritySkills.map(skill => (
              <div key={skill.skillId} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-300" />
                      <p className="text-sm font-semibold text-slate-100">{skill.skillName}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{skill.skillId}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getUrgencyClasses(skill.urgency)}`}>
                    {skill.urgency}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{skill.reason}</p>
              </div>
            ))}
          </div>
        </ViewerSection>

        <ViewerSection
          title="Vocabulary Gaps"
          sectionKey="vocabularyGaps"
          isOpen={openSections.vocabularyGaps}
          onToggle={handleToggle}
        >
          <div className="space-y-3 pt-1">
            {plan.plan.vocabularyGaps.map(gap => (
              <div key={gap.term} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-300" />
                  <p className="text-sm font-semibold text-slate-100">{gap.term}</p>
                </div>
                <p className="text-sm text-slate-300">{gap.meaning}</p>
                <p className="text-xs text-slate-500">{gap.whyItMatters}</p>
              </div>
            ))}
          </div>
        </ViewerSection>

        <ViewerSection
          title="Foundational Review"
          sectionKey="foundationalReview"
          isOpen={openSections.foundationalReview}
          onToggle={handleToggle}
        >
          <div className="space-y-3 pt-1">
            {plan.plan.foundationalReview.length === 0 && (
              <p className="text-sm text-slate-400">No prerequisite review items were surfaced from this guide.</p>
            )}
            {plan.plan.foundationalReview.map(item => (
              <div key={item.skillId} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{item.skillName}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.skillId}</p>
                </div>
                <p className="text-sm text-slate-300">{item.whyNow}</p>
                <div className="space-y-2">
                  {item.reviewActions.map(action => (
                    <p key={action} className="text-sm text-slate-400">{action}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ViewerSection>

        <ViewerSection
          title="Study Resources"
          sectionKey="studyResources"
          isOpen={openSections.studyResources}
          onToggle={handleToggle}
        >
          <div className="space-y-3 pt-1">
            {plan.plan.studyResources.length === 0 && (
              <p className="text-sm text-slate-400">Regenerate the guide after more practice to surface study-resource recommendations.</p>
            )}
            {plan.plan.studyResources.map(resource => (
              <div key={`${resource.title}-${resource.focusArea}`} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Library className="w-4 h-4 text-cyan-300" />
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{resource.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{resource.resourceType} • {resource.focusArea}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0" />
                </div>
                <p className="text-sm text-slate-300">{resource.whyItHelps}</p>
                <p className="text-sm text-slate-400">{resource.action}</p>
              </div>
            ))}
          </div>
        </ViewerSection>

        <ViewerSection
          title="Mastery Checklist"
          sectionKey="masteryChecklist"
          isOpen={openSections.masteryChecklist}
          onToggle={handleToggle}
        >
          <div className="space-y-3 pt-1">
            {plan.plan.masteryChecklist.length === 0 && (
              <p className="text-sm text-slate-400">No checklist items are available yet for this guide.</p>
            )}
            {plan.plan.masteryChecklist.map(item => (
              <div key={`${item.category}-${item.skillId}`} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl">
                <div className="flex items-start gap-3">
                  <CheckSquare className="w-5 h-5 text-emerald-300 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-100">{item.skillName}</p>
                    <p className="text-xs text-slate-500">
                      {item.category === 'deficit' ? 'Deficit skill' : 'Foundational review'} • Target {item.targetScore}%+
                      {item.currentScore !== null ? ` • Current ${item.currentScore}%` : ''}
                    </p>
                    <p className="text-sm text-slate-300">{item.note}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ViewerSection>

        <ViewerSection
          title="Study Plan"
          sectionKey="studyPlan"
          isOpen={openSections.studyPlan}
          onToggle={handleToggle}
        >
          <div className="study-plan-card-grid grid gap-4 lg:grid-cols-3 pt-1">
            {plan.plan.studyPlan.map(phase => (
              <div key={phase.phase} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <p className="text-sm font-semibold text-slate-100">{phase.phase}</p>
                </div>
                <p className="text-sm text-cyan-300">{phase.goal}</p>
                <div className="space-y-2">
                  {phase.actions.map(action => (
                    <p key={action} className="text-sm text-slate-300">
                      {action}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ViewerSection>

        <ViewerSection
          title="Weekly Schedule"
          sectionKey="weeklySchedule"
          isOpen={openSections.weeklySchedule}
          onToggle={handleToggle}
        >
          <div className="study-plan-card-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3 pt-1">
            {plan.plan.weeklySchedule.map(day => (
              <div key={day.day} className="p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-orange-300" />
                    <p className="text-sm font-semibold text-slate-100">{day.day}</p>
                  </div>
                  <span className="text-xs font-semibold text-orange-300">{day.durationMinutes} min</span>
                </div>
                <p className="text-sm text-slate-300">{day.focus}</p>
                <div className="space-y-2">
                  {day.tasks.map(task => (
                    <p key={task} className="text-sm text-slate-400">
                      {task}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ViewerSection>
      </div>
    </div>
  );
}
