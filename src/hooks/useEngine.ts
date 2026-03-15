import { useContent } from '../context/ContentContext';
import { EngineConfig } from '../types/engine';

import { DISTRACTOR_PATTERNS } from '../brain/distractor-patterns';
import { ERROR_LIBRARY } from '../brain/error-library';
import { FRAMEWORK_STEPS } from '../brain/framework-definitions';

export function useEngine(): EngineConfig {
  const context = useContent();
  
  if (context.config) {
    return context.config;
  }
  
  // Return configuration derived from dynamic context state
  return {
    skills: context.skills,
    domains: context.domains,
    errorLibrary: ERROR_LIBRARY as any,
    frameworkSteps: FRAMEWORK_STEPS as any,
    distractorPatterns: DISTRACTOR_PATTERNS as any
  };
}
