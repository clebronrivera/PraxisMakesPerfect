import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SIGNUP_SENT_KEY, type AuthMode } from './landingData';
import AuthModal from './AuthModal';
import LandingNav from './sections/LandingNav';
import HeroSection from './sections/HeroSection';
import HowItWorksSection from './sections/HowItWorksSection';
import EngineSection from './sections/EngineSection';
import MicroSkillSection from './sections/MicroSkillSection';
import MethodSection from './sections/MethodSection';
import WhyFasterSection from './sections/WhyFasterSection';
import YourPlanSection from './sections/YourPlanSection';
import FinalCtaSection from './sections/FinalCtaSection';
import LandingFooter from './sections/LandingFooter';

interface LandingPageProps {
  /** Armed by the Ctrl+Shift+A shortcut in LoginScreen; surfaces the admin sign-in button. */
  showAdminEntry: boolean;
}

/**
 * The PASS marketing landing — the pre-auth experience. Owns only the auth-modal
 * open state; the modal itself consumes useAuth(). Everything is wrapped in the
 * `.pass-landing` root so the scoped violet/fuchsia theme never leaks into the
 * authenticated (navy) app.
 */
const AUTH_MODAL_KEY = 'pass-auth-modal';

export default function LandingPage({ showAdminEntry }: LandingPageProps) {
  // Submitting any auth form toggles AuthContext `loading`, which makes App.tsx
  // swap to its global loading screen — unmounting this whole tree mid-request.
  // To keep the modal from vanishing mid-flow, we persist the open-intent and
  // reopen it on remount when there is still something to show:
  //   - an auth error (a failed sign-in must not lose its message), or
  //   - a confirmation-pending signup (succeeds with no session, so nothing else
  //     will ever tell the user their account was created — see SIGNUP_SENT_KEY).
  // Without the second case a successful signup silently drops the user back on
  // the landing page, which is the whole reason that key exists.
  const { error } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = window.sessionStorage.getItem(AUTH_MODAL_KEY) as AuthMode | null;
    const signupSent = window.sessionStorage.getItem(SIGNUP_SENT_KEY) !== null;
    if (signupSent) return saved ?? 'signup';
    return saved && error ? saved : null;
  });

  // Drop any stale persisted intent once we're settled with no modal open.
  useEffect(() => {
    if (!authMode && typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AUTH_MODAL_KEY);
    }
  }, [authMode]);

  const openAuth = useCallback((mode: AuthMode) => {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(AUTH_MODAL_KEY, mode);
    setAuthMode(mode);
  }, []);
  const closeAuth = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AUTH_MODAL_KEY);
      // Belt-and-braces: AuthModal clears this too, but if the modal ever closes
      // by a path that skips its handler, a stale key would silently reopen it.
      window.sessionStorage.removeItem(SIGNUP_SENT_KEY);
    }
    setAuthMode(null);
  }, []);

  return (
    <div className="pass-landing min-h-screen">
      <LandingNav onOpenAuth={openAuth} />
      <main>
        <HeroSection onOpenAuth={openAuth} />
        <HowItWorksSection />
        <EngineSection onOpenAuth={openAuth} />
        <MicroSkillSection />
        <MethodSection />
        <WhyFasterSection />
        <YourPlanSection />
        <FinalCtaSection onOpenAuth={openAuth} />
      </main>
      <LandingFooter />

      {authMode && (
        <AuthModal initialMode={authMode} onClose={closeAuth} showAdminEntry={showAdminEntry} />
      )}
    </div>
  );
}
