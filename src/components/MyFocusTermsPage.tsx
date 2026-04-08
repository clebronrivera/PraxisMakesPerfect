// src/components/MyFocusTermsPage.tsx
//
// My Focus Terms — shows only the glossary terms the user has accumulated
// from incorrect practice answers. Each term is shown with its user definition
// (if written) and the official definition (if revealed).
//
// Data source: same `user_glossary_terms` Supabase table as GlossaryPage.
// All rows in that table are terms added from wrong answers, so this page
// is essentially a focused, filter-free view of the full glossary.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  Loader2,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  loadGlossaryTerms,
  saveUserDefinition,
  revealDefinition,
  removeGlossaryTerm,
  type GlossaryTerm,
} from '../services/glossaryService';
import glossaryData from '../data/master-glossary.json';

// ─── Official definitions lookup ──────────────────────────────────────────────

const OFFICIAL_DEFINITIONS: Record<string, string> = {};
for (const entry of (glossaryData as { meta: object; terms: { term: string; definition: string }[] }).terms) {
  OFFICIAL_DEFINITIONS[entry.term] = entry.definition;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MyFocusTermsPageProps {
  userId: string | null;
}

// ─── FocusTermRow ─────────────────────────────────────────────────────────────

interface FocusTermRowProps {
  entry: GlossaryTerm;
  userId: string;
  onDefinitionSaved: (term: string, text: string) => void;
  onReveal: (term: string) => void;
  onRemove: (term: string) => void;
}

function FocusTermRow({ entry, userId, onDefinitionSaved, onReveal }: FocusTermRowProps) {
  const [localText, setLocalText] = useState(entry.user_definition ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const prevText = useRef(entry.user_definition ?? '');

  const officialDef = OFFICIAL_DEFINITIONS[entry.term] ?? 'Definition not available.';

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

      {/* ── Column 1: Term ──────────────────────────────────────────────── */}
      <div className="px-4 py-4 flex flex-col gap-1 border-r border-slate-100">
        <span className="font-semibold text-slate-800 text-sm leading-snug">
          {entry.term}
        </span>
        {entry.added_from_skill_id && (
          <span className="text-[10px] text-slate-400 font-mono">
            {entry.added_from_skill_id}
          </span>
        )}
        <div className="flex items-center gap-1 mt-1">
          {isRevealed ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
              <CheckCircle2 size={10} /> Revealed
            </span>
          ) : hasDef ? (
            <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
              <Circle size={10} /> Defined
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Circle size={10} /> To define
            </span>
          )}
        </div>
      </div>

      {/* ── Column 2: User's definition ─────────────────────────────────── */}
      <div className="px-4 py-4 border-r border-slate-100 flex flex-col gap-1">
        <textarea
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={handleBlur}
          rows={3}
          placeholder="Write what this term means to you…"
          className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 placeholder:text-slate-400 transition"
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

      {/* ── Column 3: Official definition ───────────────────────────────── */}
      <div className="px-4 py-4 flex flex-col gap-2 justify-start">
        {isRevealed ? (
          <div className="text-sm text-slate-700 leading-relaxed bg-amber-50/60 border border-amber-100 rounded-lg px-3 py-2">
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
              className="self-start flex items-center gap-1.5 text-xs font-medium text-amber-700 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-50 active:scale-95 transition disabled:opacity-50"
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

// ─── MyFocusTermsPage ─────────────────────────────────────────────────────────

export default function MyFocusTermsPage({ userId }: MyFocusTermsPageProps) {
  const [entries, setEntries] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    loadGlossaryTerms(userId).then((rows) => {
      setEntries(rows);
      setLoading(false);
    });
  }, [userId]);

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-amber-400" size={28} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10">
        <div className="px-6 pt-4 pb-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Target size={18} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">My Focus Terms</h1>
              <p className="text-xs text-slate-500">
                Terms from questions you've answered incorrectly
              </p>
            </div>
          </div>

          {entries.length > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                <span className="font-bold">{entries.length}</span>{' '}
                {entries.length === 1 ? 'term' : 'terms'} to study
              </span>
            </div>
          )}
        </div>

        {/* ── Table column headers ──────────────────────────────────── */}
        {entries.length > 0 && (
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

      {/* ── Rows / Empty state ──────────────────────────────────────────── */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Sparkles size={28} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-700 mb-1">
              No focus terms yet
            </h2>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              Answer practice questions to automatically add terms here. Terms appear
              when you get a question wrong.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {entries.map((entry) =>
            userId ? (
              <FocusTermRow
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
    </div>
  );
}
