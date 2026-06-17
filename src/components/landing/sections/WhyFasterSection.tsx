/** "Why it's faster" — qualitative time-saved framing (no fabricated hours).
 *  Visual: the Praxis 5403 blueprint as a grid — most cells already mastered
 *  (dimmed + checked = skipped), only the few gap cells are lit = your plan.
 *  That literally shows "stop re-studying what you already know." */

// Illustrative blueprint: 'm' mastered (skip), 'p' developing, 'c' critical gap.
// Mostly mastered so the "skip most of it" point reads at a glance.
const BLUEPRINT: Array<'m' | 'p' | 'c'> = [
  'm', 'm', 'p', 'm', 'm', 'm', 'c',
  'm', 'p', 'm', 'm', 'm', 'm', 'p',
  'm', 'm', 'm', 'c', 'm', 'p', 'm',
  'p', 'm', 'm', 'm', 'm', 'c', 'm',
];

const CELL: Record<'m' | 'p' | 'c', string> = {
  m: 'bg-emerald-500/[0.07] border-emerald-400/15 text-emerald-400/45',
  p: 'bg-amber-400/15 border-amber-400/45 text-amber-200',
  c: 'bg-rose-500/20 border-rose-400/55 text-rose-200 shadow-[0_0_12px_-2px_rgba(251,113,133,0.6)]',
};

export default function WhyFasterSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <p className="text-[12px] font-black uppercase tracking-[.2em] text-amber-300 mb-3">Why it's faster</p>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          Stop re-studying<br />what you already know.
        </h2>
        <p className="text-[15.5px] text-white/70 leading-relaxed mb-4">
          Generic prep marches you through the entire blueprint, end to end, on every pass — most of it skills
          you've already mastered. PASS skips what you've got and sends you to the{' '}
          <span className="text-white font-semibold">handful of micro-skills</span> actually costing you points.
        </p>
        <p className="text-[15.5px] text-white/70 leading-relaxed">
          Every minute you study lands on a gap that moves your score — not on material you'd ace in your sleep.
        </p>
      </div>

      {/* The blueprint, lit only where you need to study */}
      <div className="pl-glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-black uppercase tracking-wide text-white/50">The Praxis 5403 blueprint</p>
          <span className="text-[10px] text-white/40">your plan, lit</span>
        </div>
        <p className="text-[12px] text-white/45 mb-4">Dimmed = already solid. Lit = what PASS actually puts in front of you.</p>

        <div className="grid grid-cols-7 gap-1.5 mb-5">
          {BLUEPRINT.map((s, i) => (
            <div
              key={i}
              className={`aspect-square rounded-md border grid place-items-center text-[11px] ${CELL[s]}`}
              title={s === 'm' ? 'Mastered — skipped' : s === 'p' ? 'Developing — in your plan' : 'Critical gap — targeted first'}
            >
              {s === 'm' ? '✓' : ''}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/55">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-400/30 grid place-items-center text-[8px] text-emerald-400/60">✓</span> Already solid — skipped</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400/30 border border-amber-400/50" /> Developing</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-400/60" /> Critical gap</span>
        </div>

        <p className="text-[11px] text-white/40 mt-4 pt-4 border-t border-white/10 text-center">
          Same exam. Same gaps closed. A fraction of the hours.
        </p>
      </div>
    </section>
  );
}
