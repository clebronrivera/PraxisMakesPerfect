// src/contexts/AuthContext.tsx
// Manages authentication state across the app

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInAnonymous: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
      const sessionKey = `pmp-auth-session:${currentUser.uid}`;
      if (window.sessionStorage.getItem(sessionKey)) {
        return;
      }
      window.sessionStorage.setItem(sessionKey, String(Date.now()));
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const existingSnapshot = await getDoc(userDocRef);
      const existingData = existingSnapshot.data() as {
        authMetrics?: {
          loginCount?: number;
          createdAt?: any;
        };
      } | undefined;

      await setDoc(userDocRef, {
        authMetrics: {
          email: currentUser.email ?? null,
          displayName: currentUser.displayName ?? null,
          isAnonymous: currentUser.isAnonymous,
          providerIds: currentUser.providerData
            .map((provider) => provider.providerId)
            .filter(Boolean),
          loginCount: (existingData?.authMetrics?.loginCount ?? 0) + 1,
          createdAt: existingData?.authMetrics?.createdAt ?? serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          lastActiveAt: serverTimestamp()
        },
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (trackingError) {
      console.error('[Auth] Failed to track authenticated session:', trackingError);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        void trackAuthenticatedSession(nextUser);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sign in anonymously (for trying the app without an account)
  const signInAnonymous = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInAnonymously(auth);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // Handle specific sign-in errors with user-friendly messages
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again or reset your password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check and try again.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later or reset your password.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
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
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
    } catch (err: any) {
      // Handle specific sign-up errors with user-friendly messages
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check and try again.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account' // Force account selection
      });
      const result = await signInWithPopup(auth, provider);
      // Google sign-in successful - user is automatically signed in
      // The user object will be available via onAuthStateChanged
      console.log('[Auth] Google sign-in successful:', result.user.email);
    } catch (err: any) {
      // Handle specific Google sign-in errors
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please contact support.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please contact support.');
      } else {
        setError(err.message || 'Failed to sign in with Google. Please try again.');
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
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      // Handle specific password reset errors
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to send password reset email. Please try again.');
      }
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
        window.sessionStorage.removeItem(`pmp-auth-session:${user.uid}`);
      }
      await signOut(auth);
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
    signInAnonymous,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
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
