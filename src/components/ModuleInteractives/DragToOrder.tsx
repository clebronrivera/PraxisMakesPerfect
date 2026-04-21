import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';

interface DragToOrderProps {
  items: string[];
  prompt?: string;
  onComplete?: (orderedItems: string[]) => void;
  variant?: 'atelier' | 'editorial';
}

/**
 * DragToOrder: Sequence builder - reorder items by dragging
 * Used for: Reading skill hierarchy, implementation pipeline, protocol steps
 */
export default function DragToOrder({
  items: initialItems,
  prompt,
  onComplete,
  variant = 'editorial',
}: DragToOrderProps) {
  const isA = variant === 'atelier';
  const [items, setItems] = useState(() => {
    // Shuffle on mount so the user actually has to reorder
    const shuffled = [...initialItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrectOrder = JSON.stringify(items) === JSON.stringify(initialItems);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    setItems(newItems);
    setDraggedIndex(null);
    // Clear submitted state when user reorders after a wrong attempt
    if (submitted) setSubmitted(false);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (onComplete) onComplete(items);
  };

  const handleRetry = () => {
    setSubmitted(false);
    // Re-shuffle for a fresh attempt
    const shuffled = [...initialItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setItems(shuffled);
  };

  const promptCls = isA ? 'text-sm text-slate-400 italic' : 'text-sm text-slate-600 italic';
  const rowDragging = isA
    ? 'bg-[color:var(--d1-peach)]/15 border-[color:var(--d1-peach)]/50 opacity-75'
    : 'bg-cyan-50 border-cyan-300 opacity-75';
  const rowIdle = isA
    ? 'bg-white/5 border-white/10 hover:border-[color:var(--d1-peach)]/40 hover:bg-white/10'
    : 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm';
  const badgeCls = isA
    ? 'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[color:var(--d1-peach)]/20 border border-[color:var(--d1-peach)]/40 font-bold text-sm text-[color:var(--d1-peach)]'
    : 'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-700 font-bold text-sm';
  const itemTextCls = isA ? 'text-sm text-slate-200 leading-normal' : 'text-sm text-slate-700 leading-normal';
  const handleCls = isA ? 'w-4 h-4 text-slate-500 mt-1 flex-shrink-0' : 'w-4 h-4 text-slate-400 mt-1 flex-shrink-0';
  const correctBannerCls = isA
    ? 'rounded-xl bg-[color:var(--d2-mint)]/10 border border-[color:var(--d2-mint)]/40 px-4 py-3'
    : 'rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3';
  const correctBannerText = isA ? 'text-sm font-semibold text-[color:var(--d2-mint)]' : 'text-sm text-emerald-700 font-semibold';
  const wrongBannerCls = isA
    ? 'rounded-xl bg-[color:var(--accent-rose)]/10 border border-[color:var(--accent-rose)]/40 px-4 py-3 flex items-center justify-between gap-3'
    : 'rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 flex items-center justify-between gap-3';
  const wrongBannerText = isA ? 'text-sm font-semibold text-[color:var(--accent-rose)]' : 'text-sm text-rose-700 font-semibold';
  const retryBtnCls = isA
    ? 'text-xs font-semibold underline whitespace-nowrap text-[color:var(--accent-rose)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)] rounded'
    : 'text-xs font-semibold text-rose-600 underline hover:text-rose-800 whitespace-nowrap';
  const submitBtnCls = isA
    ? 'btn-soft-glow w-full text-sm font-semibold'
    : 'w-full py-2 rounded-lg font-semibold text-sm transition-colors bg-cyan-600 hover:bg-cyan-700 text-white border border-transparent';

  return (
    <div className="space-y-4">
      {prompt && (
        <p className={promptCls}>
          {prompt}
        </p>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="relative">
            <div
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-move ${
                draggedIndex === index ? rowDragging : rowIdle
              }`}
            >
              {/* Step number badge */}
              <div className={badgeCls}>
                {index + 1}
              </div>

              {/* Item text */}
              <div className="flex-grow">
                <p className={itemTextCls}>{item}</p>
              </div>

              {/* Drag handle */}
              <GripVertical className={handleCls} />
            </div>
          </div>
        ))}
      </div>

      {/* Feedback — shown after submit */}
      {submitted && (
        isCorrectOrder ? (
          <div className={correctBannerCls}>
            <p className={correctBannerText}>✓ Correct sequence!</p>
          </div>
        ) : (
          <div className={wrongBannerCls}>
            <p className={wrongBannerText}>✗ Not quite — try reordering the steps.</p>
            <button
              onClick={handleRetry}
              className={retryBtnCls}
            >
              Try again
            </button>
          </div>
        )
      )}

      {onComplete && !submitted && (
        <button
          onClick={handleSubmit}
          className={submitBtnCls}
        >
          Submit order
        </button>
      )}
    </div>
  );
}
