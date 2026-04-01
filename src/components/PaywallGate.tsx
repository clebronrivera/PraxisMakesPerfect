// src/components/PaywallGate.tsx
// Wrapper component that shows an upgrade prompt instead of children
// when the user's subscription doesn't include the required feature.

import { Lock, Sparkles } from 'lucide-react';
import type { GatedFeature } from '../types/subscription';
import { ACTIVE_LAUNCH_FEATURES } from '../utils/launchConfig';

interface PaywallGateProps {
  feature: GatedFeature;
  canAccess: boolean;
  onUpgrade: () => void;
  children: React.ReactNode;
  /** Optional custom message. Defaults to feature-specific text. */
  message?: string;
}

const FEATURE_LABELS: Record<GatedFeature, string> = {
  unlimited_practice: 'Unlimited Practice Questions',
  unlimited_tutor: 'Unlimited AI Tutor Messages',
  study_guide: 'AI Study Guide',
  redemption_rounds: 'Redemption Rounds',
  score_export: 'Score Export',
  full_learning_path: 'Full Learning Path',
};

export default function PaywallGate({
  feature,
  canAccess,
  onUpgrade,
  children,
  message,
}: PaywallGateProps) {
  // If paywall is disabled, always show children
  if (!ACTIVE_LAUNCH_FEATURES.paywall) return <>{children}</>;

  // If user has access, show children
  if (canAccess) return <>{children}</>;

  const featureLabel = FEATURE_LABELS[feature] || 'This Feature';
  const displayMessage = message || `${featureLabel} is available with a Premium subscription.`;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
        <Lock className="h-6 w-6 text-amber-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{featureLabel}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-600">{displayMessage}</p>
      <button
        onClick={onUpgrade}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:from-amber-600 hover:to-amber-700 transition-all"
      >
        <Sparkles className="h-4 w-4" />
        Upgrade to Premium
      </button>
      <p className="mt-2 text-xs text-slate-400">Starting at $14.99/month</p>
    </div>
  );
}
