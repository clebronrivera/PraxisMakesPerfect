import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  BookOpen,
  Target,
  Lightbulb
} from 'lucide-react';
import { DiagnosticFeedback as DiagnosticFeedbackType } from '../brain/diagnostic-feedback';

interface DiagnosticFeedbackProps {
  feedback: DiagnosticFeedbackType;
  onDismiss?: () => void;
}

export default function DiagnosticFeedback({
  feedback,
  onDismiss
}: DiagnosticFeedbackProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['explanation']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const isExpanded = (section: string) => expandedSections.has(section);

  // Learning state badge colors
  const getStateColor = (state: string) => {
    switch (state) {
      case 'mastery':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'proficient':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'developing':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'emerging':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className={`mt-4 p-6 rounded-2xl border ${
      feedback.isCorrect
        ? 'bg-emerald-500/10 border-emerald-500/30'
        : 'bg-amber-500/10 border-amber-500/30'
    }`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          feedback.isCorrect 
            ? 'bg-emerald-500/20' 
            : 'bg-amber-500/20'
        }`}>
          {feedback.isCorrect ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <XCircle className="w-5 h-5 text-amber-400" />
          )}
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold mb-2 ${
            feedback.isCorrect ? 'text-emerald-300' : 'text-amber-300'
          }`}>
            {feedback.isCorrect ? 'Correct Answer!' : 'Diagnostic Feedback'}
          </h4>
          
          {/* Mastery Status (for correct answers) */}
          {feedback.isCorrect && feedback.masteryStatus && (
            <p className="text-sm text-slate-400 mb-3">{feedback.masteryStatus}</p>
          )}

          {/* Learning State Badge */}
          {feedback.skillGuidance && (
            <div className="mb-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStateColor(feedback.skillGuidance.currentState)}`}>
                <Target className="w-3 h-3" />
                {feedback.skillGuidance.currentState.charAt(0).toUpperCase() + feedback.skillGuidance.currentState.slice(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* General Explanation */}
      <div className="mb-4">
        <p className={`text-sm leading-relaxed ${
          feedback.isCorrect ? 'text-emerald-200' : 'text-amber-200'
        }`}>
          {feedback.generalExplanation}
        </p>
      </div>

      {/* Prerequisite Warning */}
      {feedback.skillGuidance && !feedback.skillGuidance.prerequisiteCheck.met && 
       feedback.skillGuidance.prerequisiteCheck.missingNames.length > 0 && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="text-sm font-semibold text-red-300 mb-1">Prerequisites Not Met</h5>
              <p className="text-xs text-red-200/80">
                Review foundational skills before continuing: <span className="font-medium">
                  {feedback.skillGuidance.prerequisiteCheck.missingNames.join(', ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Framework Guidance (Collapsible) */}
      {feedback.frameworkGuidance && feedback.frameworkGuidance.currentStepId && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection('framework')}
            className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800/70 rounded-xl transition-all"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">
                Framework Context
                {feedback.frameworkGuidance.currentStepName && (
                  <span className="text-slate-500 ml-2">
                    ({feedback.frameworkGuidance.currentStepName})
                  </span>
                )}
              </span>
            </div>
            {isExpanded('framework') ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          
          {isExpanded('framework') && (
            <div className="mt-2 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              {/* Step Relationship */}
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-1">How this relates to the framework:</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {feedback.frameworkGuidance.relationship}
                </p>
              </div>

              {/* User Selected Step (if applicable) */}
              {feedback.frameworkGuidance.userSelectedStep && (
                <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-300 font-medium mb-1">
                    You may have jumped to:
                  </p>
                  <p className="text-sm text-amber-200">
                    {feedback.frameworkGuidance.userSelectedStep}
                  </p>
                </div>
              )}

              {/* Next Steps */}
              {feedback.frameworkGuidance.nextSteps.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Next steps:</p>
                  <ul className="space-y-1.5">
                    {feedback.frameworkGuidance.nextSteps.map((step, i) => (
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

      {/* Remediation Tips (Collapsible) */}
      {feedback.remediationTips.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection('remediation')}
            className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800/70 rounded-xl transition-all"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">
                {feedback.isCorrect ? 'Tips to Continue Improving' : 'Remediation Tips'}
              </span>
            </div>
            {isExpanded('remediation') ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          
          {isExpanded('remediation') && (
            <div className="mt-2 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <ul className="space-y-2">
                {feedback.remediationTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className={`mt-0.5 ${
                      feedback.isCorrect ? 'text-emerald-400' : 'text-amber-400'
                    }`}>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error Pattern Info (for wrong answers) */}
      {!feedback.isCorrect && feedback.patternId && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Error Pattern:</p>
          <span className="inline-block px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300">
            {feedback.patternId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
      )}

      {/* Dismiss Button (if provided) */}
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
