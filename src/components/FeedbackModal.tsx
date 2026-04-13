import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import {
  BetaFeedbackCategory,
  useBetaFeedback
} from '../hooks/useBetaFeedback';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS: Array<{
  value: BetaFeedbackCategory;
  label: string;
  description: string;
}> = [
  { value: 'bug', label: 'Bug report', description: 'Something is broken or behaving incorrectly.' },
  { value: 'content', label: 'Content issue', description: 'A question, explanation, or tag looks wrong.' },
  { value: 'ux', label: 'UX friction', description: 'A workflow is confusing or harder than it should be.' },
  { value: 'feature-request', label: 'Feature idea', description: 'A capability you want added or expanded.' },
  { value: 'general', label: 'General note', description: 'Anything else from beta testing.' }
];

const CONTEXT_OPTIONS = [
  { value: 'feature', label: 'Feature' },
  { value: 'tool', label: 'Tool' },
  { value: 'question', label: 'Question' },
  { value: 'general', label: 'General' }
] as const;

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { submitFeedback, isSubmitting } = useBetaFeedback();
  const [category, setCategory] = useState<BetaFeedbackCategory>('bug');
  const [contextType, setContextType] = useState<'feature' | 'tool' | 'question' | 'general'>('general');
  const [featureArea, setFeatureArea] = useState('');
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setCategory('bug');
    setContextType('general');
    setFeatureArea('');
    setMessage('');
    setSubmitError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setSubmitError('Please add a short description before submitting feedback.');
      return;
    }

    try {
      setSubmitError(null);
      await submitFeedback({
        category,
        contextType,
        featureArea: featureArea.trim() || undefined,
        message: message.trim(),
        page: typeof window !== 'undefined' ? window.location.hash || 'home' : 'home',
        appVersion: 'beta'
      });
      handleClose();
    } catch (error: unknown) {
      console.error('[FeedbackModal] Error submitting feedback:', error);
      const errCode = error instanceof Error ? (error as Error & { code?: string }).code : undefined;
      if (errCode === 'permission-denied') {
        setSubmitError('Feedback permissions were denied. Refresh the app and sign in again, then retry.');
        return;
      }

      if (errCode === 'unauthenticated') {
        setSubmitError('You must be signed in before sending feedback.');
        return;
      }

      if (error instanceof Error && error.message) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError('Unable to submit feedback right now. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-100">Beta Feedback</h3>
              <p className="text-sm text-slate-400">
                Share bugs, feature requests, content issues, or anything confusing.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
            title="Close feedback form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {submitError && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {submitError}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-300">What kind of feedback is this?</p>
            <div className="grid gap-3 md:grid-cols-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    category === option.value
                      ? 'border-cyan-400/60 bg-cyan-500/10 text-slate-100'
                      : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/70'
                  }`}
                >
                  <p className="font-medium">{option.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.1fr,1.4fr]">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">Where did it happen?</span>
              <select
                value={contextType}
                onChange={(event) => setContextType(event.target.value as typeof contextType)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition-colors focus:border-cyan-400/60"
              >
                {CONTEXT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">Feature or tool name</span>
              <input
                value={featureArea}
                onChange={(event) => setFeatureArea(event.target.value)}
                placeholder="Example: Practice mode, screener, study plan"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-cyan-400/60"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">What should we know?</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe what happened, what felt off, or what you expected instead."
              rows={7}
              className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-cyan-400/60"
            />
          </label>

          <div className="flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-slate-300 transition-colors hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isSubmitting ? 'Submitting...' : 'Send feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
