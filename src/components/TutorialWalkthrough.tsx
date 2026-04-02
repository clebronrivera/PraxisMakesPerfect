// src/components/TutorialWalkthrough.tsx
// Full-screen modal walkthrough triggered after onboarding or from Help page.

import { useState, useCallback } from 'react';
import {
  X, ChevronLeft, ChevronRight,
  Sparkles, ClipboardCheck, LayoutDashboard, Dumbbell,
  Bot, TrendingUp, BookOpen, RotateCcw,
  Target, GitBranch, Gauge, PauseCircle, Rocket,
} from 'lucide-react';
import { TUTORIAL_SLIDES, DIAGNOSTIC_TUTORIAL_SLIDES } from '../data/tutorial-slides';
import type { TutorialSlide } from '../data/tutorial-slides';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Sparkles, ClipboardCheck, LayoutDashboard, Dumbbell,
  Bot, TrendingUp, BookOpen, RotateCcw,
  Target, GitBranch, Gauge, PauseCircle, Rocket,
};

const GRADIENT_CLASSES = [
  'from-violet-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-purple-600',
  'from-sky-500 to-cyan-600',
  'from-orange-500 to-red-600',
];

interface TutorialWalkthroughProps {
  onDismiss: () => void;
  variant?: 'full' | 'diagnostic';
}

export default function TutorialWalkthrough({ onDismiss, variant = 'full' }: TutorialWalkthroughProps) {
  const slides: TutorialSlide[] = variant === 'diagnostic' ? DIAGNOSTIC_TUTORIAL_SLIDES : TUTORIAL_SLIDES;
  const [currentIndex, setCurrentIndex] = useState(0);
  const slide = slides[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === slides.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onDismiss();
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [isLast, onDismiss]);

  const goPrev = useCallback(() => {
    if (!isFirst) setCurrentIndex(i => i - 1);
  }, [isFirst]);

  const IconComponent = ICON_MAP[slide.icon] || Sparkles;
  const gradientClass = GRADIENT_CLASSES[currentIndex % GRADIENT_CLASSES.length];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg animate-fade-in">
        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Gradient header */}
          <div className={`relative flex h-48 items-center justify-center bg-gradient-to-br ${gradientClass}`}>
            <IconComponent className="h-20 w-20 text-white/90" />
            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label="Close tutorial"
            >
              <X className="h-4 w-4" />
            </button>
            {/* Slide counter */}
            <span className="absolute bottom-3 right-4 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
              {currentIndex + 1} / {slides.length}
            </span>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 pt-5">
            <h2 className="text-xl font-bold text-slate-900">{slide.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{slide.description}</p>

            <ul className="mt-4 space-y-2">
              {slide.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br ${gradientClass}`} />
                  {h}
                </li>
              ))}
            </ul>

            {/* Dot indicators */}
            <div className="mt-5 flex items-center justify-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    i === currentIndex ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={isFirst}
                className={`flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isFirst
                    ? 'cursor-not-allowed text-slate-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <button
                onClick={onDismiss}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Skip tour
              </button>

              <button
                onClick={goNext}
                className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                {isLast ? 'Get Started' : 'Next'}
                {!isLast && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
