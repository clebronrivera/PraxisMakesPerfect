// src/components/MilestoneToast.tsx
//
// Slide-in celebration banner shown when a student crosses a domain milestone
// (25% / 50% / 75% / 100% of the domain's skills at Demonstrating).
//
// Auto-dismisses after 4 seconds; also manually dismissable.

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { MilestoneEvent } from '../utils/domainMilestones';

interface MilestoneToastProps {
  event: MilestoneEvent;
  onDismiss: () => void;
}

const MILESTONE_COPY: Record<number, string> = {
  25:  '25% Demonstrating — great start!',
  50:  'Halfway there — 50% Demonstrating!',
  75:  '75% Demonstrating — almost mastered!',
  100: '100% Demonstrating — domain complete!',
};

export default function MilestoneToast({ event, onDismiss }: MilestoneToastProps) {
  const [visible, setVisible] = useState(false);

  // Animate in on mount; auto-dismiss after 4 s
  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // wait for fade-out
    }, 4_000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 z-50 w-[min(88vw,360px)] -translate-x-1/2
        transition-all duration-300
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
      `}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 shadow-lg">
        <Sparkles className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-widest text-amber-700">
            Milestone reached!
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800 leading-snug">
            {event.domainName}
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            {MILESTONE_COPY[event.pct] ?? `${event.pct}% Demonstrating`}
          </p>
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className="shrink-0 rounded-lg p-0.5 text-amber-500 hover:text-amber-700"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
