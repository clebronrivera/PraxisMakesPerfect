// src/hooks/useFirebaseProgress.ts
// Cloud-synced user progress using Firestore
// Replaces localStorage with Firebase for persistent, cross-device storage

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  doc, 
  setDoc,
  updateDoc,
  getDoc,
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy
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

// Profile is a cached view derived from response events (users/{uid}/responses).
// domainScores, weakestDomains, factualGaps, errorPatterns are computed from events
// on assessment complete (or can be recomputed via getAssessmentResponses + detectWeaknesses).
// No practiceHistory or generatedQuestionsSeen - use practiceResponseCount / recentPracticeQuestionIds.
export interface UserProfile {
  preAssessmentComplete: boolean;
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
  preAssessmentQuestionIds?: string[]; // Questions used in pre-assessment
  fullAssessmentQuestionIds?: string[]; // Questions used in full assessment
  recentPracticeQuestionIds?: string[]; // Rolling window of recent practice questions (last 20)
  screenerItemIds?: string[]; // Questions selected for the screener
  // New fields
  practiceResponseCount?: number; // Count of practice responses (replaces practiceHistory)
  lastPracticeAt?: any; // Timestamp of last practice answer
  migrationVersion?: number; // Set to 1 to prevent legacy array writes
  lastSession?: {
    sessionId: string;
    mode: 'practice' | 'full' | 'diagnostic';
    questionIndex: number;
    updatedAt: any; // Timestamp
  };
  lastPreAssessmentSessionId?: string; // Session ID of last completed pre-assessment
  lastFullAssessmentSessionId?: string; // Session ID of last completed full assessment
  lastPreAssessmentCompletedAt?: any; // Timestamp of last pre-assessment completion
  lastFullAssessmentCompletedAt?: any; // Timestamp of last full assessment completion
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
  assessmentType: 'diagnostic' | 'full' | 'practice';
  sessionId: string;
  isCorrect: boolean;
  confidence: 'low' | 'medium' | 'high';
  timeSpent: number;
  time_on_item_seconds?: number; // Mirror field for diagnostic verification
  timestamp: number;
  selectedAnswers: string[]; // Full multi-select (source of truth)
  correctAnswers: string[]; // For weakness analysis and analytics
  distractorPatternId?: string; // Error type/pattern when wrong (for "how they think")
  createdAt: any; // serverTimestamp
  // Legacy: selectedAnswer/domainId for backward compat when reading old docs
  selectedAnswer?: string;
  domainId?: number;
}

export interface DiagnosticResponse {
  question_id: string;
  skill_id: string;
  domain_id: number;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  confidence: string;
  time_on_item_seconds: number;
  distractor_selected?: string;
  attempt_number?: number;
}

export interface DiagnosticSessionDoc {
  status: 'in_progress' | 'paused' | 'complete';
  started_at: any;
  current_question_index: number;
  elapsed_seconds: number;
  responses: DiagnosticResponse[];
  saved_at?: any;
  completed_at?: any;
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
  const migrationRef = useRef<string | null>(null);

  // Subscribe to user's profile in Firestore
  useEffect(() => {
    if (!user) {
      setProfile(defaultProfile);
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
        setProfile({
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
        setProfile(defaultProfile);
      }
      setIsLoaded(true);
    }, (error) => {
      console.error('Error listening to profile:', error);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user]);



  // Save profile to Firestore
  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        ...newProfile,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }, [user]);

  // Update profile (with automatic save)
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await saveProfile(newProfile);
  }, [profile, saveProfile]);

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
    if (user && isLoaded && migrationRef.current !== user.uid) {
      migrateDomainSchema();
      migrationRef.current = user.uid;
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
      await setDoc(doc(responsesRef, responseId), {
        ...response,
        createdAt: serverTimestamp()
      }, { merge: true });
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
    mode: 'practice' | 'full' | 'diagnostic',
    questionIndex: number,
    elapsedSeconds?: number
  ): Promise<void> => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        lastSession: {
          sessionId,
          mode,
          questionIndex,
          elapsedSeconds: elapsedSeconds || 0,
          updatedAt: serverTimestamp()
        },
        lastUpdated: serverTimestamp()
      }, { merge: true });
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
    const currentSkill = profile.skillScores[skillId];
    
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
      return profile.skillScores[id];
    };
    
    const oldState = baseSkill.learningState;
    const newState = calculateLearningState(updatedSkill, skillId, skillPerfLookup);
    
    if (newState === 'mastery' && oldState !== 'mastery' && !baseSkill.masteryDate) {
      updatedSkill.masteryDate = Date.now();
    }
    
    updatedSkill.learningState = newState;
    
    const newProfile = {
      ...profile,
      skillScores: {
        ...profile.skillScores,
        [skillId]: updatedSkill
      }
    };
    
    setProfile(newProfile);
    await saveProfile(newProfile);
  }, [profile, saveProfile]);

  // Reset all progress
  const resetProgress = useCallback(async () => {
    if (!user) {
      setProfile(defaultProfile);
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

      setProfile(defaultProfile);
      console.log('[ResetProgress] All progress cleared');
    } catch (error) {
      console.error('Error resetting progress:', error);
      // Still update local state even if Firestore fails
      setProfile(defaultProfile);
    }
  }, [user]);

  /**
   * Migrate old skillScores format to new format
   */
  const migrateSkillScores = useCallback((oldScores: any): Record<SkillId, SkillPerformance> => {
    const migrated: Record<SkillId, SkillPerformance> = {};
    
    if (!oldScores || typeof oldScores !== 'object') {
      return migrated;
    }
    
    for (const [skillId, oldScore] of Object.entries(oldScores)) {
      if (oldScore && typeof oldScore === 'object') {
        // Check if it's already in new format
        if ('learningState' in oldScore && 'consecutiveCorrect' in oldScore) {
          migrated[skillId] = oldScore as SkillPerformance;
        } else {
          // Migrate from old format: { correct, total, lastSeen }
          const correct = (oldScore as any).correct || 0;
          const total = (oldScore as any).total || 0;
          const score = total > 0 ? correct / total : 0;
          
          migrated[skillId] = {
            score,
            attempts: total,
            correct,
            consecutiveCorrect: 0, // Can't determine from old data
            history: [], // Can't recover history from old data
            learningState: 'emerging' as LearningState,
            masteryDate: undefined
          };
        }
      }
    }
    
    return migrated;
  }, []);

  /**
   * Retrieve assessment responses from Firestore for a given session.
   * Reports are always retrievable from response events (source of truth).
   * Reconstructs UserResponse[] from response logs for ScoreReport and past report view.
   */
  const getAssessmentResponses = useCallback(async (
    sessionId: string,
    assessmentType: 'diagnostic' | 'full',
    questions: AnalyzedQuestion[]
  ): Promise<UserResponse[]> => {
    if (!user) {
      console.warn('[getAssessmentResponses] No user, cannot retrieve responses');
      return [];
    }

    try {
      const responsesRef = collection(db, 'users', user.uid, 'responses');
      const q = query(
        responsesRef,
        where('sessionId', '==', sessionId),
        where('assessmentType', '==', assessmentType),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const responses: UserResponse[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as ResponseLog;
        const question = questions.find(q => q.id === data.questionId);
        
        if (!question) {
          console.warn(`[getAssessmentResponses] Question not found: ${data.questionId}`);
          return;
        }
        
        // Reconstruct UserResponse from ResponseLog (supports new schema and legacy)
        const selectedAnswers = Array.isArray(data.selectedAnswers) && data.selectedAnswers.length > 0
          ? data.selectedAnswers
          : (data.selectedAnswer ? [data.selectedAnswer] : []);
        const correctAnswers = Array.isArray(data.correctAnswers) && data.correctAnswers.length > 0
          ? data.correctAnswers
          : (question.correct_answer || []);
        const userResponse: UserResponse = {
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
        };
        responses.push(userResponse);
      });
      
      console.log(`[getAssessmentResponses] Retrieved ${responses.length} responses for session ${sessionId}`);
      return responses;
    } catch (error) {
      console.error('[getAssessmentResponses] Error retrieving responses:', error);
      return [];
    }
  }, [user]);

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
    totalQuestions: number = 45
  ) => {
    if (!user) return;

    try {
      // 1. Save to responses/{userId}/screener/{questionId}
      // Note: Path specified as responses/{userId}/screener/{questionId}
      const screenerResponseRef = doc(db, 'responses', user.uid, 'screener', response.question_id);
      await setDoc(screenerResponseRef, {
        ...response,
        createdAt: serverTimestamp()
      }, { merge: true });

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

  // Migrate from localStorage (call this once when user first logs in)
  // Note: Do NOT write practiceHistory or generatedQuestionsSeen to Firestore
  // Calculate practiceResponseCount from practiceHistory length if it exists
  const migrateFromLocalStorage = useCallback(async () => {
    if (!user) return false;
    
    const STORAGE_KEY = 'praxis-user-profile';
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) return false;
    
    try {
      const localProfile = JSON.parse(stored);
      
      // Migrate skillScores if they exist and are in old format
      const migratedSkillScores = localProfile.skillScores 
        ? migrateSkillScores(localProfile.skillScores)
        : {};
      
      // Calculate practiceResponseCount from legacy practiceHistory if it exists
      const practiceResponseCount = localProfile.practiceHistory?.length || 0;
      
      // Ensure all required fields exist with safe defaults
      // DO NOT include practiceHistory or generatedQuestionsSeen in migrated profile
      const migratedProfile: UserProfile = {
        ...defaultProfile,
        // Copy over non-legacy fields
        preAssessmentComplete: localProfile.preAssessmentComplete ?? false,
        fullAssessmentComplete: localProfile.fullAssessmentComplete ?? false,
        domainScores: localProfile.domainScores ?? {},
        skillScores: migratedSkillScores,
        weakestDomains: localProfile.weakestDomains ?? [],
        factualGaps: localProfile.factualGaps ?? [],
        errorPatterns: localProfile.errorPatterns ?? [],
        totalQuestionsSeen: localProfile.totalQuestionsSeen ?? 0,
        streak: localProfile.streak ?? 0,
        flaggedQuestions: localProfile.flaggedQuestions ?? {},
        distractorErrors: localProfile.distractorErrors ?? {},
        skillDistractorErrors: localProfile.skillDistractorErrors ?? {},
        preAssessmentQuestionIds: localProfile.preAssessmentQuestionIds ?? [],
        fullAssessmentQuestionIds: localProfile.fullAssessmentQuestionIds ?? [],
        recentPracticeQuestionIds: localProfile.recentPracticeQuestionIds ?? [],
        screenerItemIds: localProfile.screenerItemIds ?? [],
        diagnosticComplete: localProfile.diagnosticComplete ?? false,
        // New fields
        practiceResponseCount,
        migrationVersion: 1
      };
      
      // Save to Firestore
      await saveProfile(migratedProfile);
      
      // Clear localStorage after successful migration
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('praxis-assessment-session');
      
      console.log('Successfully migrated localStorage to Firebase');
      return true;
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      return false;
    }
  }, [user, saveProfile, migrateSkillScores]);

  return {
    profile,
    updateProfile,
    updateSkillProgress,
    resetProgress,
    migrateDomainSchema,
    migrateFromLocalStorage,
    logResponse,
    updateLastSession,
    getAssessmentResponses,
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
        await setDoc(docRef, {
          ...response,
          timestamp: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('[savePracticeResponse] Error saving response:', error);
      }
    }, [user]),
    /**
     * Recalculate global scores (aggregating screener, diagnostic, practice)
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
    /**
     * Start a new diagnostic session
     * Path: diagnosticSessions/{userId}/sessions/{sessionId}
     */
    startDiagnosticSession: useCallback(async (sessionId: string) => {
      if (!user) return;
      try {
        const sessionRef = doc(db, 'diagnosticSessions', user.uid, 'sessions', sessionId);
        await setDoc(sessionRef, {
          status: 'in_progress',
          started_at: serverTimestamp(),
          current_question_index: 0,
          elapsed_seconds: 0,
          responses: []
        });
        console.log(`[Diagnostic] Session ${sessionId} started`);
      } catch (error) {
        console.error('[Diagnostic] Error starting session:', error);
      }
    }, [user]),

    /**
     * Update progress in a diagnostic session
     */
    updateDiagnosticSessionProgress: useCallback(async (
      sessionId: string, 
      currentQuestionIndex: number, 
      elapsedSeconds: number, 
      response?: DiagnosticResponse
    ) => {
      if (!user) return;
      try {
        const sessionRef = doc(db, 'diagnosticSessions', user.uid, 'sessions', sessionId);
        const updates: any = {
          current_question_index: currentQuestionIndex,
          elapsed_seconds: elapsedSeconds,
          saved_at: serverTimestamp()
        };
        
        if (response) {
          updates.responses = arrayUnion(response);
        }
        
        await updateDoc(sessionRef, updates);
      } catch (error) {
        console.error('[Diagnostic] Error updating session:', error);
      }
    }, [user]),

    /**
     * Pause a diagnostic session
     */
    pauseDiagnosticSession: useCallback(async (sessionId: string) => {
      if (!user) return;
      try {
        const sessionRef = doc(db, 'diagnosticSessions', user.uid, 'sessions', sessionId);
        await updateDoc(sessionRef, {
          status: 'paused',
          saved_at: serverTimestamp()
        });
        console.log(`[Diagnostic] Session ${sessionId} paused`);
      } catch (error) {
        console.error('[Diagnostic] Error pausing session:', error);
      }
    }, [user]),

    /**
     * Complete a diagnostic session
     */
    completeDiagnosticSession: useCallback(async (sessionId: string) => {
      if (!user) return;
      try {
        const sessionRef = doc(db, 'diagnosticSessions', user.uid, 'sessions', sessionId);
        await updateDoc(sessionRef, {
          status: 'complete',
          completed_at: serverTimestamp(),
          saved_at: serverTimestamp()
        });
        console.log(`[Diagnostic] Session ${sessionId} completed`);
        
        // Recalculate global scores after completion
        try {
          await calculateAndSaveGlobalScores(user.uid);
        } catch (calcError) {
          console.error('[Diagnostic] Error recalculating global scores:', calcError);
        }
      } catch (error) {
        console.error('[Diagnostic] Error completing session:', error);
      }
    }, [user]),

    /**
     * Resume a diagnostic session
     * Returns the saved state to restore the user's progress
     */
    resumeDiagnosticSession: useCallback(async (sessionId: string): Promise<{questionIndex: number, elapsedSeconds: number} | null> => {
      if (!user) return null;
      try {
        const sessionRef = doc(db, 'diagnosticSessions', user.uid, 'sessions', sessionId);
        const docSnap = await getDoc(sessionRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as DiagnosticSessionDoc;
          
          // If it was paused, set it back to in_progress
          if (data.status === 'paused') {
            await updateDoc(sessionRef, {
              status: 'in_progress',
              saved_at: serverTimestamp()
            });
          }
          
          return {
            questionIndex: data.current_question_index,
            elapsedSeconds: data.elapsed_seconds
          };
        }
        return null;
      } catch (error) {
        console.error('[Diagnostic] Error resuming session:', error);
        return null;
      }
    }, [user]),
    isLoaded,
    isLoggedIn: !!user
  };
}
