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

  return (
    <div className="grid grid-cols-[minmax(140px,1fr)_2fr_2fr] gap-0 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">

      {/* ── Column 1: Term ─────────────────────────────────────────────── */}
      <div className="px-4 py-4 flex flex-col gap-1 border-r border-slate-100">
        <span className="font-semibold text-slate-800 text-sm leading-snug">
          {entry.term}
        </span>
        {entry.added_from_skill_id && (
          <span className="text-[10px] text-slate-400 font-mono">
            {entry.added_from_skill_id}
          </span>
        )}
        {/* Status dot */}
        <div className="flex items-center gap-1 mt-1">
          {isRevealed ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
              <CheckCircle2 size={10} /> Revealed
            </span>
          ) : hasDef ? (
            <span className="flex items-center gap-1 text-[10px] text-indigo-500 font-medium">
              <Circle size={10} /> Defined
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Circle size={10} /> To define
            </span>
          )}
        </div>
      </div>

      {/* ── Column 2: User's definition ────────────────────────────────── */}
      <div className="px-4 py-4 border-r border-slate-100 flex flex-col gap-1">
        <textarea
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={handleBlur}
          rows={3}
          placeholder="Write what this term means to you…"
          className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-slate-400 transition"
        />
        <div className="h-4 flex items-center">
          {saving && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Loader2 size={10} className="animate-spin" /> Saving…
            </span>
          )}
          {saved && !saving && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500">
              <CheckCircle2 size={10} /> Saved
            </span>
          )}
        </div>
      </div>

      {/* ── Column 3: Official definition ──────────────────────────────── */}
      <div className="px-4 py-4 flex flex-col gap-2 justify-start">
        {isRevealed ? (
          <div className="text-sm text-slate-700 leading-relaxed bg-indigo-50/60 border border-indigo-100 rounded-lg px-3 py-2">
            {officialDef}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 italic">
              <EyeOff size={12} />
              Hidden until you reveal it
            </div>
            <button
              onClick={handleReveal}
              disabled={revealing}
              className="self-start flex items-center gap-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 active:scale-95 transition disabled:opacity-50"
            >
              {revealing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Eye size={12} />
              )}
              Reveal Definition
            </button>
            {hasDef && (
              <p className="text-[10px] text-slate-400">
                Compare it to yours once you're ready.
              </p>
            )}
          </div>
        )}
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
        <Loader2 className="animate-spin text-indigo-400" size={28} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="px-6 pt-5 pb-0 flex items-end gap-1">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg border border-b-0 transition ${
              activeTab === 'terms'
                ? 'bg-white text-indigo-700 border-slate-200 relative z-10 -mb-px'
                : 'bg-slate-50 text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <BookMarked size={14} />
            My Terms
            {total > 0 && (
              <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-600 rounded-full px-1.5 py-0.5 font-bold">
                {total}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg border border-b-0 transition ${
              activeTab === 'quiz'
                ? 'bg-white text-violet-700 border-slate-200 relative z-10 -mb-px'
                : 'bg-slate-50 text-slate-500 border-transparent hover:text-slate-700'
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
              <Loader2 className="animate-spin text-violet-400" size={28} />
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
            <div className="px-6 pt-4 pb-4 bg-white border-b border-slate-200">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <BookMarked size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">My Glossary</h1>
                  <p className="text-xs text-slate-500">
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
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search terms…"
                      className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Table column headers ──────────────────────────────────── */}
            {total > 0 && (
              <div className="grid grid-cols-[minmax(140px,1fr)_2fr_2fr] gap-0 bg-slate-50 border-b border-slate-200">
                <div className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200">
                  Term
                </div>
                <div className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200">
                  What does this mean to you?
                </div>
                <div className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Official Definition
                </div>
              </div>
            )}
          </div>

          {/* ── Rows ───────────────────────────────────────────────────────── */}
          {total === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No terms match your filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
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
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
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
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
        <Sparkles size={28} className="text-indigo-400" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-1">
          Your glossary is empty
        </h2>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          When you get a practice question wrong, the key vocabulary words from
          that skill will automatically appear here for you to define and study.
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-2 text-left bg-slate-50 rounded-xl p-4 max-w-sm w-full">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
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
    <div className="flex items-start gap-2 text-xs text-slate-600">
      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      {text}
    </div>
  );
}
