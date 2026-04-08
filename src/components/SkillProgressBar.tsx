import { ReactNode } from 'react';

/**
 * Two-tone progress bar showing baseline (at diagnostic) and growth since.
 *
 * Four visual states, per docs/WORKFLOW_GROUNDING.md section 3.10:
 *   1. Growth     (current >  baseline)  → indigo-900 baseline + indigo-500 growth
 *   2. Regression (current <  baseline)  → full rose-500/70 bar + thin baseline tick
 *   3. No baseline (legacy or new skill) → single bg-indigo-500 bar
 *   4. No change  (current == baseline)  → solid indigo-900 bar
 *
 * Used by ResultsDashboard, StudentDetailDrawer, and PostAssessmentReport.
 * Editorial-light theme: warm cream track (#ece8df) so this drops into existing
 * editorial-surface cards without clashing.
 */

export type SkillProgressBarSize = 'sm' | 'md';

export interface SkillProgressBarProps {
  /** Current accuracy as a 0–1 fraction. Required. */
  current: number;
  /** Baseline accuracy at diagnostic as a 0–1 fraction. Null = no baseline. */
  baseline: number | null;
  /** Optional target line (e.g. 0.70 for the readiness goal). Renders as amber tick. */
  target?: number | null;
  /** Skill or domain label rendered above the bar. */
  label: ReactNode;
  /** Right-aligned percentage display. Optional override; defaults to "{current}%". */
  valueLabel?: ReactNode;
  /** Visual size. 'md' is the default 12px-tall bar; 'sm' is 8px for skill grids. */
  size?: SkillProgressBarSize;
  /** Optional sublabel rendered under the bar (e.g. "No baseline (not in diagnostic)"). */
  sublabel?: ReactNode;
  /** Extra classes on the outer wrapper. */
  className?: string;
  /** When true, renders a vertical indicator at the 80% (Demonstrating) threshold. */
  showMasteryLine?: boolean;
  /** When true, renders a small legend above the bar explaining the color encoding. */
  legend?: boolean;
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

const formatPct = (fraction: number): string => `${Math.round(clamp01(fraction) * 100)}%`;

export function SkillProgressBar({
  current,
  baseline,
  target = null,
  label,
  valueLabel,
  size = 'md',
  sublabel,
  className = '',
  showMasteryLine = false,
  legend = false,
}: SkillProgressBarProps) {
  const currentClamped = clamp01(current);
  const baselineClamped = baseline === null ? null : clamp01(baseline);
  const targetClamped = target === null || target === undefined ? null : clamp01(target);

  const isRegression = baselineClamped !== null && currentClamped < baselineClamped;
  const hasBaseline = baselineClamped !== null;
  const isNoChange = hasBaseline && Math.abs(currentClamped - (baselineClamped ?? 0)) < 0.005;

  const trackHeightClass = size === 'sm' ? 'h-2' : 'h-3';
  const labelTextClass = size === 'sm' ? 'text-xs' : 'text-sm';
  const valueTextClass = size === 'sm' ? 'text-xs' : 'text-sm';

  // Choose value-text color based on tier of the current score
  const valueColorClass =
    isRegression ? 'text-rose-600'
    : currentClamped >= 0.8 ? 'text-emerald-700'
    : currentClamped >= 0.6 ? 'text-amber-700'
    : 'text-rose-600';

  return (
    <div className={className}>
      <div className={`flex items-baseline justify-between gap-3 ${labelTextClass} mb-1`}>
        <span className="font-medium text-slate-700 truncate">{label}</span>
        <span className={`${valueTextClass} font-bold tabular-nums shrink-0 ${valueColorClass}`}>
          {valueLabel ?? (
            <>
              {formatPct(currentClamped)}
              {hasBaseline && !isNoChange && (
                <span className="ml-1 text-[10px] font-medium text-slate-400">
                  was {formatPct(baselineClamped ?? 0)}
                </span>
              )}
            </>
          )}
        </span>
      </div>

      {legend && (
        <div className="mb-1.5 flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-indigo-900" /> Baseline
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-indigo-500" /> Current
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-0.5 bg-slate-600" /> Mastery (80%)
          </span>
        </div>
      )}

      <div className={`relative ${trackHeightClass} rounded-full bg-[#ece8df] overflow-hidden`}>
        {showMasteryLine && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-600 z-10"
            style={{ left: '80%' }}
            title="Demonstrating threshold (80%)"
          />
        )}
        {isRegression ? (
          <>
            {/* Full rose-500/70 bar at the current (lower) value */}
            <div
              className="absolute inset-y-0 left-0 bg-rose-500/70"
              style={{ width: `${currentClamped * 100}%` }}
            />
            {/* Thin tick at the baseline position to show how far it slipped */}
            <div
              className="absolute inset-y-0 w-0.5 bg-slate-700/60"
              style={{ left: `calc(${(baselineClamped ?? 0) * 100}% - 1px)` }}
              title={`baseline ${formatPct(baselineClamped ?? 0)}`}
            />
          </>
        ) : !hasBaseline ? (
          // No baseline → single indigo-500 bar
          <div
            className="absolute inset-y-0 left-0 bg-indigo-500"
            style={{ width: `${currentClamped * 100}%` }}
          />
        ) : (
          <>
            {/* Baseline segment (dark indigo) */}
            <div
              className="absolute inset-y-0 left-0 bg-indigo-900 border-r border-indigo-500/40"
              style={{ width: `${(baselineClamped ?? 0) * 100}%` }}
            />
            {/* Growth segment (bright indigo) */}
            {!isNoChange && (
              <div
                className="absolute inset-y-0 bg-indigo-500"
                style={{
                  left: `${(baselineClamped ?? 0) * 100}%`,
                  width: `${(currentClamped - (baselineClamped ?? 0)) * 100}%`,
                }}
              />
            )}
          </>
        )}
      </div>

      {targetClamped !== null && (
        <div className="relative h-1.5">
          <div
            className="absolute top-0 h-1.5 w-0.5 rounded-full bg-amber-500/70"
            style={{ left: `calc(${targetClamped * 100}% - 1px)` }}
            title={`${formatPct(targetClamped)} target`}
          />
        </div>
      )}

      {sublabel && (
        <p className="mt-0.5 text-[10px] text-slate-400">{sublabel}</p>
      )}
    </div>
  );
}
