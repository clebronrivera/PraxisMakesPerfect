// src/hooks/useFirebaseProgress.ts
// Cloud-synced user progress using Firestore
// Replaces localStorage with Firebase for persistent, cross-device storage

import { useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { PatternId } from '../brain/template-schema';
import { SkillId } from '../brain/skill-map';
import { 
  LearningState, 
  SkillPerformance, 
  SkillAttempt,
  calculateLearningState,
  calculateConfidenceWeight,
  calculateWeightedAccuracy,
  countConfidenceFlags
} from '../brain/learning-state';

// Updated interface: removed practiceHistory, generatedQuestionsSeen, attemptHistory
// Added response logging subcollection and session tracking
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
  distractorErrors: Record<PatternId, number>;
  skillDistractorErrors: Record<SkillId, Record<PatternId, number>>;
  preAssessmentQuestionIds?: string[]; // Questions used in pre-assessment
  fullAssessmentQuestionIds?: string[]; // Questions used in full assessment
  recentPracticeQuestionIds?: string[]; // Rolling window of recent practice questions (last 20)
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
  lastUpdated?: any;
}

// Response log document structure (stored in users/{uid}/responses/{responseId})
export interface ResponseLog {
  questionId: string;
  skillId?: string;
  domainId?: number;
  assessmentType: 'diagnostic' | 'full' | 'practice';
  sessionId: string;
  isCorrect: boolean;
  confidence: 'low' | 'medium' | 'high';
  timeSpent: number;
  timestamp: number;
  selectedAnswer?: string; // Optional letter
  distractorPatternId?: string; // Optional pattern ID if wrong answer selected
  createdAt: any; // serverTimestamp
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
  practiceResponseCount: 0,
  migrationVersion: 1
};

export function useFirebaseProgress() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
          // Ensure numbers have defaults
          totalQuestionsSeen: data.totalQuestionsSeen ?? 0,
          streak: data.streak ?? 0,
          practiceResponseCount: data.practiceResponseCount ?? 0,
          migrationVersion: data.migrationVersion ?? 1,
          // Ensure new assessment tracking arrays have defaults
          preAssessmentQuestionIds: data.preAssessmentQuestionIds ?? [],
          fullAssessmentQuestionIds: data.fullAssessmentQuestionIds ?? [],
          recentPracticeQuestionIds: data.recentPracticeQuestionIds ?? []
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
    
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        ...newProfile,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  // Update profile (with automatic save)
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await saveProfile(newProfile);
  }, [profile, saveProfile]);

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
      await addDoc(responsesRef, {
        ...response,
        createdAt: serverTimestamp()
      });
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
    questionIndex: number
  ): Promise<void> => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        lastSession: {
          sessionId,
          mode,
          questionIndex,
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
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
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
    migrateFromLocalStorage,
    logResponse,
    updateLastSession,
    isLoaded,
    isSaving,
    isLoggedIn: !!user
  };
}
