// src/components/TodaysFocusCard.tsx
// Shows 1-2 recommended skills to focus on today based on skill velocity.

import { Crosshair, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { TodaysFocusItem } from '../utils/todaysFocus';

interface Props {
  items: TodaysFocusItem[];
  onPracticeSkill: (skillId: string) => void;
}

const ACCENT_STYLES = {
  coral: {
    card: 'bg-rose-500/8 border-rose-500/20',
    badge: 'bg-rose-500/15 text-rose-300',
    btn: 'bg-rose-500 hover:bg-rose-600 text-white',
    icon: 'text-rose-400',
    label: 'text-rose-300',
  },
  cyan: {
    card: 'bg-cyan-500/8 border-cyan-500/20',
    badge: 'bg-cyan-500/15 text-cyan-300',
    btn: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    icon: 'text-cyan-400',
    label: 'text-cyan-300',
  },
  amber: {
    card: 'bg-amber-500/8 border-amber-500/20',
    badge: 'bg-amber-500/15 text-amber-300',
    btn: 'bg-amber-500 hover:bg-amber-600 text-white',
    icon: 'text-amber-400',
    label: 'text-amber-300',
  },
};

function AccentIcon({ accent }: { accent: TodaysFocusItem['accent'] }) {
  if (accent === 'coral') return <TrendingDown className="w-3.5 h-3.5" />;
  if (accent === 'cyan') return <TrendingUp className="w-3.5 h-3.5" />;
  return <Minus className="w-3.5 h-3.5" />;
}

export default function TodaysFocusCard({ items, onPracticeSkill }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Crosshair className="w-3.5 h-3.5 text-slate-500" />
        <p className="overline">Today's focus</p>
      </div>

      <div className={`grid gap-3 ${items.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {items.map(item => {
          const s = ACCENT_STYLES[item.accent];
          return (
            <div key={item.skillId} className={`p-4 border rounded-2xl ${s.card}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold leading-tight truncate ${s.label}`}>
                    {item.name}
                  </p>
                  <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.badge}`}>
                    <AccentIcon accent={item.accent} />
                    {item.reason}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onPracticeSkill(item.skillId)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${s.btn}`}
              >
                Practice now
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
