/**
 * AccountPage — dedicated account / settings page (replaces the old slide-over).
 *
 * Sections: Profile · Study profile (edits via the existing onboarding editor) ·
 * Security (password reset, sign out) · Privacy & data (legal links, consent, JSON
 * export) · Danger zone (request account deletion). Light indigo/violet theme.
 */

import { useEffect, useState } from 'react';
import { KeyRound, CheckCircle, LogOut, Download, ShieldAlert, AlertTriangle, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import type { UserProfile } from '../hooks/useProgressTracking';

export interface AccountPageProps {
  profile: UserProfile;
  displayName: string | null;
  /** Opens the existing onboarding-answer editor (drawer). */
  onEditAnswers: () => void;
  /** Signs the user out. */
  onSignOut: () => void | Promise<void>;
}

// ─── Label helpers ──────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  graduate_student: 'Graduate Student',
  certification_only: 'Certification-Only / Alternative Route',
  other: 'Other',
};

function humanize(value?: string | null): string {
  if (!value) return '—';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function initialsOf(name?: string | null, email?: string | null): string {
  const src = (name || email || '?').trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AccountPage({ profile, displayName, onEditAnswers, onSignOut }: AccountPageProps) {
  const { user } = useAuth();
  const email = user?.email ?? null;
  const emailVerified = !!user?.email_confirmed_at;
  const memberSince = formatDate(user?.created_at ?? null);

  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const role = ROLE_LABELS[profile.accountRole ?? ''] ?? humanize(profile.accountRole);
  const goals = (profile.studyGoals ?? []).map(humanize).join(', ') || '—';
  const weekly = profile.weeklyStudyHours ? `${profile.weeklyStudyHours} hrs / week` : '—';

  async function handleReset() {
    if (!email) return;
    setResetStatus('sending');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setResetStatus(error ? 'error' : 'sent');
  }

  async function handleExport() {
    if (!user?.id) return;
    setExportStatus('working');
    try {
      const [prog, resp] = await Promise.all([
        supabase.from('user_progress').select('*').eq('user_id', user.id),
        supabase.from('responses').select('*').eq('user_id', user.id),
      ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        account: { email, displayName },
        profile: prog.data ?? [],
        responses: resp.data ?? [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pass-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('idle');
    } catch (err) {
      console.error('[AccountPage] export failed:', err);
      setExportStatus('error');
    }
  }

  return (
    <div className="mx-auto max-w-[860px] px-2 sm:px-4 py-8">
      <p className="editorial-overline text-indigo-600 mb-1">Account</p>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
        Your <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent">account.</span>
      </h1>
      <p className="text-sm text-slate-500 mb-8">Manage your profile, security, and data.</p>

      {/* PROFILE */}
      <section className="editorial-surface p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl grad-chrome flex items-center justify-center text-white text-xl font-black shrink-0">
            {initialsOf(displayName, email)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Profile</p>
              <button onClick={onEditAnswers} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 rounded">
                <Pencil size={12} aria-hidden="true" /> Edit
              </button>
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1 truncate">{displayName ?? '—'}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-slate-500 truncate">{email ?? '—'}</span>
              {emailVerified && (
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">✓ Verified</span>
              )}
            </div>
            <p className="text-[12px] text-slate-400 mt-2">Member since {memberSince} · {role}</p>
          </div>
        </div>
      </section>

      {/* STUDY PROFILE */}
      <section className="editorial-surface p-6 mb-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Study profile</p>
            <p className="text-[12px] text-slate-400">How we personalize your plan and practice.</p>
          </div>
          <button onClick={onEditAnswers} className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 shrink-0">
            Edit answers
          </button>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          {[
            { k: 'Role', v: role },
            { k: 'Program', v: humanize(profile.programType) },
            { k: 'Exam', v: 'Praxis 5403' },
            { k: 'Target test date', v: formatDate(profile.plannedTestDate) },
            { k: 'Weekly study time', v: weekly },
            { k: 'Training stage', v: humanize(profile.trainingStage) },
            { k: 'Goal', v: goals },
          ].map((f) => (
            <div key={f.k}>
              <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">{f.k}</dt>
              <dd className="text-sm font-semibold text-slate-800 mt-0.5 break-words">{f.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* SECURITY */}
      <section className="editorial-surface p-6 mb-5">
        <p className="text-sm font-bold text-slate-900 mb-4">Security</p>
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Password</p>
              <p className="text-[12px] text-slate-400">We&apos;ll email you a secure reset link.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {resetStatus === 'sent' && (
                <span className="flex items-center gap-1 text-xs text-emerald-600" role="status"><CheckCircle size={13} aria-hidden="true" /> Sent</span>
              )}
              {resetStatus === 'error' && <span className="text-xs text-rose-600" role="alert">Try again</span>}
              <button
                onClick={handleReset}
                disabled={resetStatus === 'sending' || resetStatus === 'sent'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              >
                <KeyRound size={13} aria-hidden="true" /> {resetStatus === 'sending' ? 'Sending…' : 'Send reset link'}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Sign out</p>
              <p className="text-[12px] text-slate-400">End your session on this device.</p>
            </div>
            <button onClick={() => onSignOut()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 shrink-0">
              <LogOut size={13} aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
      </section>

      {/* PRIVACY & DATA */}
      <section className="editorial-surface p-6 mb-5">
        <p className="text-sm font-bold text-slate-900 mb-4">Privacy &amp; data</p>
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Legal</p>
              <p className="text-[12px] text-slate-400">
                {profile.consentAcceptedAt ? `Consent accepted ${formatDate(profile.consentAcceptedAt)}.` : 'Review our policies.'}
              </p>
            </div>
            <div className="flex gap-3 text-xs font-bold text-indigo-600 shrink-0">
              <button onClick={() => { window.location.hash = 'privacy'; }} className="hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 rounded">Privacy Policy</button>
              <button onClick={() => { window.location.hash = 'terms'; }} className="hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 rounded">Terms</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Export my data</p>
              <p className="text-[12px] text-slate-400">Download your progress and responses (JSON).</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {exportStatus === 'error' && <span className="text-xs text-rose-600" role="alert">Failed</span>}
              <button
                onClick={handleExport}
                disabled={exportStatus === 'working'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              >
                <Download size={13} aria-hidden="true" /> {exportStatus === 'working' ? 'Preparing…' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DANGER ZONE */}
      <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50/40 p-6 mb-10">
        <p className="flex items-center gap-1.5 text-sm font-bold text-rose-700 mb-1">
          <ShieldAlert size={15} aria-hidden="true" /> Danger zone
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[13px] text-slate-600 max-w-md">
            Request permanent deletion of your account and all study data — diagnostics, practice history, study plans, and glossary. This <span className="font-bold">cannot be undone.</span>
          </p>
          <button
            onClick={() => setDeleteOpen(true)}
            className="shrink-0 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
          >
            Delete my account
          </button>
        </div>
      </section>

      {deleteOpen && (
        <DeleteAccountModal
          userId={user?.id ?? null}
          onCancel={() => setDeleteOpen(false)}
          onSignOut={onSignOut}
        />
      )}
    </div>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteAccountModal({
  userId,
  onCancel,
  onSignOut,
}: {
  userId: string | null;
  onCancel: () => void;
  onSignOut: () => void | Promise<void>;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const armed = confirmText.trim().toUpperCase() === 'DELETE';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  async function handleConfirm() {
    if (!armed || !userId) return;
    setStatus('working');
    try {
      // Request-deletion model: flag the account, then sign out. An admin purges
      // flagged accounts (CLAUDE.md: the Supabase auth-user delete path is unavailable).
      const { error } = await supabase
        .from('user_progress')
        .update({ deletion_requested_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (error) throw error;
      await onSignOut();
    } catch (err) {
      console.error('[AccountPage] deletion request failed:', err);
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onCancel} />
      <div className="editorial-surface relative w-full max-w-md p-6" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <p id="delete-account-title" className="text-lg font-extrabold text-slate-900">Delete your account?</p>
        </div>
        <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
          This requests permanent deletion of your account and <span className="font-semibold">all</span> study data. We can&apos;t recover it. If you just want a break, you can sign out instead.
        </p>
        <label htmlFor="delete-confirm" className="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">
          Type <span className="text-rose-600">DELETE</span> to confirm
        </label>
        <input
          id="delete-confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        />
        {status === 'error' && <p className="text-xs text-rose-600 mb-3" role="alert">Something went wrong — try again.</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!armed || status === 'working'}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
          >
            {status === 'working' ? 'Submitting…' : 'Permanently delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
