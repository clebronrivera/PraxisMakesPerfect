import { useCallback } from 'react';
import { generateQuestion } from '../brain/question-generator';
import { SkillId } from '../brain/skill-map';
import type { SkillPerformance } from '../brain/learning-state';
import { UserProfile } from './useFirebaseProgress';
import { runCapacityTest, type CapacityTestResult } from '../brain/question-capacity';
import { AnalyzedQuestion } from '../brain/question-analyzer';

function getDomainFromSkillId(skillId: string): number {
  const prefix = skillId.split('-')[0].toUpperCase();

  // Domain 1: Professional Practices
  // Domain 2: Student-Level Services  
  // Domain 3: Systems-Level Services
  // Domain 4: Foundations of School Psychology
  const domainMap: Record<string, number> = {
    // Domain 1 — Professional Practices
    'CON': 1, 'DBD': 1, 'ETH': 1, 'FAM': 1, 'LEG': 1, 'PSY': 1, 'RES': 1,
    // Domain 2 — Student-Level Services
    'ACA': 2, 'DEV': 2, 'MBH': 2, 'SAF': 2,
    // Domain 3 — Systems-Level Services
    'SWP': 3,
    // Domain 4 — Foundations
    'DIV': 4
  };

  return domainMap[prefix] || 1;
}

// Cache for pool availability calculations
let capacityCache: CapacityTestResult | null = null;

function getBankQuestionCount(skillId: SkillId, questions: AnalyzedQuestion[]): number {
  return questions.filter(q => q.skillId === skillId && !q.isGenerated).length;
}

function getGenerationCapacity(skillId: SkillId): number {
  if (!capacityCache) {
    capacityCache = runCapacityTest();
  }
  const domainSummary = capacityCache.domainSummaries.find(ds => 
    ds.skills.some((s: any) => s.skillId === skillId)
  );
  const skill = domainSummary?.skills.find((s: any) => s.skillId === skillId);
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
  const bankTotal = getBankQuestionCount(skillId, questions);

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

  /**
   * Calculate priority for a skill using current profile fields only (no attemptHistory).
   * Uses score, confidenceFlags (high+wrong = misconceptions), and history (last 5 bools).
   */
  const calculateSkillPriority = useCallback((skill: SkillPerformance): number => {
    if (!skill || skill.attempts === 0) return 2;
    const score = skill.score ?? 0;
    const confidenceFlags = skill.confidenceFlags ?? 0;
    if (confidenceFlags > 0) return 3 + Math.min(1, confidenceFlags / 3);
    if (score < 0.6) return 3;
    if (score < 0.8) return 2;
    return 1;
  }, []);

  const getWeakestSkills = useCallback((profile: UserProfile): string[] => {
    const skillArray = Object.entries(profile.skillScores)
      .map(([skillId, score]) => ({
        skillId,
        accuracy: score.score, // Use cached score (0-1)
        attempts: score.attempts,
        priority: calculateSkillPriority(score)
      }))
      .filter(s => s.attempts > 0)
      .sort((a, b) => {
        // Sort by priority (higher = more practice needed), then by accuracy
        if (Math.abs(a.priority - b.priority) > 0.1) {
          return b.priority - a.priority;
        }
        return a.accuracy - b.accuracy;
      });

    // Return top 30% by priority (most need practice)
    const cutoff = Math.max(1, Math.floor(skillArray.length * 0.3));
    return skillArray.slice(0, cutoff).map(s => s.skillId);
  }, [calculateSkillPriority]);

  const selectNextQuestion = useCallback((
    profile: UserProfile,
    questions: AnalyzedQuestion[],
    history: string[]
  ): AnalyzedQuestion | null => {
    // Build exclusion set: assessment questions + recent practice + session history
    const excludeIds = new Set<string>();
    
    // Exclude pre-assessment questions
    if (profile.preAssessmentQuestionIds) {
      profile.preAssessmentQuestionIds.forEach(id => excludeIds.add(id));
    }
    
    // Exclude full assessment questions
    if (profile.fullAssessmentQuestionIds) {
      profile.fullAssessmentQuestionIds.forEach(id => excludeIds.add(id));
    }
    
    // Exclude recent practice questions (rolling window)
    if (profile.recentPracticeQuestionIds) {
      profile.recentPracticeQuestionIds.forEach(id => excludeIds.add(id));
    }
    
    // Exclude questions already seen in this session
    history.forEach(id => excludeIds.add(id));
    
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
          // Avoid repeating same generated question in this session (profile has no generatedQuestionsSeen)
          if (!history.includes(generated.id)) {
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
    // Filter out excluded questions (assessment + recent practice + session history)
    const available = questions.filter(q => !excludeIds.has(q.id));
    
    if (available.length === 0) {
      // Reset history if we've seen all questions
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    // Target weakest domains
    const activeDomainIds = [...new Set(questions.flatMap(q => q.domains || []))].filter(d => d <= 4);
    const weakestDomains = profile.weakestDomains.length > 0 
      ? profile.weakestDomains 
      : activeDomainIds;
    
    // 70% chance to pick from weakest domains
    const targetWeak = Math.random() < 0.7;
    const candidates = targetWeak
      ? available.filter(q => (q.domains || []).some(d => weakestDomains.includes(d)))
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
