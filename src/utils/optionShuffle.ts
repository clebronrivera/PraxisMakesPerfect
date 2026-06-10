// src/utils/optionShuffle.ts
//
// Deterministic, render-time option-order shuffling.
//
// WHY: ~66% of bank items have "B" as the keyed-correct answer (DIV 84%, ETH 79%).
// A student who learns "always pick B" scores well above chance regardless of
// knowledge. We defeat this WITHOUT mutating questions.json: the display ORDER of
// options is shuffled per question, so the correct answer lands at a (per-item)
// stable but bank-wide ~uniform display position.
//
// SAFETY: this only reorders the `options` array that QuestionCard renders.
//   • Each option keeps its CANONICAL `letter` — selection (`onSelectAnswer(letter)`),
//     scoring (`getQuestionCorrectAnswers`), `selected_answer` persistence, and
//     distractor-metadata lookup (`distractor_misconception_<letter>`) are all
//     keyed on the canonical letter and are unaffected.
//   • QuestionCard's displayed A/B/C/D badge is already POSITIONAL
//     (`String.fromCharCode(65 + index)`), so reordering the array is all that's
//     needed for the student-facing letter to change.
//   • Feedback/explanation prose is rendered content-first (sanitizeFeedbackText
//     rewrites "Option B" → the quoted choice text via canonical-letter lookup),
//     so it stays correct regardless of display order.
//
// DETERMINISTIC: the order is a pure function of the question id. The same item
// always displays in the same order (stable across re-renders, redemption repeats,
// and resumed sessions) and is reproducible for audit without persisting anything.

import { AnalyzedQuestion, Question, getQuestionChoices } from '../brain/question-analyzer';

/** FNV-1a 32-bit string hash → unsigned int. Stable across runs/platforms. */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast seeded PRNG returning floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a deterministic display order of the given option letters, seeded by
 * the question id. Pure permutation (same multiset of letters, reordered).
 */
export function deterministicOptionOrder(questionId: string, letters: string[]): string[] {
  const order = [...letters];
  if (order.length < 2) return order;
  const rng = mulberry32(hashString(questionId || ''));
  // Fisher–Yates with the seeded PRNG.
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // Guard: if the permutation is identity for a 2+ option item, rotate by one so
  // the displayed order actually differs from the stored (often correct-is-B) order.
  if (order.length >= 2 && order.every((l, i) => l === letters[i])) {
    order.push(order.shift()!);
  }
  return order;
}

/**
 * Returns a shallow copy of `question` whose `options` array is reordered for
 * display, seeded deterministically by the question id. Canonical letters and
 * choice text are preserved; `choices` is left canonical so all keyed lookups
 * (feedback, distractor metadata) are unaffected.
 *
 * Pass the result to <QuestionCard>; keep using the ORIGINAL question for all
 * scoring / persistence / lookups.
 */
export function withShuffledOptions(question: AnalyzedQuestion): AnalyzedQuestion {
  const choices = getQuestionChoices(question);
  const letters = Object.keys(choices);
  if (letters.length < 2) return question;

  const questionId = question.id || (question as Question).UNIQUEID || '';
  const order = deterministicOptionOrder(questionId, letters);

  return {
    ...question,
    options: order.map(letter => ({ letter, text: choices[letter] })),
  };
}
