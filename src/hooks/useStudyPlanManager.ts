/**
 * useStudyPlanManager
 *
 * Owns all study-plan state that previously lived in App.tsx:
 *   - studyPlanHistory / studyPlanLoading / studyPlanGenerating / studyPlanError
 *   - canGenerateStudyPlan (derived)
 *   - handleGenerateStudyPlan callback
 *   - the effect that loads history whenever `user` changes
 *
 * Extracted as part of Task 1 (App.tsx prop-drill audit).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import {
  StudyConstraints,
  StudyPlanHistoryEntry,
  generateStudyPlan,
  getStudyPlanHistory,
} from '../services/studyPlanService';
import type { Domain, Skill } from '../types/content';
import type { UserProfile } from './useFirebaseProgress';

interface UseStudyPlanManagerOptions {
  user: User | null;
  profile: UserProfile;
  fetchedSkills: Skill[];
  fetchedDomains: Domain[];
}

export interface UseStudyPlanManagerReturn {
  studyPlanHistory: StudyPlanHistoryEntry[];
  studyPlanLoading: boolean;
  studyPlanGenerating: boolean;
  studyPlanError: string | null;
  canGenerateStudyPlan: boolean;
  handleGenerateStudyPlan: (constraints?: StudyConstraints) => Promise<void>;
}

export function useStudyPlanManager({
  user,
  profile,
  fetchedSkills,
  fetchedDomains,
}: UseStudyPlanManagerOptions): UseStudyPlanManagerReturn {
  const [studyPlanHistory, setStudyPlanHistory] = useState<StudyPlanHistoryEntry[]>([]);
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);
  const [studyPlanGenerating, setStudyPlanGenerating] = useState(false);
  const [studyPlanError, setStudyPlanError] = useState<string | null>(null);

  // Derived: can the user request a new plan?
  const canGenerateStudyPlan = useMemo(() => {
    if (!user) return false;
    // New adaptive diagnostic path
    if ((profile as any).adaptiveDiagnosticComplete) return true;
    // Legacy two-step path: screener + full assessment
    if (!profile.screenerComplete) return false;
    return Boolean(profile.lastFullAssessmentSessionId || profile.fullAssessmentComplete);
  }, [profile, user]);

  // Load (or clear) history whenever the logged-in user changes.
  useEffect(() => {
    if (!user) {
      setStudyPlanHistory([]);
      setStudyPlanError(null);
      setStudyPlanLoading(false);
      return;
    }

    let isCancelled = false;

    const loadStudyPlan = async () => {
      setStudyPlanLoading(true);
      setStudyPlanError(null);

      try {
        const history = await getStudyPlanHistory(user.id);
        if (!isCancelled) {
          setStudyPlanHistory(history);
          setStudyPlanError(null);
        }
      } catch (error) {
        console.error('[StudyPlan] Failed to load latest study plan:', error);
        if (!isCancelled) {
          setStudyPlanError(
            'Unable to load your saved study guide right now. You can regenerate it.',
          );
        }
      } finally {
        if (!isCancelled) {
          setStudyPlanLoading(false);
        }
      }
    };

    void loadStudyPlan();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const handleGenerateStudyPlan = useCallback(
    async (constraints?: StudyConstraints) => {
      if (!user) return;

      setStudyPlanGenerating(true);
      setStudyPlanError(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const idToken = sessionData.session?.access_token ?? '';

        if (!idToken) {
          // Session has expired — tell the user clearly rather than surfacing a cryptic 401.
          setStudyPlanError(
            'Your session has expired. Please log out and log back in, then try again.',
          );
          return;
        }

        const generatedPlan = await generateStudyPlan({
          userId: user.id,
          idToken,
          skills: fetchedSkills,
          domains: fetchedDomains,
          studyConstraints: constraints,
        });

        // Reload full history so the new plan appears at the top of the list.
        const updatedHistory = await getStudyPlanHistory(user.id);
        setStudyPlanHistory(
          updatedHistory.length > 0
            ? updatedHistory
            : [{ id: 'new', createdAt: generatedPlan.generatedAt, plan: generatedPlan }],
        );
      } catch (error) {
        console.error('[StudyPlan] Generation failed:', error);
        setStudyPlanError(
          error instanceof Error
            ? error.message
            : 'Study guide generation failed. Please retry.',
        );
      } finally {
        setStudyPlanGenerating(false);
      }
    },
    [fetchedDomains, fetchedSkills, user],
  );

  return {
    studyPlanHistory,
    studyPlanLoading,
    studyPlanGenerating,
    studyPlanError,
    canGenerateStudyPlan,
    handleGenerateStudyPlan,
  };
}
