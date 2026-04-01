// src/types/subscription.ts
// Subscription and paywall types for Stripe integration.

export type SubscriptionPlan = 'free' | 'premium_monthly' | 'premium_yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface UserSubscription {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;  // ISO date
  createdAt: string;
  updatedAt: string;
}

/** Features that can be gated behind the paywall. */
export type GatedFeature =
  | 'unlimited_practice'     // Free: 10 questions/day
  | 'unlimited_tutor'        // Free: 3 messages/day
  | 'study_guide'            // Free: locked
  | 'redemption_rounds'      // Free: locked
  | 'score_export'           // Free: locked
  | 'full_learning_path';    // Free: first 2 modules only

/** Daily usage limits for the free tier. */
export const FREE_TIER_LIMITS = {
  practiceQuestionsPerDay: 10,
  tutorMessagesPerDay: 3,
  learningPathModules: 2,
} as const;

/** Pricing (in cents for Stripe). Display values are for UI only. */
export const PRICING = {
  monthly: {
    amount: 1499,       // $14.99
    display: '$14.99',
    interval: 'month' as const,
  },
  yearly: {
    amount: 9999,       // $99.99
    display: '$99.99',
    interval: 'year' as const,
    savings: '$79.89',  // vs monthly * 12
  },
} as const;
