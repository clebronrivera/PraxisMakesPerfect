import { MICRO_SKILL_MAP, type LandingAuthProps, type MasteryTier } from '../landingData';

/**
 * Landing hero (v7 structure) — benefit-first copy + CTAs on the left, the
 * micro-skill map on the right (domain-grouped, illustrative). The full
 * diagnostic engine lives in its own section below (EngineSection), after the
 * "how it works" bridge (HowItWorksSection) — this panel is a compact tease of
 * that payoff, not a duplicate of the step-by-step copy that already lives in
 * those two sections. No counts/percentages render here — see MICRO_SKILL_MAP's
 * doc comment in landingData.ts.
 */

const TIER_STYLE: Record<MasteryTier, string> = {
  strong: 'bg-emerald-500/20 border border-emerald-400/30',
  developing: 'bg-amber-500/20 border border-amber-400/30',
  critical: 'bg-rose-500/35 border border-rose-400/50 shadow-[0_0_8px_rgba(251,113,133,0.55)]',
};

export default function HeroSection({ onOpenAuth }: LandingAuthProps) {
  return (
    <section id="hero" className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-12 items-center pt-12 pb-16">
      {/* Left — copy + CTAs */}
      <div className="relative z-10">
        <div className="pl-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white/85 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> Praxis 5403 · School Psychology
        </div>
        <h1 className="text-5xl md:text-[58px] font-extrabold leading-[1.03] tracking-tight mb-5">
          Find the <span className="pl-gtxt">exact skills</span><br />
          holding you back.
        </h1>
        <p className="text-[16.5px] leading-relaxed text-white/75 max-w-xl mb-7">
          Take an adaptive baseline and PASS pinpoints the exact{' '}
          <span className="text-white font-semibold">micro-skills</span> standing between you and your
          license — then builds your study plan around them. You'll see where you really stand in one
          sitting.
        </p>
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={() => onOpenAuth('signup')}
            className="rounded-2xl px-6 py-3.5 text-sm font-bold text-indigo-700 bg-white shadow-xl shadow-indigo-900/40 hover:bg-indigo-50 transition"
          >
            Take your adaptive baseline →
          </button>
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="pl-chip rounded-2xl px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition"
          >
            I have an account
          </button>
        </div>
        <p className="text-[12.5px] text-white/45">
          Built by an educator with 15+ years of diagnostic experience — not a test-prep mill.
        </p>
      </div>

      {/* Right — the micro-skill map (the full engine is the section below) */}
      <div className="relative z-10">
        <div className="pl-glass rounded-3xl p-6 sm:p-7">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-semibold mb-4">
            Your micro-skill map
          </div>
          <div className="space-y-3">
            {MICRO_SKILL_MAP.map((domain) => (
              <div key={domain.shortName}>
                <p className="mb-1.5 text-[11.5px] font-semibold text-white/60">{domain.shortName}</p>
                <div className="flex flex-wrap gap-1.5">
                  {domain.tiers.map((tier, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className={`h-5 w-5 sm:h-6 sm:w-6 rounded-md ${TIER_STYLE[tier]}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-white/10 text-[11.5px] text-white/50">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Mastered</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Developing</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> Critical gap</span>
          </div>
          <a href="#engine" className="block text-center mt-4 text-[12px] text-indigo-300 font-medium hover:text-indigo-200 transition">↓ Watch the engine map yours live</a>
        </div>
      </div>
    </section>
  );
}
