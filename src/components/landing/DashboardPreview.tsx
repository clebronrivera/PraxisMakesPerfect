// Static, non-interactive React replica of the PASS dashboard, used as the
// "live" product preview inside the landing hero window. Faithful to
// public/mockup-retheme-allscreens.html (bright multi-gradient). Rendered at a
// fixed 1360px base width so the hero can scale it down predictably.
//
// NOTE: numbers here are illustrative product-preview values, NOT real stats,
// and intentionally carry NO fixed counts ("45 skills" / "4 domains").

interface DomainCard {
  iconGradient: string;
  glyph: string;
  eyebrowColor: string;
  eyebrow: string;
  title: string;
  status: string;
  barGradient: string;
  pct: number;
}

const DOMAIN_CARDS: DomainCard[] = [
  { iconGradient: 'from-cyan-500 to-blue-600', glyph: '◐', eyebrowColor: 'text-cyan-700', eyebrow: 'Professional', title: 'Practices', status: '41% · Emerging', barGradient: 'from-cyan-500 to-blue-600', pct: 41 },
  { iconGradient: 'from-emerald-500 to-teal-600', glyph: '◑', eyebrowColor: 'text-emerald-700', eyebrow: 'Student-Level', title: 'Services', status: '78% · Approaching', barGradient: 'from-emerald-500 to-teal-600', pct: 78 },
  { iconGradient: 'from-rose-500 to-pink-600', glyph: '◒', eyebrowColor: 'text-rose-700', eyebrow: 'Systems-Level', title: 'Services', status: '34% · Emerging', barGradient: 'from-rose-500 to-pink-600', pct: 34 },
  { iconGradient: 'from-amber-500 to-orange-600', glyph: '◓', eyebrowColor: 'text-amber-700', eyebrow: 'Foundations', title: ' ', status: '62% · Approaching', barGradient: 'from-amber-500 to-orange-600', pct: 62 },
];

const NAV_ITEMS = [
  { glyph: '◆', label: 'Dashboard', active: true, iconBg: 'bg-white/25' },
  { glyph: '▶', label: 'Practice', active: false, iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
  { glyph: '▥', label: 'Progress', active: false, iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
  { glyph: '◈', label: 'Study Plan', active: false, iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600' },
  { glyph: '✦', label: 'AI Tutor', active: false, iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600' },
  { glyph: '▦', label: 'Glossary', active: false, iconBg: 'bg-gradient-to-br from-sky-500 to-cyan-600' },
];

/** Fixed-width (1360px) dashboard replica for the hero preview window. */
export default function DashboardPreview() {
  return (
    <div className="flex" style={{ width: 1360, fontFamily: "'Inter', system-ui, sans-serif", background: '#f7f6f8' }} aria-hidden="true">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col p-4 gap-1">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black">◑</div>
          <div>
            <p className="font-bold text-slate-900 leading-tight tracking-tight">PASS</p>
            <p className="text-[9px] tracking-wide text-slate-500 uppercase">School Psychology 5403</p>
          </div>
        </div>
        {NAV_ITEMS.map((n) => (
          <div
            key={n.label}
            className={
              n.active
                ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-500/30'
                : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600'
            }
          >
            <span className={`w-6 h-6 rounded-lg ${n.iconBg} flex items-center justify-center text-white text-xs`}>{n.glyph}</span>
            {n.label}
          </div>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-indigo-600 mb-1">Welcome back</p>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">
          Hi, <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent">Carlos.</span>
        </h1>

        {/* Readiness hero card */}
        <div className="rounded-3xl overflow-hidden mb-6 shadow-xl shadow-indigo-500/20 bg-gradient-to-br from-violet-500 via-indigo-600 to-indigo-700">
          <div className="p-6 flex items-center gap-8 text-white">
            <div className="relative w-32 h-32 shrink-0">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: 'conic-gradient(rgba(255,255,255,.95) 0%, rgba(255,255,255,.95) 41%, rgba(255,255,255,.22) 41%)' }}
              />
              <div className="absolute inset-[10px] rounded-full bg-indigo-600 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">41%</span>
                <span className="text-[10px] tracking-wide text-indigo-100 uppercase font-bold">Emerging</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-indigo-100 mb-1">Exam readiness</p>
              <p className="text-2xl font-bold leading-snug"><span className="text-white">13</span> skills<br />at Demonstrating.</p>
              <p className="text-sm text-indigo-100 mt-2">19 more to reach your readiness target.</p>
              <div className="flex gap-6 mt-4 pt-3 border-t border-white/20">
                <div><p className="text-[10px] uppercase tracking-wide text-indigo-200">Readiness phase</p><p className="text-sm font-bold">Developing</p></div>
                <div><p className="text-[10px] uppercase tracking-wide text-indigo-200">This week</p><p className="text-sm font-bold">+2 skills</p></div>
                <div><p className="text-[10px] uppercase tracking-wide text-indigo-200">Accuracy</p><p className="text-sm font-bold">74%</p></div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-indigo-700 bg-white shadow-lg">Start Practice →</div>
              <div className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-white bg-white/15 border border-white/30">View full report</div>
            </div>
          </div>
        </div>

        {/* Domain cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {DOMAIN_CARDS.map((d, i) => (
            <div key={i} className="bg-white border border-[#e7e3ee] rounded-3xl shadow-[0_18px_50px_rgba(30,27,75,0.07)] p-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${d.iconGradient} flex items-center justify-center text-white mb-3`}>{d.glyph}</div>
              <p className={`text-[10px] font-black uppercase tracking-wide ${d.eyebrowColor}`}>{d.eyebrow}</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{d.title}</p>
              <p className="text-xs text-slate-500 mt-1">{d.status}</p>
              <div className="h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${d.barGradient}`} style={{ width: `${d.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Today's Focus + This Week */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white border border-[#e7e3ee] rounded-3xl shadow-[0_18px_50px_rgba(30,27,75,0.07)] p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-slate-900">Today's Focus</p>
              <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-slate-400">Chained by priority</p>
            </div>
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 p-4 flex items-center gap-4 text-white shadow-lg shadow-rose-500/20">
              <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center text-white">◎</div>
              <div className="flex-1">
                <p className="text-[10px] font-black tracking-wide uppercase text-rose-100">Priority · Emerging · Systems-Level Services</p>
                <p className="font-semibold">Ecological Assessment and Contextual Factors</p>
                <p className="text-xs text-rose-100">9 skills below 60% in this domain — start here.</p>
              </div>
              <div className="rounded-xl px-4 py-2 text-sm font-semibold text-rose-700 bg-white">Practice →</div>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <span className="text-[10px] font-black uppercase text-slate-400 w-10">Then</span>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">▦</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Spaced review · 3 skills due</p>
                <p className="text-xs text-slate-500">RIOT Framework, Professional Liability, Section 504…</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#e7e3ee] rounded-3xl shadow-[0_18px_50px_rgba(30,27,75,0.07)] p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-slate-900">This Week</p>
              <span className="text-[10px] text-slate-400">7D</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Questions</span><span className="font-bold text-slate-900">148</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Study time</span><span className="font-bold text-slate-900">3h 42m</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Accuracy</span><span className="font-bold text-indigo-600">74%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Today's goal</span><span className="font-bold text-slate-900">22 / 25</span></div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-600" style={{ width: '88%' }} /></div>
            </div>
            <div className="mt-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-3 text-white flex items-center gap-2">
              <span className="text-lg">✦</span>
              <div><p className="text-xs font-bold leading-tight">3-day streak</p><p className="text-[10px] text-amber-100">Keep it going today</p></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
