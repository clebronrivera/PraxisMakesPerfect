export const SCREENER_QUESTION_COUNT = 50;
export const LEGACY_SCREENER_QUESTION_COUNT = 45;
export const LEGACY_QUICK_DIAGNOSTIC_QUESTION_COUNT = 40;

export function isScreenerQuestionCount(questionCount: number): boolean {
  return (
    questionCount === SCREENER_QUESTION_COUNT ||
    questionCount === LEGACY_SCREENER_QUESTION_COUNT
  );
}
