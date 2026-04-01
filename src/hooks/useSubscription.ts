// src/hooks/useSubscription.ts
// Reads subscription state from Supabase and provides access checks.
// Behind ACTIVE_LAUNCH_FEATURES.paywall flag — returns premium for all when disabled.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { ACTIVE_LAUNCH_FEATURES } from '../utils/launchConfig';
import type { SubscriptionPlan, GatedFeature } from '../types/subscription';
import { FREE_TIER_LIMITS } from '../types/subscription';

interface SubscriptionState {
  plan: SubscriptionPlan;
  isPremium: boolean;
  isLoading: boolean;
  currentPeriodEnd: string | null;
}

const DAILY_USAGE_KEY = 'pmp-daily-usage';

interface DailyUsage {
  date: string;  // YYYY-MM-DD
  practiceQuestions: number;
  tutorMessages: number;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyUsage(userId: string): DailyUsage {
  const key = `${DAILY_USAGE_KEY}-${userId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyUsage;
      if (parsed.date === getTodayKey()) return parsed;
    }
  } catch { /* ignore */ }
  return { date: getTodayKey(), practiceQuestions: 0, tutorMessages: 0 };
}

function setDailyUsage(userId: string, usage: DailyUsage) {
  localStorage.setItem(`${DAILY_USAGE_KEY}-${userId}`, JSON.stringify(usage));
}

export function useSubscription(userId: string | undefined) {
  const [state, setState] = useState<SubscriptionState>({
    plan: 'free',
    isPremium: !ACTIVE_LAUNCH_FEATURES.paywall, // When paywall disabled, everyone is premium
    isLoading: true,
    currentPeriodEnd: null,
  });

  useEffect(() => {
    if (!userId || !ACTIVE_LAUNCH_FEATURES.paywall) {
      setState(s => ({ ...s, isLoading: false, isPremium: !ACTIVE_LAUNCH_FEATURES.paywall }));
      return;
    }

    let active = true;
    (async () => {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('plan, status, current_period_end')
        .eq('user_id', userId)
        .single();

      if (active) {
        if (data && data.status === 'active') {
          setState({
            plan: data.plan as SubscriptionPlan,
            isPremium: data.plan !== 'free',
            isLoading: false,
            currentPeriodEnd: data.current_period_end,
          });
        } else {
          setState({ plan: 'free', isPremium: false, isLoading: false, currentPeriodEnd: null });
        }
      }
    })();

    return () => { active = false; };
  }, [userId]);

  /** Check if user can access a gated feature. */
  const canAccess = useCallback((feature: GatedFeature): boolean => {
    if (!ACTIVE_LAUNCH_FEATURES.paywall) return true;
    if (state.isPremium) return true;

    // Free tier: some features are always locked
    if (feature === 'study_guide') return false;
    if (feature === 'redemption_rounds') return false;
    if (feature === 'score_export') return false;

    // Usage-limited features: check daily counts
    if (!userId) return false;
    const usage = getDailyUsage(userId);

    if (feature === 'unlimited_practice') {
      return usage.practiceQuestions < FREE_TIER_LIMITS.practiceQuestionsPerDay;
    }
    if (feature === 'unlimited_tutor') {
      return usage.tutorMessages < FREE_TIER_LIMITS.tutorMessagesPerDay;
    }
    if (feature === 'full_learning_path') {
      return true; // Learning path module limit checked elsewhere
    }

    return false;
  }, [state.isPremium, userId]);

  /** Increment daily usage counter. */
  const trackUsage = useCallback((type: 'practice' | 'tutor') => {
    if (!userId || !ACTIVE_LAUNCH_FEATURES.paywall || state.isPremium) return;
    const usage = getDailyUsage(userId);
    if (type === 'practice') usage.practiceQuestions++;
    if (type === 'tutor') usage.tutorMessages++;
    setDailyUsage(userId, usage);
  }, [userId, state.isPremium]);

  /** Get remaining daily quota. */
  const getRemainingQuota = useCallback((type: 'practice' | 'tutor'): number => {
    if (!ACTIVE_LAUNCH_FEATURES.paywall || state.isPremium) return Infinity;
    if (!userId) return 0;
    const usage = getDailyUsage(userId);
    if (type === 'practice') return Math.max(0, FREE_TIER_LIMITS.practiceQuestionsPerDay - usage.practiceQuestions);
    if (type === 'tutor') return Math.max(0, FREE_TIER_LIMITS.tutorMessagesPerDay - usage.tutorMessages);
    return Infinity;
  }, [state.isPremium, userId]);

  return {
    ...state,
    canAccess,
    trackUsage,
    getRemainingQuota,
  };
}
