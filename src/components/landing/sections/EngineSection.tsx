import type { LandingAuthProps } from '../landingData';
import DiagnosticEngine from '../DiagnosticEngine';

/**
 * "Watch your diagnosis build" — the full scrub+explore diagnostic engine in its
 * own section, placed AFTER the hero + how-it-works bridge (v6 narrative). On
 * desktop the section is a tall `[data-scrub-track]` and the panel pins, so the
 * diagnosis builds as you scroll; on mobile it auto-plays. With the 4-step
 * explanation already read, the domains / colors / stat cards land as proof.
 */
export default function EngineSection({ onOpenAuth }: LandingAuthProps) {
  return (
    <section id="engine" data-scrub-track className="de-hero-track relative scroll-mt-20">
      <div className="de-hero-pin">
        <div className="w-full max-w-3xl mx-auto px-6 md:px-10 pt-10 pb-16">
          <div className="text-center max-w-xl mx-auto mb-7">
            <p className="text-[12px] font-black uppercase tracking-[.2em] text-indigo-300 mb-3">See it work</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Watch your diagnosis build.</h2>
            <p className="text-white/60 leading-relaxed">
              Scroll, and PASS runs all four steps on a sample learner — breaking responses into domains,
              scoring every micro-skill, isolating the gaps, and building the plan. Then tap any node to dig in.
            </p>
          </div>
          <DiagnosticEngine onStart={() => onOpenAuth('signup')} />
        </div>
      </div>
    </section>
  );
}
