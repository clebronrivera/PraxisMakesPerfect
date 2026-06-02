/** "Why it's faster" — qualitative time-saved framing (no fabricated hours). */
export default function WhyFasterSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <p className="text-[12px] font-black uppercase tracking-[.2em] text-amber-300 mb-3">Why it's faster</p>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          Stop re-studying<br />what you already know.
        </h2>
        <p className="text-[15.5px] text-white/70 leading-relaxed mb-4">
          Because our test algorithm isolates the <span className="text-white font-semibold">micro-skills</span> you're
          missing — not broad topics — every minute you study goes to a gap that's actually costing you points. No
          grinding back through material you've already mastered.
        </p>
        <p className="text-[15.5px] text-white/70 leading-relaxed">
          Generic prep makes you review every topic, end to end, on every pass. PASS sends you straight to the handful
          of micro-skills standing between you and a pass.
        </p>
      </div>
      <div className="pl-glass rounded-3xl p-6">
        <p className="text-[11px] font-black uppercase tracking-wide text-white/50 mb-5">Where your study hours go</p>
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-semibold text-white/70">Generic prep</span>
            <span className="text-[11px] text-white/40">reviews all of it</span>
          </div>
          <div className="h-8 rounded-lg overflow-hidden flex">
            <div className="bg-white/10 flex items-center pl-2" style={{ width: '78%' }}>
              <span className="text-[10px] text-white/45 font-medium">material you already know</span>
            </div>
            <div className="bg-gradient-to-r from-rose-500 to-pink-600" style={{ width: '22%' }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-semibold text-white">With PASS</span>
            <span className="text-[11px] text-emerald-300">straight to your micro-gaps</span>
          </div>
          <div className="h-8 rounded-lg overflow-hidden flex">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600" style={{ width: '22%' }} />
            <div className="bg-gradient-to-r from-emerald-500/60 to-teal-600/60 flex items-center pl-2" style={{ width: '78%' }}>
              <span className="text-[10px] font-bold text-white/90">time back in your week</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-white/40 mt-4 text-center">Same exam. Same gaps closed. A fraction of the hours.</p>
      </div>
    </section>
  );
}
