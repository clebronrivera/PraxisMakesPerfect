// src/components/FocusItemGroup.tsx
//
// Renders a grouped checklist of focus items (vocabulary, misconceptions, traps).
// Used inside StudyCenterSidebar → Focus Items tab.

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Circle, BookOpen, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { FocusItem } from '../utils/focusItemExtractor';

interface FocusItemGroupProps {
  title: string;
  icon: React.ReactNode;
  items: FocusItem[];
  checkedIds: Set<string>;
  onToggleCheck: (itemId: string) => void;
  /** Whether to show "NEW" badges on unchecked items */
  showNewBadges: boolean;
}

export default function FocusItemGroup({
  title,
  icon,
  items,
  checkedIds,
  onToggleCheck,
  showNewBadges,
}: FocusItemGroupProps) {
  const [expanded, setExpanded] = useState(true);

  if (items.length === 0) return null;

  const checkedCount = items.filter(i => checkedIds.has(i.id)).length;

  return (
    <div className="space-y-2">
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="text-amber-700">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex-1">
          {title}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {checkedCount}/{items.length}
        </span>
        <span className="text-slate-400">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </button>

      {/* Items */}
      {expanded && (
        <div className="space-y-1.5">
          {items.map(item => {
            const checked = checkedIds.has(item.id);
            const isNew = showNewBadges && !checked;

            return (
              <button
                key={item.id}
                onClick={() => onToggleCheck(item.id)}
                className={`
                  flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all
                  ${checked
                    ? 'border-slate-100 bg-slate-50 opacity-60'
                    : 'border-slate-200 bg-white hover:border-amber-200'}
                `}
              >
                {/* Checkbox icon */}
                <span className="mt-0.5 shrink-0">
                  {checked ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300" />
                  )}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-semibold leading-snug ${checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {item.text}
                    </p>
                    {isNew && (
                      <span className="shrink-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase">
                        New
                      </span>
                    )}
                  </div>
                  {item.detail && !checked && (
                    <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                      {item.detail}
                    </p>
                  )}
                  {item.context && !checked && (
                    <p className="mt-0.5 text-[10px] text-slate-400 italic">
                      {item.context}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Convenience: full Focus Items panel ──────────────────────────────────────

export function FocusItemsPanel({
  items,
  checkedIds,
  onToggleCheck,
  showNewBadges,
  loading,
}: {
  items: FocusItem[];
  checkedIds: Set<string>;
  onToggleCheck: (itemId: string) => void;
  showNewBadges: boolean;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  const vocab = items.filter(i => i.type === 'vocabulary');
  const misconceptions = items.filter(i => i.type === 'misconception');
  const traps = items.filter(i => i.type === 'trap');

  if (items.length === 0) {
    return (
      <div className="text-center py-6 space-y-2">
        <p className="text-xs text-slate-500">
          No focus items for this skill yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FocusItemGroup
        title="Key Vocabulary"
        icon={<BookOpen className="w-3.5 h-3.5" />}
        items={vocab}
        checkedIds={checkedIds}
        onToggleCheck={onToggleCheck}
        showNewBadges={showNewBadges}
      />
      <FocusItemGroup
        title="Watch Out For"
        icon={<AlertTriangle className="w-3.5 h-3.5" />}
        items={misconceptions}
        checkedIds={checkedIds}
        onToggleCheck={onToggleCheck}
        showNewBadges={showNewBadges}
      />
      <FocusItemGroup
        title="Common Traps"
        icon={<ShieldAlert className="w-3.5 h-3.5" />}
        items={traps}
        checkedIds={checkedIds}
        onToggleCheck={onToggleCheck}
        showNewBadges={showNewBadges}
      />
    </div>
  );
}
