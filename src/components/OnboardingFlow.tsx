// src/components/OnboardingFlow.tsx
// Multi-step onboarding flow to collect user profile info after sign-up

import React, { useState } from 'react';
import {
  Brain, ChevronRight, ChevronLeft, Check, GraduationCap,
  BookOpen, Target, Award, Loader2, User, AlertCircle
} from 'lucide-react';
import {
  NASP_PROGRAMS_BY_STATE,
  NASP_PROGRAM_STATE_OPTIONS,
  US_STATE_OPTIONS,
} from '../data/naspSchoolPsychPrograms';

const STATE_NAME_BY_CODE = Object.fromEntries(
  US_STATE_OPTIONS.map(({ code, name }) => [code, name])
) as Record<string, string>;

const STATE_CODE_BY_NAME = Object.fromEntries(
  US_STATE_OPTIONS.map(({ code, name }) => [name, code])
) as Record<string, string>;

// ─── Types ──────────────────────────────────────────────────────────────────
export interface UserProfileData {
  // Step 1 — Role
  account_role: 'graduate_student' | 'certification_only' | 'other' | '';

  // Step 2 — Grad student fields
  // full_name removed — collected at sign-up via displayName
  preferred_display_name?: string; // kept for backward compat, not rendered in form
  university?: string;
  program_type?: 'eds' | 'phd' | 'ma' | 'other' | '';
  program_state?: string;
  delivery_mode?: 'on_campus' | 'hybrid' | 'online' | '';
  training_stage?: 'early_program' | 'mid_program' | 'approaching_internship' | 'in_internship' | '';

  // Step 2 — Cert-only fields
  certification_state?: string;
  current_role?: 'teacher' | 'school_counselor' | 'psychologist_trainee' | 'other' | '';
  certification_route?: 'initial' | 'add_on' | 'reciprocity' | 'other' | '';

  // Step 3 — Exam
  primary_exam: 'praxis_5403' | 'ftce_school_psychologist' | 'other' | '';
  planned_test_date?: string;
  retake_status?: 'first_attempt' | 'retake' | '';
  number_of_prior_attempts?: string;
  target_score?: string;

  // Step 4 — Goals + research
  study_goals: string[];
  weekly_study_hours?: '1_2' | '3_5' | '6_10' | '10_plus' | '';
  biggest_challenge?: string[];
  used_other_resources?: boolean | null;
  other_resources_list?: string[];
  what_was_missing?: string;
}

function mergeWithEmptyProfileData(partial?: Partial<UserProfileData> | null): UserProfileData {
  return {
    account_role: '',
    primary_exam: '',
    study_goals: [],
    training_stage: '',
    current_role: '',
    certification_route: '',
    retake_status: '',
    weekly_study_hours: '',
    program_type: '',
    delivery_mode: '',
    biggest_challenge: [],
    other_resources_list: [],
    used_other_resources: null,
    ...partial
  };
}

interface OnboardingFlowProps {
  displayName?: string | null;
  onComplete: (data: UserProfileData) => Promise<void>;
  onSkip?: () => void;
  /** When set (e.g. profile edit), form is pre-filled from saved answers */
  initialData?: Partial<UserProfileData> | null;
  mode?: 'onboarding' | 'edit';
  variant?: 'fullscreen' | 'embedded';
  /** Called when user closes edit UI from first step (replaces Skip) */
  onCancel?: () => void;
}

// ─── Shared sub-components ──────────────────────────────────────────────────
function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-600 mb-2">
      {children}
      {optional && <span className="ml-1.5 text-xs text-slate-500 font-normal">(optional)</span>}
    </label>
  );
}

function TextInput({
  value, onChange, placeholder, type = 'text'
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
    />
  );
}

function TextAreaInput({
  value, onChange, placeholder, rows = 3
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm resize-none"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function RadioCard({
  label, description, selected, onClick, icon
}: {
  label: string; description?: string; selected: boolean; onClick: () => void; icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center gap-3 ${
        selected
          ? 'border-amber-300 bg-amber-50 text-amber-700'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
        selected ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
      }`}>
        {selected && <Check className="w-3 h-3 text-amber-700" strokeWidth={3} />}
      </div>
      {icon && <div className={selected ? 'text-amber-400' : 'text-slate-500'}>{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
      </div>
    </button>
  );
}

function CheckboxCard({
  label, description, checked, onClick
}: {
  label: string; description?: string; checked: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
        checked
          ? 'border-amber-300 bg-amber-50 text-amber-700'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
        checked ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
      }`}>
        {checked && <Check className="w-3 h-3 text-amber-700" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
      </div>
    </button>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-1">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

// ─── Step 1: Role ─────────────────────────────────────────────────────────────
function StepRole({ data, setData }: { data: UserProfileData; setData: (d: Partial<UserProfileData>) => void }) {
  return (
    <div className="space-y-3">
      <RadioCard
        label="Graduate Student"
        description="Enrolled in a school psychology graduate program"
        icon={<GraduationCap className="w-5 h-5" />}
        selected={data.account_role === 'graduate_student'}
        onClick={() => setData({ account_role: 'graduate_student' })}
      />
      <RadioCard
        label="Certification-Only / Alternative Route"
        description="Working in education, pursuing certification without a full graduate program"
        icon={<Award className="w-5 h-5" />}
        selected={data.account_role === 'certification_only'}
        onClick={() => setData({ account_role: 'certification_only' })}
      />
      <RadioCard
        label="Other"
        description="Psychologist, researcher, or another path"
        icon={<User className="w-5 h-5" />}
        selected={data.account_role === 'other'}
        onClick={() => setData({ account_role: 'other' })}
      />
    </div>
  );
}

// ─── Step 2a: Grad student details ───────────────────────────────────────────
function StepGradDetails({ data, setData }: { data: UserProfileData; setData: (d: Partial<UserProfileData>) => void }) {
  const selectedProgramStateCode = data.program_state
    ? STATE_CODE_BY_NAME[data.program_state] ?? ''
    : '';
  const programsInState = selectedProgramStateCode
    ? (NASP_PROGRAMS_BY_STATE[selectedProgramStateCode] ?? [])
    : [];

  return (
    <div className="space-y-4">
      <SectionDivider label="Your program" />

      <div>
        <FieldLabel optional>Program state</FieldLabel>
        <SelectInput
          value={selectedProgramStateCode}
          onChange={stateCode => {
            const nextPrograms = stateCode ? (NASP_PROGRAMS_BY_STATE[stateCode] ?? []) : [];
            const currentProgramStillMatches = nextPrograms.some(program => program.name === data.university);
            setData({
              program_state: stateCode ? STATE_NAME_BY_CODE[stateCode] : '',
              university: currentProgramStillMatches ? data.university : '',
            });
          }}
          options={NASP_PROGRAM_STATE_OPTIONS.map(state => ({
            value: state.code,
            label: state.name,
          }))}
          placeholder="Select a state"
        />
      </div>

      <div>
        <FieldLabel optional>School psychology program</FieldLabel>
        <SelectInput
          value={data.university ?? ''}
          onChange={value => setData({ university: value })}
          options={programsInState.map(program => ({
            value: program.name,
            label: program.name,
          }))}
          placeholder={selectedProgramStateCode ? 'Select a NASP-listed program' : 'Select a state first'}
          disabled={!selectedProgramStateCode}
        />
        <p className="text-xs text-slate-500 mt-1.5">
          Program list sourced from NASP&apos;s School Psychology Program Information directory.
        </p>
      </div>

      <div>
        <FieldLabel>Program type</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'eds', label: 'Ed.S.', desc: 'Education Specialist' },
            { value: 'phd', label: 'Ph.D.', desc: 'Doctor of Philosophy' },
            { value: 'ma', label: 'M.A. / M.S.', desc: 'Master\'s degree' },
            { value: 'other', label: 'Other', desc: '' },
          ].map(opt => (
            <RadioCard
              key={opt.value}
              label={opt.label}
              description={opt.desc}
              selected={data.program_type === opt.value}
              onClick={() => setData({ program_type: opt.value as UserProfileData['program_type'] })}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Delivery mode</FieldLabel>
        <div className="space-y-1.5">
          {[
            { value: 'on_campus', label: 'On-campus' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'online', label: 'Online' },
          ].map(opt => (
            <RadioCard
              key={opt.value}
              label={opt.label}
              selected={data.delivery_mode === opt.value}
              onClick={() => setData({ delivery_mode: opt.value as UserProfileData['delivery_mode'] })}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Training stage</FieldLabel>
        <div className="space-y-2">
          {[
            { value: 'early_program', label: 'Early Program', desc: 'First 1–2 semesters' },
            { value: 'mid_program', label: 'Mid Program', desc: 'Core coursework underway' },
            { value: 'approaching_internship', label: 'Approaching Internship', desc: 'Final year before practicum' },
            { value: 'in_internship', label: 'In Internship', desc: 'Currently on internship' },
          ].map(opt => (
            <RadioCard
              key={opt.value}
              label={opt.label}
              description={opt.desc}
              selected={data.training_stage === opt.value}
              onClick={() => setData({ training_stage: opt.value as UserProfileData['training_stage'] })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2b: Cert-only details ───────────────────────────────────────────────
function StepCertDetails({ data, setData }: { data: UserProfileData; setData: (d: Partial<UserProfileData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel optional>Target certification state</FieldLabel>
        <SelectInput
          value={data.certification_state ?? ''}
          onChange={value => setData({ certification_state: value })}
          options={US_STATE_OPTIONS.map(state => ({
            value: state.name,
            label: state.name,
          }))}
          placeholder="Select a state"
        />
      </div>

      <div>
        <FieldLabel>Current role</FieldLabel>
        <div className="space-y-2">
          {[
            { value: 'teacher', label: 'Teacher' },
            { value: 'school_counselor', label: 'School Counselor' },
            { value: 'psychologist_trainee', label: 'Psychologist Trainee' },
            { value: 'other', label: 'Other' },
          ].map(opt => (
            <RadioCard
              key={opt.value}
              label={opt.label}
              selected={data.current_role === opt.value}
              onClick={() => setData({ current_role: opt.value as UserProfileData['current_role'] })}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Certification route</FieldLabel>
        <div className="space-y-2">
          {[
            { value: 'initial', label: 'Initial Certification', desc: 'First school psych certification' },
            { value: 'add_on', label: 'Add-on Certification', desc: 'Adding to existing license' },
            { value: 'reciprocity', label: 'Reciprocity / Transfer', desc: 'Moving credentials to a new state' },
            { value: 'other', label: 'Other' },
          ].map(opt => (
            <RadioCard
              key={opt.value}
              label={opt.label}
              description={opt.desc}
              selected={data.certification_route === opt.value}
              onClick={() => setData({ certification_route: opt.value as UserProfileData['certification_route'] })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Exam details ─────────────────────────────────────────────────────
function StepExam({ data, setData }: { data: UserProfileData; setData: (d: Partial<UserProfileData>) => void }) {
  const isRetake = data.retake_status === 'retake';

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Primary exam</FieldLabel>
        <div className="space-y-2">
          {[
            { value: 'praxis_5403', label: 'Praxis 5403', desc: 'School Psychologist (ETS)' },
            { value: 'ftce_school_psychologist', label: 'FTCE School Psychologist PK-12', desc: 'Florida Teacher Certification Exam' },
            { value: 'other', label: 'Other' },
          ].map(opt => (
            <RadioCard
              key={opt.value}
              label={opt.label}
              description={opt.desc}
              selected={data.primary_exam === opt.value}
              onClick={() => setData({ primary_exam: opt.value as UserProfileData['primary_exam'] })}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel optional>Planned test date</FieldLabel>
        <TextInput
          type="date"
          value={data.planned_test_date ?? ''}
          onChange={v => setData({ planned_test_date: v })}
        />
      </div>

      <div>
        <FieldLabel>Attempt status</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <RadioCard
            label="First attempt"
            selected={data.retake_status === 'first_attempt'}
            onClick={() => setData({ retake_status: 'first_attempt', number_of_prior_attempts: undefined })}
          />
          <RadioCard
            label="Retake"
            description="I've taken this before"
            selected={data.retake_status === 'retake'}
            onClick={() => setData({ retake_status: 'retake' })}
          />
        </div>
      </div>

      {isRetake && (
        <div>
          <FieldLabel optional>Number of prior attempts</FieldLabel>
          <TextInput
            type="number"
            value={data.number_of_prior_attempts ?? ''}
            onChange={v => setData({ number_of_prior_attempts: v })}
            placeholder="e.g. 1"
          />
        </div>
      )}

      <div>
        <FieldLabel optional>Target score</FieldLabel>
        <TextInput
          type="number"
          value={data.target_score ?? ''}
          onChange={v => setData({ target_score: v })}
          placeholder="e.g. 157"
        />
        <p className="text-xs text-slate-500 mt-1.5">
          Praxis 5403 passing score is typically 147–159 depending on your state.
        </p>
      </div>
    </div>
  );
}

// ─── Step 4: Goals + research ─────────────────────────────────────────────────
function StepGoals({ data, setData }: { data: UserProfileData; setData: (d: Partial<UserProfileData>) => void }) {
  const toggleItem = (field: 'study_goals' | 'biggest_challenge' | 'other_resources_list', value: string) => {
    const current: string[] = (data[field] as string[]) ?? [];
    const next = current.includes(value)
      ? current.filter(g => g !== value)
      : [...current, value];
    setData({ [field]: next });
  };

  const usedResources = data.used_other_resources;

  return (
    <div className="space-y-6">
      {/* Study goals */}
      <div>
        <FieldLabel>Study goals</FieldLabel>
        <p className="text-xs text-slate-500 mb-2.5">Select all that apply</p>
        <div className="space-y-2">
          {[
            { value: 'pass_exam', label: 'Pass the exam', desc: 'Reach the passing score for certification' },
            { value: 'improve_weak_domains', label: 'Improve weak domains', desc: 'Target specific content areas' },
            { value: 'timed_practice', label: 'Build timed practice', desc: 'Replicate real exam conditions and pacing' },
            { value: 'build_confidence', label: 'Build confidence', desc: 'Reduce anxiety through consistent practice' },
          ].map(g => (
            <CheckboxCard
              key={g.value}
              label={g.label}
              description={g.desc}
              checked={data.study_goals?.includes(g.value) ?? false}
              onClick={() => toggleItem('study_goals', g.value)}
            />
          ))}
        </div>
      </div>

      {/* Weekly availability */}
      <div>
        <FieldLabel>Weekly study availability</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: '1_2', label: '1–2 hrs / week', desc: 'Light' },
            { value: '3_5', label: '3–5 hrs / week', desc: 'Moderate' },
            { value: '6_10', label: '6–10 hrs / week', desc: 'Intensive' },
            { value: '10_plus', label: '10+ hrs / week', desc: 'Full focus' },
          ].map(h => (
            <RadioCard
              key={h.value}
              label={h.label}
              description={h.desc}
              selected={data.weekly_study_hours === h.value}
              onClick={() => setData({ weekly_study_hours: h.value as UserProfileData['weekly_study_hours'] })}
            />
          ))}
        </div>
      </div>

      {/* Biggest challenge */}
      <div>
        <FieldLabel optional>Biggest challenge right now</FieldLabel>
        <p className="text-xs text-slate-500 mb-2.5">Select all that apply</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'test_anxiety', label: 'Test anxiety' },
            { value: 'content_gaps', label: 'Content knowledge gaps' },
            { value: 'time_management', label: 'Time management' },
            { value: 'question_quality', label: 'Not enough good questions' },
            { value: 'no_study_plan', label: 'No clear study plan' },
            { value: 'motivation', label: 'Staying motivated' },
          ].map(c => (
            <CheckboxCard
              key={c.value}
              label={c.label}
              checked={data.biggest_challenge?.includes(c.value) ?? false}
              onClick={() => toggleItem('biggest_challenge', c.value)}
            />
          ))}
        </div>
      </div>

      <SectionDivider label="Quick research questions" />

      {/* Used other resources */}
      <div>
        <FieldLabel optional>Have you used other prep resources?</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <RadioCard
            label="Yes"
            selected={usedResources === true}
            onClick={() => setData({ used_other_resources: true })}
          />
          <RadioCard
            label="No"
            selected={usedResources === false}
            onClick={() => setData({ used_other_resources: false, other_resources_list: [], what_was_missing: undefined })}
          />
        </div>
      </div>

      {/* Which resources */}
      {usedResources === true && (
        <>
          <div>
            <FieldLabel optional>Which resources did you use?</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'ets_study_guide', label: 'ETS / Pearson study guide' },
                { value: 'youtube', label: 'YouTube / Videos' },
                { value: 'flashcards', label: 'Flashcards / Quizlet' },
                { value: 'another_app', label: 'Another prep app' },
                { value: 'private_tutor', label: 'Private tutoring' },
                { value: 'other', label: 'Other' },
              ].map(r => (
                <CheckboxCard
                  key={r.value}
                  label={r.label}
                  checked={data.other_resources_list?.includes(r.value) ?? false}
                  onClick={() => toggleItem('other_resources_list', r.value)}
                />
              ))}
            </div>
          </div>

          <div>
            <FieldLabel optional>What was missing from those resources?</FieldLabel>
            <TextAreaInput
              value={data.what_was_missing ?? ''}
              onChange={v => setData({ what_was_missing: v })}
              placeholder="e.g. Not enough practice questions, explanations weren't clear, too expensive…"
              rows={3}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step config ──────────────────────────────────────────────────────────────
type StepKey = 'role' | 'pathway' | 'exam' | 'goals';

const STEP_CONFIG: Record<StepKey, { title: string; subtitle: string; icon: React.ReactNode }> = {
  role: {
    title: 'What best describes you?',
    subtitle: 'This helps us personalize your study experience.',
    icon: <User className="w-5 h-5" />,
  },
  pathway: {
    title: 'Your program & background',
    subtitle: 'Tell us a bit about your training path.',
    icon: <GraduationCap className="w-5 h-5" />,
  },
  exam: {
    title: 'About your exam',
    subtitle: 'We\'ll use this to shape your study timeline.',
    icon: <BookOpen className="w-5 h-5" />,
  },
  goals: {
    title: 'Goals & study habits',
    subtitle: 'A few quick questions so we can build the right plan for you.',
    icon: <Target className="w-5 h-5" />,
  },
};

function getSteps(role: string): StepKey[] {
  const steps: StepKey[] = ['role'];
  if (role === 'graduate_student' || role === 'certification_only') {
    steps.push('pathway');
  }
  steps.push('exam', 'goals');
  return steps;
}

// ─── Progress bars (matches mockup-user-flow.html Screen 2) ──────────────────
function ProgressBars({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-8 h-1 rounded-full transition-all duration-300 ${
            i <= current ? 'bg-amber-500' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OnboardingFlow({
  displayName,
  onComplete,
  onSkip,
  initialData,
  mode = 'onboarding',
  variant = 'fullscreen',
  onCancel
}: OnboardingFlowProps) {
  const [data, setData] = useState<UserProfileData>(() => mergeWithEmptyProfileData(initialData));

  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateData = (partial: Partial<UserProfileData>) => {
    setData(prev => ({ ...prev, ...partial }));
  };

  // When role changes on step 0, keep step at 0 and reset role-specific fields
  const updateRole = (partial: Partial<UserProfileData>) => {
    setData(prev => ({
      ...prev,
      ...partial,
      // Clear both role-detail buckets when switching roles
      university: '', program_type: '', program_state: '', delivery_mode: '', training_stage: '',
      certification_state: '', current_role: '', certification_route: '',
    }));
    if (stepIndex > 0) setStepIndex(0);
  };

  const steps = getSteps(data.account_role);
  const currentStep = steps[stepIndex];
  const config = STEP_CONFIG[currentStep];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const canAdvance = (): boolean => {
    switch (currentStep) {
      case 'role': return data.account_role !== '';
      case 'pathway':
        if (data.account_role === 'graduate_student') {
          return Boolean(data.training_stage) && Boolean(data.program_type) && Boolean(data.delivery_mode);
        }
        if (data.account_role === 'certification_only') {
          return Boolean(data.current_role) && Boolean(data.certification_route);
        }
        return true;
      case 'exam': return data.primary_exam !== '' && Boolean(data.retake_status);
      case 'goals':
        if (mode === 'edit') return true;
        return data.study_goals.length > 0 && Boolean(data.weekly_study_hours);
      default: return true;
    }
  };

  const handleNext = async () => {
    setSaveError(null);
    if (isLast) {
      setSaving(true);
      try {
        await onComplete(data);
      } catch (_err) {
        setSaveError('Something went wrong saving your profile. Please try again.');
      } finally {
        setSaving(false);
      }
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setSaveError(null);
    setStepIndex(prev => Math.max(0, prev - 1));
  };

  const rootShell =
    variant === 'embedded'
      ? 'flex min-h-full flex-col bg-[#f7f6f2] p-4'
      : 'min-h-screen bg-[#f7f6f2] flex items-center justify-center p-4';

  const innerWrap = variant === 'embedded' ? 'flex w-full min-h-0 flex-1 flex-col' : 'w-full max-w-xl';

  return (
    <div className={rootShell}>
      <div className={innerWrap}>

        {/* Top wordmark */}
        {variant !== 'embedded' && (
          <div className="mb-7 flex items-center justify-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Praxis Makes Perfect</span>
          </div>
        )}

        {/* Welcome */}
        <div className={`text-center ${variant === 'embedded' ? 'mb-4' : 'mb-6'}`}>
          {mode !== 'edit' && (
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 mb-2">
              STEP {stepIndex + 1} OF {steps.length}
            </p>
          )}
          <h2 className={`font-bold text-slate-900 ${variant === 'embedded' ? 'text-lg' : 'mb-1 text-2xl'}`}>
            {mode === 'edit'
              ? 'Your onboarding answers'
              : <>Welcome{displayName ? `, ${displayName.split(' ')[0]}` : ''}! 👋</>}
          </h2>
          <p className="text-sm text-slate-500">
            {mode === 'edit'
              ? 'Review how you answered, or change your display name, program, exam, and goals.'
              : `Let's set up your profile — ${steps.length} quick steps so we can personalize everything.`}
          </p>
        </div>

        {/* Step indicator bars */}
        {variant !== 'embedded' && (
          <div className="mb-6">
            <ProgressBars total={steps.length} current={stepIndex} />
          </div>
        )}

        {/* Card */}
        <div
          className={`overflow-hidden rounded-2xl border border-[#e6dfd4] bg-white shadow-sm ${
            variant === 'embedded' ? 'flex min-h-0 flex-1 flex-col' : ''
          }`}
        >

          {/* Step header bar */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900 leading-tight">{config.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{config.subtitle}</p>
              </div>
              <div className="text-xs text-slate-500 shrink-0">
                {stepIndex + 1} / {steps.length}
              </div>
            </div>
          </div>

          {/* Step content */}
          <div
            className={`overflow-y-auto px-6 py-5 ${
              variant === 'embedded' ? 'min-h-0 max-h-[min(520px,calc(100vh-12rem))] flex-1' : 'max-h-[440px]'
            }`}
          >
            {currentStep === 'role' && (
              <StepRole data={data} setData={updateRole} />
            )}
            {currentStep === 'pathway' && data.account_role === 'graduate_student' && (
              <StepGradDetails data={data} setData={updateData} />
            )}
            {currentStep === 'pathway' && data.account_role === 'certification_only' && (
              <StepCertDetails data={data} setData={updateData} />
            )}
            {currentStep === 'exam' && (
              <StepExam data={data} setData={updateData} />
            )}
            {currentStep === 'goals' && (
              <StepGoals data={data} setData={updateData} />
            )}
          </div>

          {/* Error */}
          {saveError && (
            <div className="mx-6 mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Footer nav */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                if (isFirst) {
                  if (mode === 'edit' && onCancel) onCancel();
                  else if (onSkip) void onSkip();
                } else {
                  handleBack();
                }
              }}
              className="editorial-button-secondary text-xs"
            >
              {isFirst ? (
                mode === 'edit' && onCancel ? (
                  <span>Close</span>
                ) : (
                  <span>Skip for now</span>
                )
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" /> Back
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance() || saving}
              className="editorial-button-primary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : isLast ? (
                <><Check className="w-4 h-4" /> Finish</>
              ) : (
                <>Continue <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
