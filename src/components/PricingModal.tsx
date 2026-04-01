// src/components/PricingModal.tsx
// Pricing table modal with monthly/yearly toggle and Stripe Checkout redirect.

import { useState } from 'react';
import { X, Check, Sparkles, Zap } from 'lucide-react';
import { PRICING } from '../types/subscription';
import { supabase } from '../config/supabase';

interface PricingModalProps {
  onClose: () => void;
}

export default function PricingModal({ onClose }: PricingModalProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPrice = isYearly ? PRICING.yearly : PRICING.monthly;

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not logged in');

      const priceId = isYearly
        ? (import.meta.env.VITE_STRIPE_PRICE_ID_YEARLY || 'price_yearly_placeholder')
        : (import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || 'price_monthly_placeholder');

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout');

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  const freeFeatures = [
    'Adaptive Diagnostic (full)',
    '10 practice questions/day',
    '3 AI Tutor messages/day',
    'Full Glossary access',
    'Basic progress tracking',
  ];

  const premiumFeatures = [
    'Everything in Free, plus:',
    'Unlimited practice questions',
    'Unlimited AI Tutor messages',
    'AI Study Guide (personalized)',
    'Redemption Rounds',
    'Full Learning Path',
    'Score Export / PDF Reports',
    'Priority support',
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-2xl animate-fade-in">
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 px-6 py-8 text-center text-white">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <Sparkles className="mx-auto mb-3 h-10 w-10" />
            <h2 className="text-2xl font-bold">Upgrade to Premium</h2>
            <p className="mt-2 text-sm text-white/80">Unlock the full power of your study companion</p>

            {/* Toggle */}
            <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/10 px-1 py-1">
              <button
                onClick={() => setIsYearly(false)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  !isYearly ? 'bg-white text-indigo-700 shadow' : 'text-white/70 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  isYearly ? 'bg-white text-indigo-700 shadow' : 'text-white/70 hover:text-white'
                }`}
              >
                Yearly
                <span className="ml-1.5 rounded-full bg-emerald-400 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                  Save {PRICING.yearly.savings}
                </span>
              </button>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {/* Free tier */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900">Free</h3>
              </div>
              <p className="mt-1 text-2xl font-bold text-slate-900">$0<span className="text-sm font-normal text-slate-400">/forever</span></p>
              <ul className="mt-4 space-y-2">
                {freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="mt-5 w-full rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-400"
              >
                Current Plan
              </button>
            </div>

            {/* Premium tier */}
            <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/30 p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-indigo-900">Premium</h3>
              </div>
              <p className="mt-1 text-2xl font-bold text-indigo-900">
                {currentPrice.display}
                <span className="text-sm font-normal text-indigo-400">/{currentPrice.interval}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {premiumFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-indigo-800">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Redirecting to Stripe...' : 'Subscribe Now'}
              </button>
              {error && (
                <p className="mt-2 text-center text-xs text-rose-600">{error}</p>
              )}
            </div>
          </div>

          <p className="px-6 pb-4 text-center text-xs text-slate-400">
            Cancel anytime. Secure payment via Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
