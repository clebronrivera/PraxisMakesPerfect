import type { LandingAuthProps } from '../landingData';
import DashboardPreview from '../DashboardPreview';

/** Landing hero — headline + CTAs on the left, live dashboard preview on the right. */
export default function HeroSection({ onOpenAuth }: LandingAuthProps) {
  return (
    <section
      className="relative max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-[0.92fr_1.08fr] gap-8 items-center pt-12 pb-20"
      style={{ minHeight: '86vh' }}
    >
      {/* Left — copy + CTAs */}
      <div className="relative z-10">
        <div className="pl-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white/85 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> Praxis 5403 · School Psychology
        </div>
        <h1 className="text-5xl md:text-[58px] font-extrabold leading-[1.03] tracking-tight mb-5">
          Find the exact skills<br />
          <span className="pl-gtxt">holding you back.</span>
        </h1>
        <p className="text-[16.5px] leading-relaxed text-white/75 max-w-xl mb-7">
          Take an adaptive baseline. A diagnostic algorithm — built by an educator with almost two decades of
          experience across classroom instruction, <span className="text-white font-semibold">MTSS</span>, and student
          support, grounded in the science of how we learn — pinpoints the exact{' '}
          <span className="text-white font-semibold">micro-skills</span> you're missing across the entire exam
          blueprint, then builds your plan around them.
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
        <p className="text-[12.5px] text-white/45">Built by an educator — not a test-prep mill.</p>
      </div>

      {/* Right — live product window (hidden on small screens to avoid tilt overflow) */}
      <div className="pl-stage relative h-[520px] hidden lg:block">
        <div className="pl-window absolute right-0 top-1/2 -translate-y-1/2 w-[600px] rounded-2xl overflow-hidden border border-white/15">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#15122a] border-b border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-3 text-[10px] text-white/40 font-medium rounded-md bg-white/5 px-3 py-0.5">app.pass.study/dashboard</span>
            <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE
            </span>
          </div>
          {/* Scaled dashboard replica (1360px base × 0.44 ≈ 598px wide) */}
          <div className="relative overflow-hidden" style={{ height: 360, background: '#f7f6f8' }}>
            <div style={{ position: 'absolute', top: -22, left: 0, transform: 'scale(0.44)', transformOrigin: 'top left' }}>
              <DashboardPreview />
            </div>
          </div>
        </div>

        {/* Floating: micro-skill pinpointed */}
        <div className="pl-float pl-bob absolute left-1 bottom-2 w-[300px] rounded-2xl bg-white text-slate-900 p-4 z-20">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center text-white text-[10px]">✦</span>
            <span className="text-[10px] font-black uppercase tracking-wide text-violet-700">Micro-skill pinpointed</span>
          </div>
          <p className="text-[15px] font-bold leading-snug mb-1">Norm- vs. criterion-referenced interpretation</p>
          <p className="text-[11.5px] text-slate-500 mb-3">
            a micro-skill inside <b className="text-slate-700">Assessment &amp; Data Use</b> · not the whole topic
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold">Tier 2 · targeted</span>
            <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold">drives 3 recent misses</span>
          </div>
        </div>
      </div>
    </section>
  );
}
