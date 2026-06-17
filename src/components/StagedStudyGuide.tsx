// src/components/StagedStudyGuide.tsx
// A lighter, "staged" presentation of an existing StudyPlanDocumentV2.
// Stage 1 ("Where you stand") = one card per domain with a score chip, plain-English
// meaning, one concrete thing to watch, and Practice / Review / Test actions.
// Stage 2 ("Your plan") = a Bare-minimum vs Intentional depth toggle.
//
// PURE PRESENTATION: reuses the already-generated study-plan data. No regeneration,
// no new data fields. The only outward wiring is the optional launcher callbacks,
// which fall back to no-ops when not provided.

import { useState } from 'react';
import { StudyPlanDocumentV2 } from '../services/studyPlanService';
import { getSkillProficiency } from '../utils/skillProficiency';

interface LauncherProps {
  /** Start adaptive practice for a domain (Practice button). */
  onPractice?: (domainId: number) => void;
  /** Revisit previously-missed questions for a domain (Review button). */
  onReview?: (domainId: number) => void;
  /** Short timed check for a domain (Test button). */
  onTest?: (domainId: number) => void;
  /** Switch to the full, detailed 6-tab viewer. */
  onOpenDetailed?: () => void;
}

interface StagedStudyGuideProps extends LauncherProps {
  plan: StudyPlanDocumentV2;
}

// ─── Domain visual identity (per docs/DESIGN_TOKENS.md domain gradients) ──────────
interface DomainTheme { grad: string; chip: string; soft: string; ring: string; tick: string; }
const DOMAIN_THEME: Record<number, DomainTheme> = {
  1: { grad: 'from-cyan-500 to-blue-600',    chip: 'bg-cyan-100 text-cyan-700',       soft: 'bg-cyan-50 text-cyan-700 border-cyan-200',       ring: 'ring-cyan-200',  tick: 'text-cyan-500' },
  2: { grad: 'from-emerald-500 to-teal-600', chip: 'bg-emerald-100 text-emerald-700', soft: 'bg-emerald-50 text-emerald-700 border-emerald-200', ring: 'ring-emerald-200', tick: 'text-emerald-500' },
  3: { grad: 'from-rose-500 to-pink-600',    chip: 'bg-rose-100 text-rose-700',       soft: 'bg-rose-50 text-rose-700 border-rose-200',       ring: 'ring-rose-200',  tick: 'text-rose-500' },
  4: { grad: 'from-amber-500 to-orange-600', chip: 'bg-amber-100 text-amber-700',     soft: 'bg-amber-50 text-amber-700 border-amber-200',     ring: 'ring-amber-200', tick: 'text-amber-500' },
};
const domainTheme = (id: number): DomainTheme => DOMAIN_THEME[id] ?? DOMAIN_THEME[1];

const PROFICIENCY_LABEL: Record<string, string> = {
  proficient: 'Demonstrating',
  approaching: 'Approaching',
  emerging: 'Emerging',
  unstarted: 'Not started',
};

function readinessTheme(level: StudyPlanDocumentV2['readinessSnapshot']['readinessLevel']) {
  switch (level) {
    case 'early':       return { label: 'Early',       pct: 15, pill: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'developing':  return { label: 'Developing',  pct: 40, pill: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'approaching': return { label: 'Approaching', pct: 70, pill: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    case 'ready':       return { label: 'Ready',       pct: 95, pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
}

const pct = (score: number | null): number => (score == null ? 0 : Math.round(score * 100));

export default function StagedStudyGuide({
  plan,
  onPractice,
  onReview,
  onTest,
  onOpenDetailed,
}: StagedStudyGuideProps) {
  const [stage, setStage] = useState<1 | 2>(1);
  const [mode, setMode] = useState<'bare' | 'intentional'>('bare');

  const snap = plan.readinessSnapshot;
  const rt = readinessTheme(snap.readinessLevel);

  // Overall readiness % — average of available domain scores, else the level's nominal pct.
  const scored = plan.domainStudyMaps.filter(d => d.domainScore != null);
  const overallPct = scored.length
    ? Math.round((scored.reduce((s, d) => s + (d.domainScore ?? 0), 0) / scored.length) * 100)
    : rt.pct;

  // Domain cards, worst-first ("start with the red ones").
  const domains = [...plan.domainStudyMaps].sort(
    (a, b) => (a.domainScore ?? 1) - (b.domainScore ?? 1),
  );
  const weakestId = domains[0]?.domainId;
  const strongestId = domains[domains.length - 1]?.domainId;

  const weeksToTest = plan.studyConstraints?.weeksToTest ?? null;
  const intentionalAvailable = (weeksToTest ?? plan.weeklyStudyPlan.length) >= 3;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-indigo-600">Your study guide</p>
        <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-slate-900">
          Where you stand, <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent">and what to do next.</span>
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Built from your last assessment — no quiz to retake. Updated as you practice.</p>
      </div>

      {/* ── Readiness snapshot ── */}
      <div className="rounded-3xl overflow-hidden shadow-xl shadow-indigo-500/20 bg-gradient-to-br from-violet-500 via-indigo-600 to-indigo-700">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 text-white">
          <div className="relative w-24 h-24 shrink-0">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: `conic-gradient(rgba(255,255,255,.95) ${overallPct}%, rgba(255,255,255,.22) 0)` }}
            />
            <div className="absolute inset-[9px] rounded-full bg-indigo-600 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold">{overallPct}%</span>
              <span className="text-[9px] tracking-wide text-indigo-100 uppercase font-bold">{rt.label}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-indigo-100 mb-1">Readiness · {rt.label}</p>
            <p className="text-lg font-bold leading-snug">{snap.summary}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 pt-3 border-t border-white/20 text-sm">
              {snap.testTimeline && (
                <div><span className="text-indigo-200 text-xs">Test date</span> · <span className="font-bold">{snap.testTimeline}</span></div>
              )}
              <div><span className="text-indigo-200 text-xs">Next best move</span> · <span className="font-bold">{snap.nextBestMove}</span></div>
              <div><span className="text-indigo-200 text-xs">Strongest</span> · <span className="font-bold">{snap.strongestArea}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stage switcher ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100">
          <button
            onClick={() => setStage(1)}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${stage === 1 ? 'text-white bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Stage 1 · Where you stand
          </button>
          <button
            onClick={() => setStage(2)}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${stage === 2 ? 'text-white bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Stage 2 · Your plan
          </button>
        </div>
        {onOpenDetailed && (
          <button onClick={onOpenDetailed} className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition">
            Detailed view →
          </button>
        )}
      </div>

      {/* ── STAGE 1 ── */}
      {stage === 1 && (
        <section>
          <p className="text-sm text-slate-600 max-w-2xl mb-4">
            One card per area. Your score, what it means in plain English, one thing to watch — then jump
            straight into work on it. <span className="text-slate-400">Start with the red ones.</span>
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {domains.map(d => {
              const t = domainTheme(d.domainId);
              const prof = getSkillProficiency(d.domainScore ?? 0, d.domainScore == null ? 0 : 1);
              const watch = d.commonTraps[0] ?? d.keyVocabulary[0] ?? d.masteryIndicator;
              const isWeakest = d.domainId === weakestId;
              const isStrongest = d.domainId === strongestId && !isWeakest;
              return (
                <div key={d.domainId} className={`bg-white border border-slate-200 rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.07)] p-5 ${isWeakest ? `ring-2 ${t.ring}` : ''}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.grad} shrink-0`} aria-hidden />
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-wide ${t.chip.split(' ')[1]}`}>{d.domainName}</p>
                        <p className="text-sm font-semibold text-slate-900">{d.masteryIndicator}</p>
                      </div>
                    </div>
                    <span className={`rounded-full ${t.chip} px-2.5 py-1 text-[11px] font-black whitespace-nowrap`}>
                      {pct(d.domainScore)}% · {PROFICIENCY_LABEL[prof]}
                    </span>
                  </div>

                  {isWeakest && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full ${t.soft} border px-2.5 py-1 text-[10px] font-bold mb-3`}>● Start here</span>
                  )}
                  {isStrongest && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold mb-3">★ Your strongest area</span>
                  )}

                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    <span className="font-semibold text-slate-800">What this means:</span> {d.interpretation}
                  </p>

                  {watch && (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">One thing to watch</p>
                      <p className="text-[13px] text-slate-700 leading-snug">{watch}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onPractice?.(d.domainId)}
                      className={`rounded-xl px-3 py-2.5 text-sm font-bold text-white bg-gradient-to-br ${t.grad} hover:opacity-90 transition`}
                    >
                      Practice
                    </button>
                    <button
                      onClick={() => onReview?.(d.domainId)}
                      className={`rounded-xl px-3 py-2.5 text-sm font-bold ${t.soft} border hover:opacity-80 transition`}
                    >
                      Review
                    </button>
                    <button
                      onClick={() => onTest?.(d.domainId)}
                      className="rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
                    >
                      Test
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span><span className="font-bold text-slate-700">Practice</span> — work this area at your level, adaptively.</span>
            <span><span className="font-bold text-slate-700">Review</span> — revisit only the questions you've missed before.</span>
            <span><span className="font-bold text-slate-700">Test</span> — a short timed check to see if it's stuck.</span>
          </div>
        </section>
      )}

      {/* ── STAGE 2 ── */}
      {stage === 2 && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <p className="text-sm text-slate-600 max-w-xl">How much of a plan do you want? Pick the depth that fits your time.</p>
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 self-start">
              <button
                onClick={() => setMode('bare')}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${mode === 'bare' ? 'bg-white text-indigo-700 shadow-[0_4px_14px_rgba(30,27,75,0.12)]' : 'text-slate-500'}`}
              >
                Bare minimum
              </button>
              <button
                onClick={() => intentionalAvailable && setMode('intentional')}
                disabled={!intentionalAvailable}
                title={intentionalAvailable ? undefined : 'A sequenced plan needs at least 3 weeks before your test.'}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${mode === 'intentional' ? 'bg-white text-indigo-700 shadow-[0_4px_14px_rgba(30,27,75,0.12)]' : 'text-slate-500'} ${intentionalAvailable ? '' : 'opacity-40 cursor-not-allowed'}`}
              >
                Intentional
              </button>
            </div>
          </div>

          {/* Bare minimum */}
          {mode === 'bare' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.07)] p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">✓</span>
                  <p className="font-bold text-slate-900">If you only do the essentials</p>
                </div>
                <p className="text-sm text-slate-500 mb-5">The shortest path that still moves your readiness.</p>
                <ol className="space-y-3">
                  {plan.tacticalInstructions.immediateActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <span className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-black flex items-center justify-center">{i + 1}</span>
                      <p className="text-sm text-slate-700 flex-1">{action}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {plan.tacticalInstructions.avoidList.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.07)] p-5">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-2">Don't waste time on</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.tacticalInstructions.avoidList.map((item, i) => (
                      <span key={i} className="rounded-full bg-slate-100 text-slate-500 px-3 py-1 text-xs">{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Intentional */}
          {mode === 'intentional' && (
            <div className="space-y-4">
              {weeksToTest != null && (
                <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-xs">◷</span>
                  <p className="text-sm text-indigo-900"><span className="font-bold">You have ~{weeksToTest} weeks</span> — enough runway for a sequenced plan. Here's a week-by-week build.</p>
                </div>
              )}
              {plan.weeklyStudyPlan.map(week => (
                <div key={week.weekNumber} className="bg-white border border-slate-200 rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.07)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black flex items-center justify-center">{week.weekNumber}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{week.weekGoal}</p>
                        <p className="text-xs text-slate-500">{week.clusterFocus} · ~{Math.round(week.allocatedMinutes / 60)}h</p>
                      </div>
                    </div>
                    {week.datesLabel && <span className="text-[10px] font-bold text-slate-400">{week.datesLabel}</span>}
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    {week.sessions.map((s, i) => (
                      <p key={i} className="flex gap-2"><span className="text-indigo-400">▸</span> {s.focus}</p>
                    ))}
                  </div>
                  {week.checkpointQuestion && (
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-500">
                      <span className="font-bold text-slate-600">Checkpoint:</span> {week.checkpointQuestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
