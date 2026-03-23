import { useCallback } from 'react';
import type { SkillPerformance } from '../brain/learning-state';
import { UserProfile } from './useFirebaseProgress';
import { AnalyzedQuestion } from '../brain/question-analyzer';
import { CONTENT_POLICY } from '../config/content-policy';
import { ACTIVE_LAUNCH_FEATURES } from '../utils/launchConfig';

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
    
    // Exclude archived short-assessment questions stored under legacy fields
    if (profile.preAssessmentQuestionIds) {
      profile.preAssessmentQuestionIds.forEach(id => excludeIds.add(id));
    }

    // Exclude screener questions
    if (profile.screenerItemIds) {
      profile.screenerItemIds.forEach(id => excludeIds.add(id));
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

    // Explicit runtime content policy guard
    if (CONTENT_POLICY.ALLOW_RUNTIME_GENERATED_QUESTIONS) {
       console.warn("Runtime generation is not implemented in this version to enforce static bank purity.");
    }
    
    // Filter out excluded questions (assessment + recent practice + session history)
    // CRITICAL POLICY ENFORCEMENT: Ensure we only pick statically generated questions
    const available = questions.filter(q => !excludeIds.has(q.id) && !q.isGenerated);

    if (available.length === 0) {
      // Reset history if we've seen all available questions within our content policy constraint
      const allStaticQuestions = questions.filter(q => !q.isGenerated);
      if (allStaticQuestions.length === 0) return null;
      return allStaticQuestions[Math.floor(Math.random() * allStaticQuestions.length)];
    }

    // When adaptive practice is disabled, return a simple random question from the pool.
    if (!ACTIVE_LAUNCH_FEATURES.adaptivePractice) {
      return available[Math.floor(Math.random() * available.length)];
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
      // Fallback to any available static question
      return available[Math.floor(Math.random() * available.length)];
    }

    // Also consider skill-level weaknesses
    if (weakestSkills.length > 0) {
      const skillCandidates = candidates.filter(q =>
        q.skillId && weakestSkills.includes(q.skillId)
      );

      if (skillCandidates.length > 0) {
        // Prefer foundational (anchor) questions for skills the user has seen fewer than 3 times.
        // This surfaces vetted entry-point questions before the full pool opens up.
        const lowAttemptSkills = new Set(
          Object.entries(profile.skillScores)
            .filter(([, s]) => s.attempts < 3)
            .map(([skillId]) => skillId)
        );
        const foundationalCandidates = skillCandidates.filter(
          q => q.isFoundational && q.skillId && lowAttemptSkills.has(q.skillId)
        );
        if (foundationalCandidates.length > 0) {
          return foundationalCandidates[Math.floor(Math.random() * foundationalCandidates.length)];
        }
        return skillCandidates[Math.floor(Math.random() * skillCandidates.length)];
      }
    }

    // For candidates outside the weakest-skill pool, still prefer foundational
    // questions on skills the user hasn't yet encountered (0 attempts).
    const unseenSkills = new Set(
      Object.entries(profile.skillScores)
        .filter(([, s]) => s.attempts === 0)
        .map(([skillId]) => skillId)
    );
    const unseenFoundational = candidates.filter(
      q => q.isFoundational && q.skillId && unseenSkills.has(q.skillId)
    );
    if (unseenFoundational.length > 0) {
      return unseenFoundational[Math.floor(Math.random() * unseenFoundational.length)];
    }

    // Random selection from candidates
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [getWeakestSkills]);

  return {
    selectNextQuestion,
    getWeakestSkills
  };
}
