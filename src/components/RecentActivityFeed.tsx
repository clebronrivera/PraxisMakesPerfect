// src/components/RecentActivityFeed.tsx
// Shows a 7-day activity heatmap strip and momentum badge on the dashboard.

import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { WeeklyMomentum } from '../hooks/useWeeklyMomentum';
import { formatStudyTime } from '../hooks/useDailyStudyTime';

interface DayActivity {
  date: string;       // YYYY-MM-DD
  questions: number;
  seconds: number;
}

interface Props {
  days: DayActivity[];
  momentum: WeeklyMomentum;
}

function MomentumBadge({ momentum }: { momentum: WeeklyMomentum }) {
  if (momentum.thisWeek === 0 && momentum.lastWeek === 0) return null;

  const { trend, delta, thisWeek, lastWeek } = momentum;

  if (trend === 'new' || lastWeek === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/15 text-cyan-300">
        <Activity className="w-2.5 h-2.5" />
        {thisWeek} this week
      </span>
    );
  }

  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300">
        <TrendingUp className="w-2.5 h-2.5" />
        +{delta} vs last week
      </span>
    );
  }

  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/15 text-rose-300">
        <TrendingDown className="w-2.5 h-2.5" />
        {delta} vs last week
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/60 text-slate-400">
      <Minus className="w-2.5 h-2.5" />
      Same as last week
    </span>
  );
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
}

function heatColor(questions: number): string {
  if (questions === 0) return 'bg-navy-700/60';
  if (questions < 5) return 'bg-cyan-900/70';
  if (questions < 10) return 'bg-cyan-700/70';
  if (questions < 20) return 'bg-cyan-500/70';
  return 'bg-cyan-400';
}

export default function RecentActivityFeed({ days, momentum }: Props) {
  // Show last 7 days, most recent on the right
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const totalThisWeek = sorted.reduce((s, d) => s + d.questions, 0);
  const totalTime = sorted.reduce((s, d) => s + d.seconds, 0);

  if (totalThisWeek === 0 && momentum.thisWeek === 0) return null;

  return (
    <div className="p-4 bg-navy-800/60 border border-navy-600/40 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <p className="text-xs font-semibold text-slate-400">This week</p>
        </div>
        <MomentumBadge momentum={momentum} />
      </div>

      {/* 7-day heatmap strip */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {sorted.map(day => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <div
              className={`w-full aspect-square rounded-md transition-colors ${heatColor(day.questions)}`}
              title={`${day.date}: ${day.questions} questions${day.seconds > 0 ? `, ${formatStudyTime(day.seconds)}` : ''}`}
            />
            <span className="text-[9px] text-slate-600">{dayLabel(day.date)}</span>
          </div>
        ))}
      </div>

      {/* Summary line */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        <span>{totalThisWeek} questions</span>
        {totalTime > 0 && <span>{formatStudyTime(totalTime)} studied</span>}
      </div>
    </div>
  );
}
