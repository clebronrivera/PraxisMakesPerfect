import { useState } from 'react';
import { CheckCircle, XCircle, Bookmark, BookmarkCheck, BookOpen, AlertTriangle } from 'lucide-react';
import { generateDiagnosticFeedback } from '../brain/diagnostic-feedback';
import {
  AnalyzedQuestion,
  Question,
  getQuestionChoices,
  getQuestionCorrectAnswers,
  getQuestionPrompt,
  getQuestionRationale
} from '../brain/question-analyzer';
import { UserProfile } from '../hooks/useFirebaseProgress';
import DiagnosticFeedback from './DiagnosticFeedback';
import { useEngine } from '../hooks/useEngine';
import {
  formatChoiceReferenceList,
  sanitizeFeedbackText
} from '../utils/feedbackText';
import { getProgressSkillDefinition } from '../utils/progressTaxonomy';

interface ExplanationPanelProps {
  question: AnalyzedQuestion;
  userAnswer: string[]; // Used for determining correctness display
  isCorrect: boolean;
  rationale: string;
  userProfile?: UserProfile; // Optional - only available in practice sessions
  distractorNote?: string; // Optional - specific explanation of the wrong answer chosen
  /** Confidence level at the time of answering — used for false-confidence callout */
  confidence?: 'low' | 'medium' | 'high';
  /** Called when user bookmarks this question for later review (practice mode only) */
  onBookmark?: (questionId: string) => void;
  /** Called when user taps "Review this skill's lesson" (practice mode only) */
  onReviewSkill?: (skillId: string) => void;
  /** Whether this is in practice mode (controls bookmark + review links) */
  assessmentType?: 'pre' | 'full' | 'practice';
}

export default function ExplanationPanel({
  question,
  userAnswer,
  isCorrect,
  rationale,
  userProfile,
  distractorNote,
  confidence,
  onBookmark,
  onReviewSkill,
  assessmentType,
}: ExplanationPanelProps) {
  const [bookmarked, setBookmarked] = useState(false);
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

  return (
    <div className="space-y-4">
      {/* Original Rationale Panel */}
      <div className={`rounded-[2rem] border p-6 ${
        isCorrect
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-rose-200 bg-rose-50'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
            isCorrect ? 'bg-emerald-100' : 'bg-rose-100'
          }`}>
            {isCorrect ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-500" />
            )}
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold mb-2 ${
              isCorrect ? 'text-emerald-800' : 'text-rose-800'
            }`}>
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </h4>
            <div className="space-y-2 mb-3">
              {!isCorrect && userAnswerSummary && (
                <p className="text-sm leading-relaxed text-slate-700">
                  <span className="font-semibold text-slate-900">Your selection:</span>{' '}
                  {userAnswerSummary}
                </p>
              )}
              {correctAnswerSummary && (
                <p className="text-sm leading-relaxed text-slate-700">
                  <span className="font-semibold text-slate-900">
                    {getQuestionCorrectAnswers(question).length > 1 ? 'Correct responses:' : 'Correct answer:'}
                  </span>{' '}
                  {correctAnswerSummary}
                </p>
              )}
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{displayRationale}</p>
            
            {/* Extended Bank Fields (Static Questions) */}
            {displayCorrectExplanation && displayCorrectExplanation !== displayRationale && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Correct explanation</p>
                <p className="text-sm leading-relaxed text-slate-700">{displayCorrectExplanation}</p>
              </div>
            )}
            
            {(question as any).contentLimit && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Content rule</p>
                <p className="text-sm leading-relaxed text-slate-700">{(question as any).contentLimit}</p>
              </div>
            )}

            {(question as any).complexityRationale && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Complexity</p>
                <p className="text-sm leading-relaxed text-slate-700">{(question as any).complexityRationale}</p>
              </div>
            )}

            {/* Key Concepts */}
            {question.keyConcepts && question.keyConcepts.length > 0 && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Key concepts</p>
                <div className="flex flex-wrap gap-2">
                  {question.keyConcepts.map((concept, i) => (
                    <span key={i} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── False confidence callout (Feature E) ───────────────────── */}
            {!isCorrect && confidence === 'high' && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-[11px] leading-relaxed text-amber-800">
                  <span className="font-bold">High confidence, wrong answer.</span>{' '}
                  This is a blind spot — you were sure but the reasoning didn't hold. Review the lesson for this skill before it costs you on the exam.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Practice-mode actions row (Features D + F) ─────────────────────── */}
      {assessmentType === 'practice' && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Bookmark button (Feature F) */}
          {onBookmark && (
            <button
              onClick={() => {
                if (!bookmarked) {
                  onBookmark(question.id);
                  setBookmarked(true);
                }
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all ${
                bookmarked
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-slate-900'
              }`}
            >
              {bookmarked ? (
                <><BookmarkCheck className="w-3.5 h-3.5" /> Saved for review</>
              ) : (
                <><Bookmark className="w-3.5 h-3.5" /> Save for review</>
              )}
            </button>
          )}

          {/* Review this skill (Feature D) — only on wrong answers */}
          {!isCorrect && onReviewSkill && question.skillId && (
            <button
              onClick={() => onReviewSkill(question.skillId!)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 transition-all hover:border-amber-300 hover:text-slate-900"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Review lesson for{' '}
              {getProgressSkillDefinition(question.skillId)?.shortLabel ?? 'this skill'}
            </button>
          )}
        </div>
      )}

      {/* Diagnostic Feedback (only if userProfile is available) */}
      {diagnosticFeedback && (
        <DiagnosticFeedback feedback={diagnosticFeedback} distractorNote={distractorNote} />
      )}
    </div>
  );
}
