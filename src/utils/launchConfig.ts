// src/utils/launchConfig.ts
// Feature flags that gate beta / in-development capabilities.
// Set a flag to `true` once the feature is ready for production use.
// adaptivePractice — adaptive question selection based on mastery curve
// teachMode        — guided teach-back review mode

export const ACTIVE_LAUNCH_FEATURES = {
  adaptivePractice: false,
  teachMode: false,
  studyGuide: false,        // AI study guide — set true when production-ready
  tutorChat: true,          // AI Tutor Chat — enabled for testing
} as const;
