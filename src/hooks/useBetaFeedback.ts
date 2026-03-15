import { useCallback, useState } from 'react';
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { isAdminEmail } from '../config/admin';
import { sanitizeForFirestore } from '../utils/firestore';

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
      await addDoc(collection(db, 'betaFeedback'), sanitizeForFirestore({
        ...feedback,
        userId: user.uid,
        userEmail: user.email ?? null,
        userDisplayName: user.displayName ?? null,
        status: 'new' as const,
        createdAt: serverTimestamp()
      }));
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
      const feedbackQuery = query(
        collection(db, 'betaFeedback'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(feedbackQuery);

      return snapshot.docs.map((feedbackDoc) => ({
        id: feedbackDoc.id,
        ...feedbackDoc.data()
      } as BetaFeedback));
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

    await updateDoc(doc(db, 'betaFeedback', feedbackId), {
      status
    });
  }, [user]);

  return {
    submitFeedback,
    getAllFeedback,
    updateFeedbackStatus,
    isSubmitting
  };
}
