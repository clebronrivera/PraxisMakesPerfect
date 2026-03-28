/**
 * usePracticeFlow
 *
 * Owns practice-session routing state that previously lived in App.tsx:
 *   State
 *   ─────
 *   practiceDomainFilter · practiceSkillFilter · lastPracticeContext
 *
 *   Derived
 *   ───────
 *   practiceQuestions — filtered from analyzedQuestions
 *
 *   Handlers
 *   ─────────
 *   startPractice · startSkillPractice
 *   savePracticeContext · resetPracticeFilters
 *
 *   Effects
 *   ───────
 *   Load lastPracticeContext from localStorage when userId is known.
 *
 * Extracted as part of Task 1 (App.tsx prop-drill audit).
 *
 * `onNavigate` is a callback — the hook calls it when a handler needs to
 * transition the app to the 'practice' route.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { AnalyzedQuestion } from '../brain/question-analyzer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PracticeContext {
  type: 'skill' | 'domain' | 'general';
  skillId?: string;
  domainId?: number;
}

export interface UsePracticeFlowOptions {
  analyzedQuestions: AnalyzedQuestion[];
  userId: string | undefined;
  /** Called when the hook wants to navigate to the 'practice' route. */
  onNavigate: (mode: string) => void;
}

export interface UsePracticeFlowReturn {
  practiceDomainFilter: number | null;
  practiceSkillFilter: string | null;
  lastPracticeContext: PracticeContext | null;
  practiceQuestions: AnalyzedQuestion[];

  startPractice: (domainId?: number) => void;
  startSkillPractice: (skillId: string) => void;
  savePracticeContext: (ctx: PracticeContext) => void;
  /**
   * Called by onExitPractice in App.tsx — clears filters
   * and returns the mode to navigate to based on what was active.
   */
  resetPracticeFilters: () => { wasSkillPractice: boolean };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePracticeFlow({
  analyzedQuestions,
  userId,
  onNavigate,
}: UsePracticeFlowOptions): UsePracticeFlowReturn {
  const [practiceDomainFilter, setPracticeDomainFilter] = useState<number | null>(null);
  const [practiceSkillFilter, setPracticeSkillFilter] = useState<string | null>(null);
  const [lastPracticeContext, setLastPracticeContext] = useState<PracticeContext | null>(null);

  // Restore last practice context from localStorage when the user is known.
  useEffect(() => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(`pmp-practice-context-${userId}`);
      if (stored) setLastPracticeContext(JSON.parse(stored) as PracticeContext);
    } catch {
      // Ignore corrupt data.
    }
  }, [userId]);

  // Derived: filter the full question bank by current practice mode.
  const practiceQuestions = useMemo(() => {
    if (practiceSkillFilter) {
      return analyzedQuestions.filter(q => q.skillId === practiceSkillFilter);
    }
    if (practiceDomainFilter === null) {
      return analyzedQuestions;
    }
    return analyzedQuestions.filter(q => (q.domains || []).includes(practiceDomainFilter!));
  }, [analyzedQuestions, practiceDomainFilter, practiceSkillFilter]);

  // ── savePracticeContext ───────────────────────────────────────────────────
  const savePracticeContext = useCallback(
    (ctx: PracticeContext) => {
      setLastPracticeContext(ctx);
      if (userId) {
        try {
          localStorage.setItem(`pmp-practice-context-${userId}`, JSON.stringify(ctx));
        } catch {
          // Ignore storage errors.
        }
      }
    },
    [userId],
  );

  // ── startPractice ─────────────────────────────────────────────────────────
  const startPractice = useCallback(
    (domainId?: number) => {
      setPracticeSkillFilter(null);
      setPracticeDomainFilter(domainId ?? null);
      savePracticeContext(domainId ? { type: 'domain', domainId } : { type: 'general' });
      onNavigate('practice');
    },
    [onNavigate, savePracticeContext],
  );

  // ── startSkillPractice ────────────────────────────────────────────────────
  const startSkillPractice = useCallback(
    (skillId: string) => {
      setPracticeDomainFilter(null);
      setPracticeSkillFilter(skillId);
      savePracticeContext({ type: 'skill', skillId });
      onNavigate('practice');
    },
    [onNavigate, savePracticeContext],
  );

  // ── resetPracticeFilters ──────────────────────────────────────────────────
  // Returns the flags App.tsx needs to decide the exit-navigation target.
  const resetPracticeFilters = useCallback((): {
    wasSkillPractice: boolean;
  } => {
    const wasSkillPractice = Boolean(practiceSkillFilter);
    setPracticeDomainFilter(null);
    setPracticeSkillFilter(null);
    return { wasSkillPractice };
  }, [practiceSkillFilter]);

  return {
    practiceDomainFilter,
    practiceSkillFilter,
    lastPracticeContext,
    practiceQuestions,
    startPractice,
    startSkillPractice,
    savePracticeContext,
    resetPracticeFilters,
  };
}
