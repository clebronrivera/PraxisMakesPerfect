import type { ActiveSessionStorageType, SessionPayload } from './sessionTypes';
import type { SessionAssessmentFlow } from '../types/assessment';

/** Single session model: in-progress assessment (per-user). Payload + identity for resume. */
export interface UserSession extends SessionPayload {
  userName: string;
  sessionId: string;
  createdAt: number;
}

const SESSIONS_KEY_PREFIX = 'praxis-session-';
const USER_SESSIONS_LIST_KEY = 'praxis-user-sessions-list';
const CURRENT_USER_KEY = 'praxis-current-user';

/**
 * Get all saved sessions for a user
 */
function getUserSessions(userName: string): UserSession[] {
  try {
    const listKey = `${USER_SESSIONS_LIST_KEY}-${userName}`;
    const stored = localStorage.getItem(listKey);
    if (!stored) return [];
    
    const sessionIds: string[] = JSON.parse(stored);
    const sessions: UserSession[] = [];
    
    for (const sessionId of sessionIds) {
      const sessionData = localStorage.getItem(`${SESSIONS_KEY_PREFIX}${sessionId}`);
      if (sessionData) {
        sessions.push(JSON.parse(sessionData));
      }
    }
    
    return sessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
  } catch (error) {
    console.error('Error loading user sessions:', error);
    return [];
  }
}

function deleteUserSessionsByType(userName: string, type: UserSession['type']): void {
  const sessions = getUserSessions(userName).filter(session => session.type === type);
  sessions.forEach(session => {
    deleteUserSession(userName, session.sessionId);
  });
}

/**
 * Save a session (single session model: same payload shape as sessionStorage)
 */
export function saveUserSession(session: UserSession): void {
  try {
    localStorage.setItem(`${SESSIONS_KEY_PREFIX}${session.sessionId}`, JSON.stringify(session));
    
    // Update user's session list
    const listKey = `${USER_SESSIONS_LIST_KEY}-${session.userName}`;
    const stored = localStorage.getItem(listKey);
    const sessionIds: string[] = stored ? JSON.parse(stored) : [];
    
    if (!sessionIds.includes(session.sessionId)) {
      sessionIds.push(session.sessionId);
    }
    
    localStorage.setItem(listKey, JSON.stringify(sessionIds));
    
    // Update global users list
    const usersKey = USER_SESSIONS_LIST_KEY;
    const usersStored = localStorage.getItem(usersKey);
    const users: string[] = usersStored ? JSON.parse(usersStored) : [];
    
    if (!users.includes(session.userName)) {
      users.push(session.userName);
      localStorage.setItem(usersKey, JSON.stringify(users));
    }
    
    // Set as current user
    localStorage.setItem(CURRENT_USER_KEY, session.userName);
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

/**
 * Load a specific session
 */
export function loadUserSession(sessionId: string): UserSession | null {
  try {
    const stored = localStorage.getItem(`${SESSIONS_KEY_PREFIX}${sessionId}`);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
}

export function deleteUserSession(userName: string, sessionId: string): void {
  try {
    localStorage.removeItem(`${SESSIONS_KEY_PREFIX}${sessionId}`);

    const listKey = `${USER_SESSIONS_LIST_KEY}-${userName}`;
    const stored = localStorage.getItem(listKey);
    const sessionIds: string[] = stored ? JSON.parse(stored) : [];
    const nextSessionIds = sessionIds.filter((id) => id !== sessionId);

    if (nextSessionIds.length > 0) {
      localStorage.setItem(listKey, JSON.stringify(nextSessionIds));
    } else {
      localStorage.removeItem(listKey);
    }
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}

/**
 * Get current active session for a user
 */
export function getCurrentSession(userName: string): UserSession | null {
  const sessions = getUserSessions(userName);
  // Return the most recently updated incomplete session
  const incomplete = sessions.filter(s => 
    s.currentIndex < s.questionIds.length
  );
  
  if (incomplete.length > 0) {
    return incomplete.sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
  }
  
  return null;
}

/**
 * Get current user
 */
export function getCurrentUser(): string | null {
  try {
    return localStorage.getItem(CURRENT_USER_KEY);
  } catch {
    return null;
  }
}

/**
 * Create a new session
 */
export function createUserSession(
  userName: string,
  type: ActiveSessionStorageType,
  questionIds: string[],
  assessmentFlow?: SessionAssessmentFlow
): UserSession {
  // Keep a single in-progress session per assessment type to avoid surfacing stale resume cards.
  deleteUserSessionsByType(userName, type);

  const sessionId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const session: UserSession = {
    userName,
    sessionId,
    type,
    assessmentFlow,
    questionIds,
    currentIndex: 0,
    responses: [],
    selectedAnswers: [],
    showFeedback: false,
    confidence: 'medium',
    startTime: Date.now(),
    lastUpdated: Date.now(),
    createdAt: Date.now()
  };
  
  saveUserSession(session);
  return session;
}
