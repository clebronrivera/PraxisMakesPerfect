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
  const [items, setItems] = useState(initialItems);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
  };

  const isCorrectOrder =
    JSON.stringify(items) === JSON.stringify(initialItems);

  return (
    <div className="space-y-4">
      {prompt && (
        <p className="text-sm text-slate-300 italic">
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
                  ? 'bg-cyan-600/20 border-cyan-500/40 opacity-75'
                  : 'bg-slate-800/60 border-slate-600/40 hover:border-cyan-500/30'
              }`}
            >
              {/* Step number badge */}
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 font-bold text-sm">
                {index + 1}
              </div>

              {/* Item text */}
              <div className="flex-grow">
                <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
              </div>

              {/* Drag handle */}
              <GripVertical className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {isCorrectOrder && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <p className="text-sm text-emerald-300 font-semibold">✓ Correct sequence!</p>
        </div>
      )}

      {onComplete && (
        <button
          onClick={() => onComplete(items)}
          disabled={!isCorrectOrder}
          className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
            isCorrectOrder
              ? 'bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 text-cyan-300'
              : 'bg-slate-800/40 border border-slate-700/40 text-slate-500 cursor-not-allowed'
          }`}
        >
          Complete activity
        </button>
      )}
    </div>
  );
}
