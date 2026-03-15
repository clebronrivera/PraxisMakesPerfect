// src/hooks/useFirebaseProgress.ts
// Cloud-synced user progress using Firestore
// Replaces localStorage with Firebase for persistent, cross-device storage

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  doc, 
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { SkillId } from '../brain/skill-map';
import { 
  LearningState, 
  SkillPerformance, 
  SkillAttempt,
  calculateLearningState,
  calculateWeightedAccuracy,
  countConfidenceFlags
} from '../brain/learning-state';
import { UserResponse } from '../brain/weakness-detector';
import { calculateAndSaveGlobalScores } from '../utils/globalScoreCalculator';
import { AnalyzedQuestion } from '../brain/question-analyzer';
import { sanitizeForFirestore } from '../utils/firestore';
import type {
  AssessmentReportType,
  ResponseAssessmentType,
  SessionMode
} from '../types/assessment';

// Profile is a cached view derived from response events (users/{uid}/responses).
// domainScores, weakestDomains, factualGaps, errorPatterns are computed from events
// on assessment complete (or can be recomputed via getAssessmentResponses + detectWeaknesses).
// No practiceHistory or generatedQuestionsSeen - use practiceResponseCount / recentPracticeQuestionIds.
export interface UserProfile {
  preAssessmentComplete: boolean; // Legacy quick-diagnostic completion flag
  fullAssessmentComplete?: boolean;
  domainScores: Record<number, { correct: number; total: number }>;
  skillScores: Record<SkillId, SkillPerformance>;
  weakestDomains: number[];
  factualGaps: string[];
  errorPatterns: string[];
  totalQuestionsSeen: number;
  streak: number;
  flaggedQuestions: Record<string, string>;
  distractorErrors: Record<string, number>;
  skillDistractorErrors: Record<SkillId, Record<string, number>>;
  preAssessmentQuestionIds?: string[]; // Legacy quick-diagnostic question IDs
  fullAssessmentQuestionIds?: string[]; // Questions used in full assessment
  recentPracticeQuestionIds?: string[]; // Rolling window of recent practice questions (last 20)
  screenerItemIds?: string[]; // Questions selected for the screener
  // New fields
  practiceResponseCount?: number; // Count of practice responses (replaces practiceHistory)
  lastPracticeAt?: any; // Timestamp of last practice answer
  migrationVersion?: number; // Set to 1 to prevent legacy array writes
  lastSession?: {
    sessionId: string;
    mode: SessionMode;
    questionIndex: number;
    updatedAt: any; // Timestamp
  } | null;
  lastPreAssessmentSessionId?: string; // Session ID of last completed legacy quick diagnostic
  lastFullAssessmentSessionId?: string; // Session ID of last completed full assessment
  lastScreenerSessionId?: string; // Session ID of last completed screener
  lastPreAssessmentCompletedAt?: any; // Timestamp of last legacy quick-diagnostic completion
  lastFullAssessmentCompletedAt?: any; // Timestamp of last full assessment completion
  lastScreenerCompletedAt?: any; // Timestamp of last screener completion
  screenerComplete?: boolean;
  screenerResults?: {
    domain_scores: Record<number, number>;
    completed_at: any;
  };
  diagnosticComplete?: boolean;
  lastUpdated?: any;
}

// Single response event schema (stored in users/{uid}/responses) - same shape for all flows
export interface ResponseLog {
  questionId: string;
  skillId?: string;
  domainIds?: number[]; // All domains for this question (supports multi-domain)
  assessmentType: ResponseAssessmentType;
  sessionId: string;
  isCorrect: boolean;
  confidence: 'low' | 'medium' | 'high';
  timeSpent: number;
  time_on_item_seconds?: number; // Legacy mirror field retained for existing data checks
  timestamp: number;
  selectedAnswers: string[]; // Full multi-select (source of truth)
  correctAnswers: string[]; // For weakness analysis and analytics
  distractorPatternId?: string; // Error type/pattern when wrong (for "how they think")
  createdAt: any; // serverTimestamp
  // Legacy: selectedAnswer/domainId for backward compat when reading old docs
  selectedAnswer?: string;
  domainId?: number;
}

interface AssessmentResponseBundle {
  sessionId: string | null;
  questionIds: string[];
  responses: UserResponse[];
}

const defaultProfile: UserProfile = {
  preAssessmentComplete: false,
  domainScores: {},
  skillScores: {},
  weakestDomains: [],
  factualGaps: [],
  errorPatterns: [],
  totalQuestionsSeen: 0,
  streak: 0,
  flaggedQuestions: {},
  distractorErrors: {},
  skillDistractorErrors: {},
  preAssessmentQuestionIds: [],
  fullAssessmentQuestionIds: [],
  recentPracticeQuestionIds: [],
  screenerItemIds: [],
  practiceResponseCount: 0,
  migrationVersion: 1,
  screenerComplete: false,
  diagnosticComplete: false
};

export function useFirebaseProgress() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);
  const schemaCheckRef = useRef<string | null>(null);
  const profileRef = useRef<UserProfile>(defaultProfile);

  const setProfileState = useCallback((nextProfile: UserProfile) => {
    profileRef.current = nextProfile;
    setProfile(nextProfile);
  }, []);

  const rebuildAssessmentResponses = useCallback((
    logs: ResponseLog[],
    questions: AnalyzedQuestion[]
  ): AssessmentResponseBundle => {
    const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);
    const questionIds: string[] = [];
    const responses: UserResponse[] = [];

    sortedLogs.forEach((data) => {
      const question = questions.find(q => q.id === data.questionId);

      if (!question) {
        console.warn(`[rebuildAssessmentResponses] Question not found: ${data.questionId}`);
        return;
      }

      questionIds.push(data.questionId);

      const selectedAnswers = Array.isArray(data.selectedAnswers) && data.selectedAnswers.length > 0
        ? data.selectedAnswers
        : (data.selectedAnswer ? [data.selectedAnswer] : []);
      const correctAnswers = Array.isArray(data.correctAnswers) && data.correctAnswers.length > 0
        ? data.correctAnswers
        : (question.correct_answer || []);

      responses.push({
        questionId: data.questionId,
        selectedAnswers,
        correctAnswers,
        isCorrect: data.isCorrect,
        timeSpent: data.timeSpent,
        confidence: data.confidence,
        timestamp: data.timestamp,
        selectedDistractor: data.distractorPatternId
          ? { letter: selectedAnswers[0] || '', text: '', patternId: data.distractorPatternId as any }
          : undefined,
      });
    });

    return {
      sessionId: sortedLogs[0]?.sessionId ?? null,
      questionIds,
      responses
    };
  }, []);

  // Subscribe to user's profile in Firestore
  useEffect(() => {
    if (!user) {
      setProfileState(defaultProfile);
      setIsLoaded(true);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    
    // Real-time listener for profile changes
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      // Debug logging on auth state change
      console.log('[Auth] User changed:', {
        uid: user?.uid,
        provider: user?.providerData[0]?.providerId,
        profileExists: docSnap.exists()
      });
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<UserProfile>;
        // Apply safe defaults for all fields to prevent undefined crashes
        setProfileState({
          ...defaultProfile,
          ...data,
          // Ensure arrays are always arrays (never undefined)
          weakestDomains: data.weakestDomains ?? [],
          factualGaps: data.factualGaps ?? [],
          errorPatterns: data.errorPatterns ?? [],
          // Ensure objects are always objects (never undefined)
          domainScores: data.domainScores ?? {},
          skillScores: data.skillScores ?? {},
          flaggedQuestions: data.flaggedQuestions ?? {},
          distractorErrors: data.distractorErrors ?? {},
          skillDistractorErrors: data.skillDistractorErrors ?? {},
          // Ensure booleans have defaults
          preAssessmentComplete: data.preAssessmentComplete ?? false,
          fullAssessmentComplete: data.fullAssessmentComplete ?? false,
          screenerComplete: data.screenerComplete ?? false,
          diagnosticComplete: data.diagnosticComplete ?? false,
          // Ensure objects are always objects (never undefined)
          screenerResults: data.screenerResults,
          // Ensure numbers have defaults
          totalQuestionsSeen: data.totalQuestionsSeen ?? 0,
          streak: data.streak ?? 0,
          practiceResponseCount: data.practiceResponseCount ?? 0,
          migrationVersion: data.migrationVersion ?? 1,
          // Ensure new assessment tracking arrays have defaults
          preAssessmentQuestionIds: data.preAssessmentQuestionIds ?? [],
          fullAssessmentQuestionIds: data.fullAssessmentQuestionIds ?? [],
          recentPracticeQuestionIds: data.recentPracticeQuestionIds ?? [],
          screenerItemIds: data.screenerItemIds ?? []
        });
      } else {
        // No profile exists yet, use default
        // DO NOT initialize defaults here - only initialize when explicitly needed
        setProfileState(defaultProfile);
      }
      setIsLoaded(true);
    }, (error) => {
      console.error('Error listening to profile:', error);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user, setProfileState]);



  // Save profile to Firestore
  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, sanitizeForFirestore({
        ...newProfile,
        lastUpdated: serverTimestamp()
      }), { merge: true });
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }, [user]);

  // Update profile (with automatic save)
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profileRef.current, ...updates };
    setProfileState(newProfile);
    await saveProfile(newProfile);
  }, [saveProfile, setProfileState]);

  /**
   * Migrate legacy domain data (10-domain system) to new 4-domain system.
   * Logic: if any value in the stored weakestDomains array is greater than 4, clear weakestDomains and domainScores entirely.
   * This removes corrupted progress data written by the old 10-domain system.
   */
  const migrateDomainSchema = useCallback(async () => {
    if (!user || !isLoaded) return;
    
    const hasLegacyData = profile.weakestDomains.some(id => id > 4);
    
    if (hasLegacyData) {
      console.log('Legacy domain data detected and cleared. Progress reset to clean state.');
      await updateProfile({
        weakestDomains: [],
        domainScores: {}
      });
    }
  }, [user, isLoaded, profile.weakestDomains, updateProfile]);

  // Trigger schema migration once when user loads/logs in
  useEffect(() => {
    if (user && isLoaded && schemaCheckRef.current !== user.uid) {
      migrateDomainSchema();
      schemaCheckRef.current = user.uid;
    }
  }, [user, isLoaded, migrateDomainSchema]);

  /**
   * Log a response to the responses subcollection
   * This is the source of truth - summary doc is cached view
   */
  const logResponse = useCallback(async (
    response: Omit<ResponseLog, 'createdAt'>
  ): Promise<void> => {
    if (!user) {
      console.warn('[logResponse] No user, skipping log');
      return;
    }

    try {
      const responseId = `${response.sessionId}_${response.questionId}_${response.timestamp}`;
      const responsesRef = collection(db, 'users', user.uid, 'responses');
      await setDoc(doc(responsesRef, responseId), sanitizeForFirestore({
        ...response,
        createdAt: serverTimestamp()
      }), { merge: true });
    } catch (error) {
      console.error('[logResponse] Error logging response:', error);
      // Don't throw - response logging failure shouldn't break answer submission
      // Summary update will still happen
    }
  }, [user]);

  /**
   * Update lastSession pointer in summary doc
   */
  const updateLastSession = useCallback(async (
    sessionId: string,
    mode: SessionMode,
    questionIndex: number,
    elapsedSeconds?: number
  ): Promise<void> => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, sanitizeForFirestore({
        lastSession: {
          sessionId,
          mode,
          questionIndex,
          elapsedSeconds: elapsedSeconds || 0,
          updatedAt: serverTimestamp()
        },
        lastUpdated: serverTimestamp()
      }), { merge: true });
    } catch (error) {
      console.error('[updateLastSession] Error updating last session:', error);
    }
  }, [user]);

  // Update skill progress after answering a question
  // Note: attemptHistory removed - compute weightedAccuracy from responses subcollection if needed
  const updateSkillProgress = useCallback(async (
    skillId: SkillId,
    isCorrect: boolean,
    confidence: 'low' | 'medium' | 'high' = 'medium',
    questionId?: string,
    timeSpent?: number
  ) => {
    const latestProfile = profileRef.current;
    const currentSkill = latestProfile.skillScores[skillId];
    
    const baseSkill: SkillPerformance = currentSkill || {
      score: 0,
      attempts: 0,
      correct: 0,
      consecutiveCorrect: 0,
      history: [],
      learningState: 'emerging' as LearningState,
      masteryDate: undefined,
      weightedAccuracy: 0,
      confidenceFlags: 0
    };
    
    const newAttempts = baseSkill.attempts + 1;
    const newCorrect = baseSkill.correct + (isCorrect ? 1 : 0);
    const newScore = newAttempts > 0 ? newCorrect / newAttempts : 0;
    const newConsecutiveCorrect = isCorrect ? baseSkill.consecutiveCorrect + 1 : 0;
    const newHistory = [...baseSkill.history, isCorrect].slice(-5);
    
    // Calculate weighted accuracy from recent history (last 5)
    // For more accurate calculation, query responses subcollection
    const recentAttempts: SkillAttempt[] = newHistory.map((correct, idx) => ({
      questionId: questionId || `unknown-${Date.now()}-${idx}`,
      correct,
      confidence: confidence, // Use current confidence for recent attempts
      timestamp: Date.now(),
      timeSpent: timeSpent || 0
    }));
    const weightedAccuracy = calculateWeightedAccuracy(recentAttempts);
    
    // Count confidence flags from recent history
    const confidenceFlags = countConfidenceFlags(recentAttempts);
    
    const updatedSkill: SkillPerformance = {
      ...baseSkill,
      score: newScore,
      attempts: newAttempts,
      correct: newCorrect,
      consecutiveCorrect: newConsecutiveCorrect,
      history: newHistory,
      weightedAccuracy,
      confidenceFlags
    };
    
    // Calculate new learning state
    const skillPerfLookup = (id: SkillId) => {
      if (id === skillId) return updatedSkill;
      return latestProfile.skillScores[id];
    };
    
    const oldState = baseSkill.learningState;
    const newState = calculateLearningState(updatedSkill, skillId, skillPerfLookup);
    
    if (newState === 'mastery' && oldState !== 'mastery' && !baseSkill.masteryDate) {
      updatedSkill.masteryDate = Date.now();
    }
    
    updatedSkill.learningState = newState;
    
    const newProfile = {
      ...latestProfile,
      skillScores: {
        ...latestProfile.skillScores,
        [skillId]: updatedSkill
      }
    };
    
    setProfileState(newProfile);
    await saveProfile(newProfile);
  }, [saveProfile, setProfileState]);

  // Reset all progress
  const resetProgress = useCallback(async () => {
    if (!user) {
      setProfileState(defaultProfile);
      return;
    }
    
    // Completely overwrite Firestore document (don't merge)
    try {
      const userDocRef = doc(db, 'users', user.uid);
      // Use setDoc without merge to completely overwrite (not merge)
      await setDoc(userDocRef, {
        ...defaultProfile,
        lastUpdated: serverTimestamp()
      }, { merge: false }); // Explicitly set merge to false for complete overwrite

      setProfileState(defaultProfile);
      console.log('[ResetProgress] All progress cleared');
    } catch (error) {
      console.error('Error resetting progress:', error);
      // Still update local state even if Firestore fails
      setProfileState(defaultProfile);
    }
  }, [user, setProfileState]);

  /**
   * Retrieve assessment responses from Firestore for a given session.
   * Reports are always retrievable from response events (source of truth).
   * Reconstructs UserResponse[] from response logs for ScoreReport and past report view.
   */
  const getAssessmentResponses = useCallback(async (
    sessionId: string,
    assessmentTypes: AssessmentReportType[],
    questions: AnalyzedQuestion[]
  ): Promise<UserResponse[]> => {
    if (!user) {
      console.warn('[getAssessmentResponses] No user, cannot retrieve responses');
      return [];
    }

    try {
      const responsesRef = collection(db, 'users', user.uid, 'responses');
      const q = query(responsesRef, where('sessionId', '==', sessionId));
      
      const querySnapshot = await getDocs(q);
      const responseLogs = querySnapshot.docs
        .map((doc) => doc.data() as ResponseLog)
        .filter((log) => assessmentTypes.includes(log.assessmentType as AssessmentReportType));
      const { responses } = rebuildAssessmentResponses(responseLogs, questions);
      
      console.log(`[getAssessmentResponses] Retrieved ${responses.length} responses for session ${sessionId}`);
      return responses;
    } catch (error) {
      console.error('[getAssessmentResponses] Error retrieving responses:', error);
      return [];
    }
  }, [rebuildAssessmentResponses, user]);

  const getLatestAssessmentResponses = useCallback(async (
    assessmentTypes: AssessmentReportType[],
    questions: AnalyzedQuestion[]
  ): Promise<AssessmentResponseBundle> => {
    if (!user) {
      console.warn('[getLatestAssessmentResponses] No user, cannot retrieve responses');
      return { sessionId: null, questionIds: [], responses: [] };
    }

    try {
      const responsesRef = collection(db, 'users', user.uid, 'responses');
      const q = query(responsesRef);

      const querySnapshot = await getDocs(q);
      const logsBySession = new Map<string, ResponseLog[]>();

      querySnapshot.forEach((doc) => {
        const data = doc.data() as ResponseLog;
        if (!data.sessionId) {
          return;
        }
        if (!assessmentTypes.includes(data.assessmentType as AssessmentReportType)) {
          return;
        }

        const sessionLogs = logsBySession.get(data.sessionId) ?? [];
        sessionLogs.push(data);
        logsBySession.set(data.sessionId, sessionLogs);
      });

      let latestSessionId: string | null = null;
      let latestTimestamp = -Infinity;

      logsBySession.forEach((sessionLogs, sessionId) => {
        const sessionLatestTimestamp = Math.max(...sessionLogs.map(log => log.timestamp));
        if (sessionLatestTimestamp > latestTimestamp) {
          latestTimestamp = sessionLatestTimestamp;
          latestSessionId = sessionId;
        }
      });

      if (!latestSessionId) {
        return { sessionId: null, questionIds: [], responses: [] };
      }

      return rebuildAssessmentResponses(logsBySession.get(latestSessionId) ?? [], questions);
    } catch (error) {
      console.error('[getLatestAssessmentResponses] Error retrieving latest responses:', error);
      return { sessionId: null, questionIds: [], responses: [] };
    }
  }, [rebuildAssessmentResponses, user]);

  /**
   * Save a screener response and check for completion
   */
  const saveScreenerResponse = useCallback(async (
    response: {
      question_id: string;
      skill_id: string;
      domain_id: number;
      selected_answer: string;
      correct_answer: string;
      is_correct: boolean;
      confidence: string;
      timestamp: number;
    },
    totalQuestions: number = 50
  ) => {
    if (!user) return;

    try {
      // 1. Save to responses/{userId}/screener/{questionId}
      // Note: Path specified as responses/{userId}/screener/{questionId}
      const screenerResponseRef = doc(db, 'responses', user.uid, 'screener', response.question_id);
      await setDoc(screenerResponseRef, sanitizeForFirestore({
        ...response,
        createdAt: serverTimestamp()
      }), { merge: true });

      // 2. Check if screener is complete
      const screenerCollRef = collection(db, 'responses', user.uid, 'screener');
      const snapshot = await getDocs(screenerCollRef);
      const completedCount = snapshot.size;

      if (completedCount >= totalQuestions) {
        // Calculate domain scores
        const responses = snapshot.docs.map(d => d.data());
        const domainStats: Record<number, { correct: number; total: number }> = {};
        
        responses.forEach(r => {
          const dId = Number(r.domain_id);
          if (!domainStats[dId]) domainStats[dId] = { correct: 0, total: 0 };
          domainStats[dId].total++;
          if (r.is_correct) domainStats[dId].correct++;
        });

        const domainScores: Record<number, number> = {};
        Object.entries(domainStats).forEach(([dId, stats]) => {
          domainScores[Number(dId)] = Math.round((stats.correct / stats.total) * 100);
        });

        // 3. Update user document
        await updateProfile({
          screenerComplete: true,
          screenerResults: {
            domain_scores: domainScores,
            completed_at: serverTimestamp()
          }
        });
      }
    } catch (error) {
      console.error('[saveScreenerResponse] Error logging screener response:', error);
    }
  }, [user, updateProfile]);

  return {
    profile,
    updateProfile,
    updateSkillProgress,
    resetProgress,
    migrateDomainSchema,
    logResponse,
    updateLastSession,
    getAssessmentResponses,
    getLatestAssessmentResponses,
    saveScreenerResponse,
    /**
     * Save a practice response to Firestore: practiceResponses/{userId}/{sessionId}/{questionId}
     */
    savePracticeResponse: useCallback(async (
      sessionId: string,
      questionId: string,
      response: {
        skill_id: string;
        domain_id: number;
        selected_answer: string;
        correct_answer: string;
        is_correct: boolean;
        confidence: string;
        time_on_item_seconds: number;
        shuffled_order: string[];
      }
    ) => {
      if (!user) return;
      try {
        const docRef = doc(db, 'practiceResponses', user.uid, sessionId, questionId);
        await setDoc(docRef, sanitizeForFirestore({
          ...response,
          timestamp: serverTimestamp()
        }), { merge: true });
      } catch (error) {
        console.error('[savePracticeResponse] Error saving response:', error);
      }
    }, [user]),
    /**
     * Recalculate global scores (aggregating screener, assessment, practice)
     */
    recalculateGlobalScores: useCallback(async () => {
      if (!user) return null;
      try {
        const result = await calculateAndSaveGlobalScores(user.uid);
        console.log('[GlobalScores] Recalculated and saved:', result);
        return result;
      } catch (error) {
        console.error('[GlobalScores] Error recalculating:', error);
        return null;
      }
    }, [user]),
    isLoaded,
    isLoggedIn: !!user
  };
}
