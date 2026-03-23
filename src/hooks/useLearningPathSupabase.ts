// src/hooks/useLearningPathSupabase.ts
//
// Supabase-backed learning path progress hook.
//
// Tracks per-user, per-skill Learning Path activity in the
// `learning_path_progress` table (see migration 0003).
//
// ─── Status derivation rules ──────────────────────────────────────────────────
//   not_started   — lesson has never been viewed
//   emerging      — lesson viewed but questions not yet submitted OR accuracy < 60%
//   approaching   — questions submitted, 60% ≤ accuracy < 80%
//   demonstrating — questions submitted, accuracy ≥ 80%
//   mastered      — demonstrating on two or more separate sessions
//                   (tracked via questions_submitted count; app sets this explicitly)
//
// ─── Relationship to skill_scores ─────────────────────────────────────────────
//   This table is separate from user_progress.skill_scores.
//   When the user submits practice questions via the Module page (Section 2),
//   the caller should ALSO invoke updateSkillProgress() to keep skill_scores
//   in sync. This hook does NOT modify user_progress directly.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LearningPathStatus =
  | 'not_started'
  | 'emerging'
  | 'approaching'
  | 'demonstrating'
  | 'mastered';

export interface LearningPathSkillRecord {
  skillId: string;
  lessonViewed: boolean;
  timeSpentSeconds: number;
  lessonCompletedAt: string | null;
  questionsSubmitted: boolean;
  questionsCorrect: number;
  questionsTotal: number;
  accuracy: number | null;
  status: LearningPathStatus;
}

export type LearningPathProgressMap = Record<string, LearningPathSkillRecord>;

// ─── Status derivation helper ─────────────────────────────────────────────────

export function deriveLearningPathStatus(
  lessonViewed: boolean,
  questionsSubmitted: boolean,
  accuracy: number | null,
  currentStatus: LearningPathStatus
): LearningPathStatus {
  if (!lessonViewed) return 'not_started';
  if (!questionsSubmitted || accuracy === null) return 'emerging';
  if (accuracy >= 0.8) {
    // Preserve mastered if already set
    return currentStatus === 'mastered' ? 'mastered' : 'demonstrating';
  }
  if (accuracy >= 0.6) return 'approaching';
  return 'emerging';
}

// ─── DB row shape ─────────────────────────────────────────────────────────────

interface DbRow {
  skill_id: string;
  lesson_viewed: boolean;
  time_spent_seconds: number;
  lesson_completed_at: string | null;
  questions_submitted: boolean;
  questions_correct: number;
  questions_total: number;
  accuracy: number | null;
  status: string;
}

function rowToRecord(row: DbRow): LearningPathSkillRecord {
  return {
    skillId: row.skill_id,
    lessonViewed: row.lesson_viewed,
    timeSpentSeconds: row.time_spent_seconds,
    lessonCompletedAt: row.lesson_completed_at,
    questionsSubmitted: row.questions_submitted,
    questionsCorrect: row.questions_correct,
    questionsTotal: row.questions_total,
    accuracy: row.accuracy,
    status: row.status as LearningPathStatus,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseLearningPathSupabaseReturn {
  /** All progress records keyed by skillId. Empty until loaded. */
  progress: LearningPathProgressMap;
  loading: boolean;
  error: string | null;

  /** Get the record for a single skill (or a default not_started record). */
  getSkillRecord: (skillId: string) => LearningPathSkillRecord;

  /** Mark the lesson for a skill as complete. Records elapsed seconds. */
  markLessonComplete: (skillId: string, elapsedSeconds: number) => Promise<void>;

  /** Add incremental seconds to time_spent for a skill (called periodically during reading). */
  addTimeSpent: (skillId: string, seconds: number) => Promise<void>;

  /** Submit practice question results for a skill, optionally blended with interactive exercise scores. */
  submitQuestions: (
    skillId: string,
    correct: number,
    total: number,
    interactiveScore?: { score: number; count: number }
  ) => Promise<void>;

  /** Explicitly promote a skill to mastered (e.g. after second demonstrating session). */
  markMastered: (skillId: string) => Promise<void>;
}

function defaultRecord(skillId: string): LearningPathSkillRecord {
  return {
    skillId,
    lessonViewed: false,
    timeSpentSeconds: 0,
    lessonCompletedAt: null,
    questionsSubmitted: false,
    questionsCorrect: 0,
    questionsTotal: 0,
    accuracy: null,
    status: 'not_started',
  };
}

export function useLearningPathSupabase(
  userId: string | null
): UseLearningPathSupabaseReturn {
  const [progress, setProgress] = useState<LearningPathProgressMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track pending time additions to batch writes
  const pendingSecondsRef = useRef<Record<string, number>>({});
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load all progress on mount / user change ────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setProgress({});
      return;
    }

    setLoading(true);
    supabase
      .from('learning_path_progress')
      .select('*')
      .eq('user_id', userId)
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
        } else if (data) {
          const map: LearningPathProgressMap = {};
          for (const row of data as DbRow[]) {
            map[row.skill_id] = rowToRecord(row);
          }
          setProgress(map);
        }
        setLoading(false);
      });
  }, [userId]);

  // ── Upsert helper ──────────────────────────────────────────────────────────
  const upsert = useCallback(
    async (skillId: string, patch: Partial<Omit<DbRow, 'skill_id'>>): Promise<void> => {
      if (!userId) return;
      const { error: err } = await supabase
        .from('learning_path_progress')
        .upsert(
          { user_id: userId, skill_id: skillId, ...patch, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,skill_id' }
        );
      if (err) {
        setError(err.message);
        console.error('[useLearningPathSupabase] upsert error:', err);
      }
    },
    [userId]
  );

  // ── getSkillRecord ─────────────────────────────────────────────────────────
  const getSkillRecord = useCallback(
    (skillId: string): LearningPathSkillRecord =>
      progress[skillId] ?? defaultRecord(skillId),
    [progress]
  );

  // ── markLessonComplete ────────────────────────────────────────────────────
  const markLessonComplete = useCallback(
    async (skillId: string, elapsedSeconds: number): Promise<void> => {
      const existing = progress[skillId] ?? defaultRecord(skillId);
      const totalSeconds = existing.timeSpentSeconds + elapsedSeconds;
      const nextStatus = deriveLearningPathStatus(
        true,
        existing.questionsSubmitted,
        existing.accuracy,
        existing.status
      );

      const updated: LearningPathSkillRecord = {
        ...existing,
        lessonViewed: true,
        timeSpentSeconds: totalSeconds,
        lessonCompletedAt: new Date().toISOString(),
        status: nextStatus,
      };

      // Optimistic local update
      setProgress(prev => ({ ...prev, [skillId]: updated }));

      await upsert(skillId, {
        lesson_viewed: true,
        time_spent_seconds: totalSeconds,
        lesson_completed_at: updated.lessonCompletedAt,
        status: nextStatus,
      });
    },
    [progress, upsert]
  );

  // ── addTimeSpent — batched with 30 s flush ────────────────────────────────
  const addTimeSpent = useCallback(
    async (skillId: string, seconds: number): Promise<void> => {
      if (!userId || seconds <= 0) return;

      // Accumulate locally first
      pendingSecondsRef.current[skillId] =
        (pendingSecondsRef.current[skillId] ?? 0) + seconds;

      // Optimistic update to local state
      setProgress(prev => {
        const existing = prev[skillId] ?? defaultRecord(skillId);
        return {
          ...prev,
          [skillId]: {
            ...existing,
            timeSpentSeconds: existing.timeSpentSeconds + seconds,
          },
        };
      });

      // Debounce: flush to Supabase after 30 s of no new additions
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = setTimeout(async () => {
        const pending = { ...pendingSecondsRef.current };
        pendingSecondsRef.current = {};
        for (const [sid, secs] of Object.entries(pending)) {
          if (secs > 0) {
            await upsert(sid, {
              time_spent_seconds: (progress[sid]?.timeSpentSeconds ?? 0) + secs,
            });
          }
        }
      }, 30_000);
    },
    [userId, progress, upsert]
  );

  // ── submitQuestions ───────────────────────────────────────────────────────
  // Supports blended accuracy: 70% quiz weight + 30% interactive weight.
  // If no interactive scores provided, uses quiz accuracy alone.
  const submitQuestions = useCallback(
    async (
      skillId: string,
      correct: number,
      total: number,
      interactiveScore?: { score: number; count: number }
    ): Promise<void> => {
      if (!userId) return;
      const existing = progress[skillId] ?? defaultRecord(skillId);
      const quizAccuracy = total > 0 ? correct / total : null;

      // Blend quiz + interactive scores when both available
      let blendedAccuracy: number | null;
      if (quizAccuracy !== null && interactiveScore && interactiveScore.count > 0) {
        blendedAccuracy = quizAccuracy * 0.7 + interactiveScore.score * 0.3;
      } else {
        blendedAccuracy = quizAccuracy;
      }

      const nextStatus = deriveLearningPathStatus(
        existing.lessonViewed,
        true,
        blendedAccuracy,
        existing.status
      );

      const updated: LearningPathSkillRecord = {
        ...existing,
        questionsSubmitted: true,
        questionsCorrect: correct,
        questionsTotal: total,
        accuracy: blendedAccuracy,
        status: nextStatus,
      };

      setProgress(prev => ({ ...prev, [skillId]: updated }));

      const patch: Record<string, unknown> = {
        questions_submitted: true,
        questions_correct: correct,
        questions_total: total,
        accuracy: blendedAccuracy,
        status: nextStatus,
      };

      // Also persist interactive aggregates if provided
      if (interactiveScore && interactiveScore.count > 0) {
        patch.total_interactive_score = interactiveScore.score;
        patch.interactive_exercises_completed = interactiveScore.count;
      }

      await upsert(skillId, patch);
    },
    [userId, progress, upsert]
  );

  // ── markMastered ──────────────────────────────────────────────────────────
  const markMastered = useCallback(
    async (skillId: string): Promise<void> => {
      if (!userId) return;
      const existing = progress[skillId] ?? defaultRecord(skillId);
      const updated = { ...existing, status: 'mastered' as LearningPathStatus };
      setProgress(prev => ({ ...prev, [skillId]: updated }));
      await upsert(skillId, { status: 'mastered' });
    },
    [userId, progress, upsert]
  );

  return {
    progress,
    loading,
    error,
    getSkillRecord,
    markLessonComplete,
    addTimeSpent,
    submitQuestions,
    markMastered,
  };
}
