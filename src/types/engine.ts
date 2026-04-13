import type { Skill, Domain } from './content';
import type { ErrorExplanation } from '../brain/error-library';
import type { FrameworkStep } from '../brain/framework-definitions';
import type { DistractorPattern } from '../brain/distractor-patterns';

export interface EngineConfig {
  skills: Skill[];
  domains: Domain[];
  /** Optional mappings for legacy/generic error patterns */
  errorLibrary?: Partial<Record<string, ErrorExplanation>>;
  frameworkSteps?: Record<string, FrameworkStep>;
  distractorPatterns?: Record<string, DistractorPattern>;
  assessmentConfig?: {
    fullAssessmentQuestions: number;
    screenerQuestionsPerDomain: number;
    distribution?: Record<string, { percentage: number; domains: number[] }>;
  };
}
