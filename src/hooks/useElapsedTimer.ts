import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useElapsedTimer Hook
 * 
 * Features:
 * - Count-up timer tracking total elapsed seconds (excluding paused time).
 * - Per-question timer tracking time spent on each item.
 * - Inactivity tracking: 90s warning, 120s auto-pause.
 * - Interaction detection (click, keypress, mousedown, etc) resets inactivity.
 * - Display format: HH:MM:SS with a specific label.
 */

interface UseElapsedTimerProps {
  onAutoPause?: () => void;
  isActive?: boolean;
  initialElapsedSeconds?: number;
}

export const useElapsedTimer = ({ 
  onAutoPause, 
  isActive = true, 
  initialElapsedSeconds = 0 
}: UseElapsedTimerProps = {}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds);
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [isAutoPaused, setIsAutoPaused] = useState(false);

  // Use refs for values needed in the interval/events to avoid stale closures
  const lastInteractionRef = useRef(Date.now());
  const isPausedRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Global interaction tracker
  const recordInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    
    // Clear warning state on interaction
    setShowInactivityWarning(false);
    
    // If we were auto-paused, we stay paused until resume() is called, 
    // but the interaction timer is reset.
  }, []);

  // Set up interaction listeners
  useEffect(() => {
    if (!isActive) return;

    // Track click, keypress, mousedown, touch, scroll as interactions
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'keypress'];
    const handler = () => recordInteraction();
    
    events.forEach(event => window.addEventListener(event, handler));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handler));
    };
  }, [isActive, recordInteraction]);

  // Main Timer Interval
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Don't increment or check inactivity if paused
      if (isPausedRef.current) return;

      const now = Date.now();
      const inactiveSecs = Math.floor((now - lastInteractionRef.current) / 1000);

      // Handle Auto-Pause at 120 seconds of inactivity
      if (inactiveSecs >= 120) {
        setIsPaused(true);
        setIsAutoPaused(true);
        if (onAutoPause) {
          onAutoPause();
        }
        return; // Stop processing this tick
      } 
      
      // Handle Warning at 90 seconds of inactivity
      if (inactiveSecs >= 90) {
        setShowInactivityWarning(true);
      } else {
        setShowInactivityWarning(false);
      }

      // Increment timers (only if not paused, which is checked above)
      setElapsedSeconds(prev => prev + 1);
      setQuestionSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onAutoPause]);

  const resetQuestionTimer = useCallback((): number => {
    const timeSpent = questionSeconds;
    setQuestionSeconds(0);
    return timeSpent;
  }, [questionSeconds]);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    setIsAutoPaused(false);
    recordInteraction();
  }, [recordInteraction]);

  /**
   * Format seconds to HH:MM:SS
   */
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map(v => v < 10 ? "0" + v : v.toString())
      .join(":");
  };

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    timerLabel: 'Elapsed Time — Pace yourself',
    questionSeconds,
    isPaused,
    showInactivityWarning,
    isAutoPaused,
    recordInteraction,
    resetQuestionTimer,
    pause,
    resume
  };
};

