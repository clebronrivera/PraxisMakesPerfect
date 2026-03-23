import { useState, useEffect, useRef } from 'react';

interface Card {
  id: string;
  front: string;
  back: string;
}

interface CardFlipProps {
  cards: Card[];
  prompt?: string;
  onComplete?: (result: { flipped: number; total: number }) => void;
}

/**
 * CardFlip: Reveal-on-click cards
 * Used for: True/False, vocabulary definitions, terminology flash cards
 */
export default function CardFlip({ cards, prompt, onComplete }: CardFlipProps) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  const toggleFlip = (id: string) => {
    const newFlipped = new Set(flipped);
    if (newFlipped.has(id)) {
      newFlipped.delete(id);
    } else {
      newFlipped.add(id);
    }
    setFlipped(newFlipped);
  };

  const allRevealed = flipped.size === cards.length;
  const firedRef = useRef(false);

  useEffect(() => {
    if (allRevealed && !firedRef.current && onComplete) {
      firedRef.current = true;
      onComplete({ flipped: flipped.size, total: cards.length });
    }
  }, [allRevealed, onComplete, flipped.size, cards.length]);

  return (
    <div className="space-y-4">
      {prompt && (
        <p className="text-sm text-slate-600 italic">
          {prompt}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => toggleFlip(card.id)}
            className="relative h-32 perspective cursor-pointer"
          >
            <div
              className="relative w-full h-full transition-transform duration-500 transform-gpu"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped.has(card.id) ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <div
                className="absolute w-full h-full bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-lg font-bold text-slate-800 mb-2">{card.front}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Click to reveal</p>
              </div>

              {/* Back */}
              <div
                className="absolute w-full h-full bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 flex items-center justify-center shadow-sm"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-sm text-emerald-800 leading-normal text-center">{card.back}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {allRevealed && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
          <p className="text-sm text-emerald-700 font-semibold">✓ You've reviewed all cards</p>
        </div>
      )}
    </div>
  );
}
