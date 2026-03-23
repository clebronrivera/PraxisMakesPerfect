// src/hooks/useSectionObserver.ts
//
// IntersectionObserver wrapper for tracking section visibility and time.
//
// Usage:
//   const { sectionRefs, maxScrollDepth } = useSectionObserver({
//     sectionCount,
//     onVisible: (index) => ...,
//     onHidden: (index) => ...,
//   });
//
//   // Attach refs: <div ref={el => sectionRefs.current[i] = el}>
//
// How it works:
//   1. Each section div gets a ref entry in sectionRefs
//   2. IntersectionObserver fires onVisible/onHidden when sections enter/leave viewport
//   3. maxScrollDepth tracks the deepest section that has been visible (0.0–1.0)
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useState } from 'react';

interface UseSectionObserverOptions {
  /** Total number of sections in the module */
  sectionCount: number;
  /** Called when a section enters the viewport */
  onVisible: (sectionIndex: number) => void;
  /** Called when a section leaves the viewport */
  onHidden: (sectionIndex: number) => void;
  /** IntersectionObserver threshold (default: 0.3 = 30% visible) */
  threshold?: number;
  /** Whether observing is enabled (default: true) */
  enabled?: boolean;
}

interface UseSectionObserverReturn {
  /** Ref array — assign each section's wrapper div: ref={el => sectionRefs.current[i] = el} */
  sectionRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  /** 0.0–1.0 representing the deepest section that entered the viewport */
  maxScrollDepth: number;
}

export function useSectionObserver({
  sectionCount,
  onVisible,
  onHidden,
  threshold = 0.3,
  enabled = true,
}: UseSectionObserverOptions): UseSectionObserverReturn {
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [maxScrollDepth, setMaxScrollDepth] = useState(0);

  // Stable callback refs to avoid re-creating observer on every render
  const onVisibleRef = useRef(onVisible);
  const onHiddenRef = useRef(onHidden);
  onVisibleRef.current = onVisible;
  onHiddenRef.current = onHidden;

  const sectionCountRef = useRef(sectionCount);
  sectionCountRef.current = sectionCount;

  useEffect(() => {
    if (!enabled || sectionCount === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLDivElement;
          const idx = parseInt(el.dataset.sectionIndex ?? '-1', 10);
          if (idx < 0) continue;

          if (entry.isIntersecting) {
            onVisibleRef.current(idx);
            // Update scroll depth based on deepest section seen
            const depth = sectionCountRef.current > 1
              ? (idx + 1) / sectionCountRef.current
              : 1;
            setMaxScrollDepth(prev => Math.max(prev, depth));
          } else {
            onHiddenRef.current(idx);
          }
        }
      },
      { threshold }
    );

    // Observe all current section refs
    const refs = sectionRefs.current;
    for (let i = 0; i < sectionCount; i++) {
      const el = refs[i];
      if (el) {
        el.dataset.sectionIndex = String(i);
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, [sectionCount, threshold, enabled]);

  return { sectionRefs, maxScrollDepth };
}
