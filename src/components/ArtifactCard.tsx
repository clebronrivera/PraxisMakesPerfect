// src/components/ArtifactCard.tsx
// Renders an artifact (vocabulary list, weak-areas summary, practice set,
// fill-in-blank, matching activity) with Download and Print buttons.

import { useState } from 'react';
import { Download, FileText, Printer, CheckCircle, Circle } from 'lucide-react';

interface ArtifactCardProps {
  type: string;
  payload: Record<string, unknown>;
}

// ─── Markdown export ──────────────────────────────────────────────────────────

function artifactToMarkdown(type: string, payload: Record<string, unknown>): string {
  const lines: string[] = [`# ${formatType(type)}`, ''];

  if (type === 'vocabulary-list') {
    const terms = payload.terms as Array<{ term: string; definition: string }> | undefined;
    if (terms) {
      for (const t of terms) {
        lines.push(`**${t.term}**: ${t.definition}`, '');
      }
    }
  } else if (type === 'weak-areas-summary') {
    const skills = payload.skills as Array<{ skillId: string; skillName: string; accuracy: number; note?: string }> | undefined;
    if (skills) {
      for (const s of skills) {
        lines.push(`## ${s.skillName} (${s.skillId})`);
        lines.push(`Accuracy: ${Math.round(s.accuracy * 100)}%`);
        if (s.note) lines.push(s.note);
        lines.push('');
      }
    }
  } else if (type === 'practice-set') {
    const qs = payload.questions as PracticeSetQuestion[] | undefined;
    if (qs) {
      qs.forEach((q, i) => {
        lines.push(`## Question ${i + 1} — ${q.skillName}`, '');
        lines.push(q.stem, '');
        q.choices.forEach(c => lines.push(`${c.label}. ${c.text}`));
        lines.push('', `**Correct Answer:** ${q.correctAnswer}`, '');
        if (q.explanation) lines.push(`*${q.explanation}*`, '');
        lines.push('---', '');
      });
    }
  } else if (type === 'fill-in-blank') {
    const sentences = payload.sentences as FillInBlankSentence[] | undefined;
    const wordBank = payload.wordBank as string[] | undefined;
    if (wordBank) lines.push(`**Word Bank:** ${wordBank.join(' | ')}`, '');
    if (sentences && sentences.length > 0) {
      sentences.forEach((s, i) => {
        lines.push(`${i + 1}. ${s.text}`);
      });
      lines.push('', '### Answer Key');
      sentences.forEach((s, i) => lines.push(`${i + 1}. ${s.answer}`));
    } else if (wordBank) {
      lines.push('*(Sentences not available — use the word bank above to create fill-in-the-blank sentences for each term.)*');
    }
  } else if (type === 'matching-activity') {
    const pairs = payload.pairs as MatchingPair[] | undefined;
    if (pairs) {
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
    const qs = payload.questions as PracticeSetQuestion[] | undefined;
    body = (qs || []).map((q, i) => `
      <div class="question">
        <p class="qnum">Question ${i + 1} <span class="skill">${q.skillName}</span></p>
        <p class="stem">${q.stem}</p>
        <ul class="choices">
          ${q.choices.map(c => `<li><span class="label">${c.label}.</span> ${c.text}</li>`).join('')}
        </ul>
        <p class="answer">Answer: ___</p>
      </div>`).join('');
  } else if (type === 'fill-in-blank') {
    const sentences = payload.sentences as FillInBlankSentence[] | undefined;
    const wordBank = payload.wordBank as string[] | undefined;
    body = `
      <div class="word-bank">
        <strong>Word Bank:</strong> ${(wordBank || []).map(w => `<span>${w}</span>`).join(', ')}
      </div>
      <ol class="sentences">
        ${(sentences || []).map(s => `<li>${s.text.replace('___', '<span class="blank">___________</span>')}</li>`).join('')}
      </ol>`;
  } else if (type === 'matching-activity') {
    const pairs = payload.pairs as MatchingPair[] | undefined;
    const shuffled = pairs ? [...pairs].sort(() => Math.random() - 0.5) : [];
    body = `
      <table class="match-table">
        <thead><tr><th>#</th><th>Term</th><th>Letter</th><th>Definition</th></tr></thead>
        <tbody>
          ${(pairs || []).map((p, i) => `
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
  if (type === 'practice-set') {
    const qs = payload.questions as unknown[] | undefined;
    return !qs || qs.length === 0;
  }
  if (type === 'fill-in-blank') {
    const sentences = payload.sentences as unknown[] | undefined;
    return !sentences || sentences.length === 0;
  }
  if (type === 'matching-activity') {
    const pairs = payload.pairs as unknown[] | undefined;
    return !pairs || pairs.length === 0;
  }
  if (type === 'vocabulary-list') {
    const terms = payload.terms as unknown[] | undefined;
    return !terms || terms.length === 0;
  }
  if (type === 'weak-areas-summary') {
    const skills = payload.skills as unknown[] | undefined;
    return !skills || skills.length === 0;
  }
  return false;
}

function EmptyArtifactNotice({ type }: { type: string }) {
  return (
    <div className="mt-1 p-4 text-center text-sm text-amber-700 bg-amber-50 rounded-lg border border-dashed border-amber-300">
      <p className="font-medium">No content could be generated for this {formatType(type).toLowerCase()}.</p>
      <p className="text-xs text-amber-600 mt-1">Try asking about a different skill or topic.</p>
    </div>
  );
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

function PracticeSetRenderer({ payload }: { payload: Record<string, unknown> }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const qs = (payload.questions as PracticeSetQuestion[]) || [];

  if (qs.length === 0) return <EmptyArtifactNotice type="practice-set" />;

  const toggle = (i: number) => {
    setRevealed(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-3 mt-1">
      {qs.slice(0, 4).map((q, i) => (
        <div key={q.id} className="border border-amber-200 rounded-lg p-3 bg-white">
          <p className="text-xs font-semibold text-amber-700 mb-1">{q.skillName}</p>
          <p className="text-sm text-stone-800 mb-2 leading-snug">{q.stem}</p>
          <ul className="space-y-1 mb-2">
            {q.choices.map(c => (
              <li key={c.label} className="text-sm text-stone-700">
                <span className="font-semibold">{c.label}.</span> {c.text}
              </li>
            ))}
          </ul>
          <button
            onClick={() => toggle(i)}
            className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 transition-colors"
          >
            {revealed.has(i) ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
            {revealed.has(i) ? `Answer: ${q.correctAnswer}` : 'Reveal answer'}
          </button>
        </div>
      ))}
      {qs.length > 4 && (
        <p className="text-xs text-amber-700">+{qs.length - 4} more questions in print / download</p>
      )}
    </div>
  );
}

function FillInBlankRenderer({ payload }: { payload: Record<string, unknown> }) {
  const sentences = (payload.sentences as FillInBlankSentence[]) || [];
  const wordBank = (payload.wordBank as string[]) || [];
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (sentences.length === 0) return <EmptyArtifactNotice type="fill-in-blank" />;

  const toggle = (i: number) => {
    setRevealed(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="mt-1 space-y-3">
      <div className="bg-amber-100 rounded-lg p-2 text-xs text-amber-800">
        <span className="font-semibold">Word Bank: </span>
        {wordBank.join(' · ')}
      </div>
      <ol className="space-y-2 list-decimal list-inside">
        {sentences.slice(0, 5).map((s, i) => (
          <li key={i} className="text-sm text-stone-800 leading-relaxed">
            {s.text.split('___').map((part, j, arr) =>
              j < arr.length - 1 ? (
                <span key={j}>
                  {part}
                  <button
                    onClick={() => toggle(i)}
                    className={`inline-block min-w-[80px] border-b-2 text-center mx-1 text-xs font-semibold transition-colors ${
                      revealed.has(i)
                        ? 'border-green-500 text-green-700'
                        : 'border-amber-500 text-amber-500 hover:border-amber-700'
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
        <p className="text-xs text-amber-700">+{sentences.length - 5} more in print / download</p>
      )}
    </div>
  );
}

function MatchingRenderer({ payload }: { payload: Record<string, unknown> }) {
  const pairs = (payload.pairs as MatchingPair[]) || [];

  if (pairs.length === 0) return <EmptyArtifactNotice type="matching-activity" />;

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

  return (
    <div className="mt-1 space-y-2">
      {allMatched && (
        <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> All matched!
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Terms</p>
          {preview.map((p, i) => (
            <button
              key={i}
              onClick={() => selectTerm(i)}
              className={`w-full text-left text-xs p-2 rounded border transition-colors ${
                matches.has(i)
                  ? 'border-green-400 bg-green-50 text-green-800 cursor-default'
                  : selected.termIdx === i
                  ? 'border-amber-500 bg-amber-50 text-amber-900'
                  : 'border-stone-200 bg-white text-stone-800 hover:border-amber-400'
              }`}
            >
              {p.term}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Definitions</p>
          {shuffledDefs.slice(0, 4).map((p, shuffledIdx) => {
            const isMatched = [...matches.values()].includes(shuffledIdx);
            return (
              <button
                key={shuffledIdx}
                onClick={() => selectDef(shuffledIdx)}
                className={`w-full text-left text-xs p-2 rounded border transition-colors ${
                  isMatched
                    ? 'border-green-400 bg-green-50 text-green-800 cursor-default'
                    : selected.defIdx === shuffledIdx
                    ? 'border-red-400 bg-red-50 text-red-800'
                    : selected.termIdx !== null
                    ? 'border-stone-200 bg-white text-stone-800 hover:border-amber-400 cursor-pointer'
                    : 'border-stone-200 bg-white text-stone-600 cursor-default'
                }`}
              >
                {p.definition.length > 70 ? p.definition.slice(0, 70) + '…' : p.definition}
              </button>
            );
          })}
        </div>
      </div>
      {pairs.length > 4 && (
        <p className="text-xs text-amber-700">+{pairs.length - 4} more pairs in print / download</p>
      )}
    </div>
  );
}

// ─── Main ArtifactCard ────────────────────────────────────────────────────────

export function ArtifactCard({ type, payload }: ArtifactCardProps) {
  const empty = isArtifactEmpty(type, payload);

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
    const title = (payload.title as string) || formatType(type);
    printArtifact(type, payload, title);
  };

  const label = (payload.title as string) || formatType(type);
  const isPrintable = ['practice-set', 'fill-in-blank', 'matching-activity'].includes(type);

  return (
    <div className="editorial-surface mt-2 p-4 rounded-lg border border-amber-200 bg-amber-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-700" />
          <span className="text-sm font-semibold text-amber-900">{label}</span>
        </div>
        {!empty && (
        <div className="flex items-center gap-1.5">
          {isPrintable && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white border border-amber-400 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Printer className="w-3 h-3" />
              Print
            </button>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
        )}
      </div>

      {type === 'vocabulary-list' && (
        <div className="space-y-2">
          {(payload.terms as Array<{ term: string; definition: string }> || []).slice(0, 5).map((t, i) => (
            <div key={i} className="text-sm">
              <span className="font-semibold text-amber-900">{t.term}: </span>
              <span className="text-amber-800">{t.definition}</span>
            </div>
          ))}
          {(payload.terms as unknown[])?.length > 5 && (
            <p className="text-xs text-amber-700">+ {(payload.terms as unknown[]).length - 5} more in download</p>
          )}
        </div>
      )}

      {type === 'weak-areas-summary' && (
        <div className="space-y-1.5">
          {(payload.skills as Array<{ skillId: string; skillName: string; accuracy: number }> || []).slice(0, 4).map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-amber-900">{s.skillName}</span>
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                {Math.round(s.accuracy * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {type === 'practice-set' && <PracticeSetRenderer payload={payload} />}
      {type === 'fill-in-blank' && <FillInBlankRenderer payload={payload} />}
      {type === 'matching-activity' && <MatchingRenderer payload={payload} />}

      {!['vocabulary-list', 'weak-areas-summary', 'practice-set', 'fill-in-blank', 'matching-activity'].includes(type) && (
        <p className="text-xs text-amber-700">Download the file to view full content.</p>
      )}
    </div>
  );
}
