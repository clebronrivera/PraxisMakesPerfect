import { METHOD_PRACTICES, METHOD_LOOP, METHOD_ROLES } from '../landingData';

/** "Where this comes from" — grounded in performance science (the founder's
 *  diagnostic career), not MTSS-as-résumé-line. */
export default function MethodSection() {
  return (
    <section id="method" className="relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — the practice cards + roles */}
        <div className="order-2 lg:order-1">
          <div className="grid grid-cols-2 gap-3">
            {METHOD_PRACTICES.map((p) => (
              <div key={p.title} className="pl-glass rounded-2xl p-5">
                <span className={`text-lg ${p.accentText}`}>{p.glyph}</span>
                <div className="font-semibold text-white text-[14px] mt-3">{p.title}</div>
                <p className="text-[12.5px] text-white/50 mt-1.5 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="text-[10.5px] uppercase tracking-[.18em] text-white/40 font-semibold mb-2.5">Fifteen-plus years across</div>
            <div className="flex flex-wrap gap-2">
              {METHOD_ROLES.map((r) => (
                <span key={r} className="pl-chip rounded-full px-3 py-1 text-[11.5px] text-white/70">{r}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — the narrative + the question + the loop */}
        <div className="order-1 lg:order-2">
          <p className="text-[12px] font-black uppercase tracking-[.2em] text-cyan-300 mb-3">Where this comes from</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Grounded in <span className="pl-gtxt">performance science</span>, not guesswork.
          </h2>
          <p className="text-[15.5px] text-white/70 leading-relaxed mb-5">
            PASS wasn't designed around content coverage. It was designed around how improvement actually happens.
            Its founder's entire career — analyzing assessment data, monitoring intervention response, regrouping
            students, coaching educators, making calls from imperfect information — has been spent answering one
            question:
          </p>
          <blockquote className="pl-glass rounded-2xl px-6 py-5 border-l-2 border-l-violet-400/60 mb-5">
            <p className="text-[17px] font-extrabold text-white leading-snug">
              Why is performance breaking down — and what's the smallest intervention that fixes it?
            </p>
          </blockquote>
          <p className="text-[15.5px] text-white/70 leading-relaxed mb-3.5">The engine runs that same diagnostic loop on your prep:</p>
          <div className="flex flex-wrap items-center gap-y-2 text-[12.5px] font-medium text-white/65 mb-5">
            {METHOD_LOOP.map((s, i) => (
              <span key={s} className="flex items-center">
                <span className={`rounded-full px-3 py-1 ${i === METHOD_LOOP.length - 1 ? 'border border-indigo-400/40 bg-indigo-500/10 text-indigo-200' : 'pl-chip'}`}>{s}</span>
                {i < METHOD_LOOP.length - 1 && <span className="mx-1.5 text-white/30">→</span>}
              </span>
            ))}
          </div>
          <p className="text-[14px] text-white/55 leading-relaxed">
            Every recommendation is driven by evidence gathered from{' '}
            <span className="text-white font-semibold">your own performance</span> — not a generic study schedule.
          </p>
        </div>
      </div>
    </section>
  );
}
