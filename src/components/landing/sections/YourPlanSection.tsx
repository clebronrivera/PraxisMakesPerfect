import { PLAN_STATS, PLAN_QUEUE } from '../landingData';

/** "Your plan" — built from your data, not a template. */
export default function YourPlanSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <p className="text-[12px] font-black uppercase tracking-[.2em] text-emerald-300 mb-3">Your plan</p>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          A plan built from your data —<br />not a template.
        </h2>
        <p className="text-[15.5px] text-white/70 leading-relaxed mb-5">
          Two candidates never get the same plan. PASS sequences your weeks by what raises readiness fastest,
          quarantines what you keep missing for focused review, and resurfaces it on a spaced schedule so it sticks.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {PLAN_STATS.map((s) => (
            <div key={s.value} className="pl-glass rounded-xl p-3">
              <p className="text-2xl font-extrabold pl-gtxt">{s.value}</p>
              <p className="text-[11px] text-white/55">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="pl-glass rounded-3xl p-5">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-600 to-indigo-700 p-4 mb-3">
          <p className="text-[10px] uppercase tracking-wide text-indigo-200 font-bold mb-1">This week · sequenced by impact</p>
          <p className="text-sm font-semibold">Lock Assessment &amp; Data Use → +5% readiness</p>
        </div>
        <div className="space-y-2">
          {PLAN_QUEUE.map((q) => (
            <div key={q.label} className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
              <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${q.iconGradient} grid place-items-center text-white text-xs`}>
                {q.glyph}
              </span>
              <p className="text-[13px] flex-1">{q.label}</p>
              <span className="text-[11px] text-white/40">{q.time}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
