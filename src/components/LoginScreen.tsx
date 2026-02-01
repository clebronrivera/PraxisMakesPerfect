// src/components/LoginScreen.tsx
// Enhanced login screen with email, Google, and password reset

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, User, Chrome, ArrowLeft, Loader2 } from 'lucide-react';

export default function LoginScreen() {
  const { 
    signInAnonymous, 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    resetPassword,
    error, 
    loading,
    clearError 
  } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
      }
    } catch (err) {
      // Error is handled in context
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setResetEmailSent(false);
    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (err) {
      // Error is handled in context
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    try {
      await signInWithGoogle();
    } catch (err) {
      // Error is handled in context
    }
  };

  const handleAnonymousSignIn = async () => {
    clearError();
    try {
      await signInAnonymous();
    } catch (err) {
      // Error is handled in context
    }
  };

  const switchToReset = () => {
    clearError();
    setResetEmailSent(false);
    setMode('reset');
  };

  const switchToLogin = () => {
    clearError();
    setResetEmailSent(false);
    setMode('login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
            Praxis Study App
          </h1>
          <p className="text-slate-400">
            {mode === 'login' && 'Sign in to continue'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'reset' && 'Reset your password'}
          </p>
        </div>

        {/* Success Message */}
        {resetEmailSent && !error && (
          <div className="mb-4 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
            <div className="flex items-start gap-2">
              <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium mb-1">Password reset email sent!</p>
                <p className="text-emerald-200/80 text-xs">
                  Check your inbox at <strong>{email}</strong> for instructions to reset your password.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
            <div className="flex items-start gap-2">
              <div className="flex-1">{error}</div>
              <button 
              onClick={clearError}
              className="text-red-400 hover:text-red-200 text-lg leading-none"
              aria-label="Dismiss error"
            >
              ×
            </button>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          {/* Password Reset Form */}
          {mode === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Reset Email
                  </>
                )}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="text-sm text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to sign in
                </button>
              </div>
            </form>
          )}

          {/* Email Form (Login/Signup) */}
          {mode !== 'reset' && (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm text-slate-400">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={switchToReset}
                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                  {mode === 'signup' && (
                    <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Login/Signup */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setMode(mode === 'login' ? 'signup' : 'login');
                  }}
                  className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
                >
                  {mode === 'login' 
                    ? "Don't have an account? Sign up" 
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-sm text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          {/* Social/Alternative Buttons - Only show when not in reset mode */}
          {mode !== 'reset' && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-700"></div>
                <span className="text-sm text-slate-500">or</span>
                <div className="flex-1 h-px bg-slate-700"></div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl font-medium text-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Chrome className="w-4 h-4" />
                  )}
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={handleAnonymousSignIn}
                  disabled={loading}
                  className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl font-medium text-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  Try Without Account
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Your progress will be saved and synced across devices
        </p>
      </div>
    </div>
  );
}
