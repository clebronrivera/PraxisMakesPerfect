// src/hooks/useTutorialState.ts
// Tracks whether the user has seen the tutorial walkthrough.
// Auto-triggers on first post-onboarding visit.

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'pmp-tutorial-seen';

export function useTutorialState(userId: string | undefined, onboardingComplete: boolean) {
  const [showTutorial, setShowTutorial] = useState(false);

  // Check on mount whether we should auto-show
  useEffect(() => {
    if (!userId || !onboardingComplete) return;
    const key = `${STORAGE_KEY}-${userId}`;
    const seen = localStorage.getItem(key);
    if (!seen) {
      setShowTutorial(true);
    }
  }, [userId, onboardingComplete]);

  const dismissTutorial = useCallback(() => {
    if (userId) {
      localStorage.setItem(`${STORAGE_KEY}-${userId}`, 'true');
    }
    setShowTutorial(false);
  }, [userId]);

  const replayTutorial = useCallback(() => {
    setShowTutorial(true);
  }, []);

  return { showTutorial, dismissTutorial, replayTutorial };
}
