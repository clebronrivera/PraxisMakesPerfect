import { UserResponse } from '../brain/weakness-detector';

export interface UserSession {
  userName: string;
  sessionId: string;
  type: 'pre-assessment' | 'full-assessment';
  questionIds: string[];
  currentIndex: number;
  responses: UserResponse[];
  selectedAnswers: string[];
  showFeedback: boolean;
  confidence: 'low' | 'medium' | 'high';
  startTime: number;
  lastUpdated: number;
  createdAt: number;
}

export interface UserSessionList {
  userName: string;
  sessions: Array<{
    sessionId: string;
    type: 'pre-assessment' | 'full-assessment';
    createdAt: number;
    lastUpdated: number;
    progress: number; // percentage complete
    questionCount: number;
  }>;
}

const SESSIONS_KEY_PREFIX = 'praxis-session-';
const USER_SESSIONS_LIST_KEY = 'praxis-user-sessions-list';
const CURRENT_USER_KEY = 'praxis-current-user';

/**
 * Get all saved sessions for a user
 */
export function getUserSessions(userName: string): UserSession[] {
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

/**
 * Get list of all users with their sessions
 */
export function getAllUsersWithSessions(): UserSessionList[] {
  try {
    const stored = localStorage.getItem(USER_SESSIONS_LIST_KEY);
    if (!stored) return [];
    
    const users: string[] = JSON.parse(stored);
    const result: UserSessionList[] = [];
    
    for (const userName of users) {
      const sessions = getUserSessions(userName);
      result.push({
        userName,
        sessions: sessions.map(s => ({
          sessionId: s.sessionId,
          type: s.type,
          createdAt: s.createdAt,
          lastUpdated: s.lastUpdated,
          progress: s.questionIds.length > 0 
            ? Math.round((s.currentIndex / s.questionIds.length) * 100)
            : 0,
          questionCount: s.questionIds.length
        }))
      });
    }
    
    return result.sort((a, b) => {
      const aLatest = a.sessions[0]?.lastUpdated || 0;
      const bLatest = b.sessions[0]?.lastUpdated || 0;
      return bLatest - aLatest;
    });
  } catch (error) {
    console.error('Error loading all users:', error);
    return [];
  }
}

/**
 * Save a session
 */
export function saveUserSession(session: UserSession): void {
  try {
    // Save the session
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
 * Delete a session
 */
export function deleteUserSession(sessionId: string, userName: string): void {
  try {
    localStorage.removeItem(`${SESSIONS_KEY_PREFIX}${sessionId}`);
    
    const listKey = `${USER_SESSIONS_LIST_KEY}-${userName}`;
    const stored = localStorage.getItem(listKey);
    if (stored) {
      const sessionIds: string[] = JSON.parse(stored);
      const updated = sessionIds.filter(id => id !== sessionId);
      localStorage.setItem(listKey, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error deleting session:', error);
  }
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
 * Set current user
 */
export function setCurrentUser(userName: string): void {
  try {
    localStorage.setItem(CURRENT_USER_KEY, userName);
  } catch (error) {
    console.error('Error setting current user:', error);
  }
}

/**
 * Create a new session
 */
export function createUserSession(
  userName: string,
  type: 'pre-assessment' | 'full-assessment',
  questionIds: string[]
): UserSession {
  const sessionId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const session: UserSession = {
    userName,
    sessionId,
    type,
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
