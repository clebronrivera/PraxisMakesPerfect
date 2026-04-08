// src/components/SimplifiedOnboardingFlow.tsx
// Single-page 6-field onboarding flow per public/mockup-onboarding.html.
// Required by docs/WORKFLOW_GROUNDING.md section 3.10. Replaces the legacy
// 4-step OnboardingFlow.tsx for new users — old component is kept in tree
// for back-compat with existing users until a separate cleanup pass.
//
// Per the 2026-04-08 user decision: NO "Skip for now" link. All 6 fields
// must be completed before the user enters the app. Required fields are
// marked with a red asterisk; school_attending is optional via checkbox.

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SimplifiedOnboardingPayload {
  first_name: string;
  last_name: string;
  zip_code: string;
  school_attending: string | null;
  purpose: string;
  how_did_you_hear: string;
  /** Convenience: combined "First Last" for back-compat with the legacy full_name column. */
  full_name: string;
}

export interface SimplifiedOnboardingFlowProps {
  displayName?: string | null;
  onComplete: (data: SimplifiedOnboardingPayload) => Promise<void> | void;
}

// ─── Field option lists ─────────────────────────────────────────────────────

const PURPOSE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'graduate_program', label: 'Graduate program requirement' },
  { value: 'certification', label: 'Certification exam prep' },
  { value: 'professional_development', label: 'Professional development' },
  { value: 'other', label: 'Other' },
];

const HOW_DID_YOU_HEAR_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'google', label: 'Google / Search' },
  { value: 'social_media', label: 'Social media' },
  { value: 'professor', label: 'Professor / Instructor' },
  { value: 'friend', label: 'Friend / Colleague' },
  { value: 'other', label: 'Other' },
];

// ─── Validation ─────────────────────────────────────────────────────────────

interface FormErrors {
  first_name?: string;
  last_name?: string;
  zip_code?: string;
  school_attending?: string;
  purpose?: string;
  how_did_you_hear?: string;
}

function validate(state: {
  first_name: string;
  last_name: string;
  zip_code: string;
  school_attending: string;
  not_enrolled: boolean;
  purpose: string;
  how_did_you_hear: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (!state.first_name.trim()) errors.first_name = 'First name is required';
  if (!state.last_name.trim()) errors.last_name = 'Last name is required';
  if (!state.zip_code.trim()) errors.zip_code = 'Zip code is required';
  else if (!/^[0-9A-Za-z\s-]{3,10}$/.test(state.zip_code.trim()))
    errors.zip_code = 'Enter a valid zip / postal code';
  if (!state.not_enrolled && !state.school_attending.trim())
    errors.school_attending = 'Enter a school or check "Not currently enrolled"';
  if (!state.purpose) errors.purpose = 'Select what brings you here';
  if (!state.how_did_you_hear) errors.how_did_you_hear = 'Select how you heard about us';
  return errors;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SimplifiedOnboardingFlow({
  displayName,
  onComplete,
}: SimplifiedOnboardingFlowProps) {
  // Pre-fill from displayName if available (e.g. from auth provider).
  const seedFirstName = (displayName ?? '').trim().split(/\s+/)[0] ?? '';
  const seedLastName = (displayName ?? '').trim().split(/\s+/).slice(1).join(' ') ?? '';

  const [state, setState] = useState({
    first_name: seedFirstName,
    last_name: seedLastName,
    zip_code: '',
    school_attending: '',
    not_enrolled: false,
    purpose: '',
    how_did_you_hear: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
    if (submitted) {
      // Re-validate live once the user has tried to submit.
      const next = { ...state, [key]: value };
      setErrors(validate(next));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(state);
    setErrors(validationErrors);
    setSubmitted(true);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      const fullName = `${state.first_name.trim()} ${state.last_name.trim()}`.trim();
      await onComplete({
        first_name: state.first_name.trim(),
        last_name: state.last_name.trim(),
        zip_code: state.zip_code.trim(),
        school_attending: state.not_enrolled ? null : state.school_attending.trim(),
        purpose: state.purpose,
        how_did_you_hear: state.how_did_you_hear,
        full_name: fullName,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputBaseClass =
    'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';
  const inputClass = (hasError: boolean) =>
    hasError
      ? `${inputBaseClass} border-rose-400 focus:border-rose-500 focus:ring-rose-200`
      : `${inputBaseClass} border-slate-300`;
  const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700';
  const errorClass = 'mt-1 text-[11px] font-medium text-rose-600';
  const requiredMark = <span className="text-rose-500">*</span>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fbfaf7]">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Praxis Makes Perfect</h1>
          <p className="text-sm text-slate-500">
            Tell us a little about yourself — this takes less than a minute.
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="editorial-surface space-y-5 p-7" noValidate>
          {/* Name row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className={labelClass}>
                First name {requiredMark}
              </label>
              <input
                id="first_name"
                type="text"
                placeholder="Jordan"
                value={state.first_name}
                onChange={e => update('first_name', e.target.value)}
                className={inputClass(Boolean(errors.first_name))}
                autoComplete="given-name"
                required
              />
              {errors.first_name && <p className={errorClass}>{errors.first_name}</p>}
            </div>
            <div>
              <label htmlFor="last_name" className={labelClass}>
                Last name {requiredMark}
              </label>
              <input
                id="last_name"
                type="text"
                placeholder="Rivera"
                value={state.last_name}
                onChange={e => update('last_name', e.target.value)}
                className={inputClass(Boolean(errors.last_name))}
                autoComplete="family-name"
                required
              />
              {errors.last_name && <p className={errorClass}>{errors.last_name}</p>}
            </div>
          </div>

          {/* Zip code */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="zip_code" className={labelClass}>
                Zip code {requiredMark}
              </label>
              <input
                id="zip_code"
                type="text"
                placeholder="90210"
                value={state.zip_code}
                onChange={e => update('zip_code', e.target.value)}
                className={inputClass(Boolean(errors.zip_code))}
                maxLength={10}
                autoComplete="postal-code"
                required
              />
              {errors.zip_code && <p className={errorClass}>{errors.zip_code}</p>}
            </div>
          </div>

          {/* School attending */}
          <div>
            <label htmlFor="school_attending" className={labelClass}>
              School / university attending {requiredMark}
            </label>
            <input
              id="school_attending"
              type="text"
              placeholder="e.g. Temple University"
              value={state.school_attending}
              onChange={e => update('school_attending', e.target.value)}
              disabled={state.not_enrolled}
              className={`${inputClass(Boolean(errors.school_attending))} ${
                state.not_enrolled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''
              }`}
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                id="not_enrolled"
                type="checkbox"
                checked={state.not_enrolled}
                onChange={e => {
                  update('not_enrolled', e.target.checked);
                  if (e.target.checked) update('school_attending', '');
                }}
                className="h-4 w-4 cursor-pointer accent-indigo-600"
              />
              <label htmlFor="not_enrolled" className="cursor-pointer text-xs text-slate-600">
                Not currently enrolled in a program
              </label>
            </div>
            {errors.school_attending && <p className={errorClass}>{errors.school_attending}</p>}
          </div>

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className={labelClass}>
              What brings you here? {requiredMark}
            </label>
            <select
              id="purpose"
              value={state.purpose}
              onChange={e => update('purpose', e.target.value)}
              className={inputClass(Boolean(errors.purpose))}
              required
            >
              <option value="" disabled>
                Select a purpose…
              </option>
              {PURPOSE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.purpose && <p className={errorClass}>{errors.purpose}</p>}
          </div>

          {/* How did you hear */}
          <div>
            <label htmlFor="how_did_you_hear" className={labelClass}>
              How did you hear about us? {requiredMark}
            </label>
            <select
              id="how_did_you_hear"
              value={state.how_did_you_hear}
              onChange={e => update('how_did_you_hear', e.target.value)}
              className={inputClass(Boolean(errors.how_did_you_hear))}
              required
            >
              <option value="" disabled>
                Select one…
              </option>
              {HOW_DID_YOU_HEAR_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.how_did_you_hear && <p className={errorClass}>{errors.how_did_you_hear}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>Continue to your dashboard →</>
            )}
          </button>
        </form>

        {/* No "Skip for now" link — per 2026-04-08 product decision, all 6 fields are required. */}
      </div>
    </div>
  );
}
