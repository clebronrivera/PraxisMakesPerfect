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
}

/**
 * TermMatcher: Drag definitions to match with terms
 * Used for: Vocabulary matching, term to concept pairing, assessment terminology
 */
export default function TermMatcher({
  pairs,
  prompt,
  onComplete,
}: TermMatcherProps) {
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

  return (
    <div className="space-y-4">
      {prompt && (
        <p className="text-sm text-slate-600 italic">
          {prompt}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Terms (left) */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase text-slate-600 mb-3">Terms</p>
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
                className={`rounded-lg border-2 border-dashed p-3 min-h-[80px] transition-colors ${
                  matchedDefIdx !== undefined
                    ? isCorrect
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-amber-300 bg-amber-50'
                    : 'border-slate-300 bg-slate-50 hover:border-cyan-300'
                }`}
              >
                <p className="font-semibold text-slate-800 mb-2">{pair.term}</p>
                {matchedDef ? (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-700 leading-normal">
                      {matchedDef.definition}
                    </p>
                    <button
                      onClick={() => removePairing(termIdx)}
                      className="mt-0.5 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Drag definition here</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Definitions (right) */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase text-slate-600 mb-3">Definitions</p>
          <div className="space-y-2 min-h-[320px]">
            {availableDefinitions.map((def) => {
              const actualIdx = definitions.indexOf(def);
              return (
                <div
                  key={actualIdx}
                  draggable
                  onDragStart={e => handleDragStart(e, actualIdx)}
                  className={`flex items-start gap-2.5 p-3 rounded-lg cursor-move transition-colors ${
                    draggedDefIndex === actualIdx
                      ? 'bg-cyan-50 border border-cyan-300 opacity-75'
                      : 'bg-white border border-slate-200 hover:border-cyan-300 shadow-sm'
                  }`}
                >
                  <GripVertical className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                  <p className="text-xs text-slate-700 leading-normal">{def.definition}</p>
                </div>
              );
            })}
            {availableDefinitions.length === 0 && (
              <p className="text-xs text-slate-400 italic">All definitions matched</p>
            )}
          </div>
        </div>
      </div>

      {allMatched && (
        <div className={`rounded-lg px-4 py-3 ${
          allCorrect
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <p className={`text-sm font-semibold ${
            allCorrect ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {allCorrect ? '✓ Perfect match!' : `${correctMatches}/${pairs.length} correct — remove and retry the incorrect ones`}
          </p>
        </div>
      )}

      {onComplete && (
        <button
          onClick={() => onComplete(correctMatches)}
          disabled={!allMatched}
          className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
            allMatched
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white border border-transparent'
              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Complete activity
        </button>
      )}
    </div>
  );
}
