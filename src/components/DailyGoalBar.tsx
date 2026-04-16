// src/components/DailyGoalBar.tsx
// Shows daily question goal progress and today's study time.

import { Target, Clock } from 'lucide-react';
import { DAILY_GOAL } from '../hooks/useDailyQuestionCount';
import { formatStudyTime } from '../hooks/useDailyStudyTime';
import { getRandomAffirmation } from '../data/affirmations';

interface Props {
  count: number;        // questions answered today
  studySeconds: number; // seconds studied today
}

export default function DailyGoalBar({ count, studySeconds }: Props) {
  const pct = Math.min(100, Math.round((count / DAILY_GOAL) * 100));
  const done = count >= DAILY_GOAL;

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-2xl">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
          <p className="text-xs font-semibold text-slate-600">Recommended goal</p>
        </div>
        <div className="flex items-center gap-3">
          {studySeconds > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{formatStudyTime(studySeconds)} today</span>
            </div>
          )}
          <span className={`text-xs font-bold tabular-nums ${done ? 'text-emerald-600' : 'text-cyan-600'}`}>
            {count} / {DAILY_GOAL}
          </span>
        </div>
      </div>

      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${done ? 'bg-emerald-400' : 'bg-cyan-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {done && (
        <p className="text-[10px] text-emerald-600 mt-1.5 font-medium italic">
          "{getRandomAffirmation()}"
        </p>
      )}
      {!done && count > 0 && (
        <p className="text-[10px] text-slate-600 mt-1.5">
          {DAILY_GOAL - count} more to hit your goal
        </p>
      )}
    </div>
  );
}
