// src/components/BreadcrumbPillNav.tsx
//
// Horizontal pill navigator for multi-lesson modules.
// Shows one pill per module with: module ID, viewed dot, active highlight.
// Used in LearningPathModulePage above the accordion.

interface BreadcrumbPillNavProps {
  modules: Array<{ id: string; title: string }>;
  expandedIdx: number;
  isViewed: (moduleId: string) => boolean;
  onSelect: (index: number) => void;
}

export default function BreadcrumbPillNav({
  modules,
  expandedIdx,
  isViewed,
  onSelect,
}: BreadcrumbPillNavProps) {
  if (modules.length <= 1) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-print">
      {modules.map((m, i) => {
        const active = i === expandedIdx;
        const viewed = isViewed(m.id);
        return (
          <button
            key={m.id}
            onClick={() => onSelect(i)}
            className={`
              flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all
              ${active
                ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm'
                : viewed
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-slate-700'}
            `}
          >
            {viewed && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            )}
            <span>{m.id}</span>
            <span className="hidden sm:inline font-semibold normal-case tracking-normal text-[10px] text-slate-400">
              {i + 1}/{modules.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}
