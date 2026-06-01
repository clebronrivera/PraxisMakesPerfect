import { METHOD_WORKFLOW, METHOD_CHIPS } from '../landingData';

/** "The method" — grounded in MTSS, practitioner workflow. */
export default function MethodSection() {
  return (
    <section id="method" className="relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 pl-glass rounded-3xl p-6">
          <p className="text-[11px] font-black uppercase tracking-wide text-white/50 mb-4">
            The engine mirrors practitioner workflow
          </p>
          <div className="space-y-3">
            {METHOD_WORKFLOW.map((step, i) => (
              <div key={step.n}>
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${step.iconGradient} grid place-items-center text-white text-xs font-black`}>
                    {step.n}
                  </span>
                  <p className="text-sm font-semibold">
                    {step.title} <span className="text-white/45 font-normal">{step.detail}</span>
                  </p>
                </div>
                {i < METHOD_WORKFLOW.length - 1 && <div className="ml-4 h-3 w-px bg-white/20" />}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/10">
            {METHOD_CHIPS.map((chip) => (
              <span key={chip} className="pl-chip rounded-full px-3 py-1 text-[11px] font-bold">{chip}</span>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-[12px] font-black uppercase tracking-[.2em] text-cyan-300 mb-3">The method</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Grounded in MTSS,<br />not guesswork.
          </h2>
          <p className="text-[15.5px] text-white/70 leading-relaxed mb-4">
            Every decision the engine makes mirrors how effective school-based practitioners actually work —{' '}
            <span className="text-white font-semibold">baseline → pinpoint → target → progress-monitor.</span>
          </p>
          <p className="text-[15.5px] text-white/70 leading-relaxed">
            It was built by an educator with{' '}
            <span className="text-white font-semibold">almost two decades across classroom instruction, MTSS, intervention, and school-based student support</span> —
            with sequencing and review grounded in the science of learning:{' '}
            <span className="text-white font-semibold">spacing, retrieval practice, and interleaving</span>. Not flashcards.
            Not a generic question dump.
          </p>
        </div>
      </div>
    </section>
  );
}
