import { WEAK_MICRO_SKILLS } from '../landingData';

/** "Micro-skill precision" — we target the micro-skill, not the topic. */
export default function MicroSkillSection() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid lg:grid-cols-2 gap-12 items-center scroll-mt-20">
      <div>
        <p className="text-[12px] font-black uppercase tracking-[.2em] text-violet-300 mb-3">
          Micro-skill precision
        </p>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          We don't stop at skills.<br />
          We target the <span className="pl-gtxt">micro-skill.</span>
        </h2>
        <p className="text-[15.5px] text-white/70 leading-relaxed mb-5">
          Generic prep tells you you're "weak in assessment." PASS pinpoints that it's{' '}
          <span className="text-white font-semibold">norm- vs. criterion-referenced interpretation</span>, and
          that you keep confusing <span className="text-white font-semibold">screening with evaluation consent</span> —
          then targets exactly that, not the whole topic.
        </p>
        <ul className="space-y-2.5 text-[14.5px] text-white/75">
          <li className="flex gap-2.5"><span className="text-emerald-300">✓</span> Every exam skill broken down to its micro-skills</li>
          <li className="flex gap-2.5"><span className="text-emerald-300">✓</span> The exact micro-skill each question probes</li>
          <li className="flex gap-2.5"><span className="text-emerald-300">✓</span> Repeated error patterns named and targeted</li>
        </ul>
      </div>
      <div className="pl-glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-white/50">Your weakest micro-skills</p>
          <span className="text-[10px] text-white/40">live</span>
        </div>
        <div className="space-y-2.5">
          {WEAK_MICRO_SKILLS.map((m) => (
            <div key={m.title} className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
              <span className={`w-2 h-8 rounded bg-gradient-to-b ${m.barGradient}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{m.title}</p>
                <p className="text-[11px] text-white/45">{m.context}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.tierClass}`}>{m.tier}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
