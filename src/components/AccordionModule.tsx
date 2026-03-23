// src/components/AccordionModule.tsx
//
// Collapsible accordion header for a single learning module.
// Used in LearningPathModulePage to stack multiple modules vertically.

import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface AccordionModuleProps {
  moduleId: string;
  title: string;
  index: number;
  totalModules: number;
  isExpanded: boolean;
  isViewed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function AccordionModule({
  moduleId,
  title,
  index,
  totalModules,
  isExpanded,
  isViewed,
  onToggle,
  children,
}: AccordionModuleProps) {
  // Single-module skills: no accordion chrome, just render content
  if (totalModules <= 1) {
    return <div>{children}</div>;
  }

  return (
    <div className="print-expand">
      {/* Accordion header */}
      <button
        onClick={onToggle}
        className={`
          flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all no-print
          ${isExpanded
            ? 'border-amber-300 bg-amber-50 shadow-sm'
            : isViewed
              ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'
              : 'border-slate-200 bg-white hover:border-amber-200'}
        `}
      >
        {/* Module ID badge */}
        <span className={`
          shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider
          ${isExpanded
            ? 'bg-amber-200 text-amber-800'
            : isViewed
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'}
        `}>
          {moduleId}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-tight truncate ${isExpanded ? 'text-slate-900' : 'text-slate-700'}`}>
            {title}
          </p>
          <p className="text-[10px] text-slate-400">
            Lesson {index + 1} of {totalModules}
          </p>
        </div>

        {/* Status + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {isViewed && (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          )}
          <span className="text-slate-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-2 print:mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
