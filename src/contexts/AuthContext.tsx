import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { captureError } from '../utils/sentry';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const trackAuthenticatedSession = async (currentUser: User) => {
    if (typeof window !== 'undefined') {
      const sessionKey = `pmp-auth-session:${currentUser.id}`;
      if (window.sessionStorage.getItem(sessionKey)) {
        return;
      }
      window.sessionStorage.setItem(sessionKey, String(Date.now()));
    }

    try {
      // Create or update user tracking inside Supabase's user_progress
      const { data: existingData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
        
      const updates = {
        user_id: currentUser.id,
        email: currentUser.email ?? null,
        display_name: currentUser.user_metadata?.full_name ?? currentUser.user_metadata?.displayName ?? null,
        login_count: ((existingData?.login_count as number) ?? 0) + 1,
        last_login_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      };

      await supabase
        .from('user_progress')
        .upsert(updates, { onConflict: 'user_id' });
        
    } catch (trackingError) {
      console.error('[Auth] Failed to track authenticated session:', trackingError);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    // Safety timeout — if getSession() hangs (e.g. Supabase unreachable),
    // ensure the app exits the loading state within 10 seconds.
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 10_000);

    // Check active session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(safetyTimeout);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        void trackAuthenticatedSession(session.user);
      }
    }).catch((err) => {
      clearTimeout(safetyTimeout);
      console.error('[AuthContext] getSession failed:', err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        setLoading(false);

        if (nextUser) {
          void trackAuthenticatedSession(nextUser);
        } else if (typeof window !== 'undefined') {
          // Clear session key if they log out
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const key = window.sessionStorage.key(i);
            if (key?.startsWith('pmp-auth-session:')) {
              window.sessionStorage.removeItem(key);
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInError) throw signInError;
    } catch (err: any) {
      captureError(err, { tags: { source: 'auth', action: 'signIn' } });
      if (err.message === 'Invalid login credentials') {
        setError('Incorrect email or password. Please try again.');
      } else if (err.message === 'Email not confirmed') {
        setError('Please verify your email address before signing in.');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      setLoading(true);
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            displayName,
            full_name: displayName
          }
        }
      });
      
      if (signUpError) throw signUpError;
    } catch (err: any) {
      captureError(err, { tags: { source: 'auth', action: 'signUp' } });
      if (err.message.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.message.includes('Password')) {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      if (user && typeof window !== 'undefined') {
        window.sessionStorage.removeItem(`pmp-auth-session:${user.id}`);
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
