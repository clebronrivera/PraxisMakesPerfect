import type { Skill, Domain } from './content';

export interface EngineConfig {
  skills: Skill[];
  domains: Domain[];
  /** Optional mappings for legacy/generic error patterns */
  errorLibrary?: Record<string, any>;
  frameworkSteps?: Record<string, any>;
  distractorPatterns?: Record<string, any>;
  assessmentConfig?: {
    fullAssessmentQuestions: number;
    preAssessmentQuestionsPerDomain: number;
    distribution?: Record<string, { percentage: number; domains: number[] }>;
  };
}
