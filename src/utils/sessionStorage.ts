import type { SessionPayload } from './sessionTypes';

/** Single session model: in-progress assessment (anonymous). Uses shared SessionPayload. */
export type AssessmentSession = SessionPayload;

const SESSION_KEY = 'praxis-assessment-session';

export function saveSession(session: SessionPayload): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

export function loadSession(): SessionPayload | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SessionPayload;
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
