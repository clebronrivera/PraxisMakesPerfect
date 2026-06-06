// src/components/ArtifactCard.tsx
// Renders an artifact (vocabulary list, weak-areas summary, practice set,
// fill-in-blank, matching activity) with Download and Print buttons.

import { useState } from 'react';
import { Download, FileText, Printer, CheckCircle, Circle } from 'lucide-react';

type ArtifactVariant = 'atelier' | 'editorial';

interface ArtifactCardProps {
  type: string;
  payload: Record<string, unknown>;
  variant?: ArtifactVariant;
}

/** Safely extract an array field from payload. Returns [] if missing or wrong type. */
function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

// ─── Markdown export ──────────────────────────────────────────────────────────

function artifactToMarkdown(type: string, payload: Record<string, unknown>): string {
  const lines: string[] = [`# ${formatType(type)}`, ''];

  if (type === 'vocabulary-list') {
    const terms = safeArray<{ term: string; definition: string }>(payload.terms);
    for (const t of terms) {
      lines.push(`**${t.term}**: ${t.definition}`, '');
    }
  } else if (type === 'weak-areas-summary') {
    const skills = safeArray<{ skillId: string; skillName: string; accuracy: number; note?: string }>(payload.skills);
    for (const s of skills) {
      lines.push(`## ${s.skillName} (${s.skillId})`);
      lines.push(`Accuracy: ${Math.round(s.accuracy * 100)}%`);
      if (s.note) lines.push(s.note);
      lines.push('');
    }
  } else if (type === 'practice-set') {
    const qs = safeArray<PracticeSetQuestion>(payload.questions);
    qs.forEach((q, i) => {
      lines.push(`## Question ${i + 1} — ${q.skillName}`, '');
      lines.push(q.stem, '');
      if (Array.isArray(q.choices)) q.choices.forEach(c => lines.push(`${c.label}. ${c.text}`));
      lines.push('', `**Correct Answer:** ${q.correctAnswer}`, '');
      if (q.explanation) lines.push(`*${q.explanation}*`, '');
      lines.push('---', '');
    });
  } else if (type === 'fill-in-blank') {
    const sentences = safeArray<FillInBlankSentence>(payload.sentences);
    const wordBank = safeArray<string>(payload.wordBank);
    if (wordBank.length > 0) lines.push(`**Word Bank:** ${wordBank.join(' | ')}`, '');
    if (sentences.length > 0) {
      sentences.forEach((s, i) => {
        lines.push(`${i + 1}. ${s.text}`);
      });
      lines.push('', '### Answer Key');
      sentences.forEach((s, i) => lines.push(`${i + 1}. ${s.answer}`));
    } else if (wordBank.length > 0) {
      lines.push('*(Sentences not available — use the word bank above to create fill-in-the-blank sentences for each term.)*');
    }
  } else if (type === 'matching-activity') {
    const pairs = safeArray<MatchingPair>(payload.pairs);
    if (pairs.length > 0) {
      lines.push('**Match each term with its definition.**', '');
      lines.push('**Terms:**');
      pairs.forEach((p, i) => lines.push(`${i + 1}. ${p.term}`));
      lines.push('', '**Definitions:**');
      const shuffled = [...pairs].sort(() => Math.random() - 0.5);
      shuffled.forEach((p, i) => lines.push(`${String.fromCharCode(65 + i)}. ${p.definition}`));
      lines.push('', '### Answer Key');
      pairs.forEach(p => lines.push(`${p.term} → ${p.definition}`));
    }
  } else {
    lines.push('```json');
    lines.push(JSON.stringify(payload, null, 2));
    lines.push('```');
  }

  return lines.join('\n');
}

function formatType(type: string): string {
  return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Print helper ─────────────────────────────────────────────────────────────

function printArtifact(type: string, payload: Record<string, unknown>, title?: string) {
  const html = buildPrintHtml(type, payload, title || formatType(type));
  const win = window.open('', '_blank', 'width=800,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

function buildPrintHtml(type: string, payload: Record<string, unknown>, title: string): string {
  let body = '';

  if (type === 'practice-set') {
    const qs = safeArray<PracticeSetQuestion>(payload.questions);
    body = qs.map((q, i) => `
      <div class="question">
        <p class="qnum">Question ${i + 1} <span class="skill">${q.skillName}</span></p>
        <p class="stem">${q.stem}</p>
        <ul class="choices">
          ${Array.isArray(q.choices) ? q.choices.map(c => `<li><span class="label">${c.label}.</span> ${c.text}</li>`).join('') : ''}
        </ul>
        <p class="answer">Answer: ___</p>
      </div>`).join('');
  } else if (type === 'fill-in-blank') {
    const sentences = safeArray<FillInBlankSentence>(payload.sentences);
    const wordBank = safeArray<string>(payload.wordBank);
    body = `
      <div class="word-bank">
        <strong>Word Bank:</strong> ${wordBank.map(w => `<span>${w}</span>`).join(', ')}
      </div>
      <ol class="sentences">
        ${sentences.map(s => `<li>${String(s.text || '').replace('___', '<span class="blank">___________</span>')}</li>`).join('')}
      </ol>`;
  } else if (type === 'matching-activity') {
    const pairs = safeArray<MatchingPair>(payload.pairs);
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    body = `
      <table class="match-table">
        <thead><tr><th>#</th><th>Term</th><th>Letter</th><th>Definition</th></tr></thead>
        <tbody>
          ${pairs.map((p, i) => `
            <tr>
              <td>${i + 1}.</td>
              <td class="term">${p.term}</td>
              <td class="blank-cell">____</td>
              <td></td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="definitions">
        <p><strong>Definitions:</strong></p>
        ${shuffled.map((p, i) => `<p>${String.fromCharCode(65 + i)}. ${p.definition}</p>`).join('')}
      </div>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; font-size: 13px; color: #1a1a1a; }
  h1 { font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 20px; }
  .question { margin-bottom: 24px; page-break-inside: avoid; }
  .qnum { font-weight: bold; font-size: 12px; color: #555; margin-bottom: 4px; }
  .skill { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 8px; }
  .stem { margin: 0 0 8px 0; line-height: 1.5; }
  .choices { list-style: none; padding: 0; margin: 0 0 8px 12px; }
  .choices li { margin-bottom: 4px; }
  .label { font-weight: bold; }
  .answer { color: #999; font-size: 11px; border-top: 1px dotted #ccc; padding-top: 4px; }
  .word-bank { background: #f8f8f8; border: 1px solid #ddd; padding: 10px 14px; margin-bottom: 20px; line-height: 1.8; }
  .word-bank span { margin: 0 6px; font-weight: 500; }
  .sentences { line-height: 2.2; font-size: 14px; }
  .sentences li { margin-bottom: 8px; }
  .blank { border-bottom: 1px solid #333; display: inline-block; min-width: 100px; }
  .match-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .match-table th, .match-table td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
  .match-table th { background: #f0f0f0; font-size: 12px; }
  .term { font-weight: 500; }
  .blank-cell { width: 60px; text-align: center; color: #999; }
  .definitions p { margin: 4px 0; line-height: 1.5; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>${title}</h1>
${body}
</body>
</html>`;
}

// ─── Type definitions for payloads ────────────────────────────────────────────

interface PracticeSetQuestion {
  id: string; skillId: string; skillName: string;
  stem: string; choices: Array<{ label: string; text: string }>;
  correctAnswer: string; explanation: string;
}

interface FillInBlankSentence {
  text: string; answer: string; skillId: string;
}

interface MatchingPair {
  term: string; definition: string; skillId: string;
}

// ─── Empty-state detection ───────────────────────────────────────────────────

function isArtifactEmpty(type: string, payload: Record<string, unknown>): boolean {
  if (type === 'practice-set') return safeArray(payload.questions).length === 0;
  if (type === 'fill-in-blank') return safeArray(payload.sentences).length === 0;
  if (type === 'matching-activity') return safeArray(payload.pairs).length === 0;
  if (type === 'vocabulary-list') return safeArray(payload.terms).length === 0;
  if (type === 'weak-areas-summary') return safeArray(payload.skills).length === 0;
  return false;
}

function EmptyArtifactNotice({ type, variant = 'editorial' }: { type: string; variant?: ArtifactVariant }) {
  if (variant === 'atelier') {
    return (
      <div className="mt-1 p-4 text-center text-sm rounded-xl border border-dashed border-[color:#d97706]/40 bg-[color:#d97706]/8 text-[color:#d97706]">
        <p className="font-medium">No content could be generated for this {formatType(type).toLowerCase()}.</p>
        <p className="text-xs text-slate-400 mt-1">Try asking about a different skill or topic.</p>
      </div>
    );
  }
  return (
    <div className="mt-1 p-4 text-center text-sm text-indigo-700 bg-indigo-50 rounded-lg border border-dashed border-indigo-300">
      <p className="font-medium">No content could be generated for this {formatType(type).toLowerCase()}.</p>
      <p className="text-xs text-indigo-600 mt-1">Try asking about a different skill or topic.</p>
    </div>
  );
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

function PracticeSetRenderer({ payload, variant = 'editorial' }: { payload: Record<string, unknown>; variant?: ArtifactVariant }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const qs = safeArray<PracticeSetQuestion>(payload.questions);

  if (qs.length === 0) return <EmptyArtifactNotice type="practice-set" variant={variant} />;

  const toggle = (i: number) => {
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(i)) { next.delete(i); } else { next.add(i); }
      return next;
    });
  };

  const isA = variant === 'atelier';
  const cardCls = isA
    ? 'border border-slate-200 rounded-xl p-3 bg-[#ffffff] backdrop-blur-[14px]'
    : 'border border-indigo-200 rounded-lg p-3 bg-white';
  const skillCls = isA
    ? 'text-[10px] font-semibold uppercase tracking-[0.22em] mb-1 text-[color:#d97706]'
    : 'text-xs font-semibold text-indigo-700 mb-1';
  const stemCls = isA ? 'text-sm text-slate-900 mb-2 leading-snug' : 'text-sm text-stone-800 mb-2 leading-snug';
  const choiceCls = isA ? 'text-sm text-slate-600' : 'text-sm text-stone-700';
  const revealCls = isA
    ? 'flex items-center gap-1.5 text-xs transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:#d97706] rounded text-[color:#d97706]'
    : 'flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 transition-colors';
  const moreCls = isA ? 'text-xs text-slate-400' : 'text-xs text-indigo-700';

  return (
    <div className="space-y-3 mt-1">
      {qs.slice(0, 4).map((q, i) => (
        <div key={q.id} className={cardCls}>
          <p className={skillCls}>{q.skillName}</p>
          <p className={stemCls}>{q.stem}</p>
          <ul className="space-y-1 mb-2">
            {q.choices.map(c => (
              <li key={c.label} className={choiceCls}>
                <span className="font-semibold">{c.label}.</span> {c.text}
              </li>
            ))}
          </ul>
          <button
            onClick={() => toggle(i)}
            className={revealCls}
          >
            {revealed.has(i) ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
            {revealed.has(i) ? `Answer: ${q.correctAnswer}` : 'Reveal answer'}
          </button>
        </div>
      ))}
      {qs.length > 4 && (
        <p className={moreCls}>+{qs.length - 4} more questions in print / download</p>
      )}
    </div>
  );
}

function FillInBlankRenderer({ payload, variant = 'editorial' }: { payload: Record<string, unknown>; variant?: ArtifactVariant }) {
  const sentences = safeArray<FillInBlankSentence>(payload.sentences);
  const wordBank = safeArray<string>(payload.wordBank);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (sentences.length === 0) return <EmptyArtifactNotice type="fill-in-blank" variant={variant} />;

  const toggle = (i: number) => {
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(i)) { next.delete(i); } else { next.add(i); }
      return next;
    });
  };

  const isA = variant === 'atelier';
  const bankCls = isA
    ? 'rounded-xl p-2.5 text-xs border border-[color:#d97706]/30 bg-[color:#d97706]/10 text-slate-700'
    : 'bg-indigo-100 rounded-lg p-2 text-xs text-indigo-800';
  const sentenceCls = isA ? 'text-sm text-slate-700 leading-relaxed' : 'text-sm text-stone-800 leading-relaxed';
  const blankRevealedCls = isA
    ? 'border-[color:#059669] text-[color:#059669]'
    : 'border-green-500 text-green-700';
  const blankIdleCls = isA
    ? 'border-[color:#d97706] text-[color:#d97706] hover:text-slate-900 hover:border-white'
    : 'border-indigo-500 text-indigo-500 hover:border-indigo-700';
  const moreCls = isA ? 'text-xs text-slate-400' : 'text-xs text-indigo-700';

  return (
    <div className="mt-1 space-y-3">
      <div className={bankCls}>
        <span className="font-semibold">Word Bank: </span>
        {wordBank.join(' · ')}
      </div>
      <ol className="space-y-2 list-decimal list-inside">
        {sentences.slice(0, 5).map((s, i) => (
          <li key={i} className={sentenceCls}>
            {s.text.split('___').map((part, j, arr) =>
              j < arr.length - 1 ? (
                <span key={j}>
                  {part}
                  <button
                    onClick={() => toggle(i)}
                    className={`inline-block min-w-[80px] border-b-2 text-center mx-1 text-xs font-semibold transition-colors ${
                      revealed.has(i) ? blankRevealedCls : blankIdleCls
                    }`}
                  >
                    {revealed.has(i) ? s.answer : '________'}
                  </button>
                </span>
              ) : part
            )}
          </li>
        ))}
      </ol>
      {sentences.length > 5 && (
        <p className={moreCls}>+{sentences.length - 5} more in print / download</p>
      )}
    </div>
  );
}

function MatchingRenderer({ payload, variant = 'editorial' }: { payload: Record<string, unknown>; variant?: ArtifactVariant }) {
  const pairs = safeArray<MatchingPair>(payload.pairs);

  if (pairs.length === 0) return <EmptyArtifactNotice type="matching-activity" variant={variant} />;

  const [selected, setSelected] = useState<{ termIdx: number | null; defIdx: number | null }>({ termIdx: null, defIdx: null });
  const [matches, setMatches] = useState<Map<number, number>>(new Map());
  const [shuffledDefs] = useState(() => [...pairs.map((p, i) => ({ ...p, origIdx: i }))].sort(() => Math.random() - 0.5));

  const selectTerm = (i: number) => {
    if (matches.has(i)) return;
    setSelected(prev => ({ ...prev, termIdx: prev.termIdx === i ? null : i }));
  };

  const selectDef = (shuffledIdx: number) => {
    const origIdx = shuffledDefs[shuffledIdx].origIdx;
    if ([...matches.values()].includes(shuffledIdx)) return;
    if (selected.termIdx !== null) {
      const correct = origIdx === selected.termIdx;
      if (correct) {
        setMatches(prev => new Map(prev).set(selected.termIdx!, shuffledIdx));
        setSelected({ termIdx: null, defIdx: null });
      } else {
        setSelected(prev => ({ ...prev, defIdx: shuffledIdx }));
        setTimeout(() => setSelected(prev => ({ ...prev, defIdx: null })), 600);
      }
    }
  };

  const preview = pairs.slice(0, 4);
  const allMatched = matches.size === pairs.length;

  const isA = variant === 'atelier';
  const successTextCls = isA
    ? 'text-xs font-semibold flex items-center gap-1 text-[color:#059669]'
    : 'text-xs text-green-700 font-semibold flex items-center gap-1';
  const columnLabelCls = isA
    ? 'text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400'
    : 'text-xs font-semibold text-stone-500 uppercase tracking-wide';
  const termMatchedCls = isA
    ? 'border-[color:#059669]/50 bg-[color:#059669]/15 text-slate-900 cursor-default'
    : 'border-green-400 bg-green-50 text-green-800 cursor-default';
  const termSelectedCls = isA
    ? 'border-[color:#d97706]/50 bg-[color:#d97706]/15 text-slate-900'
    : 'border-indigo-500 bg-indigo-50 text-indigo-900';
  const termIdleCls = isA
    ? 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[color:#d97706]/40 hover:bg-slate-100'
    : 'border-stone-200 bg-white text-stone-800 hover:border-indigo-400';
  const defMatchedCls = termMatchedCls;
  const defFailCls = isA
    ? 'border-[color:#e11d48]/50 bg-[color:#e11d48]/15 text-slate-900'
    : 'border-red-400 bg-red-50 text-red-800';
  const defActiveIdleCls = termIdleCls;
  const defPassiveIdleCls = isA
    ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-default'
    : 'border-stone-200 bg-white text-stone-600 cursor-default';
  const moreCls = isA ? 'text-xs text-slate-400' : 'text-xs text-indigo-700';

  return (
    <div className="mt-1 space-y-2">
      {allMatched && (
        <p className={successTextCls}>
          <CheckCircle className="w-3 h-3" /> All matched!
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <p className={columnLabelCls}>Terms</p>
          {preview.map((p, i) => (
            <button
              key={i}
              onClick={() => selectTerm(i)}
              className={`w-full text-left text-xs p-2 rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:#d97706] ${
                matches.has(i) ? termMatchedCls : selected.termIdx === i ? termSelectedCls : termIdleCls
              }`}
            >
              {p.term}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <p className={columnLabelCls}>Definitions</p>
          {shuffledDefs.slice(0, 4).map((p, shuffledIdx) => {
            const isMatched = [...matches.values()].includes(shuffledIdx);
            return (
              <button
                key={shuffledIdx}
                onClick={() => selectDef(shuffledIdx)}
                className={`w-full text-left text-xs p-2 rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:#d97706] ${
                  isMatched
                    ? defMatchedCls
                    : selected.defIdx === shuffledIdx
                    ? defFailCls
                    : selected.termIdx !== null
                    ? `${defActiveIdleCls} cursor-pointer`
                    : defPassiveIdleCls
                }`}
              >
                {p.definition.length > 70 ? p.definition.slice(0, 70) + '…' : p.definition}
              </button>
            );
          })}
        </div>
      </div>
      {pairs.length > 4 && (
        <p className={moreCls}>+{pairs.length - 4} more pairs in print / download</p>
      )}
    </div>
  );
}

// ─── Main ArtifactCard ────────────────────────────────────────────────────────

export function ArtifactCard({ type, payload, variant = 'editorial' }: ArtifactCardProps) {
  const empty = isArtifactEmpty(type, payload);
  const isA = variant === 'atelier';

  const handleDownload = () => {
    const markdown = artifactToMarkdown(type, payload);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const title = (typeof payload.title === 'string' ? payload.title : '') || formatType(type);
    printArtifact(type, payload, title);
  };

  const label = (typeof payload.title === 'string' ? payload.title : '') || formatType(type);
  const isPrintable = ['practice-set', 'fill-in-blank', 'matching-activity'].includes(type);

  const shellCls = isA
    ? 'mt-2 p-4 rounded-2xl border border-slate-200 bg-[#ffffff] backdrop-blur-[14px]'
    : 'editorial-surface mt-2 p-4 rounded-lg border border-indigo-200 bg-indigo-50';
  const iconCls = isA ? 'w-4 h-4 text-[color:#d97706]' : 'w-4 h-4 text-indigo-700';
  const labelCls = isA ? 'text-sm font-semibold text-slate-900' : 'text-sm font-semibold text-indigo-900';
  const printBtnCls = isA
    ? 'editorial-button-secondary flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full'
    : 'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white border border-indigo-400 text-indigo-700 hover:bg-indigo-100 transition-colors';
  const downloadBtnCls = isA
    ? 'editorial-button-primary flex items-center gap-1.5 text-xs px-3 py-1.5'
    : 'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-indigo-600 text-slate-900 hover:bg-indigo-700 transition-colors';
  const vocabTermCls = isA ? 'font-semibold text-slate-900' : 'font-semibold text-indigo-900';
  const vocabDefCls = isA ? 'text-slate-600' : 'text-indigo-800';
  const weakLabelCls = isA ? 'text-slate-700' : 'text-indigo-900';
  const weakPctCls = isA
    ? 'text-xs bg-[color:#d97706]/20 text-[color:#d97706] px-2 py-0.5 rounded-full font-medium'
    : 'text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-medium';
  const moreCls = isA ? 'text-xs text-slate-400' : 'text-xs text-indigo-700';

  return (
    <div className={shellCls}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className={iconCls} />
          <span className={labelCls}>{label}</span>
        </div>
        {!empty && (
        <div className="flex items-center gap-1.5">
          {isPrintable && (
            <button
              onClick={handlePrint}
              className={printBtnCls}
            >
              <Printer className="w-3 h-3" />
              Print
            </button>
          )}
          <button
            onClick={handleDownload}
            className={downloadBtnCls}
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
        )}
      </div>

      {type === 'vocabulary-list' && (() => {
        const terms = safeArray<{ term: string; definition: string }>(payload.terms);
        return (
          <div className="space-y-2">
            {terms.slice(0, 5).map((t, i) => (
              <div key={i} className="text-sm">
                <span className={vocabTermCls}>{t.term}: </span>
                <span className={vocabDefCls}>{t.definition}</span>
              </div>
            ))}
            {terms.length > 5 && (
              <p className={moreCls}>+ {terms.length - 5} more in download</p>
            )}
          </div>
        );
      })()}

      {type === 'weak-areas-summary' && (() => {
        const skills = safeArray<{ skillId: string; skillName: string; accuracy: number }>(payload.skills);
        return (
          <div className="space-y-1.5">
            {skills.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className={weakLabelCls}>{s.skillName}</span>
                <span className={weakPctCls}>
                  {Math.round(s.accuracy * 100)}%
                </span>
              </div>
            ))}
          </div>
        );
      })()}

      {type === 'practice-set' && <PracticeSetRenderer payload={payload} variant={variant} />}
      {type === 'fill-in-blank' && <FillInBlankRenderer payload={payload} variant={variant} />}
      {type === 'matching-activity' && <MatchingRenderer payload={payload} variant={variant} />}

      {!['vocabulary-list', 'weak-areas-summary', 'practice-set', 'fill-in-blank', 'matching-activity'].includes(type) && (
        <p className={moreCls}>Download the file to view full content.</p>
      )}
    </div>
  );
}
