/**
 * Single session model: one abstraction for in-progress and completed assessment/practice.
 * sessionStorage and userSessionStorage both use this payload shape.
 * Resume and "start new" operate on this model.
 */
import { UserResponse } from '../brain/weakness-detector';

/** In-progress assessment session payload (shared by both storage modules) */
export interface SessionPayload {
  type: 'pre-assessment' | 'full-assessment';
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
  type: 'pre-assessment' | 'full-assessment';
  questionIds: string[];
  questionCount: number;
  completedAt: number;
  completed: true;
}
