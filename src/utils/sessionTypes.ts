/**
 * Single session model: one abstraction for in-progress and completed assessment/practice.
 * sessionStorage and userSessionStorage both use this payload shape.
 * Resume and "start new" operate on this model.
 */
import { UserResponse } from '../brain/weakness-detector';
import type { SessionAssessmentFlow } from '../types/assessment';

export type ActiveSessionStorageType = 'screener-assessment' | 'full-assessment';
export type LegacySessionStorageType = 'pre-assessment';
export type StoredSessionStorageType = ActiveSessionStorageType | LegacySessionStorageType;

export function isStoredScreenerSessionType(type: StoredSessionStorageType): boolean {
  return type === 'screener-assessment' || type === 'pre-assessment';
}

/** In-progress assessment session payload (shared by both storage modules) */
export interface SessionPayload {
  // Active writes use `screener-assessment`; `pre-assessment` is kept for resume compatibility.
  type: StoredSessionStorageType;
  assessmentFlow?: SessionAssessmentFlow;
  questionIds: string[];
  currentIndex: number;
  responses: UserResponse[];
  selectedAnswers: string[];
  showFeedback: boolean;
  confidence: 'low' | 'medium' | 'high';
  startTime: number;
  lastUpdated: number;
  totalPausedTime?: number;
  elapsedSeconds?: number;
}

/** Completed session metadata (for "view report" and listing past assessments) */
export interface CompletedSessionMeta {
  sessionId: string;
  type: StoredSessionStorageType;
  assessmentFlow?: SessionAssessmentFlow;
  questionIds: string[];
  questionCount: number;
  completedAt: number;
  completed: true;
}
