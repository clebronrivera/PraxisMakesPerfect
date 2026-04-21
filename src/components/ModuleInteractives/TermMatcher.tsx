import React, { useState } from 'react';
import { GripVertical, X } from 'lucide-react';

interface TermDefinitionPair {
  term: string;
  definition: string;
}

interface TermMatcherProps {
  pairs: TermDefinitionPair[];
  prompt?: string;
  onComplete?: (correctMatches: number) => void;
  variant?: 'atelier' | 'editorial';
}

/**
 * TermMatcher: Drag definitions to match with terms
 * Used for: Vocabulary matching, term to concept pairing, assessment terminology
 */
export default function TermMatcher({
  pairs,
  prompt,
  onComplete,
  variant = 'editorial',
}: TermMatcherProps) {
  const isA = variant === 'atelier';
  const [definitions] = useState<TermDefinitionPair[]>(
    [...pairs].sort(() => Math.random() - 0.5) // Shuffle definitions
  );
  const [matches, setMatches] = useState<Map<number, number>>(new Map()); // term index -> definition index
  const [draggedDefIndex, setDraggedDefIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedDefIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnTerm = (termIndex: number) => {
    if (draggedDefIndex === null) return;

    const newMatches = new Map(matches);
    newMatches.set(termIndex, draggedDefIndex);
    setMatches(newMatches);
    setDraggedDefIndex(null);
  };

  const removePairing = (termIndex: number) => {
    const newMatches = new Map(matches);
    newMatches.delete(termIndex);
    setMatches(newMatches);
  };

  const usedDefinitions = new Set(matches.values());
  const availableDefinitions = definitions.filter((_, i) => !usedDefinitions.has(i));

  const correctMatches = Array.from(matches.entries()).filter(([termIdx, defIdx]) => {
    return pairs[termIdx].definition === definitions[defIdx].definition;
  }).length;

  const allMatched = matches.size === pairs.length;
  const allCorrect = correctMatches === pairs.length;

  const promptCls = isA ? 'text-sm text-slate-400 italic' : 'text-sm text-slate-600 italic';
  const colLabel = isA
    ? 'text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-3'
    : 'text-[10px] font-bold uppercase text-slate-600 mb-3';
  const slotCorrect = isA
    ? 'border-[color:var(--d2-mint)]/50 bg-[color:var(--d2-mint)]/10'
    : 'border-emerald-300 bg-emerald-50';
  const slotWrong = isA
    ? 'border-[color:var(--d1-peach)]/50 bg-[color:var(--d1-peach)]/10'
    : 'border-amber-300 bg-amber-50';
  const slotIdle = isA
    ? 'border-white/20 bg-white/5 hover:border-[color:var(--d1-peach)]/40'
    : 'border-slate-300 bg-slate-50 hover:border-cyan-300';
  const termCls = isA ? 'font-semibold text-white mb-2' : 'font-semibold text-slate-800 mb-2';
  const defMatchedCls = isA ? 'text-xs text-slate-200 leading-normal' : 'text-xs text-slate-700 leading-normal';
  const removeBtn = isA
    ? 'mt-0.5 text-slate-500 hover:text-[color:var(--accent-rose)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)] rounded'
    : 'mt-0.5 text-slate-400 hover:text-rose-600 transition-colors';
  const placeholderCls = isA ? 'text-xs text-slate-500 italic' : 'text-xs text-slate-400 italic';
  const defDragging = isA
    ? 'bg-[color:var(--d1-peach)]/15 border border-[color:var(--d1-peach)]/50 opacity-75'
    : 'bg-cyan-50 border border-cyan-300 opacity-75';
  const defIdle = isA
    ? 'bg-white/5 border border-white/10 hover:border-[color:var(--d1-peach)]/40 hover:bg-white/10'
    : 'bg-white border border-slate-200 hover:border-cyan-300 shadow-sm';
  const defHandle = isA ? 'w-3.5 h-3.5 mt-0.5 text-slate-500 flex-shrink-0' : 'w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0';
  const defText = isA ? 'text-xs text-slate-200 leading-normal' : 'text-xs text-slate-700 leading-normal';
  const bannerCorrectCls = isA
    ? 'rounded-xl px-4 py-3 bg-[color:var(--d2-mint)]/10 border border-[color:var(--d2-mint)]/40'
    : 'rounded-lg px-4 py-3 bg-emerald-50 border border-emerald-200';
  const bannerPartialCls = isA
    ? 'rounded-xl px-4 py-3 bg-[color:var(--d1-peach)]/10 border border-[color:var(--d1-peach)]/40'
    : 'rounded-lg px-4 py-3 bg-amber-50 border border-amber-200';
  const bannerCorrectText = isA ? 'text-sm font-semibold text-[color:var(--d2-mint)]' : 'text-sm font-semibold text-emerald-700';
  const bannerPartialText = isA ? 'text-sm font-semibold text-[color:var(--d1-peach)]' : 'text-sm font-semibold text-amber-700';
  const submitActive = isA
    ? 'btn-soft-glow text-sm font-semibold'
    : 'bg-cyan-600 hover:bg-cyan-700 text-white border border-transparent';
  const submitDisabled = isA
    ? 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed';

  return (
    <div className="space-y-4">
      {prompt && (
        <p className={promptCls}>
          {prompt}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Terms (left) */}
        <div className="space-y-3">
          <p className={colLabel}>Terms</p>
          {pairs.map((pair, termIdx) => {
            const matchedDefIdx = matches.get(termIdx);
            const matchedDef = matchedDefIdx !== undefined ? definitions[matchedDefIdx] : null;
            const isCorrect =
              matchedDef && matchedDef.definition === pair.definition;

            return (
              <div
                key={termIdx}
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnTerm(termIdx)}
                className={`rounded-xl border-2 border-dashed p-3 min-h-[80px] transition-colors ${
                  matchedDefIdx !== undefined
                    ? isCorrect ? slotCorrect : slotWrong
                    : slotIdle
                }`}
              >
                <p className={termCls}>{pair.term}</p>
                {matchedDef ? (
                  <div className="flex items-start justify-between gap-2">
                    <p className={defMatchedCls}>
                      {matchedDef.definition}
                    </p>
                    <button
                      onClick={() => removePairing(termIdx)}
                      className={removeBtn}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <p className={placeholderCls}>Drag definition here</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Definitions (right) */}
        <div className="space-y-3">
          <p className={colLabel}>Definitions</p>
          <div className="space-y-2 min-h-[320px]">
            {availableDefinitions.map((def) => {
              const actualIdx = definitions.indexOf(def);
              return (
                <div
                  key={actualIdx}
                  draggable
                  onDragStart={e => handleDragStart(e, actualIdx)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl cursor-move transition-colors ${
                    draggedDefIndex === actualIdx ? defDragging : defIdle
                  }`}
                >
                  <GripVertical className={defHandle} />
                  <p className={defText}>{def.definition}</p>
                </div>
              );
            })}
            {availableDefinitions.length === 0 && (
              <p className={placeholderCls}>All definitions matched</p>
            )}
          </div>
        </div>
      </div>

      {allMatched && (
        <div className={allCorrect ? bannerCorrectCls : bannerPartialCls}>
          <p className={allCorrect ? bannerCorrectText : bannerPartialText}>
            {allCorrect ? '✓ Perfect match!' : `${correctMatches}/${pairs.length} correct — remove and retry the incorrect ones`}
          </p>
        </div>
      )}

      {onComplete && (
        <button
          onClick={() => onComplete(correctMatches)}
          disabled={!allMatched}
          className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
            allMatched ? submitActive : submitDisabled
          }`}
        >
          Complete activity
        </button>
      )}
    </div>
  );
}
