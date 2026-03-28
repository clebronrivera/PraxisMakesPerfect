/**
 * Generate Per-Question Vocabulary Tags
 *
 * Text-matches question stems, answer choices, and explanations against the
 * 396-term master glossary. For item_ questions, also pulls from core_concept,
 * distractor_skill_deficit, and skill_prerequisites fields.
 *
 * Usage: npx tsx scripts/generate-question-vocab-tags.ts
 * Output: src/data/question-vocabulary-tags.json + coverage report to stdout
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const questions: any[] = JSON.parse(readFileSync(join(ROOT, 'src/data/questions.json'), 'utf-8'));
const glossary: any = JSON.parse(readFileSync(join(ROOT, 'src/data/master-glossary.json'), 'utf-8'));
const skillVocabMap: any = JSON.parse(readFileSync(join(ROOT, 'src/data/skill-vocabulary-map.json'), 'utf-8'));

// ─── Build term matchers ────────────────────────────────────────────────────

interface TermMatcher {
  term: string;
  regex: RegExp;
}

// Terms <= 2 characters are excluded from text matching entirely — they produce
// too many false positives (e.g., "ED" matches in "used", "ID" in "provide").
// These short acronyms have long-form equivalents in the glossary that will match
// instead (e.g., "emotional disturbance" instead of "ED").
//
// Terms 3 chars and all-caps (BIP, ASD, CBM, etc.) use case-sensitive matching.
// All other terms use case-insensitive word-boundary matching.

// Common English words that are also glossary terms — require case-insensitive
// but only match in the QUESTION STEM (not in all auxiliary text) to reduce noise.
// Words that are common English AND glossary terms. We still match them, but
// only in the question stem + explanation (not answer choices) to reduce noise
// from generic phrasing in distractors. Only include words that would genuinely
// produce false positives in answer choice text.
const STEM_ONLY_TERMS = new Set([
  'mean', 'mode', 'test', 'review', 'data',
]);

function buildMatcher(term: string): TermMatcher | null {
  // Skip very short terms — rely on their long-form equivalents
  if (term.length <= 2) return null;

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (term.length <= 4 && term === term.toUpperCase()) {
    // Short acronym (3-4 chars, all caps): case-sensitive whole-word match
    return { term, regex: new RegExp(`\\b${escaped}\\b`, 'g') };
  }

  // Normal term: case-insensitive whole-word match
  return { term, regex: new RegExp(`\\b${escaped}\\b`, 'gi') };
}

// Sort terms longest-first so longer matches take priority
const matchers: TermMatcher[] = glossary.terms
  .map((t: any) => buildMatcher(t.term))
  .filter((m: TermMatcher | null): m is TermMatcher => m !== null)
  .sort((a: TermMatcher, b: TermMatcher) => b.term.length - a.term.length);

// ─── Extract text from a question ───────────────────────────────────────────

// Returns the text a student actually reads: question stem, case, answer choices, explanation.
// This is what drives vocabulary tagging — the concepts the student must understand.
function getSearchableText(q: any): string {
  const parts: string[] = [];

  // Question stem + case scenario
  if (q.question_stem) parts.push(q.question_stem);
  if (q.case_text) parts.push(q.case_text);

  // Answer choices
  for (const letter of ['A', 'B', 'C', 'D', 'E', 'F']) {
    if (q[letter]) parts.push(q[letter]);
  }

  // Explanation (student sees this after answering)
  if (q.CORRECT_Explanation) parts.push(q.CORRECT_Explanation);

  // item_ enrichment: core_concept and construct are direct metadata about what
  // the question tests — not auxiliary text, so include them
  if (q.core_concept) parts.push(q.core_concept);
  if (q.construct_actually_tested) parts.push(q.construct_actually_tested);

  return parts.join(' ');
}

// ─── Tag each question ──────────────────────────────────────────────────────

interface QuestionTags {
  concepts: string[];
}

const tags: Record<string, QuestionTags> = {};
let totalConceptsAssigned = 0;
let questionsWithZeroTags = 0;

for (const q of questions) {
  const id = q.UNIQUEID;
  if (!id) continue;

  const fullText = getSearchableText(q);
  // Stem-only text for common English words (reduces noise)
  const stemText = [q.question_stem || '', q.case_text || '', q.CORRECT_Explanation || ''].join(' ');
  const matchedTerms = new Set<string>();

  // Pass 1: Text matching against glossary
  for (const matcher of matchers) {
    const searchText = STEM_ONLY_TERMS.has(matcher.term.toLowerCase()) ? stemText : fullText;
    if (matcher.regex.test(searchText)) {
      matchedTerms.add(matcher.term);
    }
    // Reset regex lastIndex since we use 'g' flag
    matcher.regex.lastIndex = 0;
  }

  const allConcepts = [...matchedTerms].sort();

  tags[id] = {
    concepts: allConcepts,
  };

  totalConceptsAssigned += allConcepts.length;
  if (allConcepts.length === 0) questionsWithZeroTags++;
}

// ─── Build output ───────────────────────────────────────────────────────────

// Compute unique concept frequency (how many questions each concept appears in)
const conceptFrequency = new Map<string, number>();
for (const t of Object.values(tags)) {
  for (const c of t.concepts) {
    conceptFrequency.set(c, (conceptFrequency.get(c) || 0) + 1);
  }
}

const output = {
  meta: {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalQuestions: Object.keys(tags).length,
    totalUniqueConcepts: conceptFrequency.size,
    avgConceptsPerQuestion: +(totalConceptsAssigned / Object.keys(tags).length).toFixed(1),
    questionsWithZeroTags,
  },
  conceptFrequency: Object.fromEntries(
    [...conceptFrequency.entries()].sort((a, b) => b[1] - a[1])
  ),
  tags,
};

const outputPath = join(ROOT, 'src/data/question-vocabulary-tags.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

// ─── Coverage report ────────────────────────────────────────────────────────

console.log(`\n=== Vocabulary Tagging Report ===`);
console.log(`Questions tagged: ${Object.keys(tags).length}`);
console.log(`Unique concepts used: ${conceptFrequency.size} / ${glossary.terms.length} glossary terms`);
console.log(`Avg concepts per question: ${(totalConceptsAssigned / Object.keys(tags).length).toFixed(1)}`);
console.log(`Questions with zero tags: ${questionsWithZeroTags}`);
console.log(`Total concept assignments: ${totalConceptsAssigned}`);

// Distribution of tag counts
const tagCounts = Object.values(tags).map(t => t.concepts.length);
tagCounts.sort((a, b) => a - b);
const median = tagCounts[Math.floor(tagCounts.length / 2)];
const p25 = tagCounts[Math.floor(tagCounts.length * 0.25)];
const p75 = tagCounts[Math.floor(tagCounts.length * 0.75)];
console.log(`\nTag count distribution:`);
console.log(`  Min: ${tagCounts[0]}, P25: ${p25}, Median: ${median}, P75: ${p75}, Max: ${tagCounts[tagCounts.length - 1]}`);

// Top 20 most frequent concepts
console.log(`\nTop 20 most frequent concepts:`);
const topConcepts = [...conceptFrequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [concept, count] of topConcepts) {
  console.log(`  ${concept}: ${count} questions`);
}

// Bottom 10 — concepts that appear in fewest questions
console.log(`\nBottom 10 rarest concepts (in glossary but matched fewest questions):`);
const bottomConcepts = [...conceptFrequency.entries()].sort((a, b) => a[1] - b[1]).slice(0, 10);
for (const [concept, count] of bottomConcepts) {
  console.log(`  ${concept}: ${count} questions`);
}

// Unmatched glossary terms
const matchedGlossaryTerms = new Set(conceptFrequency.keys());
const unmatchedTerms = glossary.terms
  .map((t: any) => t.term)
  .filter((t: string) => !matchedGlossaryTerms.has(t));
console.log(`\nGlossary terms never matched: ${unmatchedTerms.length}`);
if (unmatchedTerms.length > 0 && unmatchedTerms.length <= 30) {
  for (const t of unmatchedTerms) {
    console.log(`  - ${t}`);
  }
}

console.log(`\nOutput written to: src/data/question-vocabulary-tags.json`);
