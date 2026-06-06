// src/components/QuestionBankTab.tsx
//
// Admin "Question Bank" tab — the Question Bank Vault audit.
// Counts and coverage of the static question bank, auditable down to the
// individual question: full stem + every choice + the feedback a student sees
// per choice + the downstream triggers each answer fires + bank-health triage.
//
// Pure client-side: derives everything from src/data/questions.json (loaded
// dynamically so it stays out of the main bundle) and the authoritative
// skill→domain taxonomy in progressTaxonomy.ts. No API / service role needed.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  PROGRESS_DOMAINS,
  PROGRESS_SKILL_LOOKUP,
} from '../utils/progressTaxonomy';
import skillVocabMap from '../data/skill-vocabulary-map.json';

/** Official Praxis 5403 exam content weights per domain (%). Mirrors ResultsDashboard. */
const EXAM_WEIGHTS: Record<number, number> = { 1: 36, 2: 21, 3: 19, 4: 24 };

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
type Letter = (typeof OPTION_LETTERS)[number];

interface Distractor {
  tier: string | null;
  errorType: string | null;
  misconception: string | null;
  skillDeficit: string | null;
}

interface QRow {
  id: string;
  skill: string;
  skillLabel: string;
  domain: number;
  domainName: string;
  cc: string | null;
  kt: string | null;
  found: boolean;
  fmt: string | null;
  caseV: boolean;
  ms: boolean;
  correctCount: number | null;
  optionCount: number | null;
  stem: string;
  caseText: string;
  options: Partial<Record<Letter, string>>;
  correct: string;
  explanation: string;
  coreConcept: string;
  rationale: string;
  construct: string;
  complexityRationale: string;
  distractors: Partial<Record<Letter, Distractor>>;
  dominantErrorPattern: string;
  errorClusterTag: string;
  instructionalRedFlags: string;
  topMisconceptionThemes: string;
  skillPrereqs: string;
  prereqChain: string;
  verified: boolean;
  hasExpl: boolean;
  hasErrPattern: boolean;
}

type RawQ = Record<string, unknown>;
const str = (v: unknown): string => (v == null ? '' : String(v));
const skillVocabTerms = (skillId: string): string[] =>
  ((skillVocabMap as { skills?: Record<string, { vocabularyTerms?: string[] }> })
    .skills?.[skillId]?.vocabularyTerms) ?? [];

function normalize(raw: RawQ): QRow {
  const skill = str(raw.current_skill_id);
  const def = PROGRESS_SKILL_LOOKUP[skill];
  const options: Partial<Record<Letter, string>> = {};
  for (const L of OPTION_LETTERS) {
    const v = str(raw[L]).trim();
    if (v && v.toUpperCase() !== 'UNUSED') options[L] = v;
  }
  const distractors: Partial<Record<Letter, Distractor>> = {};
  for (const L of OPTION_LETTERS) {
    const tier = str(raw[`distractor_tier_${L}`]).trim();
    const errorType = str(raw[`distractor_error_type_${L}`]).trim();
    const misconception = str(raw[`distractor_misconception_${L}`]).trim();
    const skillDeficit = str(raw[`distractor_skill_deficit_${L}`]).trim();
    if (tier || errorType || misconception || skillDeficit) {
      distractors[L] = {
        tier: tier || null,
        errorType: errorType || null,
        misconception: misconception || null,
        skillDeficit: skillDeficit || null,
      };
    }
  }
  const correctCountRaw = str(raw.correct_answer_count);
  const optionCountRaw = str(raw.option_count_expected);
  const explanation = str(raw.CORRECT_Explanation);
  const dominantErrorPattern = str(raw.dominant_error_pattern);
  return {
    id: str(raw.UNIQUEID),
    skill,
    skillLabel: def?.fullLabel ?? def?.shortLabel ?? '',
    domain: def?.domainId ?? 0,
    domainName: def ? PROGRESS_DOMAINS.find((d) => d.id === def.domainId)?.name ?? '' : '',
    cc: str(raw.cognitive_complexity) || null,
    kt: def?.knowledgeType ?? null,
    found: !!raw.is_foundational,
    fmt: str(raw.item_format) || null,
    caseV: !!raw.has_case_vignette,
    ms: !!raw.is_multi_select,
    correctCount: correctCountRaw ? parseInt(correctCountRaw, 10) : null,
    optionCount: optionCountRaw ? parseInt(optionCountRaw, 10) : null,
    stem: str(raw.question_stem),
    caseText: str(raw.case_text),
    options,
    correct: str(raw.correct_answers),
    explanation,
    coreConcept: str(raw.core_concept),
    rationale: str(raw.rationale),
    construct: str(raw.construct_actually_tested),
    complexityRationale: str(raw.complexity_rationale),
    distractors,
    dominantErrorPattern,
    errorClusterTag: str(raw.error_cluster_tag),
    instructionalRedFlags: str(raw.instructional_red_flags),
    topMisconceptionThemes: str(raw.top_misconception_themes),
    skillPrereqs: str(raw.skill_prerequisites),
    prereqChain: str(raw.prereq_chain_narrative),
    verified: !!raw.is_human_verified,
    hasExpl: !!explanation.trim(),
    hasErrPattern: !!dominantErrorPattern.trim(),
  };
}

// ── Completeness model ──────────────────────────────────────────────────────
function wrongLetters(q: QRow): Letter[] {
  const correct = q.correct.split(/[,\s]+/).map((x) => x.trim().toUpperCase());
  return (Object.keys(q.options) as Letter[]).filter((L) => !correct.includes(L));
}
function distractorComplete(q: QRow): boolean {
  const wrong = wrongLetters(q);
  if (!wrong.length) return false;
  return wrong.every((L) => !!q.distractors[L]?.misconception);
}
function completeness(q: QRow): { checks: [string, boolean][]; score: number; max: number; full: boolean } {
  const checks: [string, boolean][] = [
    ['Explanation', !!q.explanation.trim()],
    ['Rationale', !!q.rationale.trim()],
    ['Construct tested', !!q.construct.trim()],
    ['Per-distractor feedback', distractorComplete(q)],
    ['Error pattern', q.hasErrPattern],
    ['Human-verified', q.verified],
  ];
  const score = checks.filter((c) => c[1]).length;
  return { checks, score, max: checks.length, full: score === checks.length };
}
const hasAnomaly = (q: QRow): boolean => q.ms && q.correctCount === 1;

// ── CSV helpers ─────────────────────────────────────────────────────────────
const csvEsc = (v: unknown): string => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
function download(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Small presentational helpers ────────────────────────────────────────────
const BADGE: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-700',
  violet: 'bg-violet-50 text-violet-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
};
function Badge({ text, color }: { text: string; color: keyof typeof BADGE }) {
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${BADGE[color]}`}>{text}</span>;
}
const HEALTH_CARD: Record<string, string> = {
  emerald: 'border-emerald-200 bg-emerald-50/50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50/50 text-amber-700',
  rose: 'border-rose-200 bg-rose-50/50 text-rose-700',
  slate: 'border-slate-200 bg-white text-slate-700',
};

export default function QuestionBankTab() {
  const [raw, setRaw] = useState<RawQ[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fDomain, setFDomain] = useState('');
  const [fSkill, setFSkill] = useState('');
  const [fCc, setFCc] = useState('');
  const [fKt, setFKt] = useState('');
  const [fComp, setFComp] = useState('');
  const [search, setSearch] = useState('');
  const [drawerSkill, setDrawerSkill] = useState<string | null>(null);
  const [drawerQuestion, setDrawerQuestion] = useState<QRow | null>(null);

  useEffect(() => {
    let alive = true;
    import('../data/questions.json')
      .then((m) => {
        if (alive) setRaw(((m as { default?: RawQ[] }).default ?? (m as unknown as RawQ[])) as RawQ[]);
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => (raw ? raw.map(normalize) : []), [raw]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (fDomain && String(r.domain) !== fDomain) return false;
      if (fSkill && r.skill !== fSkill) return false;
      if (fCc && r.cc !== fCc) return false;
      if (fKt && r.kt !== fKt) return false;
      if (fComp === 'complete' && !completeness(r).full) return false;
      if (fComp === 'incomplete' && completeness(r).full) return false;
      if (fComp === 'unverified' && r.verified) return false;
      if (fComp === 'nodistractor' && distractorComplete(r)) return false;
      if (fComp === 'anomaly' && !hasAnomaly(r)) return false;
      if (q && !(r.id.toLowerCase().includes(q) || r.skill.toLowerCase().includes(q) || r.stem.toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [rows, fDomain, fSkill, fCc, fKt, fComp, search]);

  const total = rows.length;
  const skillOptions = useMemo(
    () =>
      Object.keys(PROGRESS_SKILL_LOOKUP)
        .filter((s) => !fDomain || String(PROGRESS_SKILL_LOOKUP[s].domainId) === fDomain)
        .sort(),
    [fDomain],
  );
  const ccOptions = useMemo(() => [...new Set(rows.map((r) => r.cc).filter(Boolean))] as string[], [rows]);
  const ktOptions = useMemo(() => ([...new Set(rows.map((r) => r.kt).filter(Boolean))] as string[]).sort(), [rows]);

  function resetFilters() {
    setFDomain('');
    setFSkill('');
    setFCc('');
    setFKt('');
    setFComp('');
    setSearch('');
  }

  function exportSummary() {
    const cols = ['id', 'domain', 'domain_name', 'skill', 'skill_label', 'knowledge_type', 'cognitive_complexity', 'item_format', 'is_foundational', 'completeness_score', 'human_verified', 'flag_anomaly'];
    const lines = filtered.map((q) =>
      [q.id, q.domain, q.domainName, q.skill, q.skillLabel, q.kt, q.cc, q.fmt, q.found, completeness(q).score, q.verified, hasAnomaly(q)].map(csvEsc).join(','),
    );
    download(`question-bank-${filtered.length}-of-${total}.csv`, [cols.join(','), ...lines].join('\r\n'));
  }

  function exportComplete() {
    const cols = ['id', 'domain', 'domain_name', 'skill', 'skill_label', 'knowledge_type', 'cognitive_complexity', 'is_foundational', 'item_format', 'correct_answer', 'correct_answer_count', 'option_count_expected', 'is_multi_select_flag', 'flag_anomaly', 'completeness_score', 'completeness_max', 'human_verified', 'case_text', 'question_stem'];
    OPTION_LETTERS.forEach((L) => cols.push('option_' + L));
    OPTION_LETTERS.forEach((L) => cols.push(`distractor_${L}_misconception`, `distractor_${L}_skill_deficit`, `distractor_${L}_tier`, `distractor_${L}_error_type`));
    cols.push('rationale', 'correct_explanation', 'construct_actually_tested', 'complexity_rationale', 'core_concept', 'dominant_error_pattern', 'error_cluster_tag', 'instructional_red_flags', 'top_misconception_themes', 'skill_prerequisites', 'prereq_chain_narrative', 'glossary_terms_injected_on_wrong');
    const lines = filtered.map((q) => {
      const c = completeness(q);
      const r: unknown[] = [q.id, q.domain, q.domainName, q.skill, q.skillLabel, q.kt, q.cc, q.found, q.fmt, q.correct, q.correctCount ?? '', q.optionCount ?? '', q.ms, hasAnomaly(q), c.score, c.max, q.verified, q.caseText, q.stem];
      OPTION_LETTERS.forEach((L) => r.push(q.options[L] ?? ''));
      OPTION_LETTERS.forEach((L) => {
        const d = q.distractors[L];
        r.push(d?.misconception ?? '', d?.skillDeficit ?? '', d?.tier ?? '', d?.errorType ?? '');
      });
      r.push(q.rationale, q.explanation, q.construct, q.complexityRationale, q.coreConcept, q.dominantErrorPattern, q.errorClusterTag, q.instructionalRedFlags, q.topMisconceptionThemes, q.skillPrereqs, q.prereqChain, skillVocabTerms(q.skill).join('; '));
      return r.map(csvEsc).join(',');
    });
    download(`question-bank-COMPLETE-${filtered.length}-of-${total}.csv`, [cols.join(','), ...lines].join('\r\n'));
  }

  if (error) {
    return <div className="editorial-surface p-10 text-center text-rose-600">Failed to load question bank: {error}</div>;
  }
  if (!raw) {
    return (
      <div className="editorial-surface p-12 text-center">
        <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500">Loading question bank…</p>
      </div>
    );
  }

  // ── Aggregates ──
  const skillsCount = new Set(rows.map((r) => r.skill)).size;
  const orphans = rows.filter((r) => !r.domain).length;
  const fully = rows.filter((r) => completeness(r).full).length;
  const noRat = rows.filter((r) => !r.rationale.trim()).length;
  const unver = rows.filter((r) => !r.verified).length;
  const noDz = rows.filter((r) => !distractorComplete(r)).length;
  const anom = rows.filter(hasAnomaly).length;
  const caseN = rows.filter((r) => r.caseV).length;
  const msN = rows.filter((r) => r.ms).length;
  const perSkill: Record<string, number> = {};
  rows.forEach((r) => (perSkill[r.skill] = (perSkill[r.skill] || 0) + 1));
  const thin = Object.entries(perSkill).sort((a, b) => a[1] - b[1])[0];

  const pct = (n: number) => ((n / total) * 100).toFixed(1) + '%';
  const ratio = (sub: QRow[], pred: (q: QRow) => boolean) =>
    sub.length ? Math.round((sub.filter(pred).length / sub.length) * 100) + '%' : '—';

  const bk = (fn: (q: QRow) => string) => {
    const m: Record<string, number> = {};
    rows.forEach((r) => {
      const k = fn(r) || '(unset)';
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };

  const summaryCards = [
    ['Total questions', total.toLocaleString(), 'every item, counted live'],
    ['Domains', new Set(rows.map((r) => r.domain)).size, '4 Praxis 5403 domains'],
    ['Skills', skillsCount, 'distinct current_skill_id'],
    ['Orphans', orphans, 'skills outside taxonomy'],
  ] as const;

  const healthCards: [string, string | number, string, keyof typeof HEALTH_CARD][] = [
    ['Fully fed', fully, `${Math.round((fully / total) * 100)}% of bank`, fully > total / 2 ? 'emerald' : 'amber'],
    ['Missing rationale', noRat, 'no correct-answer rationale', noRat ? 'amber' : 'emerald'],
    ['Unverified', unver, 'not human-reviewed', unver ? 'amber' : 'emerald'],
    ['No distractor feedback', noDz, 'wrong choices unauthored', noDz ? 'rose' : 'emerald'],
    ['Flag anomalies', anom, 'multi-select but 1 correct', anom ? 'rose' : 'emerald'],
    ['Thinnest skill', thin ? thin[1] : '—', thin ? thin[0] : '', 'slate'],
  ];

  // domain → skills present in filtered set
  const domainsInView = [1, 2, 3, 4].filter((d) => filtered.some((q) => q.domain === d));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Question Bank Vault</h2>
        <p className="text-sm text-slate-500 mt-1">
          Live count and coverage of the static question bank, auditable down to the individual question. Source:{' '}
          <code className="text-xs">src/data/questions.json</code> · taxonomy: <code className="text-xs">progressTaxonomy.ts</code>{' '}
          (authoritative skill→domain).
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map(([label, value, sub]) => (
          <div key={label} className="editorial-surface p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            <p className="mt-1 text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Data-quality flag */}
      <div className="editorial-surface p-4 border-amber-200 bg-amber-50/60 space-y-1 text-sm text-amber-900">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Data-quality flag</p>
        <p>✓ All {total.toLocaleString()} questions carry a valid <code>current_skill_id</code> and map cleanly to the {skillsCount}-skill / 4-domain taxonomy (<b>{orphans} orphans</b>).</p>
        <p>⚠ The per-question <code>domain_name</code> field is unreliable — this tool derives domain from <code>current_skill_id</code> via <code>progressTaxonomy.ts</code>.</p>
        <p>⚠ <code>has_case_vignette</code> = {caseN} and <code>is_multi_select</code> = {msN} are suspiciously round/identical and contradict <code>correct_answer_count=1</code> — treat as low-confidence.</p>
      </div>

      {/* Bank health */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Bank health — what needs feeding</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {healthCards.map(([label, value, sub, color]) => (
            <div key={label} className={`editorial-surface p-3 border ${HEALTH_CARD[color]}`}>
              <p className="text-[11px] uppercase tracking-wide opacity-80">{label}</p>
              <p className="mt-0.5 text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              <p className="text-[11px] opacity-70 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BreakdownCard title="By cognitive complexity" rows={bk((q) => q.cc || '')} />
        <BreakdownCard title="By knowledge type" rows={bk((q) => q.kt || '')} />
        <BreakdownCard title="By item format" rows={bk((q) => q.fmt || '')} />
        <BreakdownCard
          title="Flags"
          rows={[
            ['Has explanation', rows.filter((r) => r.hasExpl).length],
            ['Has error-pattern', rows.filter((r) => r.hasErrPattern).length],
            ['Human-verified', rows.filter((r) => r.verified).length],
            ['Case vignette', caseN],
            ['Multi-select', msN],
          ]}
        />
      </div>

      {/* Filters */}
      <div className="editorial-surface p-4 flex flex-wrap gap-3 items-end">
        <FilterSelect label="Domain" value={fDomain} onChange={(v) => { setFDomain(v); setFSkill(''); }} options={[['', 'All domains'], ...PROGRESS_DOMAINS.map((d) => [String(d.id), `D${d.id} · ${d.name}`] as [string, string])]} />
        <FilterSelect label="Skill" value={fSkill} onChange={setFSkill} options={[['', 'All skills'], ...skillOptions.map((s) => [s, `${s} · ${PROGRESS_SKILL_LOOKUP[s]?.shortLabel ?? ''}`] as [string, string])]} />
        <FilterSelect label="Complexity" value={fCc} onChange={setFCc} options={[['', 'Any'], ...ccOptions.map((c) => [c, c] as [string, string])]} />
        <FilterSelect label="Knowledge type" value={fKt} onChange={setFKt} options={[['', 'Any'], ...ktOptions.map((k) => [k, k] as [string, string])]} />
        <FilterSelect label="Health" value={fComp} onChange={setFComp} options={[['', 'Any'], ['complete', 'Fully fed'], ['incomplete', 'Incomplete'], ['unverified', 'Unverified'], ['nodistractor', 'Missing distractor feedback'], ['anomaly', 'Flag anomaly']]} />
        <label className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <span className="text-xs text-slate-500">Search (ID or stem)</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. LEG-02 or 'FERPA'…" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
        </label>
        <button onClick={resetFilters} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-indigo-300">Reset</button>
        <button onClick={exportSummary} className="rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Export summary ↓</button>
        <button onClick={exportComplete} className="rounded-xl border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100" title="Every field + all drawer detail for the filtered set">Export complete analysis ↓↓</button>
        <span className="text-sm text-slate-500 ml-auto self-center">{filtered.length.toLocaleString()} of {total.toLocaleString()} questions</span>
      </div>

      {/* Rollup */}
      <div className="editorial-surface overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Domain / Skill</th>
              <th className="px-5 py-3 text-right">Questions</th>
              <th className="px-5 py-3 text-right">% of bank</th>
              <th className="px-5 py-3 text-right">Exam wt</th>
              <th className="px-5 py-3 text-right">Recall</th>
              <th className="px-5 py-3 text-right">App</th>
              <th className="px-5 py-3 text-right">Found.</th>
              <th className="px-5 py-3 text-right">Verified</th>
              <th className="px-5 py-3 text-right">Fully fed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 bg-white">
            {domainsInView.map((d) => {
              const dqs = filtered.filter((q) => q.domain === d);
              const wt = EXAM_WEIGHTS[d] ?? 0;
              const delta = (dqs.length / total) * 100 - wt;
              const skills = [...new Set(dqs.map((q) => q.skill))].sort();
              return (
                <FragmentRows key={d}>
                  <tr className="bg-slate-50/80 font-semibold text-slate-900">
                    <td className="px-5 py-3">D{d} · {PROGRESS_DOMAINS.find((x) => x.id === d)?.name}</td>
                    <td className="px-5 py-3 text-right">{dqs.length}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{pct(dqs.length)}</td>
                    <td className="px-5 py-3 text-right text-slate-500">
                      {wt}% <span className={`text-[10px] ${Math.abs(delta) >= 5 ? (delta < 0 ? 'text-rose-500' : 'text-amber-500') : 'text-slate-400'}`}>({delta >= 0 ? '+' : ''}{delta.toFixed(0)}pp)</span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500">{dqs.filter((q) => q.cc === 'Recall').length}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{dqs.filter((q) => q.cc === 'Application').length}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{dqs.filter((q) => q.found).length}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{ratio(dqs, (q) => q.verified)}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{ratio(dqs, (q) => completeness(q).full)}</td>
                  </tr>
                  {skills.map((s) => {
                    const sqs = dqs.filter((q) => q.skill === s);
                    return (
                      <tr key={s} className="text-slate-700 hover:bg-indigo-50/50 cursor-pointer" onClick={() => { setDrawerSkill(s); setDrawerQuestion(null); }}>
                        <td className="px-5 py-2.5 pl-10">
                          <span className="font-mono text-xs text-indigo-600 font-semibold">{s}</span>{' '}
                          <span className="text-slate-600">{PROGRESS_SKILL_LOOKUP[s]?.shortLabel ?? ''}</span>
                          {sqs.length < 22 && <span className="text-[10px] text-amber-600"> thin</span>} <span className="text-slate-300">›</span>
                        </td>
                        <td className="px-5 py-2.5 text-right font-semibold">{sqs.length}</td>
                        <td className="px-5 py-2.5 text-right text-slate-400">{pct(sqs.length)}</td>
                        <td className="px-5 py-2.5 text-right text-slate-300">—</td>
                        <td className="px-5 py-2.5 text-right text-slate-400">{sqs.filter((q) => q.cc === 'Recall').length}</td>
                        <td className="px-5 py-2.5 text-right text-slate-400">{sqs.filter((q) => q.cc === 'Application').length}</td>
                        <td className="px-5 py-2.5 text-right text-slate-400">{sqs.filter((q) => q.found).length}</td>
                        <td className="px-5 py-2.5 text-right text-slate-400">{ratio(sqs, (q) => q.verified)}</td>
                        <td className="px-5 py-2.5 text-right text-slate-400">{ratio(sqs, (q) => completeness(q).full)}</td>
                      </tr>
                    );
                  })}
                </FragmentRows>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {(drawerSkill || drawerQuestion) && (
        <>
          <div className="fixed inset-0 bg-slate-900/30 z-30" onClick={() => { setDrawerSkill(null); setDrawerQuestion(null); }} />
          <div className="fixed inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl border-l border-slate-200 z-40 flex flex-col">
            {drawerQuestion ? (
              <QuestionDetail q={drawerQuestion} backSkill={drawerSkill} onBack={() => setDrawerQuestion(null)} onClose={() => { setDrawerSkill(null); setDrawerQuestion(null); }} skillCount={rows.filter((r) => r.skill === drawerQuestion.skill).length} />
            ) : (
              <SkillList skill={drawerSkill!} questions={rows.filter((r) => r.skill === drawerSkill)} onPick={setDrawerQuestion} onClose={() => setDrawerSkill(null)} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
function FragmentRows({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function BreakdownCard({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="editorial-surface p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">{title}</p>
      <div className="space-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-slate-600">{k}</span>
            <span className="font-semibold text-slate-900">{v.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400">
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function DrawerHeader({ title, sub, onClose }: { title: string; sub: string; onClose: () => void }) {
  return (
    <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 font-mono">{sub}</p>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
    </div>
  );
}

function SkillList({ skill, questions, onPick, onClose }: { skill: string; questions: QRow[]; onPick: (q: QRow) => void; onClose: () => void }) {
  const def = PROGRESS_SKILL_LOOKUP[skill];
  return (
    <>
      <DrawerHeader title={`${skill} · ${def?.fullLabel ?? ''}`} sub={`${questions.length} questions · Domain ${def?.domainId ?? '—'} — click a question to audit it`} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {questions.map((q) => (
          <div key={q.id} onClick={() => onPick(q)} className="editorial-surface p-3 hover:border-indigo-300 cursor-pointer">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-slate-400">{q.id}</span>
              <span className="flex gap-1">
                {q.cc && <Badge text={q.cc} color="indigo" />}
                {q.found && <Badge text="foundational" color="emerald" />}
                {completeness(q).full ? <Badge text="fully fed" color="emerald" /> : <Badge text={`${completeness(q).score}/${completeness(q).max}`} color="amber" />}
              </span>
            </div>
            <p className="text-sm text-slate-700 mt-1">{q.stem.slice(0, 150) || '(no stem)'}… <span className="text-indigo-400">›</span></p>
          </div>
        ))}
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1.5">{title}</p>
      {children}
    </div>
  );
}
function Field({ label, val }: { label: string; val: string }) {
  if (!val.trim()) return null;
  return (
    <div className="mb-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{val}</p>
    </div>
  );
}

function QuestionDetail({ q, backSkill, onBack, onClose, skillCount }: { q: QRow; backSkill: string | null; onBack: () => void; onClose: () => void; skillCount: number }) {
  const correctSet = q.correct.split(/[,\s]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);
  const comp = completeness(q);
  const vocab = skillVocabTerms(q.skill);
  const cf = (
    <>
      <Field label="Rationale (shown)" val={q.rationale} />
      {q.explanation !== q.rationale && <Field label="Correct explanation (shown)" val={q.explanation} />}
      <Field label="Construct actually tested (shown)" val={q.construct} />
      <Field label="Complexity rationale (shown)" val={q.complexityRationale} />
      <Field label="Core concept" val={q.coreConcept} />
    </>
  );
  const signals: [string, string, string][] = [
    ['dominant_error_pattern', q.dominantErrorPattern, 'AI tutor + diagnostic'],
    ['error_cluster_tag', q.errorClusterTag, 'study-plan clustering'],
    ['instructional_red_flags', q.instructionalRedFlags, 'AI tutor teaching strategy'],
    ['top_misconception_themes', q.topMisconceptionThemes, 'study plan / diagnostic'],
    ['skill_prerequisites', q.skillPrereqs, 'learning-path modules'],
    ['prereq_chain_narrative', q.prereqChain, 'learning-path modules'],
  ];
  return (
    <>
      <DrawerHeader title={q.id} sub={`${q.skill} · ${q.skillLabel} · Domain ${q.domain}`} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {backSkill && (
          <button onClick={onBack} className="text-xs text-indigo-600 hover:underline mb-2 block">← back to {backSkill} ({skillCount} questions)</button>
        )}
        <div className="flex flex-wrap gap-1 mb-3">
          {q.cc && <Badge text={q.cc} color="indigo" />}
          {q.kt && <Badge text={q.kt} color="violet" />}
          {q.found && <Badge text="foundational" color="emerald" />}
          <Badge text={q.fmt || '?'} color="slate" />
          {q.verified ? <Badge text="human-verified" color="emerald" /> : <Badge text="not verified" color="rose" />}
        </div>

        {/* Completeness checklist */}
        <Section title={`Completeness — ${comp.score}/${comp.max} signals fed`}>
          <div className={`flex flex-wrap gap-x-2 gap-y-1 rounded-lg border p-2.5 ${comp.full ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40'}`}>
            {comp.checks.map(([label, ok]) => (
              <span key={label} className={`inline-flex items-center gap-1 text-xs ${ok ? 'text-emerald-700' : 'text-rose-600'}`}>
                {ok ? '✓' : '✗'} {label}
              </span>
            ))}
          </div>
        </Section>

        {hasAnomaly(q) && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 mb-4 text-xs text-rose-700">
            ⚠ Flagged <code>is_multi_select=true</code> but <code>correct_answer_count=1</code> and <code>option_count_expected={q.optionCount ?? 4}</code> — the multi-select flag is inconsistent with the answer key.
          </div>
        )}

        {q.caseText && (
          <Section title="Case vignette"><p className="text-sm text-slate-700 whitespace-pre-wrap">{q.caseText}</p></Section>
        )}
        <Section title="Question stem"><p className="text-sm font-medium text-slate-900">{q.stem || '(none)'}</p></Section>

        <Section title="Answer choices & per-choice feedback">
          {OPTION_LETTERS.filter((L) => q.options[L] != null).map((L) => {
            const ok = correctSet.includes(L);
            const dz = q.distractors[L];
            return (
              <div key={L} className={`rounded-lg border p-2.5 mb-2 ${ok ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200'}`}>
                <div className="flex items-start gap-2">
                  <span className={`font-mono font-bold ${ok ? 'text-emerald-700' : 'text-slate-500'}`}>{L}</span>
                  <span className="text-sm text-slate-800 flex-1">{q.options[L]}</span>
                  {ok && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-semibold shrink-0">Correct</span>}
                </div>
                {!ok && (
                  <div className="mt-1.5 pl-6 text-xs text-slate-600 space-y-0.5 border-l-2 border-rose-200">
                    {dz?.misconception ? <div><span className="text-slate-400">Misconception shown:</span> {dz.misconception}</div> : null}
                    {dz?.skillDeficit ? <div><span className="text-slate-400">Skill deficit:</span> {dz.skillDeficit}</div> : null}
                    {dz && (dz.tier || dz.errorType) ? <div className="text-slate-400">tier {dz.tier || '—'} · {dz.errorType || '—'} <span className="italic">(internal: study plan + diagnostic)</span></div> : null}
                    {!dz?.misconception && !dz?.skillDeficit && <div className="text-slate-400 italic">No distractor feedback authored for this choice.</div>}
                  </div>
                )}
              </div>
            );
          })}
        </Section>

        <Section title="Feedback on correct answer">{q.rationale || q.explanation || q.construct ? cf : <p className="text-xs text-slate-400 italic">No correct-answer narrative authored.</p>}</Section>

        <Section title="Triggers fired on submit (downstream signals)">
          <div className="space-y-1.5">
            <TriggerRow name="Skill score" desc={`Updates ${q.skill} (Domain ${q.domain}) — attempts, weighted accuracy, learning state, SRS next-review. Skipped if a hint was used.`} />
            <TriggerRow name="Response log" desc={`Inserts a responses row: skill_id=${q.skill}, domain_id=${q.domain}, cognitive_complexity=${q.cc || '—'}, confidence, time, selected_answer.`} />
            <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 p-2">
              <span className="text-xs font-semibold text-indigo-700">Glossary</span>
              <div className="text-xs text-slate-600 mt-0.5">On a <b>wrong</b> answer, injects {q.skill}’s {vocab.length} vocabulary terms into the user’s glossary:</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {vocab.slice(0, 12).map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{t}</span>)}
                {vocab.length > 12 && <span className="text-[10px] text-slate-400">+{vocab.length - 12} more</span>}
              </div>
            </div>
            <TriggerRow name="Redemption" desc="Wrong 3× total → quarantine; hint used → immediate quarantine (practice_missed_questions)." />
            <TriggerRow name="Follow-up" desc={`On wrong: queues a same-skill follow-up; 3rd wrong in ${q.skill} emits a Domain ${q.domain} warning.`} />
            <TriggerRow name="Credit + retirement" desc="Counts toward the 20-answer redemption credit; retired after first pass once answered correctly 2×." />
          </div>
        </Section>

        <Section title="Internal signal fields (not shown in practice feedback)">
          <div className="space-y-1.5">
            {signals.map(([name, val, where]) => {
              const has = !!val.trim();
              return (
                <div key={name} className={`rounded-lg border p-2 ${has ? 'border-slate-200' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-mono text-[11px] ${has ? 'text-slate-700' : 'text-slate-400'}`}>{name}</span>
                    <span className="text-[10px] text-slate-400">→ {where}{has ? '' : ' · empty'}</span>
                  </div>
                  {has && <div className="text-xs text-slate-600 mt-1">{val.slice(0, 400)}</div>}
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </>
  );
}

function TriggerRow({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 p-2">
      <span className="text-xs font-semibold text-indigo-700">{name}</span>
      <div className="text-xs text-slate-600 mt-0.5">{desc}</div>
    </div>
  );
}
