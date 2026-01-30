// src/hooks/useQuestionReports.ts
// Hook for submitting and managing question reports

import { useState, useCallback } from 'react';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface QuestionReport {
  questionId: string;
  userId: string;
  assessmentType: 'pre' | 'full' | 'practice';
  targets: string[]; // What was reported (question stem, answer choices, etc.)
  issueTypes: string[]; // Type of issue (grammar, clarity, etc.)
  severity: 'minor' | 'major' | 'critical';
  notes: string;
  createdAt: any; // serverTimestamp
  status: 'open' | 'triaged' | 'fixed' | 'wont-fix';
  questionSnapshot?: {
    stem: string;
    choices: Record<string, string>;
    correct: string[];
    rationale: string;
  };
  appVersion?: string;
}

export function useQuestionReports() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Submit a question report to Firestore
   */
  const submitReport = useCallback(async (
    report: Omit<QuestionReport, 'userId' | 'createdAt' | 'status'>
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to submit a report');
    }

    setIsSubmitting(true);
    try {
      const reportsRef = collection(db, 'questionReports');
      await addDoc(reportsRef, {
        ...report,
        userId: user.uid,
        status: 'open' as const,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[useQuestionReports] Error submitting report:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [user]);

  /**
   * Get reports for a specific question
   */
  const getReportsByQuestion = useCallback(async (questionId: string): Promise<QuestionReport[]> => {
    if (!user) return [];

    try {
      const reportsRef = collection(db, 'questionReports');
      const q = query(
        reportsRef,
        where('questionId', '==', questionId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuestionReport & { id: string }));
    } catch (error) {
      console.error('[useQuestionReports] Error fetching reports:', error);
      return [];
    }
  }, [user]);

  /**
   * Get all reports (admin function)
   */
  const getAllReports = useCallback(async (): Promise<(QuestionReport & { id: string })[]> => {
    if (!user) return [];

    try {
      const reportsRef = collection(db, 'questionReports');
      const q = query(reportsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuestionReport & { id: string }));
    } catch (error) {
      console.error('[useQuestionReports] Error fetching all reports:', error);
      return [];
    }
  }, [user]);

  return {
    submitReport,
    getReportsByQuestion,
    getAllReports,
    isSubmitting
  };
}
