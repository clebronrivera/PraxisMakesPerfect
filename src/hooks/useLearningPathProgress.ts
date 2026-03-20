// src/hooks/useLearningPathProgress.ts
//
// Tracks per-user Learning Path progress in localStorage.
//
// Data stored:
//   viewedModules   — Record<moduleId, boolean>    — user has marked module as viewed
//   moduleSeconds   — Record<moduleId, number>     — cumulative seconds spent in a module
//   moduleOpenedAt  — Record<moduleId, number>     — unix ms when module was last opened
//                                                    (used to compute elapsed time on close)
//
// Storage key format: "pmp-lp-{userId}" so each user's progress is isolated.
// These are purely local — they do not sync to Supabase.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react';

export interface LearningPathProgressData {
  /** moduleId → true if user has checked off the lesson */
  viewedModules: Record<string, boolean>;
  /** moduleId → cumulative seconds spent inside the lesson viewer */
  moduleSeconds: Record<string, number>;
}

interface StoredData extends LearningPathProgressData {
  /** moduleId → unix ms when user last opened this module (transient; for in-progress timing) */
  moduleOpenedAt: Record<string, number>;
}

function storageKey(userId: string): string {
  return `pmp-lp-${userId}`;
}

function loadData(userId: string): StoredData {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { viewedModules: {}, moduleSeconds: {}, moduleOpenedAt: {} };
    return JSON.parse(raw) as StoredData;
  } catch {
    return { viewedModules: {}, moduleSeconds: {}, moduleOpenedAt: {} };
  }
}

function saveData(userId: string, data: StoredData): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {
    // localStorage may be unavailable in some environments; fail silently
  }
}

export interface UseLearningPathProgressReturn {
  /** True if a given module has been marked as viewed */
  isViewed: (moduleId: string) => boolean;
  /** Mark a module as viewed (or unmark) */
  setViewed: (moduleId: string, viewed: boolean) => void;
  /** Total seconds spent in a module */
  getSecondsSpent: (moduleId: string) => number;
  /** Call when user opens a module lesson */
  onOpenModule: (moduleId: string) => void;
  /** Call when user closes a module lesson — records elapsed time */
  onCloseModule: (moduleId: string) => void;
  /** Total number of modules marked as viewed */
  totalViewed: number;
  /** Raw data (for stats display) */
  data: LearningPathProgressData;
}

export function useLearningPathProgress(userId: string | null): UseLearningPathProgressReturn {
  const [data, setData] = useState<StoredData>(() =>
    userId ? loadData(userId) : { viewedModules: {}, moduleSeconds: {}, moduleOpenedAt: {} }
  );

  // Re-load if user changes
  useEffect(() => {
    if (userId) {
      setData(loadData(userId));
    } else {
      setData({ viewedModules: {}, moduleSeconds: {}, moduleOpenedAt: {} });
    }
  }, [userId]);

  const persist = useCallback((next: StoredData) => {
    if (!userId) return;
    setData(next);
    saveData(userId, next);
  }, [userId]);

  const isViewed = useCallback((moduleId: string) => !!data.viewedModules[moduleId], [data]);

  const setViewed = useCallback((moduleId: string, viewed: boolean) => {
    persist({
      ...data,
      viewedModules: { ...data.viewedModules, [moduleId]: viewed },
    });
  }, [data, persist]);

  const getSecondsSpent = useCallback((moduleId: string) => data.moduleSeconds[moduleId] ?? 0, [data]);

  const onOpenModule = useCallback((moduleId: string) => {
    persist({
      ...data,
      moduleOpenedAt: { ...data.moduleOpenedAt, [moduleId]: Date.now() },
    });
  }, [data, persist]);

  const onCloseModule = useCallback((moduleId: string) => {
    const openedAt = data.moduleOpenedAt[moduleId];
    if (!openedAt) return;
    const elapsedSeconds = Math.floor((Date.now() - openedAt) / 1000);
    const prev = data.moduleSeconds[moduleId] ?? 0;
    persist({
      ...data,
      moduleSeconds: { ...data.moduleSeconds, [moduleId]: prev + elapsedSeconds },
      moduleOpenedAt: { ...data.moduleOpenedAt, [moduleId]: 0 },
    });
  }, [data, persist]);

  const totalViewed = Object.values(data.viewedModules).filter(Boolean).length;

  return {
    isViewed,
    setViewed,
    getSecondsSpent,
    onOpenModule,
    onCloseModule,
    totalViewed,
    data: { viewedModules: data.viewedModules, moduleSeconds: data.moduleSeconds },
  };
}
