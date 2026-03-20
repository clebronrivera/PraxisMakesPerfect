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
const GENERIC_EXPLANATION = new Set([
  'This answer is incorrect. Review the rationale to understand the correct approach.',
  'Your answer was incorrect. Review the rationale to understand the correct approach.',
]);

export default function DiagnosticFeedback({
  feedback,
  distractorNote,
  onDismiss
}: DiagnosticFeedbackProps) {
  const [frameworkOpen, setFrameworkOpen] = useState(false);

  // ── Correct answer: show encouraging card ─────────────────────────────────
  if (feedback.isCorrect) {
    const meaningfulTips = feedback.remediationTips.filter(t => !GENERIC_TIPS.has(t));
    return (
      <div className="rounded-[2rem] border border-emerald-200 bg-white p-6">
        <p className="mb-0 text-sm leading-relaxed text-slate-700">
          {feedback.generalExplanation}
        </p>
        {meaningfulTips.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {meaningfulTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 text-emerald-600">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-4 w-full rounded-xl border border-slate-200 bg-[#fbfaf7] px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-amber-300 hover:text-slate-900"
          >
            Dismiss
          </button>
        )}
      </div>
    );
  }

  // ── Incorrect answer: build Card 2 ────────────────────────────────────────
  const meaningfulTips = feedback.remediationTips.filter(t => !GENERIC_TIPS.has(t));
  const hasDistractorNote = !!distractorNote;
  const hasNonGenericExplanation = !GENERIC_EXPLANATION.has(feedback.generalExplanation);
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
  if (!hasDistractorNote && !hasNonGenericExplanation && meaningfulTips.length === 0 && !hasFramework && !hasPrerequisites) {
    return null;
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
      {/* Leading explanation — distractor-specific or non-generic pattern explanation */}
      {(hasDistractorNote || hasNonGenericExplanation) && (
        <p className="mb-4 text-sm leading-relaxed text-slate-700">
          {distractorNote || feedback.generalExplanation}
        </p>
      )}

      {/* Prerequisite Warning */}
      {hasPrerequisites && (
        <div className="mb-4 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
            <div>
              <h5 className="mb-1 text-sm font-semibold text-rose-800">Prerequisites Not Met</h5>
              <p className="text-xs text-rose-700">
                Review foundational skills first:{' '}
                <span className="font-medium">
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
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">What to do next</span>
          </div>
          <ul className="space-y-1.5">
            {meaningfulTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 text-amber-600">•</span>
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
            className="flex w-full items-center justify-between rounded-[1.5rem] border border-slate-200 bg-[#fbfaf7] p-3 transition-all hover:border-amber-300"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-700" />
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
            <div className="mt-2 rounded-[1.5rem] border border-slate-200 bg-[#fbfaf7] p-4">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">How this relates to the framework</p>
              <p className="mb-3 text-sm leading-relaxed text-slate-700">
                {feedback.frameworkGuidance!.relationship}
              </p>

              {feedback.frameworkGuidance!.userSelectedStep && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-1 text-xs font-medium text-amber-700">You may have jumped to:</p>
                  <p className="text-sm text-amber-900">{feedback.frameworkGuidance!.userSelectedStep}</p>
                </div>
              )}

              {feedback.frameworkGuidance!.nextSteps.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">Next steps:</p>
                  <ul className="space-y-1.5">
                    {feedback.frameworkGuidance!.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-0.5 text-amber-600">•</span>
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
            className="w-full rounded-xl border border-slate-200 bg-[#fbfaf7] px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-amber-300 hover:text-slate-900"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
