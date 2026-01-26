// src/hooks/useFirebaseProgress.ts
// Cloud-synced user progress using Firestore
// Replaces localStorage with Firebase for persistent, cross-device storage

import { useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { PatternId } from '../brain/template-schema';
import { SkillId } from '../brain/skill-map';
import { LearningState, SkillPerformance, calculateLearningState } from '../brain/learning-state';

// Same interface as existing useUserProgress, but generatedQuestionsSeen is array for Firestore
export interface UserProfile {
  preAssessmentComplete: boolean;
  fullAssessmentComplete?: boolean;
  domainScores: Record<number, { correct: number; total: number }>;
  skillScores: Record<SkillId, SkillPerformance>;
  weakestDomains: number[];
  factualGaps: string[];
  errorPatterns: string[];
  practiceHistory: any[];
  totalQuestionsSeen: number;
  streak: number;
  generatedQuestionsSeen: string[]; // Changed from Set to array for Firestore
  flaggedQuestions: Record<string, string>;
  distractorErrors: Record<PatternId, number>;
  skillDistractorErrors: Record<SkillId, Record<PatternId, number>>;
  lastUpdated?: any;
}

const defaultProfile: UserProfile = {
  preAssessmentComplete: false,
  domainScores: {},
  skillScores: {},
  weakestDomains: [],
  factualGaps: [],
  errorPatterns: [],
  practiceHistory: [],
  totalQuestionsSeen: 0,
  streak: 0,
  generatedQuestionsSeen: [],
  flaggedQuestions: {},
  distractorErrors: {},
  skillDistractorErrors: {}
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
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile({
          ...defaultProfile,
          ...data
        });
      } else {
        // No profile exists yet, use default
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

  // Update skill progress after answering a question
  const updateSkillProgress = useCallback(async (
    skillId: SkillId,
    isCorrect: boolean
  ) => {
    const currentSkill = profile.skillScores[skillId];
    
    const baseSkill: SkillPerformance = currentSkill || {
      score: 0,
      attempts: 0,
      correct: 0,
      consecutiveCorrect: 0,
      history: [],
      learningState: 'emerging' as LearningState,
      masteryDate: undefined
    };
    
    const newAttempts = baseSkill.attempts + 1;
    const newCorrect = baseSkill.correct + (isCorrect ? 1 : 0);
    const newScore = newAttempts > 0 ? newCorrect / newAttempts : 0;
    const newConsecutiveCorrect = isCorrect ? baseSkill.consecutiveCorrect + 1 : 0;
    const newHistory = [...baseSkill.history, isCorrect].slice(-5);
    
    const updatedSkill: SkillPerformance = {
      ...baseSkill,
      score: newScore,
      attempts: newAttempts,
      correct: newCorrect,
      consecutiveCorrect: newConsecutiveCorrect,
      history: newHistory
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
    setProfile(defaultProfile);
    if (user) {
      await saveProfile(defaultProfile);
    }
  }, [user, saveProfile]);

  // Migrate from localStorage (call this once when user first logs in)
  const migrateFromLocalStorage = useCallback(async () => {
    if (!user) return false;
    
    const STORAGE_KEY = 'praxis-user-profile';
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) return false;
    
    try {
      const localProfile = JSON.parse(stored);
      
      // Convert Set to array if needed
      if (localProfile.generatedQuestionsSeen && 
          typeof localProfile.generatedQuestionsSeen === 'object' &&
          !Array.isArray(localProfile.generatedQuestionsSeen)) {
        // It's a Set-like object, convert to array
        if (localProfile.generatedQuestionsSeen instanceof Set) {
          localProfile.generatedQuestionsSeen = Array.from(localProfile.generatedQuestionsSeen);
        } else {
          // Handle case where it might be stored as object keys
          localProfile.generatedQuestionsSeen = Object.keys(localProfile.generatedQuestionsSeen);
        }
      } else if (!Array.isArray(localProfile.generatedQuestionsSeen)) {
        localProfile.generatedQuestionsSeen = [];
      }
      
      // Ensure all required fields exist
      const migratedProfile: UserProfile = {
        ...defaultProfile,
        ...localProfile,
        generatedQuestionsSeen: localProfile.generatedQuestionsSeen || []
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
  }, [user, saveProfile]);

  return {
    profile,
    updateProfile,
    updateSkillProgress,
    resetProgress,
    migrateFromLocalStorage,
    isLoaded,
    isSaving,
    isLoggedIn: !!user
  };
}
