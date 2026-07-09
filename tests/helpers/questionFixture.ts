// Shared question fixture for component tests.
//
// Builds a minimal-but-complete AnalyzedQuestion. The correct answer is always
// canonical letter "B" unless overridden. Option TEXT embeds the question id and
// correctness ("<id> correct option" / "<id> wrong option ...") so tests can
// click choices by text — display order is shuffled by withShuffledOptions and
// the displayed A/B/C/D chip is positional, so letter-based queries are unsafe.
import type { AnalyzedQuestion } from '../../src/brain/question-analyzer';

export function makeQuestion(overrides: Partial<AnalyzedQuestion> = {}): AnalyzedQuestion {
  const id = overrides.id ?? 'test-q';
  const choices: Record<string, string> = {
    A: `${id} wrong option one`,
    B: `${id} correct option`,
    C: `${id} wrong option two`,
    D: `${id} wrong option three`,
  };
  return {
    id,
    question: `Question stem for ${id}?`,
    questionStem: `Question stem for ${id}?`,
    choices,
    options: Object.entries(choices).map(([letter, text]) => ({ letter, text })),
    correct_answer: ['B'],
    correctAnswers: ['B'],
    rationale: `Rationale for ${id}.`,
    skillId: 'skill-1',
    domains: [1],
    source: 'bank',
    ...overrides,
  };
}

/** Choice text of the canonical correct answer (letter B) for a fixture question. */
export function correctChoiceText(q: AnalyzedQuestion): string {
  return q.choices?.B ?? '';
}

/** Choice text of a canonical wrong answer (letter A) for a fixture question. */
export function wrongChoiceText(q: AnalyzedQuestion): string {
  return q.choices?.A ?? '';
}
