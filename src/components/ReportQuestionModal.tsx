// src/components/ReportQuestionModal.tsx
// Modal for reporting question issues

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useQuestionReports } from '../hooks/useQuestionReports';

interface AnalyzedQuestion {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string[];
  rationale: string;
  skillId?: string;
  domains: number[];
}

interface ReportQuestionModalProps {
  question: AnalyzedQuestion;
  assessmentType: 'pre' | 'full' | 'practice';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TARGET_OPTIONS = [
  'Question stem',
  'Answer choices',
  'Correct answer key',
  'Rationale / feedback',
  'Skill tag / domain tag',
  'Other'
];

const ISSUE_TYPE_OPTIONS = [
  'Grammar / spelling',
  'Clarity / ambiguity',
  'Content accuracy',
  'Incorrect key',
  'Distractor quality',
  'Misaligned to skill',
  'Formatting / syntax / rendering bug',
  'Duplicate / too similar',
  'Other'
];

const SEVERITY_OPTIONS: Array<{ value: 'minor' | 'major' | 'critical'; label: string; description: string }> = [
  { value: 'minor', label: 'Minor', description: 'Small issue, doesn\'t affect learning' },
  { value: 'major', label: 'Major', description: 'Could mislead learning' },
  { value: 'critical', label: 'Critical', description: 'Wrong key or wrong content' }
];

export default function ReportQuestionModal({
  question,
  assessmentType,
  isOpen,
  onClose,
  onSuccess
}: ReportQuestionModalProps) {
  const { submitReport, isSubmitting } = useQuestionReports();
  const [step, setStep] = useState(1);
  const [targets, setTargets] = useState<string[]>([]);
  const [issueTypes, setIssueTypes] = useState<string[]>([]);
  const [severity, setSeverity] = useState<'minor' | 'major' | 'critical'>('minor');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleTargetToggle = (target: string) => {
    setTargets(prev => 
      prev.includes(target) 
        ? prev.filter(t => t !== target)
        : [...prev, target]
    );
  };

  const handleIssueTypeToggle = (issueType: string) => {
    setIssueTypes(prev => 
      prev.includes(issueType)
        ? prev.filter(i => i !== issueType)
        : [...prev, issueType]
    );
  };

  const handleSubmit = async () => {
    if (targets.length === 0 || issueTypes.length === 0) {
      alert('Please select at least one target and issue type');
      return;
    }

    try {
      await submitReport({
        questionId: question.id,
        assessmentType,
        targets,
        issueTypes,
        severity,
        notes,
        questionSnapshot: {
          stem: question.question,
          choices: question.choices,
          correct: question.correct_answer,
          rationale: question.rationale
        }
      });

      // Reset form
      setStep(1);
      setTargets([]);
      setIssueTypes([]);
      setSeverity('minor');
      setNotes('');

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const handleCancel = () => {
    setStep(1);
    setTargets([]);
    setIssueTypes([]);
    setSeverity('minor');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h3 className="text-xl font-semibold text-slate-200">Report Question</h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: What are you reporting? */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-slate-300 mb-4">What are you reporting?</p>
            <div className="space-y-2">
              {TARGET_OPTIONS.map(target => (
                <label key={target} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={targets.includes(target)}
                    onChange={() => handleTargetToggle(target)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span className="text-slate-200">{target}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => targets.length > 0 && setStep(2)}
              disabled={targets.length === 0}
              className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Issue type */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-slate-300 mb-4">What type of issue?</p>
            <div className="space-y-2">
              {ISSUE_TYPE_OPTIONS.map(issueType => (
                <label key={issueType} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={issueTypes.includes(issueType)}
                    onChange={() => handleIssueTypeToggle(issueType)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span className="text-slate-200">{issueType}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => issueTypes.length > 0 && setStep(3)}
                disabled={issueTypes.length === 0}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Severity */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-slate-300 mb-4">Severity</p>
            <div className="space-y-2">
              {SEVERITY_OPTIONS.map(option => (
                <label key={option.value} className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                  <input
                    type="radio"
                    name="severity"
                    value={option.value}
                    checked={severity === option.value}
                    onChange={() => setSeverity(option.value)}
                    className="w-4 h-4 text-amber-500 mt-1"
                  />
                  <div>
                    <div className="text-slate-200 font-medium">{option.label}</div>
                    <div className="text-slate-400 text-sm">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Notes */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-slate-300 mb-2">Additional notes (optional)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide more details about the issue..."
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
              rows={6}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:bg-slate-700 disabled:cursor-not-allowed text-red-400 rounded-lg transition-colors font-medium"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
