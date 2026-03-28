// src/utils/tutorIntentClassifier.ts
// Deterministic intent classification for tutor chat messages.
// Priority-ordered: most specific intent wins.
//
// PRIORITY ORDER (highest → lowest):
//   1. quiz-answer   — structural (quizAnswerFor present)
//   2. quiz-request  — user wants to be quizzed (checked BEFORE artifact so "quiz me on my
//                      weak areas" routes here, not to artifact-request)
//   3. artifact-request — user wants a generated study material
//   4. hint-request  — question-specific help
//   5. app-guide     — navigation / how-to
//   6. general       — everything else

import type { TutorIntent, TutorChatRequest } from '../types/tutorChat';

const QUIZ_TRIGGER_PATTERNS = [
  /\bquiz\s*me\b/i,                              // "quiz me"
  /\bquiz\s*my\b/i,                              // "quiz my weakest skill"
  /\bcan\s+you\s+quiz\b/i,                       // "can you quiz me/my..."
  /\btest\s*me\b/i,                              // "test me"
  /\bgive\s*me\s*a\s*(quiz|question)\b/i,        // "give me a quiz / a question"
  /\bpractice\s*question\b/i,                    // "practice question" (singular)
  /\bdrill\s*me\b/i,                             // "drill me"
  /\bask\s*me\s*(a\s*)?question/i,               // "ask me a question"
  /\bone\s*(more\s*)?question\b/i,               // "one more question"
  /\btry\s+(a\s*)?question\b/i,                  // "try a question"
  /\bi\s*(want|'d\s*like)\s*to\s*(be\s*)?(quizzed|tested)\b/i, // "I want to be quizzed"
];

const ARTIFACT_TRIGGER_PATTERNS = [
  /\bvocabulary\s*list\b/i,
  /\bweak\s*areas?\b/i,
  /\bstudy\s*sheet\b/i,
  /\bwhat\s*should\s*i\s*focus\b/i,
  /\bgenerate\s*(a\s*)?summary\b/i,
  /\bgive\s*me\s*(my\s*)?priorities\b/i,
  /\bwhat\s*are\s*my\s*(weakest|worst|lowest)\b/i,
  // Practice set (printable questions)
  /\bpractice\s*(set|sheet|questions?\s*to\s*print|packet)\b/i,
  /\bprint\s*(out\s*)?(some\s*)?(practice\s*)?questions?\b/i,
  /\bgenerate\s*(some\s*)?questions?\b/i,
  /\bquestions?\s*(based\s*on|for)\s*(my\s*)?(weak|areas?|gaps?|needs?)\b/i,
  // Broader practice-question phrasing ("create practice questions", "make questions", etc.)
  /\b(create|make|build|give\s+me|write)\s+(some\s+)?(practice\s+)?questions\b/i,
  /\bpractice\s+questions\b/i,                        // "practice questions" (plural → artifact, not quiz)
  /\bquestions?\s+(for|about|on)\s+\w/i,               // "questions for/about/on [topic]"
  // Fill-in-the-blank / word bank
  /\bfill\s*in\s*(the\s*)?blank/i,
  /\bword\s*bank\b/i,
  /\bblank\s*(exercise|activity|worksheet)\b/i,
  // Matching activity
  /\bmatching\s*(activity|game|exercise|worksheet)?\b/i,
  /\bdrag\s*(and\s*|&\s*)?drop\b/i,
  /\bmatch\s*(the\s*)?(terms?|concepts?|definitions?)\b/i,
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

  // Priority 2: Quiz request — checked BEFORE artifact so that phrases like
  // "quiz me on my weak areas" or "quiz my weakest skill" route here instead
  // of being misclassified as artifact-request.
  if (request.mode === 'quiz' || QUIZ_TRIGGER_PATTERNS.some(p => p.test(msg))) {
    return 'quiz-request';
  }

  // Priority 3: Artifact request
  if (ARTIFACT_TRIGGER_PATTERNS.some(p => p.test(msg))) {
    return 'artifact-request';
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
