import type { LandingAuthProps } from '../landingData';

/** Closing CTA band. */
export default function FinalCtaSection({ onOpenAuth }: LandingAuthProps) {
  return (
    <section className="px-6 md:px-10 py-20">
      <div
        className="max-w-5xl mx-auto rounded-3xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1 55%,#4338ca)' }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(40% 80% at 85% 20%, rgba(232,121,249,.45), transparent 60%)' }}
        />
        <div className="relative px-8 md:px-14 py-14 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">See your baseline in one sitting.</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-7">
            Stop guessing what to review. Find the exact skills between you and your license — then close them.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="rounded-2xl px-7 py-3.5 text-sm font-bold text-indigo-700 bg-white hover:bg-indigo-50 shadow-xl transition"
            >
              Take your adaptive baseline →
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="pl-chip rounded-2xl px-7 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition"
            >
              I have an account
            </button>
          </div>
          <p className="text-[12px] text-white/60 mt-5">One sitting · pick up on any device · currently in beta</p>
        </div>
      </div>
    </section>
  );
}
