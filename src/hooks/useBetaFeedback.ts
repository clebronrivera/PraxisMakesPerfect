// src/hooks/useBetaFeedback.ts
// Hook for submitting and managing beta feedback
// Re-implemented to use Supabase instead of Firestore

import { useCallback, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isAdminEmail } from '../config/admin';

export type BetaFeedbackCategory =
  | 'bug'
  | 'feature-request'
  | 'content'
  | 'ux'
  | 'general';

export type BetaFeedbackStatus =
  | 'new'
  | 'reviewing'
  | 'planned'
  | 'resolved'
  | 'closed';

export interface BetaFeedback {
  id?: string;
  userId: string;
  userEmail?: string | null;
  userDisplayName?: string | null;
  category: BetaFeedbackCategory;
  contextType: 'feature' | 'tool' | 'question' | 'general';
  featureArea?: string;
  message: string;
  page?: string;
  status: BetaFeedbackStatus;
  createdAt: any;
  questionId?: string;
  appVersion?: string;
  session_id?: string;
  browser_info?: string;
}

export function useBetaFeedback() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = useCallback(async (
    feedback: Omit<BetaFeedback, 'id' | 'userId' | 'userEmail' | 'userDisplayName' | 'status' | 'createdAt'>
  ) => {
    if (!user) {
      throw new Error('User must be logged in to submit feedback');
    }

    setIsSubmitting(true);
    try {
      await supabase.from('beta_feedback').insert([{
        user_id: user.id,
        user_email: user.email ?? null,
        user_display_name: user.user_metadata?.full_name ?? user.user_metadata?.displayName ?? null,
        category: feedback.category,
        context_type: feedback.contextType,
        feature_area: feedback.featureArea,
        message: feedback.message,
        page: feedback.page,
        status: 'new',
        session_id: feedback.session_id,
        app_version: feedback.appVersion,
        browser_info: feedback.browser_info
      }]);
    } catch (error) {
      console.error('[useBetaFeedback] Error submitting feedback:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [user]);

  const getAllFeedback = useCallback(async (): Promise<BetaFeedback[]> => {
    if (!user || !isAdminEmail(user.email)) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('beta_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.user_email,
        userDisplayName: row.user_display_name,
        category: row.category as BetaFeedbackCategory,
        contextType: row.context_type as any,
        featureArea: row.feature_area,
        message: row.message,
        page: row.page,
        status: row.status as BetaFeedbackStatus,
        createdAt: row.created_at,
        appVersion: row.app_version,
        session_id: row.session_id,
        browser_info: row.browser_info
      }));
    } catch (error) {
      console.error('[useBetaFeedback] Error fetching feedback:', error);
      return [];
    }
  }, [user]);

  const updateFeedbackStatus = useCallback(async (
    feedbackId: string,
    status: BetaFeedbackStatus
  ) => {
    if (!user || !isAdminEmail(user.email)) {
      throw new Error('Admin access required');
    }

    const { error } = await supabase
      .from('beta_feedback')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', feedbackId);

    if (error) throw error;
  }, [user]);

  return {
    submitFeedback,
    getAllFeedback,
    updateFeedbackStatus,
    isSubmitting
  };
}
