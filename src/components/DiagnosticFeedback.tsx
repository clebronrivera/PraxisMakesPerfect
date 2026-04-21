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
      <div className="rounded-2xl border border-[color:var(--d2-mint)]/30 bg-[color:var(--d2-mint)]/8 backdrop-blur-[14px] p-6">
        <p className="mb-0 text-sm leading-relaxed text-slate-300">
          {feedback.generalExplanation}
        </p>
        {meaningfulTips.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {meaningfulTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-0.5" style={{ color: 'var(--d2-mint)' }}>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-all hover:border-[color:var(--d1-peach)]/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)]"
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
      className="rounded-2xl border border-white/8 bg-[rgba(10,22,40,0.55)] backdrop-blur-[14px] p-6"
      style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.4)' }}
    >
      {/* Prerequisite Warning */}
      {hasPrerequisites && (
        <div className="mb-4 rounded-xl border border-[color:var(--accent-rose)]/40 bg-[color:var(--accent-rose)]/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: 'var(--accent-rose)' }} />
            <div>
              <h5 className="mb-1 text-sm font-semibold text-white">Prerequisites Not Met</h5>
              <p className="text-xs text-slate-300">
                Review foundational skills first:{' '}
                <span className="font-medium text-white">
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
            <Lightbulb className="h-4 w-4" style={{ color: 'var(--d1-peach)' }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">What to do next</span>
          </div>
          <ul className="space-y-1.5">
            {meaningfulTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-0.5" style={{ color: 'var(--d1-peach)' }}>•</span>
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
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:border-[color:var(--d1-peach)]/40 hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)]"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" style={{ color: 'var(--d1-peach)' }} />
              <span className="text-sm font-medium text-slate-200">
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
            <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">How this relates to the framework</p>
              <p className="mb-3 text-sm leading-relaxed text-slate-300">
                {feedback.frameworkGuidance!.relationship}
              </p>

              {feedback.frameworkGuidance!.userSelectedStep && (
                <div className="mb-3 rounded-xl border border-[color:var(--d1-peach)]/40 bg-[color:var(--d1-peach)]/10 p-3">
                  <p className="mb-1 text-xs font-medium" style={{ color: 'var(--d1-peach)' }}>You may have jumped to:</p>
                  <p className="text-sm text-white">{feedback.frameworkGuidance!.userSelectedStep}</p>
                </div>
              )}

              {feedback.frameworkGuidance!.nextSteps.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-400">Next steps:</p>
                  <ul className="space-y-1.5">
                    {feedback.frameworkGuidance!.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="mt-0.5" style={{ color: 'var(--d1-peach)' }}>•</span>
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
        <div className="mt-4 border-t border-white/8 pt-4">
          <button
            onClick={onDismiss}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-all hover:border-[color:var(--d1-peach)]/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)]"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
