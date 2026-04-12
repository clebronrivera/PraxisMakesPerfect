// src/hooks/useQuestionReports.ts
// Hook for submitting and managing question reports — backed by Supabase.

import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isAdminEmail } from '../config/admin';

export interface QuestionReport {
  id?: string;
  questionId: string;
  userId: string;
  userEmail?: string | null;
  userDisplayName?: string | null;
  assessmentType: 'pre' | 'full' | 'adaptive' | 'practice';
  targets: string[]; 
  issueTypes: string[]; 
  severity: 'minor' | 'major' | 'critical';
  notes: string;
  createdAt: string | number | Date;
  status: 'open' | 'triaged' | 'fixed' | 'wont-fix';
  questionSnapshot?: {
    stem: string;
    choices?: Record<string, string>;
    options?: { letter: string; text: string }[];
    correct: string[];
    rationale?: string;
  };
  appVersion?: string;
}

export function useQuestionReports() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReport = useCallback(async (
    report: Omit<QuestionReport, 'userId' | 'createdAt' | 'status'>
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to submit a report');
    }

    setIsSubmitting(true);
    try {
      await supabase.from('question_reports').insert([{
        user_id: user.id,
        user_email: user.email ?? null,
        user_display_name: user.user_metadata?.full_name ?? user.user_metadata?.displayName ?? null,
        question_id: report.questionId,
        assessment_type: report.assessmentType,
        targets: report.targets,
        issue_types: report.issueTypes,
        severity: report.severity,
        notes: report.notes,
        status: 'open',
        question_snapshot: report.questionSnapshot,
        app_version: report.appVersion
      }]);
    } catch (error) {
      console.error('[useQuestionReports] Error submitting report:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [user]);

  const getReportsByQuestion = useCallback(async (questionId: string): Promise<QuestionReport[]> => {
    if (!user) return [];

    try {
      let query = supabase
        .from('question_reports')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });

      if (!isAdminEmail(user.email)) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        questionId: row.question_id,
        userId: row.user_id,
        userEmail: row.user_email,
        userDisplayName: row.user_display_name,
        assessmentType: row.assessment_type as QuestionReport['assessmentType'],
        targets: row.targets || [],
        issueTypes: row.issue_types || [],
        severity: row.severity as QuestionReport['severity'],
        notes: row.notes,
        status: row.status as QuestionReport['status'],
        createdAt: row.created_at,
        questionSnapshot: row.question_snapshot,
        appVersion: row.app_version
      }));
    } catch (error) {
      console.error('[useQuestionReports] Error fetching reports:', error);
      return [];
    }
  }, [user]);

  const getAllReports = useCallback(async (): Promise<(QuestionReport & { id: string })[]> => {
    if (!user || !isAdminEmail(user.email)) return [];

    try {
      const { data, error } = await supabase
        .from('question_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        questionId: row.question_id,
        userId: row.user_id,
        userEmail: row.user_email,
        userDisplayName: row.user_display_name,
        assessmentType: row.assessment_type as QuestionReport['assessmentType'],
        targets: row.targets || [],
        issueTypes: row.issue_types || [],
        severity: row.severity as QuestionReport['severity'],
        notes: row.notes,
        status: row.status as QuestionReport['status'],
        createdAt: row.created_at,
        questionSnapshot: row.question_snapshot,
        appVersion: row.app_version
      }));
    } catch (error) {
      console.error('[useQuestionReports] Error fetching all reports:', error);
      return [];
    }
  }, [user]);

  const updateReportStatus = useCallback(async (
    reportId: string,
    status: QuestionReport['status']
  ) => {
    if (!user || !isAdminEmail(user.email)) {
      throw new Error('Admin access required');
    }

    const { error } = await supabase
      .from('question_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reportId);

    if (error) throw error;
  }, [user]);

  return {
    submitReport,
    getReportsByQuestion,
    getAllReports,
    updateReportStatus,
    isSubmitting
  };
}
