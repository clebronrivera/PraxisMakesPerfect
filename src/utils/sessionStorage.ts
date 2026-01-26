import { UserResponse } from '../brain/weakness-detector';

export interface AssessmentSession {
  type: 'pre-assessment' | 'full-assessment';
  questionIds: string[];
  currentIndex: number;
  responses: UserResponse[];
  selectedAnswers: string[];
  showFeedback: boolean;
  confidence: 'low' | 'medium' | 'high';
  startTime: number;
  lastUpdated: number;
}

const SESSION_KEY = 'praxis-assessment-session';

export function saveSession(session: AssessmentSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

export function loadSession(): AssessmentSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AssessmentSession;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

export function hasActiveSession(): boolean {
  const session = loadSession();
  if (!session) return false;
  
  // Session persists indefinitely until explicitly reset
  return true;
}
