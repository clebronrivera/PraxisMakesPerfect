// Diagnostic Feedback Engine - Provides detailed, framework-guided feedback
// Analyzes wrong answers, matches to error patterns, and provides adaptive coaching
// Part of Phase D Step 7: Build Diagnostic Feedback Engine

import { Question, getQuestionChoiceText, getQuestionChoices, getQuestionCorrectAnswers } from './question-analyzer';
import { PatternId } from './template-schema';
import { ErrorExplanation, FrameworkStepGuidance } from './error-library';
import type { FrameworkStep } from './framework-definitions';
import { matchDistractorPattern } from './distractor-matcher';
import { SkillId } from './skill-map';
import { LearningState, SkillPerformance, checkPrerequisitesMet } from './learning-state';
import { UserProfile } from '../hooks/useProgressTracking';
import { EngineConfig } from '../types/engine';

export interface FrameworkGuidance {
  currentStepId: string | null;
  currentStepName: string | null;
  relationship: string;
  userSelectedStep?: string; // When distractor implies user jumped to different step
  nextSteps: string[];
}

export interface SkillGuidance {
  skillId: SkillId;
  currentState: LearningState;
  remediationTips: string[];
  prerequisiteCheck: {
    met: boolean;
    missingNames: string[];
  };
}

export interface DiagnosticFeedback {
  isCorrect: boolean;
  patternId: PatternId | null;
  generalExplanation: string;
  frameworkGuidance: FrameworkGuidance | null;
  skillGuidance?: SkillGuidance;
  remediationTips: string[];
  selectedAnswerText: string;
  masteryStatus?: string; // For correct answers: current mastery level
}

/**
 * Infer framework step from question context
 * Uses question stem, content, and skill domain to determine most likely framework step
 */
function inferFrameworkStep(question: Question, engineConfig: EngineConfig): string | null {
  const stem = question.question?.toLowerCase() || '';
  const rationale = question.rationale?.toLowerCase() || '';

  // Check for explicit step indicators in stem
  if (stem.includes('first step') || stem.includes('should first') || stem.includes('initial step')) {
    // Determine which framework's first step
    if (stem.includes('behavior') || stem.includes('fba') || rationale.includes('behavior')) {
      return 'behavior-identification';
    }
    if (stem.includes('consultation') || stem.includes('consultee')) {
      return 'consultee-identification';
    }
    if (stem.includes('eligibility') || stem.includes('evaluation') || stem.includes('referral')) {
      return 'referral-review';
    }
    return 'problem-identification';
  }

  // FBA recognition
  if (stem.includes('fba') || stem.includes('functional behavior') || rationale.includes('fba')) {
    return 'fba-recognition';
  }

  // Consultation type recognition
  if (stem.includes('consultation type') || stem.includes('type of consultation')) {
    return 'consultation-type-recognition';
  }

  // Data collection indicators
  if (stem.includes('collect data') || stem.includes('gather data') || stem.includes('baseline')) {
    if (stem.includes('abc') || stem.includes('antecedent') || stem.includes('consequence')) {
      return 'fba-data-collection';
    }
    if (stem.includes('eligibility') || stem.includes('evaluation')) {
      return 'eligibility-data-collection';
    }
    return 'data-collection';
  }

  // Analysis indicators
  if (stem.includes('analyze') || stem.includes('interpret') || stem.includes('examine data')) {
    if (stem.includes('abc') || stem.includes('function')) {
      return 'abc-analysis';
    }
    if (stem.includes('eligibility')) {
      return 'eligibility-analysis';
    }
    return 'analysis';
  }

  // Intervention indicators
  if (stem.includes('intervention') || stem.includes('implement') || stem.includes('select strategy')) {
    if (stem.includes('behavior') || stem.includes('bip')) {
      return 'intervention-design';
    }
    if (stem.includes('consultation')) {
      return 'consultation-planning';
    }
    return 'intervention-selection';
  }

  // Assessment selection
  if (stem.includes('select assessment') || stem.includes('appropriate assessment') || stem.includes('which assessment')) {
    return 'assessment-selection';
  }

  // Progress monitoring
  if (stem.includes('progress monitoring') || stem.includes('monitor progress') || stem.includes('track growth')) {
    return 'progress-monitoring';
  }

  // Default based on domain (if skillId available)
  if (question.skillId) {
    const skill = engineConfig.skills.find((s: any) => s.id === question.skillId);
    if (skill) {
      // Domain-based defaults
      const domainPrefix = question.skillId.split('-')[0];
      if (domainPrefix === 'DBDM') return 'data-collection';
      if (domainPrefix === 'MBH') return 'fba-recognition';
      if (domainPrefix === 'CC') return 'consultation-type-recognition';
      if (domainPrefix === 'LEG') return 'referral-review';
    }
  }

  return null;
}

/**
 * Detect if distractor implies user jumped to wrong framework step
 * Returns the step ID the user likely selected incorrectly
 */
function detectUserSelectedStep(distractorText: string, patternId: PatternId | null): string | undefined {
  if (!patternId) return undefined;

  const text = distractorText.toLowerCase();

  // Premature action often means user jumped to intervention
  if (patternId === 'premature-action') {
    if (text.includes('implement') || text.includes('intervention') || text.includes('action')) {
      return 'intervention-selection';
    }
    if (text.includes('contact') || text.includes('refer')) {
      return 'intervention-selection';
    }
  }

  // Sequence error might indicate wrong step in sequence
  if (patternId === 'sequence-error') {
    if (text.includes('before') || text.includes('first')) {
      // User might have selected a later step when earlier was needed
      return 'intervention-selection';
    }
  }

  return undefined;
}

/**
 * Get skill guidance including learning state and prerequisites
 */
function getSkillGuidance(
  skillId: SkillId,
  userProfile: UserProfile,
  engineConfig: EngineConfig
): SkillGuidance | undefined {
  const skill = engineConfig.skills.find((s: any) => s.id === skillId);
  if (!skill) return undefined;

  const skillPerformance = userProfile.skillScores[skillId];
  const currentState: LearningState = skillPerformance?.learningState || 'emerging';

  // Check prerequisites
  const skillPerformanceLookup = (id: SkillId): SkillPerformance | undefined => {
    return userProfile.skillScores[id];
  };

  const prerequisitesMet = checkPrerequisitesMet(skillId, skillPerformanceLookup);
  const missingPrerequisites: string[] = [];

  if (!prerequisitesMet && skill.prerequisites) {
    for (const prereqId of skill.prerequisites) {
      const prereqPerf = userProfile.skillScores[prereqId];
      if (!prereqPerf || prereqPerf.learningState !== 'mastery') {
        const prereqSkill = engineConfig.skills.find((s: any) => s.id === prereqId);
        if (prereqSkill) {
          missingPrerequisites.push(prereqSkill.name);
        }
      }
    }
  }

  // State-aware remediation tips
  const remediationTips: string[] = [];
  
  if (currentState === 'emerging' || currentState === 'developing') {
    // Show 1 simple tip for emerging/developing
    const skillAny = skill as any;
    if (skillAny.commonWrongRules && skillAny.commonWrongRules.length > 0) {
      remediationTips.push(`Remember: ${skillAny.commonWrongRules[0]}`);
    } else {
      remediationTips.push(`Focus on understanding the core concept: ${skillAny.description || skill.name}`);
    }
  } else {
    // Show 2 advanced tips for proficient/mastery
    const skillAny = skill as any;
    if (skillAny.commonWrongRules && skillAny.commonWrongRules.length >= 2) {
      remediationTips.push(`Advanced tip 1: ${skillAny.commonWrongRules[0]}`);
      remediationTips.push(`Advanced tip 2: ${skillAny.commonWrongRules[1]}`);
    } else if (skillAny.commonWrongRules && skillAny.commonWrongRules.length === 1) {
      remediationTips.push(`Advanced tip: ${skillAny.commonWrongRules[0]}`);
      remediationTips.push(`Apply this skill in varied contexts to deepen understanding`);
    } else {
      remediationTips.push(`You're doing well! Continue applying this skill consistently`);
      remediationTips.push(`Consider exploring advanced applications of this concept`);
    }
  }

  return {
    skillId,
    currentState,
    remediationTips,
    prerequisiteCheck: {
      met: prerequisitesMet,
      missingNames: missingPrerequisites
    }
  };
}

// ─── Correct-answer message pools ────────────────────────────────────────────
// Keyed by LearningState. Rotated by (skillCorrectCount % pool.length) so the
// same state never shows the same phrase two questions in a row.
const CORRECT_MESSAGE_POOLS: Record<string, string[]> = {
  mastery: [
    "You've mastered this skill. Keep applying it across different contexts.",
    "Mastery level — this one is locked in.",
    "Consistent and correct. That is what mastery looks like.",
    "This skill is yours. Now help it stay sharp.",
    "Flawless execution. Your foundational knowledge is incredibly strong here.",
    "Nailed it. You've clearly put the work in on this concept.",
    "Another perfect repetition. Your mastery of this skill is evident.",
    "Expert level achieved. You could teach this concept to someone else.",
  ],
  proficient: [
    "Strong understanding showing here. Keep building on it.",
    "Solid. You're demonstrating real command of this concept.",
    "That is proficient-level performance. Keep the pressure on.",
    "You're above the threshold on this one. Push to make it permanent.",
    "Great job. You are very close to full mastery.",
    "Correct. Your reasoning patterns are aligning perfectly.",
    "Well done! You've got a firm grasp on the core ideas.",
    "Spot on. Your proficiency with this material is growing fast.",
  ],
  developing: [
    "Good progress — you're developing your understanding here.",
    "Getting sharper on this skill. Stay consistent.",
    "You're on the right side of this one. Keep going.",
    "That is developing-level work. One more layer and this clicks fully.",
    "Correct! Every right answer builds stronger pathways.",
    "Nice work. The concepts are starting to connect for you.",
    "That's it. Keep applying these strategies, and it will become second nature.",
    "Well executed. You're bridging the gap toward deeper understanding.",
  ],
  emerging: [
    "Correct. You're building foundational knowledge here — keep going.",
    "Right answer. Stay in it and the pattern will solidify.",
    "Correct. Repetition is what locks foundational skills in.",
    "That's one more brick. Foundation skills take reps — you're putting them in.",
    "Correct. Even if it felt uncertain, the answer was right.",
    "Correct. The more you see this, the more it sticks.",
    "That one's in the bank. Keep building.",
    "Correct. Foundation building takes reps.",
  ],
};

/**
 * Generate diagnostic feedback for a question response.
 * Provides framework-guided, learning-state-aware feedback.
 *
 * @param question - The question that was answered
 * @param selectedAnswers - Array of selected answer letters (e.g., ["A"])
 * @param isCorrect - Whether the answer was correct
 * @param userProfile - User's learning profile with skill scores and learning states
 * @param engineConfig - Engine configuration (distractor patterns, framework steps, etc.)
 * @returns DiagnosticFeedback object with detailed feedback
 */
export function generateDiagnosticFeedback(
  question: Question,
  selectedAnswers: string[],
  isCorrect: boolean,
  userProfile: UserProfile,
  engineConfig: EngineConfig
): DiagnosticFeedback {
  const choices = getQuestionChoices(question);
  const correctAnswers = getQuestionCorrectAnswers(question);

  // Extract selected answer text
  const selectedAnswerText = selectedAnswers
    .map(letter => getQuestionChoiceText({ choices }, letter))
    .join(' ');

  // Handle correct answers
  if (isCorrect) {
    const skillGuidance = question.skillId
      ? getSkillGuidance(question.skillId as SkillId, userProfile, engineConfig)
      : undefined;

    const masteryStatus = skillGuidance
      ? `Current mastery: ${skillGuidance.currentState}`
      : 'Keep practicing to build mastery';

    const state = skillGuidance?.currentState ?? 'emerging';
    const pool = CORRECT_MESSAGE_POOLS[state] ?? CORRECT_MESSAGE_POOLS.emerging;

    // Use total correct attempts on this skill (if available) as a simple seed
    // so consecutive questions don't repeat the same phrase.
    const skillAttempts = question.skillId
      ? (userProfile.skillScores[question.skillId]?.correct ?? 0)
      : 0;
    const encouragingMessage = pool[skillAttempts % pool.length];

    return {
      isCorrect: true,
      patternId: null,
      generalExplanation: encouragingMessage,
      frameworkGuidance: null,
      skillGuidance,
      remediationTips: skillGuidance?.remediationTips || [],
      selectedAnswerText,
      masteryStatus
    };
  }

  // Handle incorrect answers - extract distractor text
  const wrongAnswer = selectedAnswers.find(
    letter => !correctAnswers.includes(letter)
  );

  if (!wrongAnswer) {
    // Fallback: no wrong answer found (shouldn't happen, but handle gracefully)
    return {
      isCorrect: false,
      patternId: null,
      generalExplanation: 'Your answer was incorrect. Review the rationale to understand the correct approach.',
      frameworkGuidance: null,
      remediationTips: ['Review the question and rationale carefully', 'Consider the framework steps involved'],
      selectedAnswerText
    };
  }

  const distractorText = getQuestionChoiceText({ choices }, wrongAnswer);
  const correctAnswerText = correctAnswers
    .map(letter => getQuestionChoiceText({ choices }, letter))
    .join(' ');

  // Match distractor pattern
  const patternId = matchDistractorPattern(distractorText, correctAnswerText, engineConfig.distractorPatterns);

  // Get error explanation from library
  const libEntry: ErrorExplanation | undefined = patternId && engineConfig.errorLibrary
    ? engineConfig.errorLibrary[patternId] 
    : undefined;

  // Infer framework step
  const inferredStepId = inferFrameworkStep(question, engineConfig);
  const frameworkStep = inferredStepId && engineConfig.frameworkSteps ? engineConfig.frameworkSteps[inferredStepId] : null;

  // Detect if user jumped to wrong step
  const userSelectedStep = detectUserSelectedStep(distractorText, patternId as PatternId | null);

  // Build framework guidance
  let frameworkGuidance: FrameworkGuidance | null = null;
  let relationship: string;
  let nextSteps: string[];

  if (frameworkStep && libEntry) {
    // Find matching framework step guidance
    const stepGuidance = libEntry.frameworkStepGuidance?.find(
      (g: FrameworkStepGuidance) => g.stepId === inferredStepId
    );

    relationship = stepGuidance?.relationship || libEntry.generalExplanation;
    
    // Build next steps
    nextSteps = [];
    
    // Add prerequisite check if skill has prerequisites
    if (question.skillId) {
      const skillGuidance = getSkillGuidance(question.skillId as SkillId, userProfile, engineConfig);
      if (skillGuidance && !skillGuidance.prerequisiteCheck.met) {
        const missingNames = skillGuidance.prerequisiteCheck.missingNames;
        if (missingNames.length > 0) {
          nextSteps.push(`Review foundational skills: ${missingNames.join(', ')}`);
        }
      }
    }

    // Add framework-specific next steps
    if (frameworkStep.prerequisiteSteps && frameworkStep.prerequisiteSteps.length > 0) {
      const prereqSteps = frameworkStep.prerequisiteSteps
        .map((id: string) => engineConfig.frameworkSteps ? engineConfig.frameworkSteps[id] : null)
        .filter(Boolean)
        .map((step: FrameworkStep | null) => step!.name);
      
      if (prereqSteps.length > 0) {
        nextSteps.push(`Ensure you've completed: ${prereqSteps.join(' → ')}`);
      }
    }

    // Add general next steps from remediation tips
    if (libEntry.remediationTips && libEntry.remediationTips.length > 0) {
      nextSteps.push(...libEntry.remediationTips.slice(0, 2)); // Limit to 2 tips
    }

    frameworkGuidance = {
      currentStepId: inferredStepId,
      currentStepName: frameworkStep.name,
      relationship,
      userSelectedStep,
      nextSteps
    };
  } else if (libEntry) {
    // Have error explanation but no framework step
    relationship = libEntry.generalExplanation;
    nextSteps = libEntry.remediationTips?.slice(0, 2) || [];
    
    frameworkGuidance = {
      currentStepId: null,
      currentStepName: null,
      relationship,
      nextSteps
    };
  }

  // Get skill guidance
  const skillGuidance = question.skillId 
    ? getSkillGuidance(question.skillId as SkillId, userProfile, engineConfig)
    : undefined;

  // Combine remediation tips (prioritize error library, then skill guidance)
  const remediationTips: string[] = [];
  
  if (libEntry?.remediationTips) {
    // State-aware tip selection
    if (skillGuidance) {
      const state = skillGuidance.currentState;
      if (state === 'emerging' || state === 'developing') {
        // Show 1 simple tip
        if (libEntry.remediationTips.length > 0) {
          remediationTips.push(libEntry.remediationTips[0]);
        }
      } else {
        // Show 2 advanced tips
        remediationTips.push(...libEntry.remediationTips.slice(0, 2));
      }
    } else {
      // No skill guidance, show first tip
      remediationTips.push(...libEntry.remediationTips.slice(0, 1));
    }
  }

  // Add skill-specific remediation if available
  if (skillGuidance && skillGuidance.remediationTips.length > 0) {
    remediationTips.push(...skillGuidance.remediationTips);
  }

  // Fallback if no tips found
  if (remediationTips.length === 0) {
    remediationTips.push('Review the question and rationale carefully');
    remediationTips.push('Consider what framework steps apply to this situation');
  }

  return {
    isCorrect: false,
    patternId: (patternId as PatternId) || null,
    generalExplanation: libEntry?.generalExplanation || 
      'This answer is incorrect. Review the rationale to understand the correct approach.',
    frameworkGuidance,
    skillGuidance,
    remediationTips,
    selectedAnswerText
  };
}
