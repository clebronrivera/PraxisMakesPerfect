import { useCallback } from 'react';
import { generateQuestion } from '../brain/question-generator';
import { SkillId, getSkillById } from '../brain/skill-map';
import { UserProfile } from './useFirebaseProgress';
import questionSkillMapData from '../data/question-skill-map.json';
import { runCapacityTest } from '../scripts/capacity-test';

interface AnalyzedQuestion {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string[];
  rationale: string;
  skillId?: string;
  domains: number[];
  dok: number;
  questionType: 'Scenario-Based' | 'Direct Knowledge';
  stemType: string;
  keyConcepts: string[];
  isGenerated?: boolean;
  source?: 'bank' | 'generated';
  templateId?: string;
}

function getDomainFromSkillId(skillId: SkillId): number {
  const skill = getSkillById(skillId);
  if (!skill) return 1;
  
  // Map skill IDs to domains based on prefix
  const domainMap: Record<string, number> = {
    'DBDM': 1, 'CC': 2, 'ACAD': 3, 'MBH': 4, 'SWP': 5,
    'PC': 6, 'FSC': 7, 'DIV': 8, 'RES': 9, 'LEG': 10
  };
  
  const prefix = skillId.split('-')[0];
  return domainMap[prefix] || 1;
}

// Cache for pool availability calculations
let capacityCache: ReturnType<typeof runCapacityTest> | null = null;
let bankCountCache: Map<string, number> | null = null;

function getBankQuestionCount(skillId: SkillId): number {
  if (!bankCountCache) {
    bankCountCache = new Map();
    for (const entry of questionSkillMapData.mappedQuestions) {
      const count = bankCountCache.get(entry.skillId) ?? 0;
      bankCountCache.set(entry.skillId, count + 1);
    }
  }
  return bankCountCache.get(skillId) ?? 0;
}

function getGenerationCapacity(skillId: SkillId): number {
  if (!capacityCache) {
    capacityCache = runCapacityTest();
  }
  const domainSummary = capacityCache.domainSummaries.find(ds => 
    ds.skills.some(s => s.skillId === skillId)
  );
  const skill = domainSummary?.skills.find(s => s.skillId === skillId);
  return skill?.capacity ?? 0;
}

function getUnusedBankQuestions(skillId: SkillId, questions: AnalyzedQuestion[], history: string[]): number {
  const available = questions.filter(q => 
    q.skillId === skillId && !history.includes(q.id) && !q.isGenerated
  );
  return available.length;
}

function getDynamicRatio(skillId: SkillId, questions: AnalyzedQuestion[], history: string[]): number {
  const bankAvailable = getUnusedBankQuestions(skillId, questions, history);
  const generatedCapacity = getGenerationCapacity(skillId);
  const bankTotal = getBankQuestionCount(skillId);

  // Dynamic ratio based on pool availability
  if (bankAvailable > 5) {
    // Prefer bank (validated questions) when plenty available
    return 0.7; // 70% bank, 30% generated
  } else if (generatedCapacity > 20) {
    // Bank exhausted, rely on generation when capacity is good
    return 0.3; // 30% bank, 70% generated
  } else if (bankTotal > 0 || generatedCapacity > 0) {
    // Both limited, allow repeats but prefer what's available
    return bankAvailable > generatedCapacity ? 0.6 : 0.4;
  } else {
    // No questions available - this shouldn't happen
    return 0.5;
  }
}

export function useAdaptiveLearning() {
  // Question history is managed by components, not the hook

  const getWeakestSkills = useCallback((profile: UserProfile): string[] => {
    const skillArray = Object.entries(profile.skillScores)
      .map(([skillId, score]) => ({
        skillId,
        accuracy: score.score, // Use cached score (0-1)
        attempts: score.attempts
      }))
      .filter(s => s.attempts > 0)
      .sort((a, b) => a.accuracy - b.accuracy);

    // Return bottom 30% of skills
    const cutoff = Math.max(1, Math.floor(skillArray.length * 0.3));
    return skillArray.slice(0, cutoff).map(s => s.skillId);
  }, []);

  const selectNextQuestion = useCallback((
    profile: UserProfile,
    questions: AnalyzedQuestion[],
    history: string[]
  ): AnalyzedQuestion | null => {
    // Determine target skill (prefer weakest)
    const weakestSkills = getWeakestSkills(profile);
    const targetSkill = weakestSkills.length > 0
      ? (weakestSkills[Math.floor(Math.random() * weakestSkills.length)] as SkillId)
      : null;

    // Use dynamic ratio based on pool availability
    let useGenerated = false;
    if (targetSkill) {
      const ratio = getDynamicRatio(targetSkill, questions, history);
      useGenerated = Math.random() > ratio; // ratio is bank probability, so invert for generated
    } else {
      // Fallback to 40% generated if no target skill
      useGenerated = Math.random() < 0.4;
    }
    
    if (useGenerated && targetSkill) {
      // Generate a question targeting weaknesses
      try {
        const generated = generateQuestion(targetSkill, {
          seed: Date.now()
        });
        
        if (generated) {
          // Check if we've seen this question before (by ID)
          // Convert array to Set for checking
          const seenQuestions = new Set(profile.generatedQuestionsSeen || []);
          
          if (!seenQuestions.has(generated.id)) {
            // Convert generated question to AnalyzedQuestion format
            const analyzed: AnalyzedQuestion = {
              id: generated.id,
              question: generated.question,
              choices: generated.choices,
              correct_answer: generated.correct_answer,
              rationale: generated.rationale,
              skillId: targetSkill,
              domains: [getDomainFromSkillId(targetSkill)],
              dok: 2,
              questionType: 'Scenario-Based',
              stemType: 'Generated',
              keyConcepts: [],
              isGenerated: true,
              source: 'generated',
              templateId: generated.metadata.templateId
            };
            
            return analyzed;
          }
        }
      } catch (error) {
        console.error('Error generating question:', error);
      }
    }
    
    // Fall back to bank questions
    // Filter out questions already seen in this session
    const available = questions.filter(q => !history.includes(q.id));
    
    if (available.length === 0) {
      // Reset history if we've seen all questions
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    // Target weakest domains
    const weakestDomains = profile.weakestDomains.length > 0 
      ? profile.weakestDomains 
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // 70% chance to pick from weakest domains
    const targetWeak = Math.random() < 0.7;
    const candidates = targetWeak
      ? available.filter(q => q.domains.some(d => weakestDomains.includes(d)))
      : available;
    
    if (candidates.length === 0) {
      // Fallback to any available question
      return available[Math.floor(Math.random() * available.length)];
    }
    
    // Also consider skill-level weaknesses
    if (weakestSkills.length > 0) {
      const skillCandidates = candidates.filter(q => 
        q.skillId && weakestSkills.includes(q.skillId)
      );
      
      if (skillCandidates.length > 0) {
        return skillCandidates[Math.floor(Math.random() * skillCandidates.length)];
      }
    }
    
    // Random selection from candidates
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [getWeakestSkills]);

  return {
    selectNextQuestion,
    getWeakestSkills
  };
}
