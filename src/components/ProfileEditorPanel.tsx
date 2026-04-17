import { useState } from 'react';
import { X, Mail, KeyRound, CheckCircle } from 'lucide-react';
import OnboardingFlow from './OnboardingFlow';
import type { UserProfileData } from './OnboardingFlow';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

/**
 * Slide-over panel: review and edit saved onboarding answers (nickname, program, exam, goals).
 * Also shows the signed-in email and provides password reset via email link.
 */
export default function ProfileEditorPanel({
  initialData,
  onClose,
  onSaveComplete,
  displayName
}: {
  initialData: UserProfileData;
  onClose: () => void;
  onSaveComplete: (data: UserProfileData) => Promise<void>;
  displayName?: string | null;
}) {
  const { user } = useAuth();
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetStatus('sending');
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    setResetStatus(error ? 'error' : 'sent');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-white backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className="relative flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-editor-title"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p id="profile-editor-title" className="text-[11px] font-black uppercase tracking-[0.1em] text-amber-500">
              Account
            </p>
            <p className="text-sm font-semibold text-white">Profile &amp; onboarding</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white/5 p-2 text-slate-600 transition hover:bg-white/10 hover:text-white"
            aria-label="Close profile editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Account info strip */}
        <div className="shrink-0 border-b border-slate-200 px-4 py-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Signed-in account</p>

          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="text-sm text-slate-600">{user?.email ?? '—'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetStatus === 'sending' || resetStatus === 'sent'}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {resetStatus === 'sending' ? 'Sending…' : 'Send password reset email'}
            </button>
            {resetStatus === 'sent' && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" />
                Reset link sent
              </span>
            )}
            {resetStatus === 'error' && (
              <span className="text-xs text-rose-600">Something went wrong — try again.</span>
            )}
          </div>
        </div>

        {/* Onboarding / profile form */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <OnboardingFlow
            displayName={displayName}
            mode="edit"
            variant="embedded"
            initialData={initialData}
            onCancel={onClose}
            onComplete={async (data) => {
              await onSaveComplete(data);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
