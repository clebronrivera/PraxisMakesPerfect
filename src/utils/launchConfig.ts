// src/utils/launchConfig.ts
// Feature flags that gate beta / in-development capabilities.
// Set a flag to `true` once the feature is ready for production use.
// adaptivePractice — adaptive question selection based on mastery curve

export const ACTIVE_LAUNCH_FEATURES = {
  adaptivePractice: true,
  studyGuide: false,        // false = locked behind paywall screen; set true only when Stripe activation is ready
  tutorChat: true,          // AI Tutor Chat — enabled for testing
  paywall: false,           // Stripe paywall — set true when payment infrastructure is live
} as const;
