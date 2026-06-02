/**
 * FluencyDrillPage — the Vocabulary Fluency Drill experience (setup → drill → results).
 *
 * Owns scope/direction/pace selection, runs <FluencyDrillSession>, then records the
 * outcome via vocabDrillService (raw attempts + glossary miss flags) and hands skill
 * nudges back to the app so the existing adaptive engine resurfaces weak vocab.
 */

import { useRef, useState } from 'react';
import { Zap, ArrowRight, BookMarked } from 'lucide-react';
import FluencyDrillSession, { type DrillDirection, type TermResult } from './FluencyDrillSession';
import { buildDrillScopes, type DrillScope, type SkillScoreLike } from '../utils/drillScopes';
import { termsForSkills } from '../utils/vocabSkillIndex';
import { recordDrillResults } from '../services/vocabDrillService';

export interface FluencyDrillPageProps {
  userId: string;
  skillScores: Record<string, SkillScoreLike | undefined>;
  /** Apply low-confidence nudges to repeatedly-missed skills (App owns updateSkillProgress). */
  onApplyNudges?: (skillIds: string[]) => void;
  onExit: () => void;
  onNavigateToGlossary?: () => void;
}

type View = 'setup' | 'drill' | 'results';

const PACES: Record<string, { label: string; sublabel: string; seconds: { term: number; definition: number } }> = {
  relaxed: { label: 'Relaxed', sublabel: '10s / 12s', seconds: { term: 10, definition: 12 } },
  standard: { label: 'Standard', sublabel: '7s / 10s · recommended', seconds: { term: 7, definition: 10 } },
  fast: { label: 'Fast', sublabel: '5s / 7s', seconds: { term: 5, definition: 7 } },
};

const DIRECTIONS: { id: DrillDirection; label: string }[] = [
  { id: 'def-to-term', label: 'Definition → Term' },
  { id: 'term-to-def', label: 'Term → Definition' },
  { id: 'mixed', label: 'Mixed' },
];

const MAX_CARDS = 20;

export default function FluencyDrillPage({
  userId,
  skillScores,
  onApplyNudges,
  onExit,
  onNavigateToGlossary,
}: FluencyDrillPageProps) {
  const [scopes] = useState<DrillScope[]>(() => buildDrillScopes(skillScores));
  const [scopeId, setScopeId] = useState<string>(() => scopes[0]?.id ?? 'all');
  const [direction, setDirection] = useState<DrillDirection>('def-to-term');
  const [paceId, setPaceId] = useState<string>('standard');
  const [view, setView] = useState<View>('setup');

  const resultsRef = useRef<TermResult[]>([]);
  const [summary, setSummary] = useState<{ correct: number; total: number; flagged: number; nudged: number }>({
    correct: 0,
    total: 0,
    flagged: 0,
    nudged: 0,
  });

  const scope = scopes.find((s) => s.id === scopeId) ?? scopes[0];
  const pace = PACES[paceId];

  function startDrill() {
    if (!scope) return;
    resultsRef.current = [];
    setView('drill');
  }

  async function handleFinish(score: { correct: number; total: number }) {
    const results = resultsRef.current;
    let flagged = 0;
    let nudged = 0;
    try {
      const res = await recordDrillResults(userId, results);
      flagged = res.flaggedTermCount;
      nudged = res.nudgeSkillIds.length;
      if (res.nudgeSkillIds.length && onApplyNudges) onApplyNudges(res.nudgeSkillIds);
    } catch (err) {
      console.error('[FluencyDrillPage] recordDrillResults failed:', err);
    }
    setSummary({ correct: score.correct, total: score.total, flagged, nudged });
    setView('results');
  }

  // ─── DRILL ──────────────────────────────────────────────────────────────────
  if (view === 'drill' && scope) {
    return (
      <FluencyDrillSession
        terms={termsForSkills(scope.skillIds)}
        direction={direction}
        secondsByDirection={pace.seconds}
        maxCards={MAX_CARDS}
        onTermResult={(r) => resultsRef.current.push(r)}
        onFinish={handleFinish}
        onExit={() => setView('setup')}
      />
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────────────────────────
  if (view === 'results') {
    const pct = summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0;
    const accent = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#f43f5e';
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="editorial-overline mb-2">Drill complete</p>
        <div className="editorial-surface p-7 text-center mb-5">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Score</p>
          <p className="text-5xl font-black" style={{ color: accent }}>{pct}%</p>
          <p className="mt-1 text-sm text-slate-500">{summary.correct} of {summary.total} correct</p>
        </div>

        <div className="editorial-surface p-5 mb-5">
          <p className="text-sm font-bold text-slate-900 mb-1">How this moved your skills</p>
          <p className="text-[12px] text-slate-500">
            {summary.nudged > 0
              ? `${summary.nudged} skill${summary.nudged === 1 ? '' : 's'} nudged from repeated misses — they'll resurface in practice.`
              : 'No skill took repeated misses this round — nice consistency.'}
          </p>
        </div>

        {summary.flagged > 0 && (
          <div className="editorial-surface-soft p-4 mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <BookMarked size={16} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">
                {summary.flagged} term{summary.flagged === 1 ? '' : 's'} sent to your Glossary
              </p>
              <p className="text-[11px] text-slate-500">Flagged for review — clear the flags by revealing them.</p>
            </div>
            {onNavigateToGlossary && (
              <button onClick={onNavigateToGlossary} className="editorial-button-ghost text-[12px]">
                Review →
              </button>
            )}
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button onClick={startDrill} className="editorial-button-primary">Drill again</button>
          <button onClick={() => setView('setup')} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            Change scope
          </button>
        </div>
      </div>
    );
  }

  // ─── SETUP ──────────────────────────────────────────────────────────────────
  const canStart = !!scope && scope.termCount >= 4;
  const violetSel = { boxShadow: '0 0 0 1px rgba(139,92,246,0.5), 0 14px 28px -10px rgba(79,70,229,0.3)', borderColor: 'rgba(139,92,246,0.5)' };
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="editorial-overline mb-2">Build fluency</p>
      <h1 className="text-3xl font-extrabold leading-tight text-slate-900 mb-1">
        Vocabulary <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent">Fluency Drill.</span>
      </h1>
      <p className="text-sm text-slate-500 mb-7 max-w-xl">
        Rapid-fire recall, beat the clock. Misses feed your skill data and get sent to your glossary to review.
      </p>

      {scopes.length === 0 ? (
        <div className="editorial-surface p-6 text-center">
          <p className="text-sm text-slate-500">No drillable vocabulary is available yet.</p>
          <button onClick={onExit} className="editorial-button-primary mt-4">Back</button>
        </div>
      ) : (
        <>
          {/* SCOPE */}
          <p className="editorial-overline mb-3">1 · Choose your scope</p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 mb-7">
            {scopes.map((s) => {
              const selected = s.id === scopeId;
              return (
                <button
                  key={s.id}
                  onClick={() => setScopeId(s.id)}
                  className="editorial-surface p-4 text-left transition"
                  style={selected ? violetSel : undefined}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">{s.label}</p>
                    <span className="text-[11px] font-bold text-accent">{s.termCount} terms</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.sublabel}</p>
                </button>
              );
            })}
          </div>

          {/* DIRECTION */}
          <p className="editorial-overline mb-3">2 · Direction</p>
          <div className="inline-flex p-1 rounded-full bg-slate-100 mb-7 flex-wrap">
            {DIRECTIONS.map((d) => {
              const selected = d.id === direction;
              return (
                <button
                  key={d.id}
                  onClick={() => setDirection(d.id)}
                  className={`px-4 py-2 rounded-full text-[13px] transition ${selected ? 'grad-chrome text-slate-900 font-bold shadow' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* PACE */}
          <div className="flex items-center justify-between mb-3">
            <p className="editorial-overline">3 · Pace</p>
            <p className="text-[11px] text-slate-400">seconds per card · def→term / term→def</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {Object.entries(PACES).map(([id, p]) => {
              const selected = id === paceId;
              return (
                <button
                  key={id}
                  onClick={() => setPaceId(id)}
                  className="editorial-surface p-3 text-center transition"
                  style={selected ? violetSel : undefined}
                >
                  <p className="text-sm font-bold text-slate-900">{p.label}</p>
                  <p className={`text-[11px] mt-0.5 ${selected ? 'text-accent' : 'text-slate-400'}`}>{p.sublabel}</p>
                </button>
              );
            })}
          </div>

          {/* START */}
          <div className="editorial-surface p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{scope?.label} · {DIRECTIONS.find((d) => d.id === direction)?.label} · {pace.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{scope?.termCount ?? 0} terms in scope · up to {MAX_CARDS} cards</p>
            </div>
            <button onClick={startDrill} disabled={!canStart} className="editorial-button-primary disabled:opacity-40">
              <Zap size={15} /> Start drill
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed flex items-start gap-1.5">
            <ArrowRight size={12} className="mt-0.5 shrink-0 text-accent" />
            A term you miss twice nudges that skill's priority, and every missed word is sent to your Glossary with a review flag.
          </p>

          <div className="flex justify-center mt-6">
            <button onClick={onExit} className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600">
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
