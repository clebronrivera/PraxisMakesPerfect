// src/hooks/useModuleVisitTracking.ts
//
// Manages a single module visit session lifecycle:
//   1. On mount → creates a module_visit_sessions row, increments visit_count
//   2. During visit → accepts section visibility + interactive completion events
//   3. Batches writes → flushes section data every 15 s
//   4. On unmount → final flush (duration, scroll depth, sections visible)
//
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InteractiveType =
  | 'scenario-sorter'
  | 'drag-to-order'
  | 'term-matcher'
  | 'click-selector'
  | 'card-flip';

export interface InteractiveResult {
  interactiveType: InteractiveType;
  /** 0.0–1.0 */
  score: number;
  completed: boolean;
  attempts: number;
  data: Record<string, unknown>;
}

export interface UseModuleVisitTrackingReturn {
  /** UUID of the visit session row (null until created) */
  visitSessionId: string | null;
  /** Call when a section enters the viewport */
  reportSectionVisible: (sectionIndex: number, sectionType: string, interactiveType?: string) => void;
  /** Call when a section leaves the viewport */
  reportSectionHidden: (sectionIndex: number) => void;
  /** Call when an interactive exercise is completed */
  reportInteractiveComplete: (sectionIndex: number, result: InteractiveResult) => void;
  /** Update max scroll depth (0.0–1.0) */
  reportScrollDepth: (pct: number) => void;
}

interface SectionState {
  sectionIndex: number;
  sectionType: string;
  interactiveType?: string;
  becameVisible: boolean;
  visibleSince: number | null; // timestamp when became visible (null = not currently visible)
  cumulativeSeconds: number;
  exerciseCompleted?: boolean;
  exerciseScore?: number;
  exerciseAttempts: number;
  exerciseData?: Record<string, unknown>;
  dirty: boolean; // needs flush to DB
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useModuleVisitTracking(
  userId: string | null,
  moduleId: string | null,
  skillId: string | null,
  source: 'learning_path' | 'skill_help_drawer' = 'learning_path'
): UseModuleVisitTrackingReturn {

  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);
  const sectionsRef = useRef<Map<number, SectionState>>(new Map());
  const visibleSetRef = useRef<Set<number>>(new Set()); // indices currently visible
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmountedRef = useRef(false);

  // ── Create visit session on mount ───────────────────────────────────────
  useEffect(() => {
    if (!userId || !moduleId || !skillId) return;
    unmountedRef.current = false;
    startTimeRef.current = Date.now();
    scrollDepthRef.current = 0;
    sectionsRef.current = new Map();
    visibleSetRef.current = new Set();

    // 1. Count existing visits
    (async () => {
      const { count } = await supabase
        .from('module_visit_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('module_id', moduleId);

      const visitNumber = (count ?? 0) + 1;

      // 2. Create new session row
      const { data, error } = await supabase
        .from('module_visit_sessions')
        .insert({
          user_id: userId,
          module_id: moduleId,
          skill_id: skillId,
          visit_number: visitNumber,
          source,
        })
        .select('id')
        .single();

      if (!error && data) {
        sessionIdRef.current = data.id;
      }

      // 3. Increment visit_count + update last_visited_at on learning_path_progress
      await supabase
        .from('learning_path_progress')
        .upsert(
          {
            user_id: userId,
            skill_id: skillId,
            visit_count: visitNumber,
            last_visited_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,skill_id' }
        );
    })();

    // 4. Start periodic flush (every 15 s)
    flushTimerRef.current = setInterval(() => {
      flushSections(userId);
    }, 15_000);

    return () => {
      unmountedRef.current = true;
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      // Final flush on unmount
      finalizeVisit(userId, moduleId, skillId);
    };
  }, [userId, moduleId, skillId, source]);

  // ── Flush dirty sections to Supabase ────────────────────────────────────
  const flushSections = useCallback(async (uid: string) => {
    const sid = sessionIdRef.current;
    if (!sid || !uid) return;

    const toFlush: SectionState[] = [];
    sectionsRef.current.forEach((state) => {
      if (state.dirty) {
        // Snapshot cumulative time (add currently-visible elapsed)
        if (state.visibleSince) {
          state.cumulativeSeconds += (Date.now() - state.visibleSince) / 1000;
          state.visibleSince = Date.now(); // reset for next flush
        }
        toFlush.push({ ...state });
        state.dirty = false;
      }
    });

    if (toFlush.length === 0) return;

    // Upsert section_interactions rows
    const rows = toFlush.map((s) => ({
      user_id: uid,
      visit_session_id: sid,
      module_id: moduleId!,
      section_index: s.sectionIndex,
      section_type: s.sectionType,
      interactive_type: s.interactiveType ?? null,
      became_visible: s.becameVisible,
      visible_seconds: Math.round(s.cumulativeSeconds * 10) / 10,
      exercise_completed: s.exerciseCompleted ?? null,
      exercise_score: s.exerciseScore ?? null,
      exercise_attempts: s.exerciseAttempts,
      exercise_data: s.exerciseData ?? null,
      updated_at: new Date().toISOString(),
    }));

    await supabase.from('section_interactions').upsert(rows, {
      onConflict: 'visit_session_id,section_index',
      ignoreDuplicates: false,
    });
  }, [moduleId]);

  // ── Finalize visit session on unmount ───────────────────────────────────
  const finalizeVisit = useCallback(async (uid: string, _modId: string, skId: string) => {
    // Final section flush
    await flushSections(uid);

    const sid = sessionIdRef.current;
    if (!sid) return;

    const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const sectionsVisible = Array.from(
      new Set(
        Array.from(sectionsRef.current.values())
          .filter(s => s.becameVisible)
          .map(s => String(s.sectionIndex))
      )
    );

    await supabase
      .from('module_visit_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        scroll_depth_pct: Math.round(scrollDepthRef.current * 100) / 100,
        sections_visible: sectionsVisible,
      })
      .eq('id', sid);

    // Update interactive aggregates on learning_path_progress
    const interactives = Array.from(sectionsRef.current.values())
      .filter(s => s.sectionType === 'interactive' && s.exerciseCompleted != null);

    if (interactives.length > 0) {
      const completed = interactives.filter(s => s.exerciseCompleted).length;
      const totalScore = interactives
        .filter(s => s.exerciseCompleted && s.exerciseScore != null)
        .reduce((sum, s) => sum + (s.exerciseScore ?? 0), 0);
      const scoredCount = interactives.filter(s => s.exerciseCompleted && s.exerciseScore != null).length;
      const avgScore = scoredCount > 0 ? totalScore / scoredCount : null;

      await supabase
        .from('learning_path_progress')
        .upsert(
          {
            user_id: uid,
            skill_id: skId,
            interactive_exercises_completed: completed,
            interactive_exercises_total: interactives.length,
            total_interactive_score: avgScore,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,skill_id' }
        );
    }

    sessionIdRef.current = null;
  }, [flushSections]);

  // ── Public API ──────────────────────────────────────────────────────────

  const reportSectionVisible = useCallback((sectionIndex: number, sectionType: string, interactiveType?: string) => {
    visibleSetRef.current.add(sectionIndex);
    const existing = sectionsRef.current.get(sectionIndex);
    if (existing) {
      if (!existing.visibleSince) {
        existing.visibleSince = Date.now();
      }
      existing.becameVisible = true;
      existing.dirty = true;
    } else {
      sectionsRef.current.set(sectionIndex, {
        sectionIndex,
        sectionType,
        interactiveType,
        becameVisible: true,
        visibleSince: Date.now(),
        cumulativeSeconds: 0,
        exerciseAttempts: 0,
        dirty: true,
      });
    }
  }, []);

  const reportSectionHidden = useCallback((sectionIndex: number) => {
    visibleSetRef.current.delete(sectionIndex);
    const existing = sectionsRef.current.get(sectionIndex);
    if (existing && existing.visibleSince) {
      existing.cumulativeSeconds += (Date.now() - existing.visibleSince) / 1000;
      existing.visibleSince = null;
      existing.dirty = true;
    }
  }, []);

  const reportInteractiveComplete = useCallback((sectionIndex: number, result: InteractiveResult) => {
    const existing = sectionsRef.current.get(sectionIndex);
    if (existing) {
      existing.exerciseCompleted = result.completed;
      existing.exerciseScore = result.score;
      existing.exerciseAttempts = result.attempts;
      existing.exerciseData = result.data;
      existing.dirty = true;
    } else {
      sectionsRef.current.set(sectionIndex, {
        sectionIndex,
        sectionType: 'interactive',
        interactiveType: result.interactiveType,
        becameVisible: true,
        visibleSince: null,
        cumulativeSeconds: 0,
        exerciseCompleted: result.completed,
        exerciseScore: result.score,
        exerciseAttempts: result.attempts,
        exerciseData: result.data,
        dirty: true,
      });
    }
  }, []);

  const reportScrollDepth = useCallback((pct: number) => {
    if (pct > scrollDepthRef.current) {
      scrollDepthRef.current = pct;
    }
  }, []);

  return {
    visitSessionId: sessionIdRef.current,
    reportSectionVisible,
    reportSectionHidden,
    reportInteractiveComplete,
    reportScrollDepth,
  };
}
