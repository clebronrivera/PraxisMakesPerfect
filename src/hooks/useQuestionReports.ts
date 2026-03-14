// src/hooks/useQuestionReports.ts
// Hook for submitting and managing question reports

import { useState, useCallback } from 'react';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { isAdminEmail } from '../config/admin';

export interface QuestionReport {
  id?: string;
  questionId: string;
  userId: string;
  userEmail?: string | null;
  userDisplayName?: string | null;
  assessmentType: 'pre' | 'full' | 'practice';
  targets: string[]; // What was reported (question stem, answer choices, etc.)
  issueTypes: string[]; // Type of issue (grammar, clarity, etc.)
  severity: 'minor' | 'major' | 'critical';
  notes: string;
  createdAt: any; // serverTimestamp
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
        userEmail: user.email ?? null,
        userDisplayName: user.displayName ?? null,
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
      const isAdmin = isAdminEmail(user.email);
      const q = isAdmin
        ? query(
            reportsRef,
            where('questionId', '==', questionId)
          )
        : query(
            reportsRef,
            where('questionId', '==', questionId),
            where('userId', '==', user.uid)
          );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuestionReport & { id: string })).sort((a, b) => {
        const aMillis = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
        const bMillis = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
        return bMillis - aMillis;
      });
    } catch (error) {
      console.error('[useQuestionReports] Error fetching reports:', error);
      return [];
    }
  }, [user]);

  /**
   * Get all reports (admin function)
   */
  const getAllReports = useCallback(async (): Promise<(QuestionReport & { id: string })[]> => {
    if (!user || !isAdminEmail(user.email)) return [];

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

  const updateReportStatus = useCallback(async (
    reportId: string,
    status: QuestionReport['status']
  ) => {
    if (!user || !isAdminEmail(user.email)) {
      throw new Error('Admin access required');
    }

    await updateDoc(doc(db, 'questionReports', reportId), {
      status
    });
  }, [user]);

  return {
    submitReport,
    getReportsByQuestion,
    getAllReports,
    updateReportStatus,
    isSubmitting
  };
}
