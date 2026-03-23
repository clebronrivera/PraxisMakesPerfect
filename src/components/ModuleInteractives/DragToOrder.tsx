import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';

interface DragToOrderProps {
  items: string[];
  prompt?: string;
  onComplete?: (orderedItems: string[]) => void;
}

/**
 * DragToOrder: Sequence builder - reorder items by dragging
 * Used for: Reading skill hierarchy, implementation pipeline, protocol steps
 */
export default function DragToOrder({
  items: initialItems,
  prompt,
  onComplete,
}: DragToOrderProps) {
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

  return (
    <div className="space-y-4">
      {prompt && (
        <p className="text-sm text-slate-600 italic">
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
              className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-move ${
                draggedIndex === index
                  ? 'bg-cyan-50 border-cyan-300 opacity-75'
                  : 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm'
              }`}
            >
              {/* Step number badge */}
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-700 font-bold text-sm">
                {index + 1}
              </div>

              {/* Item text */}
              <div className="flex-grow">
                <p className="text-sm text-slate-700 leading-normal">{item}</p>
              </div>

              {/* Drag handle */}
              <GripVertical className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Feedback — shown after submit */}
      {submitted && (
        isCorrectOrder ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="text-sm text-emerald-700 font-semibold">✓ Correct sequence!</p>
          </div>
        ) : (
          <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-rose-700 font-semibold">✗ Not quite — try reordering the steps.</p>
            <button
              onClick={handleRetry}
              className="text-xs font-semibold text-rose-600 underline hover:text-rose-800 whitespace-nowrap"
            >
              Try again
            </button>
          </div>
        )
      )}

      {onComplete && !submitted && (
        <button
          onClick={handleSubmit}
          className="w-full py-2 rounded-lg font-semibold text-sm transition-colors bg-cyan-600 hover:bg-cyan-700 text-white border border-transparent"
        >
          Submit order
        </button>
      )}
    </div>
  );
}
