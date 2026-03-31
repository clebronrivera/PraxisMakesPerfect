import { useCallback } from 'react';
import type { SkillPerformance } from '../brain/learning-state';
import { computeFragilityFlag } from '../brain/learning-state';
import { UserProfile } from './useProgressTracking';
import { AnalyzedQuestion } from '../brain/question-analyzer';
import { CONTENT_POLICY } from '../config/content-policy';
import { ACTIVE_LAUNCH_FEATURES } from '../utils/launchConfig';
import { filterByPreferredTier } from '../utils/questionDifficulty';

export function useAdaptiveLearning() {
  // Question history is managed by components, not the hook

  /**
   * Calculate priority for a skill using additive signal model.
   * Signals: score band, recentHighConfidenceWrongCount (Rule 1), fragilityFlag (Rule 2),
   * SRS overdue review (Rule 3).
   * confidenceFlags (lifetime count) is retained on SkillPerformance but no longer drives priority.
   */
  const calculateSkillPriority = useCallback((skill: SkillPerformance): number => {
    if (!skill || skill.attempts === 0) return 2;
    const score = skill.score ?? 0;
    let priority = 0;
    // Base: accuracy band
    if (score < 0.6) priority += 3;
    else if (score < 0.8) priority += 2;
    else priority += 1;
    // Rule 1: recent high-confidence wrong answers (rolling 10-window)
    const hcw = skill.recentHighConfidenceWrongCount ?? 0;
    if (hcw >= 2) priority += 2.0;
    else if (hcw === 1) priority += 1.0;
    // Rule 2: fragility — correct but low confidence (softer signal, +1.0)
    if (skill.attemptHistory && computeFragilityFlag(skill.attemptHistory)) {
      priority += 1.0;
    }
    // Rule 3: SRS overdue review — skill is past its scheduled review date (+1.5)
    // The SRS engine persists nextReviewDate on every answer via useProgressTracking.
    // When overdue, the adaptive system silently surfaces this skill more often.
    const today = new Date().toISOString().slice(0, 10);
    if (skill.nextReviewDate && skill.nextReviewDate <= today) {
      priority += 1.5;
    }
    return priority;
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
    history: string[],
    redemptionBlacklistIds?: Set<string>
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

    // Exclude questions quarantined in Redemption — these must NEVER appear
    // in normal practice, including pool-exhaustion fallbacks.
    if (redemptionBlacklistIds) {
      redemptionBlacklistIds.forEach(id => excludeIds.add(id));
    }
    
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
      // Reset history if we've seen all available questions within our content policy constraint.
      // CRITICAL: quarantined IDs must never be reintroduced, even on pool exhaustion.
      const allStaticQuestions = questions.filter(q =>
        !q.isGenerated && !(redemptionBlacklistIds?.has(q.id))
      );
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
        // Step 8: Difficulty-tier routing — prefer Recall for skills < 40% accuracy,
        // Application for skills >= 40%. Falls back to full skillCandidates if the
        // preferred tier has no questions (e.g. skill has only one complexity type).
        const minSkillAccuracy = Math.min(
          ...skillCandidates.map(q =>
            q.skillId ? (profile.skillScores[q.skillId]?.score ?? 0) : 0
          )
        );
        const tieredCandidates = filterByPreferredTier(skillCandidates, minSkillAccuracy);
        return tieredCandidates[Math.floor(Math.random() * tieredCandidates.length)];
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
