import { HOW_IT_WORKS_STEPS } from '../landingData';

/** "How it works" — three-step baseline → pinpoint → target. */
export default function HowItWorksSection() {
  return (
    <section id="how" className="max-w-7xl mx-auto px-6 md:px-10 py-20 scroll-mt-20">
      <p className="text-center text-[12px] font-black uppercase tracking-[.2em] text-fuchsia-300 mb-3">
        How it works
      </p>
      <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
        From "study everything" to "study <span className="pl-gtxt">this.</span>"
      </h2>
      <p className="text-center text-white/60 max-w-2xl mx-auto mb-12">
        Four steps — the same loop a strong diagnostician runs, now pointed at your prep. Here's what the
        engine is about to do.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {HOW_IT_WORKS_STEPS.map((s) => (
          <div key={s.step} className="pl-glass rounded-2xl p-6">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.iconGradient} grid place-items-center text-white text-lg mb-4`}>
              {s.glyph}
            </div>
            <p className={`text-[11px] font-black ${s.accentText} mb-1`}>{s.step}</p>
            <h3 className="text-lg font-bold mb-2">{s.title}</h3>
            <p className="text-[14px] text-white/65 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
