import { CheckCircle, XCircle } from 'lucide-react';
import { generateDiagnosticFeedback } from '../brain/diagnostic-feedback';
import {
  AnalyzedQuestion,
  Question,
  getQuestionChoices,
  getQuestionCorrectAnswers,
  getQuestionPrompt,
  getQuestionRationale
} from '../brain/question-analyzer';
import { UserProfile } from '../hooks/useProgressTracking';
import DiagnosticFeedback from './DiagnosticFeedback';
import { useEngine } from '../hooks/useEngine';
import {
  formatChoiceReferenceList,
  sanitizeFeedbackText
} from '../utils/feedbackText';

interface ExplanationPanelProps {
  question: AnalyzedQuestion;
  userAnswer: string[]; // Used for determining correctness display
  isCorrect: boolean;
  rationale: string;
  userProfile?: UserProfile; // Optional - only available in practice sessions
  distractorNote?: string; // Optional - specific explanation of the wrong answer chosen
}

export default function ExplanationPanel({
  question,
  userAnswer,
  isCorrect,
  rationale,
  userProfile,
  distractorNote
}: ExplanationPanelProps) {
  const engine = useEngine();
  const correctAnswerSummary = formatChoiceReferenceList(
    question,
    getQuestionCorrectAnswers(question)
  );
  const userAnswerSummary = formatChoiceReferenceList(question, userAnswer);
  const displayRationale = sanitizeFeedbackText(question, rationale);
  const displayCorrectExplanation = question.correctExplanation
    ? sanitizeFeedbackText(question, question.correctExplanation)
    : '';

  // Convert AnalyzedQuestion to Question type for diagnostic feedback
  const questionForFeedback: Question = {
    id: question.id,
    question: getQuestionPrompt(question),
    choices: getQuestionChoices(question),
    correct_answer: getQuestionCorrectAnswers(question),
    rationale: getQuestionRationale(question),
    skillId: question.skillId
  };

  // Generate diagnostic feedback (only if userProfile is available)
  let diagnosticFeedback = null;
  if (userProfile) {
    try {
      diagnosticFeedback = generateDiagnosticFeedback(questionForFeedback, userAnswer, isCorrect, userProfile, engine);
    } catch (error) {
      console.error('[ExplanationPanel] Failed to generate diagnostic feedback:', error);
    }
  }

  // Misconception lookup — only for wrong answers, reads flat fields from questions.json
  const wrongLetter = !isCorrect
    ? userAnswer.find(a => !getQuestionCorrectAnswers(question).includes(a))
    : undefined;
  const misconceptionText = wrongLetter
    ? ((question as unknown as Record<string, unknown>)[`distractor_misconception_${wrongLetter}`] as string | undefined) || ''
    : '';
  const skillDeficitText = wrongLetter
    ? ((question as unknown as Record<string, unknown>)[`distractor_skill_deficit_${wrongLetter}`] as string | undefined) || ''
    : '';

  const accentVar = isCorrect ? 'var(--d2-mint)' : 'var(--accent-rose)';

  return (
    <div className="space-y-4">
      {/* Original Rationale Panel */}
      <div
        className="rounded-2xl border p-6 backdrop-blur-[14px]"
        style={{
          background: `color-mix(in srgb, ${accentVar} 10%, rgba(10,22,40,0.55))`,
          borderColor: `color-mix(in srgb, ${accentVar} 30%, transparent)`,
          boxShadow: '0 4px 24px -4px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{
              background: `color-mix(in srgb, ${accentVar} 18%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accentVar} 40%, transparent)`,
            }}
          >
            {isCorrect ? (
              <CheckCircle className="h-5 w-5" style={{ color: accentVar }} />
            ) : (
              <XCircle className="h-5 w-5" style={{ color: accentVar }} />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-2 text-white">
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </h4>
            <div className="space-y-2 mb-3">
              {!isCorrect && userAnswerSummary && (
                <p className="text-sm leading-relaxed text-slate-300">
                  <span className="font-semibold text-white">Your selection:</span>{' '}
                  {userAnswerSummary}
                </p>
              )}
              {correctAnswerSummary && (
                <p className="text-sm leading-relaxed text-slate-300">
                  <span className="font-semibold text-white">
                    {getQuestionCorrectAnswers(question).length > 1 ? 'Correct responses:' : 'Correct answer:'}
                  </span>{' '}
                  {correctAnswerSummary}
                </p>
              )}
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{displayRationale}</p>

            {/* Extended Bank Fields (Static Questions) */}
            {displayCorrectExplanation && displayCorrectExplanation !== displayRationale && (
              <div className="mt-4 border-t border-white/8 pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Correct explanation</p>
                <p className="text-sm leading-relaxed text-slate-300">{displayCorrectExplanation}</p>
              </div>
            )}

            {(question as unknown as Record<string, string>).contentLimit && (
              <div className="mt-4 border-t border-white/8 pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Content rule</p>
                <p className="text-sm leading-relaxed text-slate-300">{(question as unknown as Record<string, string>).contentLimit}</p>
              </div>
            )}

            {(question as unknown as Record<string, string>).complexityRationale && (
              <div className="mt-4 border-t border-white/8 pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Complexity</p>
                <p className="text-sm leading-relaxed text-slate-300">{(question as unknown as Record<string, string>).complexityRationale}</p>
              </div>
            )}

            {(question as unknown as Record<string, string>).construct_actually_tested && (
              <div className="mt-4 border-t border-white/8 pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">What this tests</p>
                <p className="text-sm leading-relaxed text-slate-300">{(question as unknown as Record<string, string>).construct_actually_tested}</p>
              </div>
            )}

            {/* Key Concepts */}
            {question.keyConcepts && question.keyConcepts.length > 0 && (
              <div className="mt-4 border-t border-white/8 pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Key concepts</p>
                <div className="flex flex-wrap gap-2">
                  {question.keyConcepts.map((concept, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Why this was wrong — misconception + knowledge gap from distractor classification */}
            {(misconceptionText || skillDeficitText) && (
              <div
                className="mt-4 border-t pt-4"
                style={{ borderColor: 'color-mix(in srgb, var(--accent-rose) 25%, transparent)' }}
              >
                <p
                  className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: 'color-mix(in srgb, var(--accent-rose) 80%, white)' }}
                >
                  Why this was wrong
                </p>
                {misconceptionText && (
                  <p className="text-sm leading-relaxed text-slate-300">{misconceptionText}</p>
                )}
                {skillDeficitText && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    <span className="font-semibold">Knowledge gap:</span> {skillDeficitText}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostic Feedback (only if userProfile is available) */}
      {diagnosticFeedback && (
        <DiagnosticFeedback feedback={diagnosticFeedback} distractorNote={distractorNote} />
      )}
    </div>
  );
}
