/**
 * Vocabulary Quiz Generator
 *
 * Generates multiple-choice quiz questions from the master glossary.
 * Two quiz types:
 *   1. "term" — show a definition, pick the correct term
 *   2. "definition" — show a term, pick the correct definition
 *
 * Distractor selection favors terms from the same skill neighborhood
 * for plausible wrong answers.
 *
 * Pure utility — no React, no side effects.
 */

import glossaryData from '../data/master-glossary.json';
import skillVocabData from '../data/skill-vocabulary-map.json';

// ─── Types ──────────────────────────────────────────────────────────────────

export type QuizType = 'term' | 'definition';

export interface VocabQuizItem {
  /** Unique id for this quiz item */
  id: string;
  type: QuizType;
  /** The prompt shown to the user */
  prompt: string;
  /** Four answer choices */
  choices: { label: string; text: string }[];
  /** The label (A/B/C/D) of the correct choice */
  correctLabel: string;
  /** The correct term (for tracking) */
  correctTerm: string;
}

export interface VocabQuizConfig {
  /** How many questions to generate */
  count: number;
  /** Which quiz types to include */
  types: QuizType[];
  /** If provided, prioritize these terms (e.g. user's glossary terms) */
  priorityTerms?: string[];
  /** If provided, only quiz from these terms */
  restrictToTerms?: string[];
}

// ─── Data Setup ─────────────────────────────────────────────────────────────

interface GlossaryEntry {
  term: string;
  definition: string;
}

const ALL_TERMS: GlossaryEntry[] = (
  glossaryData as { meta: object; terms: GlossaryEntry[] }
).terms.filter((t) => t.definition && t.definition.length > 10);

const TERM_TO_SKILLS = new Map<string, string[]>();
const skillMap = (skillVocabData as { skills: Record<string, { skillId: string; vocabularyTerms: string[] }> }).skills;
for (const [skillId, data] of Object.entries(skillMap)) {
  for (const term of data.vocabularyTerms) {
    const lower = term.toLowerCase();
    if (!TERM_TO_SKILLS.has(lower)) TERM_TO_SKILLS.set(lower, []);
    TERM_TO_SKILLS.get(lower)!.push(skillId);
  }
}

// Build skill neighborhood: terms that share at least one skill
const SKILL_TO_TERMS = new Map<string, string[]>();
for (const [, data] of Object.entries(skillMap)) {
  SKILL_TO_TERMS.set(
    data.skillId,
    data.vocabularyTerms.map((t: string) => t.toLowerCase()),
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistractors(
  correctTerm: string,
  count: number,
  allEntries: GlossaryEntry[],
): GlossaryEntry[] {
  const correctLower = correctTerm.toLowerCase();
  const skills = TERM_TO_SKILLS.get(correctLower) || [];

  // Gather same-skill terms as preferred distractors
  const sameSkillTerms = new Set<string>();
  for (const skillId of skills) {
    const terms = SKILL_TO_TERMS.get(skillId) || [];
    for (const t of terms) {
      if (t !== correctLower) sameSkillTerms.add(t);
    }
  }

  const entryMap = new Map(allEntries.map((e) => [e.term.toLowerCase(), e]));
  const sameSkillEntries = [...sameSkillTerms]
    .map((t) => entryMap.get(t))
    .filter((e): e is GlossaryEntry => !!e);

  const shuffledSameSkill = shuffle(sameSkillEntries);
  const result: GlossaryEntry[] = [];

  // Fill from same-skill first
  for (const entry of shuffledSameSkill) {
    if (result.length >= count) break;
    if (entry.term.toLowerCase() !== correctLower) {
      result.push(entry);
    }
  }

  // Fill remainder from random terms
  if (result.length < count) {
    const usedTerms = new Set([correctLower, ...result.map((e) => e.term.toLowerCase())]);
    const remaining = shuffle(allEntries.filter((e) => !usedTerms.has(e.term.toLowerCase())));
    for (const entry of remaining) {
      if (result.length >= count) break;
      result.push(entry);
    }
  }

  return result;
}

const LABELS = ['A', 'B', 'C', 'D'];

// ─── Main Generator ─────────────────────────────────────────────────────────

export function generateVocabQuiz(config: VocabQuizConfig): VocabQuizItem[] {
  const { count, types, priorityTerms, restrictToTerms } = config;

  // Determine eligible terms
  let eligible: GlossaryEntry[];
  if (restrictToTerms && restrictToTerms.length > 0) {
    const restrictSet = new Set(restrictToTerms.map((t) => t.toLowerCase()));
    eligible = ALL_TERMS.filter((e) => restrictSet.has(e.term.toLowerCase()));
  } else {
    eligible = [...ALL_TERMS];
  }

  if (eligible.length < 4) return []; // Need at least 4 terms for MCQ

  // Sort: priority terms first (shuffled), then the rest (shuffled)
  let ordered: GlossaryEntry[];
  if (priorityTerms && priorityTerms.length > 0) {
    const prioritySet = new Set(priorityTerms.map((t) => t.toLowerCase()));
    const priority = shuffle(eligible.filter((e) => prioritySet.has(e.term.toLowerCase())));
    const rest = shuffle(eligible.filter((e) => !prioritySet.has(e.term.toLowerCase())));
    ordered = [...priority, ...rest];
  } else {
    ordered = shuffle(eligible);
  }

  const items: VocabQuizItem[] = [];
  const usedTerms = new Set<string>();

  for (const entry of ordered) {
    if (items.length >= count) break;
    if (usedTerms.has(entry.term.toLowerCase())) continue;
    usedTerms.add(entry.term.toLowerCase());

    const quizType = types[Math.floor(Math.random() * types.length)];
    const distractors = pickDistractors(entry.term, 3, eligible);

    if (distractors.length < 3) continue; // Not enough distractors

    // Build choices
    const correctIdx = Math.floor(Math.random() * 4);
    const choices: { label: string; text: string }[] = [];

    let dIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        choices.push({
          label: LABELS[i],
          text: quizType === 'term' ? entry.term : entry.definition,
        });
      } else {
        const d = distractors[dIdx++];
        choices.push({
          label: LABELS[i],
          text: quizType === 'term' ? d.term : d.definition,
        });
      }
    }

    items.push({
      id: `vq-${items.length}-${Date.now()}`,
      type: quizType,
      prompt:
        quizType === 'term'
          ? entry.definition
          : entry.term,
      choices,
      correctLabel: LABELS[correctIdx],
      correctTerm: entry.term,
    });
  }

  return items;
}

/** Total terms available in the glossary */
export const TOTAL_GLOSSARY_TERMS = ALL_TERMS.length;
