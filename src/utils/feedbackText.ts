import { Question, getQuestionChoiceText } from '../brain/question-analyzer';

type FeedbackQuestion = Pick<Question, 'choices' | 'options'>;

function truncateChoiceText(text: string, maxLength = 88): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');
  const safeClip = lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped;
  return `${safeClip.trim()}...`;
}

export function formatChoiceReference(
  question: FeedbackQuestion,
  letter: string,
  maxLength = 88
): string {
  const rawChoice = getQuestionChoiceText(question, letter);
  if (!rawChoice.trim()) {
    return `the answer choice keyed as ${letter}`;
  }

  return `"${truncateChoiceText(rawChoice, maxLength)}"`;
}

export function formatChoiceReferenceList(
  question: FeedbackQuestion,
  letters: string[],
  maxLength = 88
): string {
  const references = letters
    .map((letter) => formatChoiceReference(question, letter, maxLength))
    .filter(Boolean);

  if (references.length === 0) {
    return '';
  }

  if (references.length === 1) {
    return references[0];
  }

  if (references.length === 2) {
    return `${references[0]} and ${references[1]}`;
  }

  return `${references.slice(0, -1).join(', ')}, and ${references[references.length - 1]}`;
}

export function sanitizeFeedbackText(question: FeedbackQuestion, rawText: string): string {
  if (!rawText.trim()) {
    return '';
  }

  let text = rawText;

  const replaceChoiceMention = (_match: string, letter: string): string =>
    formatChoiceReference(question, letter);

  const replaceBestAnswer = (_match: string, letter: string): string =>
    `the best answer is ${formatChoiceReference(question, letter)}`;

  const replaceCorrectAnswer = (_match: string, letter: string): string =>
    `the correct answer is ${formatChoiceReference(question, letter)}`;

  const replaceSelectedAnswer = (_match: string, letter: string): string =>
    `you selected ${formatChoiceReference(question, letter)}`;

  text = text.replace(
    /\b(?:answer choice|choice|option|answer)\s*[“"']?\(?([A-F])\)?[.”"”']*/gi,
    replaceChoiceMention
  );

  text = text.replace(
    /\bthe\s+best\s+(?:answer|response)\s+(?:is|would be)\s*[“"']?\(?([A-F])\)?[.”"”']*/gi,
    replaceBestAnswer
  );

  text = text.replace(
    /\bbest\s+(?:answer|response)\s+(?:is|would be)\s*[“"']?\(?([A-F])\)?[.”"”']*/gi,
    replaceBestAnswer
  );

  text = text.replace(
    /\bthe\s+correct\s+(?:answer|response)\s+(?:is|would be)\s*[“"']?\(?([A-F])\)?[.”"”']*/gi,
    replaceCorrectAnswer
  );

  text = text.replace(
    /\bcorrect\s+(?:answer|response)\s+(?:is|would be)\s*[“"']?\(?([A-F])\)?[.”"”']*/gi,
    replaceCorrectAnswer
  );

  text = text.replace(
    /\byou\s+selected\s*[“"']?\(?([A-F])\)?[.”"”']*/gi,
    replaceSelectedAnswer
  );

  return text.replace(/\s{2,}/g, ' ').trim();
}
