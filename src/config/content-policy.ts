/**
 * Global content policy for the application.
 * Defines strict rules about what content sources are allowed in learner-facing views.
 */
export const CONTENT_POLICY = {
  // Determines if the application is permitted to generate questions at runtime
  // using LLM templates. If false, only vetted, static questions from the bundled bank
  // are served to learners.
  ALLOW_RUNTIME_GENERATED_QUESTIONS: false,
};
