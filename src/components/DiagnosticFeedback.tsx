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
      <div className="p-6 rounded-2xl border bg-emerald-500/10 border-emerald-500/30">
        <p className="text-sm leading-relaxed text-emerald-200 mb-0">
          {feedback.generalExplanation}
        </p>
        {meaningfulTips.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {meaningfulTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-4 w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all"
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
    <div className="p-6 rounded-2xl border bg-slate-800/50 border-slate-700/50">
      {/* Leading explanation — distractor-specific or non-generic pattern explanation */}
      {(hasDistractorNote || hasNonGenericExplanation) && (
        <p className="text-sm leading-relaxed text-slate-300 mb-4">
          {distractorNote || feedback.generalExplanation}
        </p>
      )}

      {/* Prerequisite Warning */}
      {hasPrerequisites && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-semibold text-red-300 mb-1">Prerequisites Not Met</h5>
              <p className="text-xs text-red-200/80">
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
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">What to do next</span>
          </div>
          <ul className="space-y-1.5">
            {meaningfulTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-amber-400 mt-0.5">•</span>
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
            className="w-full flex items-center justify-between p-3 bg-slate-700/40 hover:bg-slate-700/60 rounded-xl transition-all"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">
                Framework Context
                {feedback.frameworkGuidance!.currentStepName && (
                  <span className="text-slate-500 ml-2">
                    ({feedback.frameworkGuidance!.currentStepName})
                  </span>
                )}
              </span>
            </div>
            {frameworkOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {frameworkOpen && (
            <div className="mt-2 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">How this relates to the framework:</p>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {feedback.frameworkGuidance!.relationship}
              </p>

              {feedback.frameworkGuidance!.userSelectedStep && (
                <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-300 font-medium mb-1">You may have jumped to:</p>
                  <p className="text-sm text-amber-200">{feedback.frameworkGuidance!.userSelectedStep}</p>
                </div>
              )}

              {feedback.frameworkGuidance!.nextSteps.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Next steps:</p>
                  <ul className="space-y-1.5">
                    {feedback.frameworkGuidance!.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-amber-400 mt-0.5">•</span>
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
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <button
            onClick={onDismiss}
            className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
