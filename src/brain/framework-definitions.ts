// Framework Definitions - Defines the 4 main frameworks used in school psychology practice
// Each framework has distinct steps that guide professional decision-making

import { PatternId } from './template-schema';

export type FrameworkType = 'problem-solving' | 'fba' | 'consultation' | 'eligibility';

export interface FrameworkStep {
  stepId: string;
  name: string;
  description: string;
  order: number;
  frameworkType: FrameworkType;
  commonErrors: PatternId[]; // Which error patterns are common at this step
  prerequisiteSteps?: string[]; // Steps that should come before this
}

export const FRAMEWORK_STEPS: Record<string, FrameworkStep> = {
  // Problem-Solving Framework (MTSS/RTI)
  'problem-identification': {
    stepId: 'problem-identification',
    name: 'Problem Identification',
    description: 'Identify and define the specific problem or concern that needs to be addressed. This involves gathering initial information, reviewing referral data, and clarifying the nature of the problem.',
    order: 1,
    frameworkType: 'problem-solving',
    commonErrors: ['premature-action', 'data-ignorance', 'incomplete-response'],
    prerequisiteSteps: []
  },
  'data-collection': {
    stepId: 'data-collection',
    name: 'Data Collection',
    description: 'Systematically gather relevant data to understand the problem. This includes reviewing existing records, conducting observations, collecting baseline data, and using appropriate assessment tools.',
    order: 2,
    frameworkType: 'problem-solving',
    commonErrors: ['premature-action', 'data-ignorance', 'context-mismatch'],
    prerequisiteSteps: ['problem-identification']
  },
  'analysis': {
    stepId: 'analysis',
    name: 'Problem Analysis',
    description: 'Analyze the collected data to identify patterns, root causes, and contributing factors. This involves interpreting assessment results, identifying skill deficits, and understanding the context of the problem.',
    order: 3,
    frameworkType: 'problem-solving',
    commonErrors: ['correlation-as-causation', 'data-ignorance', 'incomplete-response'],
    prerequisiteSteps: ['data-collection']
  },
  'intervention-selection': {
    stepId: 'intervention-selection',
    name: 'Intervention Selection',
    description: 'Select evidence-based interventions that match the identified problem and student needs. This involves choosing appropriate strategies, matching interventions to skill deficits, and ensuring interventions are feasible.',
    order: 4,
    frameworkType: 'problem-solving',
    commonErrors: ['premature-action', 'context-mismatch', 'incomplete-response'],
    prerequisiteSteps: ['analysis']
  },
  'progress-monitoring': {
    stepId: 'progress-monitoring',
    name: 'Progress Monitoring',
    description: 'Continuously monitor student progress using frequent, curriculum-aligned assessments. This involves collecting ongoing data, tracking growth, and making data-based decisions about intervention effectiveness.',
    order: 5,
    frameworkType: 'problem-solving',
    commonErrors: ['data-ignorance', 'delay', 'incomplete-response'],
    prerequisiteSteps: ['intervention-selection']
  },
  'evaluation': {
    stepId: 'evaluation',
    name: 'Evaluation',
    description: 'Evaluate intervention effectiveness and determine next steps. This involves analyzing outcomes, interpreting data, making decisions about continuing or modifying interventions, and determining if goals have been met.',
    order: 6,
    frameworkType: 'problem-solving',
    commonErrors: ['data-ignorance', 'correlation-as-causation', 'incomplete-response'],
    prerequisiteSteps: ['progress-monitoring']
  },

  // FBA Framework
  'behavior-identification': {
    stepId: 'behavior-identification',
    name: 'Behavior Identification',
    description: 'Clearly define and describe the target behavior(s) of concern. This involves operationalizing behaviors, identifying frequency and severity, and establishing baseline measures.',
    order: 1,
    frameworkType: 'fba',
    commonErrors: ['premature-action', 'incomplete-response'],
    prerequisiteSteps: []
  },
  'fba-data-collection': {
    stepId: 'fba-data-collection',
    name: 'FBA Data Collection',
    description: 'Systematically collect data on antecedents, behaviors, and consequences (ABC data). This involves direct observation, interviews, and documenting environmental factors that influence behavior.',
    order: 2,
    frameworkType: 'fba',
    commonErrors: ['premature-action', 'data-ignorance', 'incomplete-response'],
    prerequisiteSteps: ['behavior-identification']
  },
  'abc-analysis': {
    stepId: 'abc-analysis',
    name: 'ABC Analysis',
    description: 'Analyze the relationship between antecedents, behaviors, and consequences to identify patterns. This involves identifying triggers, maintaining consequences, and understanding the function of behavior.',
    order: 3,
    frameworkType: 'fba',
    commonErrors: ['function-confusion', 'correlation-as-causation', 'incomplete-response'],
    prerequisiteSteps: ['fba-data-collection']
  },
  'function-hypothesis': {
    stepId: 'function-hypothesis',
    name: 'Function Hypothesis',
    description: 'Develop a hypothesis about the function of the behavior (attention, escape, tangible, sensory). This involves determining what maintains the behavior and why it occurs.',
    order: 4,
    frameworkType: 'fba',
    commonErrors: ['function-confusion', 'function-mismatch', 'incomplete-response'],
    prerequisiteSteps: ['abc-analysis']
  },
  'intervention-design': {
    stepId: 'intervention-design',
    name: 'Intervention Design',
    description: 'Design a behavior intervention plan (BIP) that addresses the function of the behavior. This involves selecting replacement behaviors, modifying antecedents/consequences, and ensuring the intervention matches the function.',
    order: 5,
    frameworkType: 'fba',
    commonErrors: ['function-mismatch', 'premature-action', 'punishment-focus'],
    prerequisiteSteps: ['function-hypothesis']
  },
  'fba-recognition': {
    stepId: 'fba-recognition',
    name: 'FBA Recognition',
    description: 'Recognize when an FBA is appropriate and understand its purpose. This involves identifying FBA components and distinguishing FBA from other assessment types.',
    order: 0, // Recognition question, not part of sequential process
    frameworkType: 'fba',
    commonErrors: ['similar-concept', 'context-mismatch'],
    prerequisiteSteps: []
  },

  // Consultation Framework
  'consultation-type-recognition': {
    stepId: 'consultation-type-recognition',
    name: 'Consultation Type Recognition',
    description: 'Recognize different types of consultation (behavioral, mental health, organizational, multicultural, conjoint). This involves understanding the characteristics and purposes of each consultation type.',
    order: 0, // Recognition question
    frameworkType: 'consultation',
    commonErrors: ['similar-concept', 'context-mismatch'],
    prerequisiteSteps: []
  },
  'consultee-identification': {
    stepId: 'consultee-identification',
    name: 'Consultee Identification',
    description: 'Identify who needs consultation support (teacher, parent, administrator). This involves determining the appropriate consultee based on the problem and context.',
    order: 1,
    frameworkType: 'consultation',
    commonErrors: ['role-confusion', 'context-mismatch'],
    prerequisiteSteps: []
  },
  'problem-clarification': {
    stepId: 'problem-clarification',
    name: 'Problem Clarification',
    description: 'Work with the consultee to clarify and define the problem. This involves active listening, asking clarifying questions, and ensuring mutual understanding of the concern.',
    order: 2,
    frameworkType: 'consultation',
    commonErrors: ['premature-action', 'incomplete-response'],
    prerequisiteSteps: ['consultee-identification']
  },
  'goal-setting': {
    stepId: 'goal-setting',
    name: 'Goal Setting',
    description: 'Collaboratively establish clear, measurable goals for the consultation. This involves defining desired outcomes and success criteria.',
    order: 3,
    frameworkType: 'consultation',
    commonErrors: ['incomplete-response', 'extreme-language'],
    prerequisiteSteps: ['problem-clarification']
  },
  'consultation-planning': {
    stepId: 'consultation-planning',
    name: 'Intervention Planning',
    description: 'Develop a plan for addressing the problem collaboratively with the consultee. This involves selecting strategies, identifying resources, and planning implementation steps.',
    order: 4,
    frameworkType: 'consultation',
    commonErrors: ['premature-action', 'role-confusion', 'incomplete-response'],
    prerequisiteSteps: ['goal-setting']
  },
  'consultation-evaluation': {
    stepId: 'consultation-evaluation',
    name: 'Evaluation',
    description: 'Evaluate the effectiveness of the consultation and intervention. This involves monitoring progress, collecting data, and determining if goals are being met.',
    order: 5,
    frameworkType: 'consultation',
    commonErrors: ['data-ignorance', 'delay'],
    prerequisiteSteps: ['consultation-planning']
  },

  // Eligibility Framework
  'referral-review': {
    stepId: 'referral-review',
    name: 'Referral Review',
    description: 'Review the initial referral and gather background information. This involves understanding the referral concern, reviewing existing records, and determining if evaluation is warranted.',
    order: 1,
    frameworkType: 'eligibility',
    commonErrors: ['premature-action', 'data-ignorance'],
    prerequisiteSteps: []
  },
  'assessment-selection': {
    stepId: 'assessment-selection',
    name: 'Assessment Selection',
    description: 'Select appropriate assessments based on referral concerns and suspected disability. This involves choosing cognitive, achievement, behavioral, and other relevant assessments.',
    order: 2,
    frameworkType: 'eligibility',
    commonErrors: ['context-mismatch', 'similar-concept', 'incomplete-response'],
    prerequisiteSteps: ['referral-review']
  },
  'eligibility-data-collection': {
    stepId: 'eligibility-data-collection',
    name: 'Data Collection',
    description: 'Administer selected assessments and gather comprehensive evaluation data. This involves conducting assessments, collecting observations, and gathering information from multiple sources.',
    order: 3,
    frameworkType: 'eligibility',
    commonErrors: ['incomplete-response', 'data-ignorance'],
    prerequisiteSteps: ['assessment-selection']
  },
  'eligibility-analysis': {
    stepId: 'eligibility-analysis',
    name: 'Data Analysis',
    description: 'Analyze assessment results to determine if eligibility criteria are met. This involves interpreting scores, identifying discrepancies, and comparing performance to eligibility standards.',
    order: 4,
    frameworkType: 'eligibility',
    commonErrors: ['correlation-as-causation', 'data-ignorance', 'incomplete-response'],
    prerequisiteSteps: ['eligibility-data-collection']
  },
  'determination': {
    stepId: 'determination',
    name: 'Eligibility Determination',
    description: 'Make a determination about special education eligibility based on comprehensive evaluation data. This involves team decision-making and ensuring all criteria are met.',
    order: 5,
    frameworkType: 'eligibility',
    commonErrors: ['legal-overreach', 'data-ignorance', 'incomplete-response'],
    prerequisiteSteps: ['eligibility-analysis']
  }
};

// Helper functions
export function getFrameworkSteps(frameworkType: FrameworkType): FrameworkStep[] {
  return Object.values(FRAMEWORK_STEPS)
    .filter(step => step.frameworkType === frameworkType)
    .sort((a, b) => a.order - b.order);
}

export function getStepById(stepId: string): FrameworkStep | null {
  return FRAMEWORK_STEPS[stepId] || null;
}

export function getStepsByFramework(frameworkType: FrameworkType): FrameworkStep[] {
  return getFrameworkSteps(frameworkType);
}

export function getCommonErrorsForStep(stepId: string): PatternId[] {
  const step = getStepById(stepId);
  return step?.commonErrors || [];
}
