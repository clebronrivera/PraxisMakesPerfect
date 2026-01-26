// Error Library - Provides detailed explanations for error patterns
// Links distractor patterns to framework steps for adaptive coaching feedback
// Part of Phase D Step 2: Build Error Library

import { PatternId } from './template-schema';
import { FRAMEWORK_STEPS } from './framework-definitions';

export interface FrameworkStepGuidance {
  stepId: string;
  relationship: string; // How the error relates to this step
}

export interface ErrorExplanation {
  patternId: PatternId;
  generalExplanation: string; // Why this error type is wrong
  frameworkStepGuidance: FrameworkStepGuidance[]; // How error relates to framework steps
  remediationTips: string[]; // What to do differently
}

/**
 * Error Library - Detailed explanations for priority error patterns
 * Maps error patterns to framework steps for adaptive coaching
 * Currently contains 6 priority patterns; additional patterns can be added as needed
 */
export const ERROR_LIBRARY: Partial<Record<PatternId, ErrorExplanation>> = {
  // Pattern 1: Premature Action (covers "jumped-to-solution")
  "premature-action": {
    patternId: "premature-action",
    generalExplanation: "This error occurs when you skip the crucial first step of problem identification or data collection and jump directly to implementing a solution. School psychology practice requires understanding the problem before taking action. You're essentially trying to solve a problem you haven't fully identified or assessed yet.",
    frameworkStepGuidance: [
      {
        stepId: "problem-identification",
        relationship: "This error skips this foundational step entirely. You're jumping to action without first identifying and defining the problem. Always start by asking: 'What exactly is the problem I'm trying to solve?'"
      },
      {
        stepId: "data-collection",
        relationship: "This error bypasses data collection. You're making decisions without gathering the necessary information first. Remember: data informs decisions, not assumptions."
      },
      {
        stepId: "intervention-selection",
        relationship: "This error jumps directly to this step without completing prerequisite analysis. Interventions selected without proper assessment are unlikely to be effective and may even be harmful. You must understand the problem before selecting solutions."
      },
      {
        stepId: "behavior-identification",
        relationship: "This error occurs when you skip clearly defining the behavior and jump to intervention. You cannot effectively address a behavior you haven't operationally defined."
      },
      {
        stepId: "fba-data-collection",
        relationship: "This error skips ABC data collection and jumps to intervention. Without understanding antecedents, behaviors, and consequences, any intervention is guesswork."
      },
      {
        stepId: "problem-clarification",
        relationship: "This error occurs when you skip clarifying the problem with the consultee and jump to solutions. Consultation requires mutual understanding before action."
      },
      {
        stepId: "referral-review",
        relationship: "This error occurs when you skip reviewing the referral and background information before proceeding. You need context before making decisions."
      }
    ],
    remediationTips: [
      "Always ask: 'What do I need to know before I act?'",
      "Start with assessment, observation, or data review - never skip to intervention",
      "If a question asks for the 'first step', look for answers involving gathering information, not taking action",
      "Remember the sequence: Assessment → Analysis → Intervention (in that order)",
      "Look for action verbs like 'implement', 'contact', 'refer' - these often indicate premature action",
      "When you see a problem, resist the urge to immediately solve it. First, understand it completely."
    ]
  },

  // Pattern 2: Role Confusion
  "role-confusion": {
    patternId: "role-confusion",
    generalExplanation: "This error occurs when you select actions that belong to another professional's role (teacher, administrator, medical professional, parent). School psychologists consult, collaborate, and assess - they don't take over other professionals' responsibilities. This error reflects a misunderstanding of the school psychologist's scope of practice.",
    frameworkStepGuidance: [
      {
        stepId: "consultee-identification",
        relationship: "This error suggests confusion about who should perform actions. School psychologists identify consultees (teachers, parents, administrators) to collaborate with, not to replace. The consultee implements interventions; the psychologist supports them."
      },
      {
        stepId: "consultation-planning",
        relationship: "This error occurs when planning interventions that exceed the school psychologist's role. Consultation involves supporting others to implement interventions, not doing their jobs. School psychologists don't teach, discipline, or provide direct instruction - they help others do so effectively."
      },
      {
        stepId: "intervention-selection",
        relationship: "This error occurs when selecting interventions that require the school psychologist to take over another professional's role. Interventions should be implemented by the appropriate professional (teacher, parent, administrator) with psychologist support."
      }
    ],
    remediationTips: [
      "Ask: 'Is this action within a school psychologist's scope of practice?'",
      "School psychologists consult and support - they don't teach, prescribe medication, or make disciplinary decisions",
      "Look for answers that involve collaboration, consultation, or assessment rather than direct service provision",
      "Remember: School psychologists empower others to implement interventions, they don't implement them directly",
      "If an answer involves 'taking over teaching' or 'prescribing', it's likely role confusion",
      "School psychologists assess, consult, and collaborate - they don't replace other professionals"
    ]
  },

  // Pattern 3: Sequence Error
  "sequence-error": {
    patternId: "sequence-error",
    generalExplanation: "This error occurs when you get the order or sequence of steps wrong. The elements may be correct, but their sequence matters critically in school psychology practice - processes must be followed in the proper order. Getting the sequence wrong can lead to ineffective interventions, wasted time, or even harm.",
    frameworkStepGuidance: [
      {
        stepId: "problem-identification",
        relationship: "This must come first in any problem-solving process. If you're doing other steps before identifying the problem, you have a sequence error. You cannot collect data, analyze, or intervene without first knowing what problem you're addressing."
      },
      {
        stepId: "data-collection",
        relationship: "This must come after problem identification but before analysis. Collecting data before defining the problem is a sequence error - you won't know what data to collect. Analyzing before collecting data is also a sequence error - you need data to analyze."
      },
      {
        stepId: "analysis",
        relationship: "This must come after data collection. Analyzing before collecting data is a sequence error - you cannot analyze what you haven't collected. This step requires the data from the previous step."
      },
      {
        stepId: "intervention-selection",
        relationship: "This must come after analysis. Selecting interventions before understanding the problem is a sequence error. Interventions must be matched to the identified problem and analysis - you can't match what you haven't identified."
      },
      {
        stepId: "progress-monitoring",
        relationship: "This must come after intervention selection. You cannot monitor progress on an intervention that hasn't been selected and implemented yet."
      },
      {
        stepId: "behavior-identification",
        relationship: "This must come first in FBA. You cannot collect ABC data, analyze function, or design interventions without first clearly identifying the target behavior."
      },
      {
        stepId: "fba-data-collection",
        relationship: "This must come after behavior identification but before ABC analysis. You need to identify what behavior to observe before you can collect ABC data on it."
      },
      {
        stepId: "abc-analysis",
        relationship: "This must come after FBA data collection. You cannot analyze ABC patterns without first collecting ABC data."
      },
      {
        stepId: "function-hypothesis",
        relationship: "This must come after ABC analysis. You cannot hypothesize about function without first analyzing the ABC data patterns."
      },
      {
        stepId: "intervention-design",
        relationship: "This must come after function hypothesis. You cannot design an intervention that matches function without first identifying the function."
      },
      {
        stepId: "consultee-identification",
        relationship: "This must come first in consultation. You need to identify who needs consultation before you can clarify problems, set goals, or plan interventions."
      },
      {
        stepId: "problem-clarification",
        relationship: "This must come after consultee identification but before goal setting. You need to clarify the problem before you can set goals to address it."
      },
      {
        stepId: "goal-setting",
        relationship: "This must come after problem clarification but before planning. You need clear goals before you can plan how to achieve them."
      },
      {
        stepId: "consultation-planning",
        relationship: "This must come after goal setting. You cannot plan interventions without first knowing what goals you're trying to achieve."
      },
      {
        stepId: "referral-review",
        relationship: "This must come first in eligibility determination. You need to review the referral before selecting assessments, collecting data, or making determinations."
      },
      {
        stepId: "assessment-selection",
        relationship: "This must come after referral review but before data collection. You need to select what assessments to use before you can collect data using them."
      },
      {
        stepId: "eligibility-data-collection",
        relationship: "This must come after assessment selection but before analysis. You need to collect data before you can analyze it."
      },
      {
        stepId: "eligibility-analysis",
        relationship: "This must come after data collection but before determination. You need to analyze the data before making an eligibility determination."
      },
      {
        stepId: "determination",
        relationship: "This must come last, after all data has been collected and analyzed. You cannot determine eligibility without comprehensive evaluation data."
      }
    ],
    remediationTips: [
      "Memorize the framework sequences: Problem → Data → Analysis → Intervention → Monitoring → Evaluation",
      "When questions ask about order, think about prerequisites: 'What must happen first?'",
      "If a step requires information from a previous step, it cannot come before that step",
      "Practice identifying which steps are prerequisites for others",
      "Remember: You cannot analyze what you haven't collected, and you cannot intervene on what you haven't analyzed",
      "For FBA: Behavior → ABC Data → Analysis → Function → Intervention",
      "For Consultation: Consultee → Problem → Goals → Planning → Evaluation",
      "For Eligibility: Referral → Assessment Selection → Data Collection → Analysis → Determination"
    ]
  },

  // Pattern 4: Similar Concept (covers "concept-confusion")
  "similar-concept": {
    patternId: "similar-concept",
    generalExplanation: "This error occurs when you confuse related concepts from the same category. The concepts are similar and may even be related, but they don't match the specific context or question being asked. This often happens with technical terms, assessment types, intervention tiers, or legal concepts that share characteristics but have distinct applications.",
    frameworkStepGuidance: [
      {
        stepId: "fba-recognition",
        relationship: "This error occurs when confusing FBA with other assessment types (e.g., functional analysis, comprehensive evaluation). While related, FBA has specific components and purposes that distinguish it from other assessments."
      },
      {
        stepId: "consultation-type-recognition",
        relationship: "This error occurs when confusing different consultation types (behavioral vs. mental health vs. organizational). While all are consultation, each has distinct characteristics, purposes, and techniques."
      },
      {
        stepId: "assessment-selection",
        relationship: "This error occurs when selecting related but incorrect assessment types. For example, confusing screening tools with diagnostic assessments, or progress monitoring tools with comprehensive evaluations. Each serves a different purpose."
      }
    ],
    remediationTips: [
      "Read questions carefully to identify the specific context or purpose being asked about",
      "When you see related concepts, ask: 'What makes this specific context unique?'",
      "Study concept distinctions: reliability types (test-retest vs. interobserver), validity types (content vs. construct), intervention tiers (Tier 2 vs. Tier 3)",
      "Pay attention to specific details in the question that indicate which concept is appropriate",
      "If two concepts seem similar, identify what distinguishes them - that's usually what the question is testing",
      "Create mental maps of related concepts and their distinguishing characteristics",
      "Practice distinguishing between similar concepts in the same category"
    ]
  },

  // Pattern 5: Context Mismatch
  "context-mismatch": {
    patternId: "context-mismatch",
    generalExplanation: "This error occurs when you select a correct approach or concept, but it's wrong for the specific context or situation described. The approach itself is valid and evidence-based, but it doesn't match the purpose, setting, or requirements of this particular situation. This is different from similar-concept errors because the concept itself is correct - it's just applied incorrectly.",
    frameworkStepGuidance: [
      {
        stepId: "data-collection",
        relationship: "This error occurs when selecting data collection methods that don't match the context. For example, using comprehensive evaluation tools for progress monitoring, or using screening tools for eligibility determination. The tool is valid, but wrong for this purpose."
      },
      {
        stepId: "intervention-selection",
        relationship: "This error occurs when selecting interventions that are evidence-based but don't match the specific context. For example, selecting a Tier 3 intervention for a Tier 1 problem, or selecting a group intervention when individual is needed. The intervention is valid, but wrong for this situation."
      },
      {
        stepId: "assessment-selection",
        relationship: "This error occurs when selecting assessments that are valid but wrong for the specific purpose. For example, using CBM for comprehensive evaluation (CBM is for progress monitoring), or using screening tools for eligibility (screening identifies risk, not eligibility)."
      },
      {
        stepId: "fba-recognition",
        relationship: "This error occurs when recognizing FBA components but applying them to the wrong context. FBA is for understanding behavior function, not for academic assessment or eligibility determination."
      },
      {
        stepId: "consultation-type-recognition",
        relationship: "This error occurs when selecting consultation types that are valid but don't match the specific problem context. For example, using behavioral consultation for a mental health issue, or organizational consultation for an individual student problem."
      }
    ],
    remediationTips: [
      "Always match the approach to the specific purpose described in the question",
      "Ask: 'What is the goal here?' - screening, progress monitoring, eligibility, intervention?",
      "Consider the context: individual vs. group, Tier 1 vs. Tier 2 vs. Tier 3, prevention vs. intervention vs. evaluation",
      "Remember: CBM is for progress monitoring, not comprehensive evaluation",
      "Remember: Screening identifies risk, not eligibility",
      "Remember: Group-administered tools for screening, individual for evaluation",
      "Match intervention intensity to problem severity and student needs",
      "Consider the setting and resources available when selecting approaches"
    ]
  },

  // Pattern 6: Definition Error (NEW pattern)
  "definition-error": {
    patternId: "definition-error",
    generalExplanation: "This error occurs when you misunderstand or misapply the definition of a key term, concept, or principle. Unlike similar-concept errors (confusing related concepts) or context-mismatch errors (correct concept, wrong application), definition errors reflect a fundamental misunderstanding of what a term means or how it's defined in school psychology practice. This can involve technical terms, legal definitions, assessment concepts, or professional standards.",
    frameworkStepGuidance: [
      {
        stepId: "problem-identification",
        relationship: "This error occurs when misdefining what constitutes a 'problem' or 'concern'. Problems must be specific, observable, and measurable - not vague or subjective. Misunderstanding problem definition leads to ineffective problem-solving."
      },
      {
        stepId: "behavior-identification",
        relationship: "This error occurs when misdefining behavior. Behaviors must be operationalized - defined in observable, measurable terms. Misunderstanding behavioral definitions leads to ineffective FBAs and interventions."
      },
      {
        stepId: "function-hypothesis",
        relationship: "This error occurs when misdefining behavior functions (attention, escape, tangible, sensory). Each function has a specific definition based on what maintains the behavior. Misunderstanding function definitions leads to incorrect hypotheses and ineffective interventions."
      },
      {
        stepId: "goal-setting",
        relationship: "This error occurs when misdefining what constitutes a 'goal' in consultation. Goals must be specific, measurable, achievable, relevant, and time-bound (SMART). Misunderstanding goal definitions leads to unclear consultation outcomes."
      },
      {
        stepId: "determination",
        relationship: "This error occurs when misdefining eligibility criteria or legal definitions (e.g., FAPE, LRE, disability categories). Legal and professional definitions have specific meanings that must be understood precisely."
      },
      {
        stepId: "fba-recognition",
        relationship: "This error occurs when misdefining what FBA is or what it includes. FBA has a specific definition and set of components. Misunderstanding the definition leads to confusion with other assessment types."
      },
      {
        stepId: "consultation-type-recognition",
        relationship: "This error occurs when misdefining consultation types. Each type (behavioral, mental health, organizational, multicultural, conjoint) has specific definitions and characteristics. Misunderstanding definitions leads to selecting wrong consultation types."
      },
      {
        stepId: "assessment-selection",
        relationship: "This error occurs when misdefining assessment types or terms (e.g., reliability vs. validity, sensitivity vs. specificity, screening vs. evaluation). Technical definitions matter - misunderstanding them leads to wrong assessment selections."
      }
    ],
    remediationTips: [
      "Study precise definitions of key terms - don't rely on general understanding",
      "Memorize technical definitions: reliability (consistency), validity (accuracy), sensitivity (true positives), specificity (true negatives)",
      "Learn legal definitions precisely: FAPE (appropriate, not optimal), LRE (least restrictive, not most inclusive)",
      "Understand operational definitions: behaviors must be observable and measurable",
      "Know function definitions: attention (getting attention), escape (avoiding/removing), tangible (getting items), sensory (automatic reinforcement)",
      "Study assessment term definitions: screening (identifies risk), evaluation (determines eligibility), progress monitoring (tracks growth)",
      "When you see a definition question, recall the precise definition, not a general understanding",
      "Create flashcards for key definitions and review them regularly",
      "Pay attention to subtle differences in definitions - they often distinguish correct from incorrect answers"
    ]
  }
};

/**
 * Get error explanation for a specific pattern
 * @param patternId - The error pattern identifier
 * @returns ErrorExplanation if found, null otherwise
 */
export function getErrorExplanation(patternId: PatternId): ErrorExplanation | null {
  return ERROR_LIBRARY[patternId] || null;
}

/**
 * Get framework steps where a specific error pattern commonly occurs
 * @param patternId - The error pattern identifier
 * @returns Array of framework steps with their relationships to the error
 */
export function getFrameworkStepsForError(patternId: PatternId): FrameworkStepGuidance[] {
  const explanation = getErrorExplanation(patternId);
  return explanation?.frameworkStepGuidance || [];
}

/**
 * Get all framework steps that commonly have a specific error pattern
 * Based on FRAMEWORK_STEPS.commonErrors arrays
 * @param patternId - The error pattern identifier
 * @returns Array of framework step IDs where this error is common
 */
export function getStepsWithError(patternId: PatternId): string[] {
  const steps: string[] = [];
  
  for (const [stepId, step] of Object.entries(FRAMEWORK_STEPS)) {
    if (step.commonErrors.includes(patternId)) {
      steps.push(stepId);
    }
  }
  
  return steps;
}
