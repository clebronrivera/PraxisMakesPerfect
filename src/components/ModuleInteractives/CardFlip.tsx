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
  variant?: 'atelier' | 'editorial';
}

/**
 * CardFlip: Reveal-on-click cards
 * Used for: True/False, vocabulary definitions, terminology flash cards
 */
export default function CardFlip({ cards, prompt, onComplete, variant = 'editorial' }: CardFlipProps) {
  const isA = variant === 'atelier';
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

  const promptCls = isA ? 'text-sm text-slate-400 italic' : 'text-sm text-slate-600 italic';
  const frontCls = isA
    ? 'absolute w-full h-full bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center backdrop-blur-[14px]'
    : 'absolute w-full h-full bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm';
  const frontTitle = isA ? 'text-lg font-bold text-white mb-2' : 'text-lg font-bold text-slate-800 mb-2';
  const frontHint = isA
    ? 'text-[10px] text-slate-500 uppercase tracking-wide'
    : 'text-[10px] text-slate-400 uppercase tracking-wide';
  const backCls = isA
    ? 'absolute w-full h-full bg-[color:var(--d2-mint)]/10 border border-[color:var(--d2-mint)]/40 rounded-xl p-4 flex items-center justify-center backdrop-blur-[14px]'
    : 'absolute w-full h-full bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 flex items-center justify-center shadow-sm';
  const backText = isA ? 'text-sm text-white leading-normal text-center' : 'text-sm text-emerald-800 leading-normal text-center';
  const doneCls = isA
    ? 'rounded-xl bg-[color:var(--d2-mint)]/10 border border-[color:var(--d2-mint)]/40 px-4 py-3'
    : 'rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3';
  const doneText = isA ? 'text-sm font-semibold text-[color:var(--d2-mint)]' : 'text-sm text-emerald-700 font-semibold';

  return (
    <div className="space-y-4">
      {prompt && (
        <p className={promptCls}>
          {prompt}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => toggleFlip(card.id)}
            className="relative h-32 perspective cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)] rounded-xl"
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
                className={frontCls}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className={frontTitle}>{card.front}</p>
                <p className={frontHint}>Click to reveal</p>
              </div>

              {/* Back */}
              <div
                className={backCls}
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className={backText}>{card.back}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {allRevealed && (
        <div className={doneCls}>
          <p className={doneText}>✓ You've reviewed all cards</p>
        </div>
      )}
    </div>
  );
}
