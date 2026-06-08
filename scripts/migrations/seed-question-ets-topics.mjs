/**
 * Migration: seed src/data/questionObjectiveMap.json
 *
 * Deterministically tags every question with 1–2 ETS objective codes (the "objective"
 * layer), scoped to its skill's curated objectives (skillObjectiveMap.ts). The output is a
 * SEPARATE, provisional, reversible map — it does NOT mutate questions.json and is NEVER
 * read by scoring/mastery logic. Every entry carries provenance: method + verified:false.
 *
 * Run (imports the TS map, so use tsx):
 *   npx tsx scripts/migrations/seed-question-ets-topics.mjs                    # re-seed (see guard)
 *   npx tsx scripts/migrations/seed-question-ets-topics.mjs --preserve-manual  # keep human edits
 *   npx tsx scripts/migrations/seed-question-ets-topics.mjs --force            # wipe + re-seed
 *
 * --preserve-manual: re-reads the existing questionObjectiveMap.json and KEEPS every entry a
 *   human has reviewed (method:"manual") instead of recomputing it. Use this flag for ANY re-seed
 *   once Pack 1 verification has started. Entries whose question no longer exists are dropped and
 *   logged as "orphaned", preserving id-parity with questions.json.
 * Safety guard: a plain (no-flag) run REFUSES to start if the existing map holds any method:"manual"
 *   entries — pass --preserve-manual to keep them or --force to intentionally discard and re-seed
 *   from scratch. With no map (or no manual entries) the no-flag run is a clean machine re-seed.
 *
 * Deterministic + idempotent: no Date.now()/random; output sorted by UNIQUEID. Re-running
 * on unchanged inputs reproduces a byte-identical questionObjectiveMap.json (the no-flag path is
 * input-only; --preserve-manual additionally folds in the prior file's manual entries). Re-run
 * whenever questions.json or skillObjectiveMap.ts changes (the parity test fails loudly if stale).
 *
 * Writes:
 *   src/data/questionObjectiveMap.json   — committed (the 1,150-entry map)
 *   scripts/ets-seed-report.json         — gitignored review aid. Carries `reviewQueue`
 *                                          {fallback, multiTag}: the exact Pack 1 work list,
 *                                          each item with its stem + candidate objectives.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { skillObjectiveMap, primaryObjectiveBySkill } from '../../src/data/skillObjectiveMap.ts';

const SEEDED_AT = '2026-06-07'; // fixed for idempotency — do not replace with a live date
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PRESERVE_MANUAL = process.argv.includes('--preserve-manual');
const FORCE = process.argv.includes('--force');
const MAP_PATH = join(ROOT, 'src/data/questionObjectiveMap.json');

// ─── Safety: never silently wipe human-verified tags ─────────────────────────────
// A plain re-run overwrites the whole map with machine guesses. If the existing map already
// holds reviewed entries (method:"manual"), refuse unless the caller is explicit: --preserve-manual
// to KEEP them, or --force to intentionally discard and re-seed from scratch. (This turns the
// Pack-1-wiping footgun into a loud, recoverable error.)
if (!PRESERVE_MANUAL && !FORCE) {
  try {
    const prev = JSON.parse(readFileSync(MAP_PATH, 'utf-8'));
    const manual = Object.values(prev.questions || {}).filter((e) => e && (e.method === 'manual' || e.verified === true)).length;
    if (manual > 0) {
      console.error(`✖ Refusing to overwrite ${manual} human-verified (method:"manual") tag(s) in src/data/questionObjectiveMap.json.`);
      console.error('  Re-run with --preserve-manual to KEEP them, or --force to intentionally wipe and re-seed from scratch.');
      process.exit(1);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // no map yet → safe to seed
  }
}

const questions = JSON.parse(readFileSync(join(ROOT, 'src/data/questions.json'), 'utf-8'));
const etsData = JSON.parse(readFileSync(join(ROOT, 'src/data/ets-content-topics.json'), 'utf-8'));

// ─── Preserve human-verified tags (Pack 1) ──────────────────────────────────────
// With --preserve-manual, re-read the existing map and keep any entry a human has reviewed
// (method:"manual"), so a re-run after manual edits never clobbers that work. Keyed by
// UNIQUEID; a kept entry whose question has since been retired is dropped below (and logged),
// preserving id-parity with questions.json. No flag → empty map → clean machine re-seed.
const preservedManual = new Map();
if (PRESERVE_MANUAL) {
  try {
    const prev = JSON.parse(readFileSync(MAP_PATH, 'utf-8'));
    for (const [id, e] of Object.entries(prev.questions || {})) {
      if (e && (e.method === 'manual' || e.verified === true)) preservedManual.set(id, e);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // no existing map yet → nothing to preserve
  }
}

// ─── ETS topic lookup: code → { keywords[], textTokens[] } ──────────────────────
const STOP = new Set(
  ('the a an of to in and or for with on at by is are as be that this which student students ' +
    'school understand understands knows knowledge methods method use uses using appropriate ' +
    'various other within their between based may can how when what include includes including ' +
    'about familiar recognizes related such etc level levels').split(' '),
);
const tokenize = (s) => (String(s || '').toLowerCase().match(/[a-z][a-z-]{2,}/g) || []);

const ALL_ETS_CODES = new Set();
const TOPIC = new Map(); // code → { keywords:[lower], textTokens:Set }
for (const domain of etsData.domains) {
  for (const section of domain.sections) {
    for (const t of section.topics) {
      ALL_ETS_CODES.add(t.code);
      TOPIC.set(t.code, {
        keywords: (t.keywords || []).map((k) => k.toLowerCase()),
        textTokens: new Set(tokenize(t.text).filter((w) => !STOP.has(w))),
        text: t.text, // human-readable objective text (for the Pack 1 review queue)
      });
    }
  }
}

const PREFIX_TO_DOMAIN = { I: 1, II: 2, III: 3, IV: 4 };
const skillDomain = (skill) => PREFIX_TO_DOMAIN[(skillObjectiveMap[skill]?.[0] || 'I').split('.')[0]];

// ─── Per-question scoring ───────────────────────────────────────────────────────
const FIELDS = [
  'question_stem', 'core_concept', 'case_text', 'CORRECT_Explanation',
  'construct_actually_tested', 'rationale', 'dominant_error_pattern',
  'complexity_rationale', 'top_misconception_themes',
];

function scoreCandidate(code, text, tokenSet) {
  const topic = TOPIC.get(code);
  if (!topic) return 0;
  let score = 0;
  for (const kw of topic.keywords) {
    if (kw.includes(' ')) {
      if (text.includes(kw)) score += 2;
    } else if (kw.length > 2 && tokenSet.has(kw)) {
      score += 2;
    }
  }
  for (const tok of topic.textTokens) if (tokenSet.has(tok)) score += 1;
  return score;
}

function assign(q) {
  const skill = q.current_skill_id;
  const candidates = skillObjectiveMap[skill] || [];
  const primary = primaryObjectiveBySkill[skill] || candidates[0];

  // Sole-objective skill: the skill owns exactly one objective, so every one of its
  // questions measures that objective by construction. Assignment is certain — not a
  // low-confidence guess — so it is "seeded", not "fallback" (nothing to disambiguate).
  if (candidates.length === 1) {
    return { ets_topics: [candidates[0]], method: 'seeded', verified: false, reason: 'sole' };
  }

  const text = FIELDS.map((f) => q[f] || '').join(' ').toLowerCase();
  const tokenSet = new Set(tokenize(text));

  // score + deterministic order: score desc, then code asc
  const ranked = candidates
    .map((code) => ({ code, score: scoreCandidate(code, text, tokenSet) }))
    .sort((a, b) => (b.score - a.score) || (a.code < b.code ? -1 : 1));

  const best = ranked[0];
  const foundational = q.is_foundational === true;

  // Multi-objective skill but no keyword could disambiguate → low confidence, needs review.
  if (!best || best.score < 2) {
    return { ets_topics: [primary], method: 'fallback', verified: false, reason: 'unmatched' };
  }
  if (foundational) {
    // exactly one objective at cold-start: the best high-confidence match
    return { ets_topics: [best.code], method: 'seeded', verified: false, reason: 'keyword' };
  }
  const out = [best.code];
  const second = ranked[1];
  if (second && second.score >= 2 && second.score >= best.score - 1) out.push(second.code);
  return { ets_topics: out, method: 'seeded', verified: false, reason: 'keyword' };
}

// ─── Build the map (sorted by UNIQUEID for determinism) ─────────────────────────
const sorted = [...questions].sort((a, b) => (a.UNIQUEID < b.UNIQUEID ? -1 : 1));
const out = {};
const report = {
  seededAt: SEEDED_AT, total: 0, seededCount: 0, fallbackCount: 0, manualCount: 0,
  verifiedCount: 0, multiTaggedCount: 0, preservedCount: 0, orphanedManual: [],
  // seeded breakdown: 'sole' = certain-by-construction (1-objective skill); 'keyword' = keyword-matched
  reasonCounts: { sole: 0, keyword: 0, unmatched: 0, manual: 0 },
  invalidCodes: [], fallbackBySkill: {}, fallbackByDomain: { 1: 0, 2: 0, 3: 0, 4: 0 },
  topFallbackSkills: [], topicDistribution: {}, sample: [],
  // Pack 1 review queues: exact items a human must disambiguate, each with stem + candidate
  // objectives (code + text). fallback = primary assigned by default; multiTag = two objectives.
  reviewQueue: { fallback: [], multiTag: [] },
};
const perSkillTotal = {};
const candidatesOf = (skill) =>
  (skillObjectiveMap[skill] || []).map((code) => ({ code, text: TOPIC.get(code)?.text || '' }));
const stemOf = (q) => String(q.question_stem || '').replace(/\s+/g, ' ').trim().slice(0, 240);

for (const q of sorted) {
  let entry, reason;
  const kept = preservedManual.get(q.UNIQUEID);
  if (kept) {
    // keep the reviewer's tags verbatim; normalize shape (a hand-edit may omit `verified`)
    entry = { ets_topics: kept.ets_topics, method: 'manual', verified: kept.verified !== false };
    reason = 'manual';
    report.preservedCount++;
    preservedManual.delete(q.UNIQUEID); // consumed → leftovers are orphaned (question retired)
  } else {
    ({ reason, ...entry } = assign(q));
  }
  out[q.UNIQUEID] = entry; // stored map carries only { ets_topics, method, verified }
  report.reasonCounts[reason] = (report.reasonCounts[reason] || 0) + 1;
  report.total++;
  const skill = q.current_skill_id;
  perSkillTotal[skill] = (perSkillTotal[skill] || 0) + 1;
  for (const code of entry.ets_topics) {
    report.topicDistribution[code] = (report.topicDistribution[code] || 0) + 1;
    if (!ALL_ETS_CODES.has(code)) report.invalidCodes.push(`${q.UNIQUEID}:${code}`);
  }
  if (entry.method === 'fallback') {
    report.fallbackCount++;
    report.fallbackBySkill[skill] = (report.fallbackBySkill[skill] || 0) + 1;
    report.fallbackByDomain[skillDomain(skill)]++;
    report.reviewQueue.fallback.push({
      id: q.UNIQUEID, skill, currentTag: entry.ets_topics[0], stem: stemOf(q), candidates: candidatesOf(skill),
    });
  } else if (entry.method === 'manual') {
    report.manualCount++;
  } else {
    report.seededCount++;
  }
  if (entry.verified === true) report.verifiedCount++;
  if (entry.ets_topics.length > 1) {
    report.multiTaggedCount++;
    // multi-tag items still needing review (resolved 'manual' ones are already verified, skip them)
    if (entry.method !== 'manual') {
      report.reviewQueue.multiTag.push({
        id: q.UNIQUEID, skill, currentTags: entry.ets_topics, stem: stemOf(q), candidates: candidatesOf(skill),
      });
    }
  }
}
report.orphanedManual = [...preservedManual.keys()]; // manual entries whose question is gone

// top fallback skills by rate (min 5 questions), then a per-domain sample
report.topFallbackSkills = Object.entries(report.fallbackBySkill)
  .map(([skill, n]) => ({ skill, fallback: n, total: perSkillTotal[skill], rate: +(n / perSkillTotal[skill]).toFixed(3) }))
  .sort((a, b) => b.rate - a.rate)
  .slice(0, 10);

for (const d of [1, 2, 3, 4]) {
  const q = sorted.find((x) => skillDomain(x.current_skill_id) === d);
  if (q) report.sample.push({
    domain: d, uniqueId: q.UNIQUEID, skill: q.current_skill_id,
    ets_topics: out[q.UNIQUEID].ets_topics, method: out[q.UNIQUEID].method,
    stem: String(q.question_stem || '').slice(0, 140),
  });
}

const mapDoc = {
  meta: {
    seededAt: SEEDED_AT,
    generator: 'scripts/migrations/seed-question-ets-topics.mjs',
    source: 'skillObjectiveMap.ts + ets-content-topics.json (keyword + text-token match)',
    totalMapped: report.total,
    seededCount: report.seededCount,
    fallbackCount: report.fallbackCount,
    manualCount: report.manualCount,
    verifiedCount: report.verifiedCount,
    note: 'Provisional machine-seeded objective tags. method:"fallback" = low-confidence (human review queue); method:"manual" = human-verified (Pack 1), preserved by --preserve-manual. Never read by scoring.',
  },
  questions: out,
};

writeFileSync(MAP_PATH, JSON.stringify(mapDoc, null, 2) + '\n');
writeFileSync(join(ROOT, 'scripts/ets-seed-report.json'), JSON.stringify(report, null, 2) + '\n');

console.log(`seeded ${report.total} questions: ${report.seededCount} seeded, ${report.fallbackCount} fallback, ${report.manualCount} manual (${report.verifiedCount} verified), ${report.multiTaggedCount} multi-tagged`);
console.log(`invalid codes: ${report.invalidCodes.length}`);
if (PRESERVE_MANUAL) {
  const orphans = report.orphanedManual;
  console.log(`preserve-manual: kept ${report.preservedCount} manual entr${report.preservedCount === 1 ? 'y' : 'ies'}; orphaned (retired question, dropped): ${orphans.length}${orphans.length ? ' → ' + orphans.join(', ') : ''}`);
} else {
  console.log('mode: full re-seed (no --preserve-manual) — any existing manual tags were overwritten');
}
console.log('fallback by domain:', JSON.stringify(report.fallbackByDomain));
console.log('top fallback skills:', report.topFallbackSkills.slice(0, 6).map((s) => `${s.skill} ${Math.round(s.rate * 100)}%`).join(', '));
