// src/components/GlossaryPage.tsx
//
// The Glossary tab — a personal vocabulary practice tool.
//
// How it works:
//   • When a student answers a question WRONG, the vocabulary terms associated
//     with that skill are automatically added to their glossary queue.
//   • Each term row has three columns:
//       1. Term — the vocabulary word
//       2. What does this mean to you? — editable textarea (auto-saved on blur)
//       3. Official Definition — hidden until the student clicks "Reveal";
//          once revealed it stays revealed permanently.
//   • A filter bar lets students focus on terms they haven't defined yet, etc.

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  Search,
  Loader2,
  BookMarked,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  loadGlossaryTerms,
  saveUserDefinition,
  revealDefinition,
  removeGlossaryTerm,
  type GlossaryTerm,
} from '../services/glossaryService';
import glossaryData from '../data/master-glossary.json';

const VocabularyQuizMode = lazy(() => import('./VocabularyQuizMode'));

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'to-define' | 'defined' | 'revealed';
type GlossaryTab = 'terms' | 'quiz';

interface GlossaryPageProps {
  userId: string | null;
}

// Build a quick lookup from master-glossary.json
const OFFICIAL_DEFINITIONS: Record<string, string> = {};
for (const entry of (glossaryData as { meta: object; terms: { term: string; definition: string }[] }).terms) {
  OFFICIAL_DEFINITIONS[entry.term] = entry.definition;
}

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── GlossaryRow ─────────────────────────────────────────────────────────────

interface GlossaryRowProps {
  entry: GlossaryTerm;
  userId: string;
  onDefinitionSaved: (term: string, text: string) => void;
  onReveal: (term: string) => void;
  onRemove: (term: string) => void; // reserved for future use
}

function GlossaryRow({ entry, userId, onDefinitionSaved, onReveal }: GlossaryRowProps) {
  const [localText, setLocalText] = useState(entry.user_definition ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const prevText = useRef(entry.user_definition ?? '');

  const officialDef = OFFICIAL_DEFINITIONS[entry.term] ?? 'Definition not available.';

  // Auto-save on blur
  const handleBlur = useCallback(async () => {
    if (localText === prevText.current) return;
    setSaving(true);
    await saveUserDefinition(userId, entry.term, localText);
    prevText.current = localText;
    onDefinitionSaved(entry.term, localText);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [localText, userId, entry.term, onDefinitionSaved]);

  const handleReveal = useCallback(async () => {
    setRevealing(true);
    await revealDefinition(userId, entry.term);
    onReveal(entry.term);
    setRevealing(false);
  }, [userId, entry.term, onReveal]);

  const isRevealed = entry.revealed;
  const hasDef = localText.trim().length > 0;

  // Atelier card-style row: vertical layout, glass surface, clear status.
  const statusColor = isRevealed ? 'var(--d2-mint)' : hasDef ? 'var(--d3-ice)' : 'rgba(226,232,240,0.2)';

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-colors hover:bg-white/4"
      style={{ background: 'rgba(10,22,40,0.45)', border: '1px solid rgba(226,232,240,0.08)' }}
    >
      {/* Left accent stripe */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
      />

      <div className="p-5 space-y-4">
        {/* Header: term + status */}
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="serif text-[18px] font-semibold text-white leading-snug tracking-tight">{entry.term}</p>
            {entry.added_from_skill_id && (
              <p className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-wider">
                {entry.added_from_skill_id}
              </p>
            )}
          </div>
          <div className="shrink-0">
            {isRevealed ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--d2-mint)' }}>
                <CheckCircle2 size={10} /> Revealed
              </span>
            ) : hasDef ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--d3-ice)' }}>
                <Circle size={10} /> Defined
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                <Circle size={10} /> To define
              </span>
            )}
          </div>
        </div>

        {/* Two-column content on wide screens, stacked below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User's definition */}
          <div>
            <p className="eyebrow mb-2">Your definition</p>
            <textarea
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={handleBlur}
              rows={3}
              placeholder="Write what this term means to you…"
              className="w-full text-[13px] text-slate-100 bg-[rgba(6,13,26,0.7)] border border-white/10 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--d1-peach)]/30 focus:border-[color:var(--d1-peach)]/50 placeholder:text-slate-500 transition"
            />
            <div className="h-4 mt-1 flex items-center">
              {saving && (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <Loader2 size={10} className="animate-spin" /> Saving…
                </span>
              )}
              {saved && !saving && (
                <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--d2-mint)' }}>
                  <CheckCircle2 size={10} /> Saved
                </span>
              )}
            </div>
          </div>

          {/* Official definition */}
          <div>
            <p className="eyebrow mb-2">Official definition</p>
            {isRevealed ? (
              <div
                className="text-[13px] text-slate-200 leading-relaxed rounded-lg px-3 py-2 min-h-[86px]"
                style={{
                  background: 'color-mix(in srgb, var(--d3-ice) 8%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--d3-ice) 25%, transparent)',
                }}
              >
                {officialDef}
              </div>
            ) : (
              <div className="flex flex-col gap-2 min-h-[86px] justify-center">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 italic">
                  <EyeOff size={12} />
                  Hidden until you reveal it
                </div>
                <button
                  onClick={handleReveal}
                  disabled={revealing}
                  className="self-start inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)]"
                  style={{
                    color: 'var(--d3-ice)',
                    background: 'color-mix(in srgb, var(--d3-ice) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--d3-ice) 30%, transparent)',
                  }}
                >
                  {revealing ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                  Reveal Definition
                </button>
                {hasDef && (
                  <p className="text-[10px] text-slate-500">Compare it to yours once you're ready.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GlossaryPage ─────────────────────────────────────────────────────────────

export default function GlossaryPage({ userId }: GlossaryPageProps) {
  const [activeTab, setActiveTab] = useState<GlossaryTab>('terms');
  const [entries, setEntries] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);

  // Load on mount
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    loadGlossaryTerms(userId).then((rows) => {
      setEntries(rows);
      setLoading(false);
    });
  }, [userId]);

  // ── Callbacks ────────────────────────────────────────────────────────────
  const handleDefinitionSaved = useCallback((term: string, text: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.term === term ? { ...e, user_definition: text } : e))
    );
  }, []);

  const handleReveal = useCallback((term: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.term === term
          ? { ...e, revealed: true, revealed_at: new Date().toISOString() }
          : e
      )
    );
  }, []);

  const handleRemove = useCallback(
    async (term: string) => {
      if (!userId) return;
      await removeGlossaryTerm(userId, term);
      setEntries((prev) => prev.filter((e) => e.term !== term));
    },
    [userId]
  );

  // ── Stats ────────────────────────────────────────────────────────────────
  const total = entries.length;
  const totalDefined = entries.filter((e) => (e.user_definition ?? '').trim().length > 0).length;
  const totalRevealed = entries.filter((e) => e.revealed).length;
  const totalToDo = entries.filter(
    (e) => !(e.user_definition ?? '').trim() && !e.revealed
  ).length;

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = entries.filter((e) => {
    const matchSearch =
      debouncedSearch === '' ||
      e.term.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchFilter =
      filter === 'all' ||
      (filter === 'to-define' && !(e.user_definition ?? '').trim() && !e.revealed) ||
      (filter === 'defined' && (e.user_definition ?? '').trim().length > 0) ||
      (filter === 'revealed' && e.revealed);

    return matchSearch && matchFilter;
  });

  // ── User term names (for quiz prioritization) ───────────────────────────
  const userTermNames = entries.map((e) => e.term);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[color:var(--d3-ice)]" size={28} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto text-slate-200">
      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-navy-900/85 border-b border-white/8 backdrop-blur-md">
        <div className="px-6 pt-5 pb-0 flex items-end gap-1">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg border border-b-0 transition ${
              activeTab === 'terms'
                ? 'bg-[rgba(10,22,40,0.85)] text-white border-white/10 relative z-10 -mb-px'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <BookMarked size={14} />
            My Terms
            {total > 0 && (
              <span className="ml-1 text-[10px] bg-[color:var(--d3-ice)]/15 text-[color:var(--d3-ice)] rounded-full px-1.5 py-0.5 font-bold">
                {total}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg border border-b-0 transition ${
              activeTab === 'quiz'
                ? 'bg-[rgba(10,22,40,0.85)] text-white border-white/10 relative z-10 -mb-px'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <Zap size={14} />
            Quiz Mode
          </button>
        </div>
      </div>

      {/* ── Quiz Mode tab ──────────────────────────────────────────────────── */}
      {activeTab === 'quiz' && (
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-[color:var(--d4-lavender)]" size={28} />
            </div>
          }
        >
          <VocabularyQuizMode userTerms={userTermNames} />
        </Suspense>
      )}

      {/* ── My Terms tab ───────────────────────────────────────────────────── */}
      {activeTab === 'terms' && (
        <>
          {/* ── Header + column headers (single sticky block) ───────────── */}
          <div className="sticky top-[53px] z-10">
            <div className="px-6 pt-4 pb-4 bg-navy-900/85 border-b border-white/8 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-[color:var(--d3-ice)]/15 flex items-center justify-center">
                  <BookMarked size={18} className="text-[color:var(--d3-ice)]" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">My Glossary</h1>
                  <p className="text-xs text-slate-400">
                    Words added when you miss a question. Define them, then reveal the
                    official meaning to compare.
                  </p>
                </div>
              </div>

              {/* Stats row */}
              {total > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  <StatChip label="Total" value={total} color="slate" />
                  <StatChip label="To Define" value={totalToDo} color="amber" />
                  <StatChip label="Defined" value={totalDefined} color="indigo" />
                  <StatChip label="Revealed" value={totalRevealed} color="emerald" />
                </div>
              )}

              {/* Search + Filter */}
              {total > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[160px] max-w-xs">
                    <Search
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search terms…"
                      className="w-full pl-7 pr-3 py-1.5 text-xs border border-white/10 rounded-lg bg-[rgba(6,13,26,0.7)] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--d1-peach)]/20 focus:border-[color:var(--d1-peach)]/50"
                    />
                  </div>

                  {/* Filter pills */}
                  <div className="flex gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'to-define', label: 'To Define' },
                        { id: 'defined', label: 'Defined' },
                        { id: 'revealed', label: 'Revealed' },
                      ] as { id: FilterMode; label: string }[]
                    ).map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setFilter(id)}
                        className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
                          filter === id
                            ? 'bg-gradient-to-r from-[color:var(--d1-peach)] to-[color:var(--d4-lavender)] text-[#1e1b3a] border-transparent'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:border-[color:var(--d1-peach)]/40 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── Rows ───────────────────────────────────────────────────────── */}
          {total === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No terms match your filter.
            </div>
          ) : (
            <div className="space-y-3 px-6 pt-4">
              {filtered.map((entry) =>
                userId ? (
                  <GlossaryRow
                    key={entry.term}
                    entry={entry}
                    userId={userId}
                    onDefinitionSaved={handleDefinitionSaved}
                    onReveal={handleReveal}
                    onRemove={handleRemove}
                  />
                ) : null
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'slate' | 'amber' | 'indigo' | 'emerald';
}) {
  const colors = {
    slate:   'bg-navy-800 text-slate-300 border border-white/10',
    amber:   'bg-[color:var(--d1-peach)]/10 text-[color:var(--d1-peach)] border border-[color:var(--d1-peach)]/30',
    indigo:  'bg-[color:var(--d4-lavender)]/10 text-[color:var(--d4-lavender)] border border-[color:var(--d4-lavender)]/30',
    emerald: 'bg-[color:var(--d2-mint)]/10 text-[color:var(--d2-mint)] border border-[color:var(--d2-mint)]/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${colors[color]}`}>
      <span className="font-bold">{value}</span> {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[color:var(--d3-ice)]/10 flex items-center justify-center">
        <Sparkles size={28} className="text-[color:var(--d3-ice)]" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-white mb-1">
          Your glossary is empty
        </h2>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          When you get a practice question wrong, the key vocabulary words from
          that skill will automatically appear here for you to define and study.
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-2 text-left bg-white/5 border border-white/8 rounded-xl p-4 max-w-sm w-full">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          How it works
        </p>
        <Step n={1} text="Answer a practice question incorrectly" />
        <Step n={2} text="Key terms from that skill appear here" />
        <Step n={3} text="Write what each term means to you" />
        <Step n={4} text="Reveal the official definition to compare" />
      </div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-2 text-xs text-slate-300">
      <span className="w-5 h-5 rounded-full bg-[color:var(--d3-ice)]/15 text-[color:var(--d3-ice)] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[color:var(--d3-ice)]/30">
        {n}
      </span>
      {text}
    </div>
  );
}
