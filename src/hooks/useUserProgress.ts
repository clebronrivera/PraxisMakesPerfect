import { useState, useEffect, useCallback } from 'react';
import { clearSession } from '../utils/sessionStorage';
import { PatternId } from '../brain/template-schema';
import { SkillId } from '../brain/skill-map';
import { LearningState, SkillPerformance, calculateLearningState } from '../brain/learning-state';

interface UserResponse {
  questionId: string;
  selectedAnswers: string[];
  correctAnswers: string[];
  isCorrect: boolean;
  timeSpent: number;
  confidence: 'low' | 'medium' | 'high';
  timestamp: number;
  selectedDistractor?: {
    letter: string;
    text: string;
    patternId?: PatternId;
  };
}

export interface UserProfile {
  preAssessmentComplete: boolean;
  fullAssessmentComplete?: boolean;
  domainScores: Record<number, { correct: number; total: number }>;
  skillScores: Record<SkillId, {
    score: number;              // Lifetime accuracy (0-1)
    attempts: number;           // Total attempts
    correct: number;            // Total correct
    consecutiveCorrect: number; // Current streak
    history: boolean[];         // Last 5 results (true=correct)
    learningState: LearningState; // Cached state (emerging/developing/proficient/mastery)
    masteryDate?: number;       // Timestamp when mastery was first reached
  }>;
  weakestDomains: number[];
  factualGaps: string[];
  errorPatterns: string[];
  practiceHistory: UserResponse[];
  totalQuestionsSeen: number;
  streak: number;
  generatedQuestionsSeen: Set<string>;
  flaggedQuestions: Record<string, string>; // questionId -> note
  distractorErrors: Record<PatternId, number>;
  skillDistractorErrors: Record<SkillId, Record<PatternId, number>>;
}

const STORAGE_KEY = 'praxis-user-profile';

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
  generatedQuestionsSeen: new Set(),
  flaggedQuestions: {},
  distractorErrors: {},
  skillDistractorErrors: {}
};

/**
 * Migrate old skillScores format to new format
 */
function migrateSkillScores(oldScores: any): Record<SkillId, SkillPerformance> {
  const migrated: Record<SkillId, SkillPerformance> = {};
  
  for (const [skillId, oldScore] of Object.entries(oldScores)) {
    if (oldScore && typeof oldScore === 'object') {
      // Check if it's already in new format
      if ('learningState' in oldScore && 'consecutiveCorrect' in oldScore) {
        migrated[skillId] = oldScore as SkillPerformance;
      } else {
        // Migrate from old format: { correct, total, lastSeen }
        const correct = oldScore.correct || 0;
        const total = oldScore.total || 0;
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
}

function loadProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultProfile;
    
    const parsed = JSON.parse(stored);
    // Convert generatedQuestionsSeen array back to Set
    if (parsed.generatedQuestionsSeen && Array.isArray(parsed.generatedQuestionsSeen)) {
      parsed.generatedQuestionsSeen = new Set(parsed.generatedQuestionsSeen);
    } else {
      parsed.generatedQuestionsSeen = new Set();
    }
    
    // Ensure new fields are initialized if they don't exist
    if (!parsed.distractorErrors) {
      parsed.distractorErrors = {};
    }
    if (!parsed.skillDistractorErrors) {
      parsed.skillDistractorErrors = {};
    }
    
    // Migrate skillScores if needed
    if (parsed.skillScores) {
      parsed.skillScores = migrateSkillScores(parsed.skillScores);
    }
    
    return {
      ...defaultProfile,
      ...parsed
    };
  } catch (error) {
    console.error('Error loading profile:', error);
    return defaultProfile;
  }
}

function saveProfile(profile: UserProfile): void {
  try {
    // Convert Set to array for JSON serialization
    const toSave = {
      ...profile,
      generatedQuestionsSeen: Array.from(profile.generatedQuestionsSeen)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

export function useUserProgress() {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  // Mark as loaded after first render
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveProfile(profile);
    }
  }, [profile, isLoaded]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates };
      // Handle Set merging for generatedQuestionsSeen
      if (updates.generatedQuestionsSeen) {
        updated.generatedQuestionsSeen = updates.generatedQuestionsSeen;
      }
      return updated;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProfile(defaultProfile);
    localStorage.removeItem(STORAGE_KEY);
    clearSession(); // Also clear any active assessment sessions
  }, []);

  /**
   * Update skill progress after answering a question
   * This function handles all the new granular tracking fields
   */
  const updateSkillProgress = useCallback((
    skillId: SkillId,
    isCorrect: boolean
  ) => {
    setProfile(prev => {
      const currentSkill = prev.skillScores[skillId];
      
      // Initialize skill if it doesn't exist
      const baseSkill: SkillPerformance = currentSkill || {
        score: 0,
        attempts: 0,
        correct: 0,
        consecutiveCorrect: 0,
        history: [],
        learningState: 'emerging' as LearningState,
        masteryDate: undefined
      };
      
      // Update metrics
      const newAttempts = baseSkill.attempts + 1;
      const newCorrect = baseSkill.correct + (isCorrect ? 1 : 0);
      const newScore = newAttempts > 0 ? newCorrect / newAttempts : 0;
      const newConsecutiveCorrect = isCorrect ? baseSkill.consecutiveCorrect + 1 : 0;
      
      // Update history (keep last 5)
      const newHistory = [...baseSkill.history, isCorrect].slice(-5);
      
      // Create updated skill performance
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
        return prev.skillScores[id];
      };
      
      const oldState = baseSkill.learningState;
      const newState = calculateLearningState(updatedSkill, skillId, skillPerfLookup);
      
      // Set masteryDate if transitioning to mastery for the first time
      if (newState === 'mastery' && oldState !== 'mastery' && !baseSkill.masteryDate) {
        updatedSkill.masteryDate = Date.now();
      }
      
      updatedSkill.learningState = newState;
      
      return {
        ...prev,
        skillScores: {
          ...prev.skillScores,
          [skillId]: updatedSkill
        }
      };
    });
  }, []);

  return {
    profile,
    updateProfile,
    updateSkillProgress,
    resetProgress,
    isLoaded
  };
}
