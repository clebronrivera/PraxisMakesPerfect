// src/utils/tutorIntentClassifier.ts
// Deterministic intent classification for tutor chat messages.
// Priority-ordered: most specific intent wins.

import type { TutorIntent, TutorChatRequest } from '../types/tutorChat';

const QUIZ_TRIGGER_PATTERNS = [
  /\bquiz\s*me\b/i,
  /\btest\s*me\b/i,
  /\bgive\s*me\s*a\s*question\b/i,
  /\bpractice\s*question\b/i,
  /\bdrill\s*me\b/i,
  /\bask\s*me\s*(a\s*)?question/i,
];

const ARTIFACT_TRIGGER_PATTERNS = [
  /\bvocabulary\s*list\b/i,
  /\bweak\s*areas?\b/i,
  /\bstudy\s*sheet\b/i,
  /\bwhat\s*should\s*i\s*focus\b/i,
  /\bgenerate\s*(a\s*)?summary\b/i,
  /\bgive\s*me\s*(my\s*)?priorities\b/i,
  /\bwhat\s*are\s*my\s*(weakest|worst|lowest)\b/i,
];

const APP_GUIDE_TRIGGER_PATTERNS = [
  /\bhow\s*(do\s*i|does\s*(this|the)\s*(app|page|screen))\b/i,
  /\bwhat\s*(does|is)\s*this\s*(page|screen|section|tab)\b/i,
  /\bhow\s*to\s*(use|navigate|start|get\s*started)\b/i,
  /\bwhere\s*(do\s*i|can\s*i|should\s*i)\b/i,
  /\bexplain\s*the\s*(app|interface|dashboard)\b/i,
  /\bhelp\s*me\s*(get\s*started|understand)\b/i,
  /\bwhat\s*should\s*i\s*do\s*(first|next|now)\b/i,
];

const HINT_TRIGGER_PATTERNS = [
  /\bexplain\s*this\s*question\b/i,
  /\bgive\s*me\s*a\s*hint\b/i,
  /\bhelp\s*(me\s*)?(with|understand)\s*this\b/i,
  /\bwhat\s*(does|is)\s*this\s*asking\b/i,
  /\bbreak\s*(this|it)\s*down\b/i,
];

export function classifyIntent(request: TutorChatRequest): TutorIntent {
  const msg = request.message.trim();

  // Priority 1: Explicit quiz answer (structural, not text-based)
  if (request.quizAnswerFor) {
    return 'quiz-answer';
  }

  // Priority 2: Artifact request
  if (ARTIFACT_TRIGGER_PATTERNS.some(p => p.test(msg))) {
    return 'artifact-request';
  }

  // Priority 3: Quiz request
  if (request.mode === 'quiz' || QUIZ_TRIGGER_PATTERNS.some(p => p.test(msg))) {
    return 'quiz-request';
  }

  // Priority 4: Hint request (only when pageContext has a questionId)
  if (request.pageContext?.questionId && HINT_TRIGGER_PATTERNS.some(p => p.test(msg))) {
    return 'hint-request';
  }

  // Priority 5: App guide
  if (APP_GUIDE_TRIGGER_PATTERNS.some(p => p.test(msg))) {
    return 'app-guide';
  }

  // Priority 6: General tutoring
  return 'general';
}
