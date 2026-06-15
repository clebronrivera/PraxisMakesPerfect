import type { LandingAuthProps } from '../landingData';
import DiagnosticEngine from '../DiagnosticEngine';

const STEPS = ['Baseline', 'Diagnose', 'Target', 'Monitor'];

/**
 * Landing hero — copy + CTAs on the left, the live PASS Diagnostic Engine on the
 * right. On desktop the section is a tall `[data-scrub-track]` and the inner row
 * pins, so the diagnosis builds as you scroll (the engine reads this track). On
 * mobile it's normal flow and the engine auto-plays. Copy sells the founder's
 * diagnostic experience (performance science), per the landing-positioning memory.
 */
export default function HeroSection({ onOpenAuth }: LandingAuthProps) {
  return (
    <section data-scrub-track className="de-hero-track relative">
      <div className="de-hero-pin">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-[0.92fr_1.08fr] gap-10 lg:gap-8 items-center pt-10 pb-16">
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
              PASS was built by an educator who has spent more than fifteen years analyzing performance
              data, identifying learning gaps, matching interventions, and monitoring growth across
              thousands of students and educators. The same diagnostic thinking now powers an engine that
              pinpoints the exact <span className="text-white font-semibold">micro-skills</span> standing
              between you and your license — then builds your study plan around them.
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
            <p className="text-[12.5px] text-white/45 mb-7">Built by an educator — not a test-prep mill.</p>

            {/* four-step flow */}
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/35 font-semibold mb-3">How the engine works</div>
              <div className="flex flex-wrap items-center gap-y-2 text-[12.5px] font-medium text-white/60">
                {STEPS.map((s, i) => (
                  <span key={s} className="flex items-center">
                    <span className="pl-chip rounded-full px-3.5 py-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] opacity-60 font-semibold">{String(i + 1).padStart(2, '0')}</span> {s}
                    </span>
                    {i < STEPS.length - 1 && (
                      <svg className="w-3.5 h-3.5 mx-1.5 text-white/25" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right — live diagnostic engine */}
          <div className="relative z-10">
            <DiagnosticEngine onStart={() => onOpenAuth('signup')} />
          </div>
        </div>
      </div>
    </section>
  );
}
