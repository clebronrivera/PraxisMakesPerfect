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
        <p className="text-sm text-slate-300 italic">
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
              className={`relative w-full h-full transition-transform duration-500 transform-gpu ${
                flipped.has(card.id) ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped.has(card.id) ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <div
                className="absolute w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/30 rounded-xl p-4 flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-lg font-bold text-cyan-300 mb-2">{card.front}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Click to reveal</p>
              </div>

              {/* Back */}
              <div
                className="absolute w-full h-full bg-gradient-to-br from-emerald-900/30 to-slate-900 border-2 border-emerald-500/30 rounded-xl p-4 flex items-center justify-center"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-sm text-emerald-300 leading-relaxed text-center">{card.back}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {allRevealed && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <p className="text-sm text-emerald-300 font-semibold">✓ You've reviewed all cards</p>
        </div>
      )}
    </div>
  );
}
