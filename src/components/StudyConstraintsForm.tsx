/**
 * StudyConstraintsForm
 *
 * Collapsible, always-skippable form for study scheduling inputs.
 * All fields have sensible defaults — the guide generates with or without them.
 */
import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Clock, Settings2 } from 'lucide-react';
import type { StudyConstraints } from '../services/studyPlanService';

interface StudyConstraintsFormProps {
  value: StudyConstraints;
  onChange: (constraints: StudyConstraints) => void;
}

const INTENSITY_OPTIONS: Array<{ value: StudyConstraints['intensity']; label: string; description: string }> = [
  { value: 'light',      label: 'Light',      description: 'Shorter sessions, easier to maintain' },
  { value: 'moderate',   label: 'Moderate',   description: 'Balanced pace — recommended' },
  { value: 'aggressive', label: 'Aggressive', description: 'Maximum study time available' },
];

const SESSION_DURATION_OPTIONS = [
  { value: 20,  label: '20 min' },
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '60 min' },
  { value: 90,  label: '90 min' },
];

const WEEKEND_OPTIONS = [
  { value: 0,   label: 'None' },
  { value: 30,  label: '30 min' },
  { value: 60,  label: '60 min' },
  { value: 90,  label: '90 min' },
  { value: 120, label: '2 hr' },
];

export default function StudyConstraintsForm({ value, onChange }: StudyConstraintsFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  function update(partial: Partial<StudyConstraints>) {
    onChange({ ...value, ...partial });
  }

  // Compute weeks remaining if testDate is set
  const weeksUntilTest = value.testDate
    ? Math.max(0, Math.round(
        (new Date(value.testDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)
      ))
    : null;

  const activeToggleClass =
    'bg-[color:var(--d1-peach)]/20 text-white border border-[color:var(--d1-peach)]/50';
  const idleToggleClass =
    'bg-white/5 text-slate-300 border border-white/8 hover:bg-white/10 hover:text-white hover:border-[color:var(--d1-peach)]/30';
  const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)]';

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-[rgba(10,22,40,0.45)] backdrop-blur-[14px]">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${focusRing}`}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4" style={{ color: 'var(--d1-peach)' }} />
          <span className="text-sm font-medium text-white">Study Settings</span>
          <span className="text-xs text-slate-400">(optional — improves scheduling)</span>
        </div>
        {isOpen
          ? <ChevronUp   className="w-4 h-4 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        }
      </button>

      {isOpen && (
        <div className="space-y-5 border-t border-white/8 bg-[rgba(10,22,40,0.55)] px-4 pb-4">

          {/* Test date */}
          <div className="pt-4 space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              Test Date
            </label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={value.testDate ?? ''}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => update({ testDate: e.target.value || undefined })}
                className={`rounded-xl border border-white/10 bg-[rgba(10,22,40,0.45)] px-3 py-2 text-sm text-slate-200 transition-colors focus:border-[color:var(--d1-peach)] focus:outline-none focus:ring-2 focus:ring-[color:var(--d1-peach)]/20 [color-scheme:dark]`}
              />
              {weeksUntilTest !== null && (
                <span className="text-sm text-slate-400">
                  {weeksUntilTest === 0
                    ? 'This week!'
                    : `${weeksUntilTest} week${weeksUntilTest === 1 ? '' : 's'} away`}
                </span>
              )}
            </div>
          </div>

          {/* Study days per week */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              Days per week
            </label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => update({ studyDaysPerWeek: days })}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${focusRing} ${
                    (value.studyDaysPerWeek ?? 5) === days ? activeToggleClass : idleToggleClass
                  }`}
                >
                  {days}
                </button>
              ))}
            </div>
          </div>

          {/* Session duration */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Minutes per session
            </label>
            <div className="flex gap-2 flex-wrap">
              {SESSION_DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ minutesPerSession: opt.value })}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${focusRing} ${
                    (value.minutesPerSession ?? 45) === opt.value ? activeToggleClass : idleToggleClass
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weekend block */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Weekend study block
            </label>
            <div className="flex gap-2 flex-wrap">
              {WEEKEND_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ weekendMinutes: opt.value })}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${focusRing} ${
                    (value.weekendMinutes ?? 60) === opt.value ? activeToggleClass : idleToggleClass
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Study intensity
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {INTENSITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ intensity: opt.value })}
                  className={`px-3 py-2.5 rounded-xl text-left transition-all border ${focusRing} ${
                    (value.intensity ?? 'moderate') === opt.value
                      ? 'border-[color:var(--d1-peach)]/50 bg-[color:var(--d1-peach)]/15 text-white'
                      : 'border-white/8 bg-white/5 text-slate-300 hover:border-[color:var(--d1-peach)]/30 hover:text-white'
                  }`}
                >
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
