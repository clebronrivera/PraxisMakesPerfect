/**
 * Migration: derive src/data/misconceptionQuestionMap.json
 *
 * Backfills each misconception's `questionIds` (98 taxonomy entries, previously 0% populated) by
 * linking questions whose DISTRACTOR BELIEFS express that misconception.
 *
 * Signal. Each wrong choice carries a first-person belief (`distractor_misconception_{A-F}`); each
 * misconception carries a canonical belief `text`. They never match verbatim, but within a skill
 * they share domain vocabulary. For each question we pool its distractor beliefs (+ dominant error
 * pattern / themes / construct / core concept) and score token overlap against each same-skill
 * misconception's text (fraction of the misconception's content words present). A question links to
 * its best-scoring misconception (and a close second ≥ 0.85× best) above the threshold.
 *
 * NOT used: `error_cluster_tag`. Inspection showed it is frequently mis-assigned (e.g. a
 * rater-reliability item tagged "consent-confidentiality-confusion") and is a separate 20-tag
 * vocabulary from the misconception `relatedPatternIds` (only 1 overlaps), so it is an unreliable
 * link signal. The distractor-belief text is the real one.
 *
 * Scope. Skill-matched only: a candidate question's `current_skill_id` must map (skillIdMap) to the
 * misconception's metadata `skillId`. 10/98 misconceptions sit on skills with no progress-skill
 * equivalent and can never link (reported in meta). Output is per-misconception questionIds ordered
 * by score, capped at CAP. Provisional + SME-confirmable; never read by scoring.
 *
 * Run:  npx tsx scripts/migrations/derive-misconception-questions.mjs
 * Deterministic: sorted by score desc then UNIQUEID asc; no Date/random.
 * Writes: src/data/misconceptionQuestionMap.json — committed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MISCONCEPTION_TAXONOMY } from '../../src/data/misconception-taxonomy.ts';
import { toProgressId } from '../../src/data/skillIdMap.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const questions = JSON.parse(readFileSync(join(ROOT, 'src/data/questions.json'), 'utf-8'));

const THRESHOLD = 0.30;   // fraction of the misconception's content words that must appear
const MIN_SHARED = 2;     // ...and at least this many shared tokens (guards 1-word coincidences)
const SECOND = 0.85;      // also link the runner-up misconception if score ≥ SECOND × best
const CAP = 12;           // max questions per misconception (keeps each link list focused)

const STOP = new Set(
  ('the a an of to in and or for with on at by is are as be that this which student students believed ' +
    'believe school understand their between based may can how when what would does not should appropriate ' +
    'use uses using other within across rather than involves relates related measures measure').split(' '),
);
const tok = (s) => [...new Set(String(s || '').toLowerCase().match(/[a-z][a-z-]{2,}/g) || [])].filter((w) => !STOP.has(w));
const questionTokens = (q) => {
  const parts = [];
  for (const L of ['A', 'B', 'C', 'D', 'E', 'F']) parts.push(q[`distractor_misconception_${L}`] || '');
  parts.push(q.dominant_error_pattern, q.top_misconception_themes, q.construct_actually_tested, q.core_concept);
  return new Set(tok(parts.join(' ')));
};

// Index questions + misconceptions by progress skill.
const qByProg = {};
for (const q of questions) (qByProg[q.current_skill_id] ??= []).push(q);
const mcByProg = {};
let unmappable = 0;
for (const m of MISCONCEPTION_TAXONOMY) {
  const prog = toProgressId(m.skillId);
  if (!prog) { unmappable++; continue; }
  (mcByProg[prog] ??= []).push({ id: m.id, skillId: m.skillId, tokens: new Set(tok(m.text)) });
}

// Score every question against its skill's misconceptions; assign best (+ close second).
const links = {}; // misconceptionId → [{ q, score }]
const push = (mid, q, score) => { (links[mid] ??= []).push({ q, score: +score.toFixed(3) }); };
for (const [prog, qs] of Object.entries(qByProg)) {
  const ms = mcByProg[prog];
  if (!ms || !ms.length) continue;
  for (const q of qs) {
    const qt = questionTokens(q);
    const ranked = ms
      .map((m) => {
        const shared = m.tokens.size ? [...m.tokens].filter((w) => qt.has(w)).length : 0;
        return { m, shared, score: m.tokens.size ? shared / m.tokens.size : 0 };
      })
      .sort((a, b) => b.score - a.score || (a.m.id < b.m.id ? -1 : 1));
    const best = ranked[0];
    if (!best || best.shared < MIN_SHARED || best.score < THRESHOLD) continue;
    push(best.m.id, q.UNIQUEID, best.score);
    const second = ranked[1];
    if (second && second.shared >= MIN_SHARED && second.score >= THRESHOLD && second.score >= best.score * SECOND) {
      push(second.m.id, q.UNIQUEID, second.score);
    }
  }
}

// Order by score desc then UNIQUEID asc; cap.
const outMc = {};
let questionSet = new Set();
for (const m of MISCONCEPTION_TAXONOMY) {
  const ranked = (links[m.id] || []).sort((a, b) => b.score - a.score || (a.q < b.q ? -1 : 1)).slice(0, CAP);
  if (!ranked.length) continue;
  outMc[m.id] = { questionIds: ranked.map((r) => r.q), topScore: ranked[0].score };
  ranked.forEach((r) => questionSet.add(r.q));
}

const doc = {
  meta: {
    generatedBy: 'scripts/migrations/derive-misconception-questions.mjs',
    source: 'questions.json distractor_misconception beliefs ↔ misconception-taxonomy text (token overlap, skill-scoped)',
    method: 'distractor-belief-overlap',
    threshold: THRESHOLD,
    cap: CAP,
    totalMisconceptions: MISCONCEPTION_TAXONOMY.length,
    unmappableSkillMisconceptions: unmappable,
    covered: Object.keys(outMc).length,
    questionsLinked: questionSet.size,
    note: 'Provisional. Links a misconception to questions whose distractor beliefs express it (skill-matched). questionIds ordered by overlap score. SME-confirmable; never read by scoring.',
  },
  misconceptions: outMc,
};

writeFileSync(join(ROOT, 'src/data/misconceptionQuestionMap.json'), JSON.stringify(doc, null, 2) + '\n');
console.log(`linked ${doc.meta.questionsLinked} questions to ${doc.meta.covered}/${doc.meta.totalMisconceptions} misconceptions (${unmappable} unmappable-skill, threshold ${THRESHOLD})`);
