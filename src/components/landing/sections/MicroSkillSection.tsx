/** "Micro-skill precision" — we target the micro-skill, not the topic. */
export default function MicroSkillSection() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid lg:grid-cols-2 gap-12 items-center scroll-mt-20">
      <div>
        <p className="text-[12px] font-black uppercase tracking-[.2em] text-violet-300 mb-3">
          Granular by design
        </p>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          We don't stop at skills.<br />
          We target the <span className="pl-gtxt">micro-skill.</span>
        </h2>
        <p className="text-[15.5px] text-white/70 leading-relaxed mb-4">
          "You're weak in Data-Based Decision Making" isn't actionable — that domain covers everything from
          psychometrics to progress monitoring. PASS keeps drilling down until it finds the specific micro-skill
          that's actually breaking: not "assessment," but{' '}
          <span className="text-white font-semibold">interpreting reliability coefficients</span>. Not "behavior," but{' '}
          <span className="text-white font-semibold">linking an FBA to the right BIP.</span>
        </p>
        <p className="text-[15.5px] text-white/70 leading-relaxed">
          And because micro-skills are connected, fixing the right one unblocks the others that depend on it.
        </p>
      </div>

      {/* Domain → Skill → Micro-skills drill-down */}
      <div className="pl-glass rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
          <span className="text-[12px] uppercase tracking-wider text-white/50 font-semibold">Domain</span>
          <span className="text-[14px] font-semibold text-white">Data-Based Decision Making</span>
        </div>
        <div className="ml-[5px] border-l border-dashed border-white/15 pl-6 pt-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
            <span className="text-[12px] uppercase tracking-wider text-white/50 font-semibold">Skill</span>
            <span className="text-[14px] font-semibold text-white/85">Assessment &amp; Measurement</span>
          </div>
          <div className="ml-[4px] border-l border-dashed border-white/15 pl-6 pt-4 space-y-2.5">
            <div className="text-[12px] uppercase tracking-wider text-white/50 font-semibold">Micro-skills</div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[12.5px] font-medium text-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Norm-referenced scores</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-[12.5px] font-medium text-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Reliability &amp; validity</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-1.5 text-[12.5px] font-medium text-rose-200"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Psychometric statistics</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[12.5px] font-medium text-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Score interpretation</span>
            </div>
            <p className="text-[12.5px] text-white/45 pt-2">Your plan targets the red one first — and re-tests the others it touches.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
