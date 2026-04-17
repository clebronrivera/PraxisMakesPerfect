// src/components/GlossaryTooltip.tsx
//
// Inline vocabulary tooltip for learning module content.
// Wraps a matched term with a dotted underline; hovering (or tapping on mobile)
// reveals a dark panel with the official definition above the word.
//
// Usage: only rendered by glossaryHighlighter — not used directly.

import { useState } from 'react';

interface GlossaryTooltipProps {
  term: string;
  definition: string;
}

export default function GlossaryTooltip({ term, definition }: GlossaryTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    // Outer span is the hover zone — the absolutely-positioned tooltip is a DOM child,
    // so moving the cursor from the term onto the tooltip does NOT trigger onMouseLeave.
    <span
      className="relative inline"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
    >
      {/* Term — dotted underline signals "this is a vocabulary word" */}
      <span className="border-b border-dotted border-indigo-400 text-indigo-700 cursor-help">
        {term}
      </span>

      {/* Tooltip panel — positioned above the term */}
      {open && (
        <span className="absolute bottom-full left-0 z-50 mb-2 block w-56 rounded-xl bg-slate-50 px-3 py-2.5 shadow-2xl text-left pointer-events-none">
          <span className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
            {term}
          </span>
          <span className="block text-xs text-slate-700 leading-relaxed">
            {definition}
          </span>
        </span>
      )}
    </span>
  );
}
