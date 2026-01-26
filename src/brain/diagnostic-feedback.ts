// Diagnostic Feedback Engine - Provides detailed, framework-guided feedback
// Analyzes wrong answers, matches to error patterns, and provides adaptive coaching
// Part of Phase D Step 7: Build Diagnostic Feedback Engine

import { Question } from './question-analyzer';
import { PatternId } from './template-schema';
import { ERROR_LIBRARY, ErrorExplanation, FrameworkStepGuidance } from './error-library';
import { matchDistractorPattern } from './distractor-matcher';
import { FRAMEWORK_STEPS, getStepById } from './framework-definitions';
import { SkillId, getSkillById } from './skill-map';
import { LearningState, SkillPerformance, checkPrerequisitesMet } from './learning-state';
import { UserProfile } from '../hooks/useUserProgress';

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
function inferFrameworkStep(question: Question): string | null {
  const stem = question.question.toLowerCase();
  const rationale = question.rationale.toLowerCase();

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
    const skill = getSkillById(question.skillId);
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
  userProfile: UserProfile
): SkillGuidance | undefined {
  const skill = getSkillById(skillId);
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
        const prereqSkill = getSkillById(prereqId);
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
    if (skill.commonWrongRules && skill.commonWrongRules.length > 0) {
      remediationTips.push(`Remember: ${skill.commonWrongRules[0]}`);
    } else {
      remediationTips.push(`Focus on understanding the core concept: ${skill.description}`);
    }
  } else {
    // Show 2 advanced tips for proficient/mastery
    if (skill.commonWrongRules && skill.commonWrongRules.length >= 2) {
      remediationTips.push(`Advanced tip 1: ${skill.commonWrongRules[0]}`);
      remediationTips.push(`Advanced tip 2: ${skill.commonWrongRules[1]}`);
    } else if (skill.commonWrongRules && skill.commonWrongRules.length === 1) {
      remediationTips.push(`Advanced tip: ${skill.commonWrongRules[0]}`);
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

/**
 * Generate diagnostic feedback for a question response
 * Provides framework-guided, learning-state-aware feedback
 * 
 * @param question - The question that was answered
 * @param selectedAnswers - Array of selected answer letters (e.g., ["A"])
 * @param isCorrect - Whether the answer was correct
 * @param userProfile - User's learning profile with skill scores and learning states
 * @returns DiagnosticFeedback object with detailed feedback
 */
export function generateDiagnosticFeedback(
  question: Question,
  selectedAnswers: string[],
  isCorrect: boolean,
  userProfile: UserProfile
): DiagnosticFeedback {
  // Extract selected answer text
  const selectedAnswerText = selectedAnswers
    .map(letter => question.choices[letter] || '')
    .join(' ');

  // Handle correct answers
  if (isCorrect) {
    const skillGuidance = question.skillId 
      ? getSkillGuidance(question.skillId, userProfile)
      : undefined;

    const masteryStatus = skillGuidance
      ? `Current mastery: ${skillGuidance.currentState}`
      : 'Keep practicing to build mastery';

    const encouragingMessage = skillGuidance?.currentState === 'mastery'
      ? 'Excellent! You\'ve mastered this skill. Continue applying it consistently.'
      : skillGuidance?.currentState === 'proficient'
      ? 'Great work! You\'re demonstrating strong understanding of this concept.'
      : skillGuidance?.currentState === 'developing'
      ? 'Good progress! You\'re developing your understanding. Keep practicing.'
      : 'Correct! You\'re building foundational knowledge. Keep learning.';

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
    letter => !question.correct_answer.includes(letter)
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

  const distractorText = question.choices[wrongAnswer] || '';
  const correctAnswerText = question.correct_answer
    .map(letter => question.choices[letter] || '')
    .join(' ');

  // Match distractor pattern
  const patternId = matchDistractorPattern(distractorText, correctAnswerText);

  // Get error explanation from library
  const libEntry: ErrorExplanation | undefined = patternId 
    ? ERROR_LIBRARY[patternId] 
    : undefined;

  // Infer framework step
  const inferredStepId = inferFrameworkStep(question);
  const frameworkStep = inferredStepId ? getStepById(inferredStepId) : null;

  // Detect if user jumped to wrong step
  const userSelectedStep = detectUserSelectedStep(distractorText, patternId);

  // Build framework guidance
  let frameworkGuidance: FrameworkGuidance | null = null;
  let relationship = '';
  let nextSteps: string[] = [];

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
      const skillGuidance = getSkillGuidance(question.skillId, userProfile);
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
        .map(id => getStepById(id))
        .filter(Boolean)
        .map(step => step!.name);
      
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
    ? getSkillGuidance(question.skillId, userProfile)
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
    patternId: patternId || null,
    generalExplanation: libEntry?.generalExplanation || 
      'This answer is incorrect. Review the rationale to understand the correct approach.',
    frameworkGuidance,
    skillGuidance,
    remediationTips,
    selectedAnswerText
  };
}
