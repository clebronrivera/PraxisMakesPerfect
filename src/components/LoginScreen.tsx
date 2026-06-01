import { useEffect, useState, useRef, useCallback } from 'react';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';
import LandingPage from './landing/LandingPage';

// ─── Entry flow phase ────────────────────────────────────────────────────────
// Boot is an easter-egg, gated by ?boot=1. The default phase renders the
// marketing landing (LandingPage), which owns the auth modal.
type EntryPhase = 'boot' | 'hero';

// ─── Skill data for boot-sequence grid ───────────────────────────────────────
const DOMAIN_COLORS: Record<number, { cell: string; border: string; text: string; boot: string }> = {
  1: { cell: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-700', boot: 'bg-amber-500' },
  2: { cell: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-700', boot: 'bg-emerald-500' },
  3: { cell: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-700', boot: 'bg-blue-500' },
  4: { cell: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-700', boot: 'bg-purple-500' },
};

const ALL_SKILLS = PROGRESS_DOMAINS.flatMap(d =>
  getProgressSkillsForDomain(d.id).map(s => ({ ...s, domainId: d.id }))
);

const DOMAIN_SKILL_COUNTS = PROGRESS_DOMAINS.map(d => ({
  ...d,
  count: getProgressSkillsForDomain(d.id).length,
}));

// ─── Boot sequence terminal lines ────────────────────────────────────────────
// Each line has an optional `delay` (ms) — the time to wait *before* showing
// this line. Defaults to 450ms. Section-end checkmarks get 900ms so the eye
// has a beat to register completion before the next phase starts.
const BOOT_LINES: Array<{ text: string; cls: string; delay?: number }> = [
  // Phase 1 — Blueprint load
  { text: '> Loading ETS Praxis 5403 blueprint...', cls: 'text-emerald-400' },
  { text: '✓ Blueprint integrity verified — sha256 OK', cls: 'text-emerald-300', delay: 900 },
  { text: '> Parsing test specification...', cls: 'text-slate-400' },
  { text: '  Found: exam blueprint + skill architecture', cls: 'text-cyan-400' },

  // Phase 2 — Domain + skill registration
  { text: '> Registering domain architecture...', cls: 'text-slate-400' },
  ...DOMAIN_SKILL_COUNTS.map((d, i) => ({
    text: `  DOMAIN_0${d.id} ${d.name.padEnd(30)} [${String(d.count).padStart(2)} skills]`,
    cls: ['text-amber-400', 'text-emerald-400', 'text-blue-400', 'text-purple-400'][i],
  })),
  { text: `✓ ${ALL_SKILLS.length} skills registered across ${PROGRESS_DOMAINS.length} domains`, cls: 'text-emerald-300', delay: 900 },

  // Phase 3 — Module linkage
  { text: '> Linking skills to adaptive modules...', cls: 'text-slate-400' },
  { text: '  ↳ Adaptive Diagnostic Engine', cls: 'text-cyan-400' },
  { text: '  ↳ Practice by Skill', cls: 'text-cyan-400' },
  { text: '  ↳ Practice by Domain', cls: 'text-cyan-400' },
  { text: '  ↳ Redemption Rounds (quarantine loop)', cls: 'text-cyan-400' },
  { text: '  ↳ Study Guide Generator', cls: 'text-cyan-400' },
  { text: `✓ Module linkage complete — ${ALL_SKILLS.length}/${ALL_SKILLS.length} skills covered`, cls: 'text-emerald-300', delay: 900 },

  // Phase 4 — Adaptivity + misconception engine
  { text: '> Loading adaptive engine...', cls: 'text-slate-400' },
  { text: '  Per-skill follow-ups · Recall / Application alternation', cls: 'text-cyan-400' },
  { text: '  Misconception detection · every distractor classified', cls: 'text-cyan-400' },
  { text: '  Confidence signal weighting: ENABLED', cls: 'text-cyan-400' },
  { text: '✓ Adaptivity online — engine adjusts after each response', cls: 'text-emerald-300', delay: 900 },

  // Phase 5 — Scheduling + handoff
  { text: '> Configuring spaced review scheduler...', cls: 'text-slate-400' },
  { text: '✓ SRS intervals: [1d, 3d, 7d, 14d, 30d]', cls: 'text-emerald-300' },
  { text: '✓✓ Platform ready — serving personalized content', cls: 'text-emerald-400 font-bold', delay: 1200 },
];

// ─── Boot Sequence Component ─────────────────────────────────────────────────
// Reached only when `?boot=1` is present in the URL.

const LINE_SHOW_AT: number[] = (() => {
  const out: number[] = [];
  let cumulative = 0;
  for (const line of BOOT_LINES) {
    cumulative += line.delay ?? 450;
    out.push(cumulative);
  }
  return out;
})();
const TOTAL_BOOT_MS = LINE_SHOW_AT[LINE_SHOW_AT.length - 1] ?? 0;

function BootSequence({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [litCells, setLitCells] = useState<Set<number>>(new Set());
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lineTimers: ReturnType<typeof setTimeout>[] = [];
    LINE_SHOW_AT.forEach((showAt) => {
      lineTimers.push(setTimeout(() => {
        setVisibleLines(prev => prev + 1);
        terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' });
      }, showAt));
    });

    let cellIndex = 0;
    let domainDelay = 600;
    for (const domain of PROGRESS_DOMAINS) {
      const skills = getProgressSkillsForDomain(domain.id);
      for (let j = 0; j < skills.length; j++) {
        const idx = cellIndex;
        lineTimers.push(setTimeout(() => {
          setLitCells(prev => new Set([...prev, idx]));
        }, domainDelay + j * 100));
        cellIndex++;
      }
      domainDelay += skills.length * 100 + 400;
    }

    const advanceTimer = setTimeout(onComplete, TOTAL_BOOT_MS + 1500);
    lineTimers.push(advanceTimer);

    return () => lineTimers.forEach(clearTimeout);
  }, [onComplete]);

  const progressPct = Math.min((visibleLines / BOOT_LINES.length) * 100, 100);

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-slate-300 p-6 flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex justify-end mb-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:border-slate-400 transition-colors"
        >
          Skip →
        </button>
      </div>

      <div className="flex-1 flex gap-6 max-w-6xl mx-auto w-full">
        {/* Terminal */}
        <div className="flex-1 rounded-xl border border-[#ece4d7] bg-[#fbfaf7] p-5 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-[10px] text-slate-600 ml-2 font-mono">pass_engine v1.0</span>
          </div>
          <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs leading-relaxed">
            {BOOT_LINES.slice(0, visibleLines).map((line, i) => {
              const elapsedSec = Math.floor((LINE_SHOW_AT[i] ?? 0) / 1000);
              const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
              const ss = String(elapsedSec % 60).padStart(2, '0');
              return (
                <p key={i} className={line.cls}>
                  <span className="text-slate-600">[{mm}:{ss}]</span>{' '}
                  {line.text}
                </p>
              );
            })}
            {visibleLines >= BOOT_LINES.length && (
              <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse" />
            )}
          </div>
        </div>

        {/* Skill grid */}
        <div className="w-72 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-3">
            Skill Architecture — {ALL_SKILLS.length} cells
          </p>
          <div className="grid grid-cols-9 gap-1">
            {ALL_SKILLS.map((skill, i) => {
              const color = DOMAIN_COLORS[skill.domainId];
              return (
                <div
                  key={skill.skillId}
                  className={`h-6 rounded transition-all duration-300 ${
                    litCells.has(i) ? `${color.boot}/80` : 'bg-white'
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-3 space-y-1">
            {DOMAIN_SKILL_COUNTS.map((d, i) => {
              const bootColors = ['text-amber-400', 'text-emerald-400', 'text-blue-400', 'text-purple-400'];
              const dotColors = ['bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500'];
              return (
                <div key={d.id} className="flex items-center gap-2 text-[10px]">
                  <span className={`w-2.5 h-2.5 rounded ${dotColors[i]}`} />
                  <span className={bootColors[i]}>{d.name} ({d.count})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full mt-6">
        <div className="h-1 rounded-full bg-white overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2 font-mono">Initializing adaptive engine...</p>
      </div>
    </div>
  );
}

// ─── Main LoginScreen ────────────────────────────────────────────────────────

/** Read ?boot=1 query param (SSR-safe). */
function shouldStartInBoot(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('boot') === '1';
}

export default function LoginScreen() {
  const [showAdminEntry, setShowAdminEntry] = useState(false);

  // ── Entry flow state ───────────────────────────────────────────────────────
  const [entryPhase, setEntryPhase] = useState<EntryPhase>(() =>
    shouldStartInBoot() ? 'boot' : 'hero'
  );

  // ── Admin keyboard shortcut (Ctrl+Shift+A → surfaces admin sign-in) ─────────
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        setShowAdminEntry((current) => !current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBootComplete = useCallback(() => setEntryPhase('hero'), []);
  const handleBootSkip = useCallback(() => setEntryPhase('hero'), []);

  // ── PHASE: BOOT (easter-egg, reached via ?boot=1) ───────────────────────────
  if (entryPhase === 'boot') {
    return <BootSequence onComplete={handleBootComplete} onSkip={handleBootSkip} />;
  }

  // ── PHASE: HERO — the PASS marketing landing (owns the auth modal) ──────────
  return <LandingPage showAdminEntry={showAdminEntry} />;
}
