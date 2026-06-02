import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { DiagnosticFeedback as DiagnosticFeedbackType } from '../brain/diagnostic-feedback';

interface DiagnosticFeedbackProps {
  feedback: DiagnosticFeedbackType;
  distractorNote?: string;
  onDismiss?: () => void;
}

// Generic fallbacks that add no value to the learner
const GENERIC_TIPS = new Set([
  'Review the question and rationale carefully',
  'Consider what framework steps apply to this situation',
  'Consider what framework steps apply',
]);

export default function DiagnosticFeedback({
  feedback,
  distractorNote: _distractorNote,
  onDismiss
}: DiagnosticFeedbackProps) {
  const [frameworkOpen, setFrameworkOpen] = useState(false);

  // ── Correct answer: show encouraging card ─────────────────────────────────
  if (feedback.isCorrect) {
    const meaningfulTips = feedback.remediationTips.filter(t => !GENERIC_TIPS.has(t));
    return (
      <div className="rounded-2xl border border-[color:#059669]/30 bg-[color:#059669]/8 backdrop-blur-[14px] p-6">
        <p className="mb-0 text-sm leading-relaxed text-slate-600">
          {feedback.generalExplanation}
        </p>
        {meaningfulTips.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {meaningfulTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-0.5" style={{ color: '#059669' }}>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-[color:#d97706]/40 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:#d97706]"
          >
            Dismiss
          </button>
        )}
      </div>
    );
  }

  // ── Incorrect answer: build Card 2 ────────────────────────────────────────
  const meaningfulTips = feedback.remediationTips.filter(t => !GENERIC_TIPS.has(t));
  const hasFramework = !!(
    feedback.frameworkGuidance &&
    feedback.frameworkGuidance.currentStepId
  );
  const hasPrerequisites = !!(
    feedback.skillGuidance &&
    !feedback.skillGuidance.prerequisiteCheck.met &&
    feedback.skillGuidance.prerequisiteCheck.missingNames.length > 0
  );

  // Don't render this card if there's nothing meaningful to show
  if (meaningfulTips.length === 0 && !hasFramework && !hasPrerequisites) {
    return null;
  }

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-[#ffffff] backdrop-blur-[14px] p-6"
      style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.4)' }}
    >
      {/* Prerequisite Warning */}
      {hasPrerequisites && (
        <div className="mb-4 rounded-xl border border-[color:#e11d48]/40 bg-[color:#e11d48]/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: '#e11d48' }} />
            <div>
              <h5 className="mb-1 text-sm font-semibold text-slate-900">Prerequisites Not Met</h5>
              <p className="text-xs text-slate-600">
                Review foundational skills first:{' '}
                <span className="font-medium text-slate-900">
                  {feedback.skillGuidance!.prerequisiteCheck.missingNames.join(', ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Remediation Tips — only if meaningful */}
      {meaningfulTips.length > 0 && (
        <div className={hasFramework ? 'mb-4' : ''}>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4" style={{ color: '#d97706' }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">What to do next</span>
          </div>
          <ul className="space-y-1.5">
            {meaningfulTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-0.5" style={{ color: '#d97706' }}>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Framework Context — collapsible, only if matched a step */}
      {hasFramework && (
        <div>
          <button
            onClick={() => setFrameworkOpen(o => !o)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 transition-all hover:border-[color:#d97706]/40 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:#d97706]"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" style={{ color: '#d97706' }} />
              <span className="text-sm font-medium text-slate-700">
                Framework Context
                {feedback.frameworkGuidance!.currentStepName && (
                  <span className="ml-2 text-slate-500">
                    ({feedback.frameworkGuidance!.currentStepName})
                  </span>
                )}
              </span>
            </div>
            {frameworkOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {frameworkOpen && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">How this relates to the framework</p>
              <p className="mb-3 text-sm leading-relaxed text-slate-600">
                {feedback.frameworkGuidance!.relationship}
              </p>

              {feedback.frameworkGuidance!.userSelectedStep && (
                <div className="mb-3 rounded-xl border border-[color:#d97706]/40 bg-[color:#d97706]/10 p-3">
                  <p className="mb-1 text-xs font-medium" style={{ color: '#d97706' }}>You may have jumped to:</p>
                  <p className="text-sm text-slate-900">{feedback.frameworkGuidance!.userSelectedStep}</p>
                </div>
              )}

              {feedback.frameworkGuidance!.nextSteps.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-400">Next steps:</p>
                  <ul className="space-y-1.5">
                    {feedback.frameworkGuidance!.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-0.5" style={{ color: '#d97706' }}>•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {onDismiss && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <button
            onClick={onDismiss}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-[color:#d97706]/40 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:#d97706]"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
