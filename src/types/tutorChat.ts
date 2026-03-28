// src/types/tutorChat.ts
// Shared types for the AI Tutor Chat feature.

// ─── Intent ──────────────────────────────────────────────────────────────────

export type TutorIntent =
  | 'quiz-answer'       // user is answering a posed quiz question
  | 'artifact-request'  // vocabulary list, weak-areas summary, study sheet
  | 'quiz-request'      // "quiz me", "test me", "give me a question"
  | 'app-guide'         // "how do I use this app?", "what does this page do?"
  | 'hint-request'      // user is asking about a specific question they're viewing
  | 'general';          // everything else (tutoring, content questions, etc.)

// ─── Page Context (floating widget) ─────────────────────────────────────────

export interface PageContext {
  page: string;             // current AppMode value e.g. 'practice', 'results', 'home'
  questionId?: string;      // if viewing a specific question
  skillId?: string;         // if viewing a specific skill
}

// ─── API Request ─────────────────────────────────────────────────────────────

export interface TutorChatRequest {
  userId: string;
  sessionId: string | null;       // null = create new session
  message: string;
  mode: 'chat' | 'quiz';
  sessionType: 'page-tutor' | 'floating';
  pageContext?: PageContext;       // floating widget only
  quizAnswerFor?: {               // when user is answering a quiz question
    questionId: string;
    selectedAnswers: string[];
  };
  // ── Adaptive retry fields ────────────────────────────────────────────────
  // Sent on quiz-request when student missed the previous question: forces
  // question selection from this skill instead of weighted random.
  prioritySkillId?: string;
  // Sent on quiz-answer when the question being answered is a retry attempt.
  // missCount = 1 means "this is the 2nd miss on this skill in a row" →
  // server shifts Claude into full remediation/explanation mode.
  quizRetryContext?: {
    skillId: string;
    missCount: number;
  };
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface TutorChatResponse {
  sessionId: string;
  messageId: string;
  content: string;                  // markdown
  suggestedFollowUps: string[];     // 2–3 clickable chips
  quizQuestion?: {
    questionId: string;
    skillId: string;
    stem: string;
    choices: { label: string; text: string }[];
    isMultiSelect: boolean;
  };
  artifact?: {
    type: string;
    payload: Record<string, unknown>;
  };
  // Populated whenever intent === 'quiz-answer'. Used by the client to
  // track consecutive misses and trigger the adaptive retry state machine.
  quizResult?: {
    isCorrect: boolean;
    skillId: string;
  };
}

// ─── Claude's expected JSON response shape ───────────────────────────────────

export interface ClaudeResponseShape {
  content: string;                                            // markdown
  suggestedFollowUps: string[];                               // 2–3 items
  poseQuestion?: { questionId: string; skillId: string };     // quiz only
  artifact?: { type: string; payload: Record<string, unknown> };
}

// ─── Session + Message types (client-side) ───────────────────────────────────

export interface ChatSessionSummary {
  id: string;
  title: string | null;
  sessionType: 'page-tutor' | 'floating';
  messageCount: number;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  assistantIntent?: TutorIntent;
  quizQuestionId?: string;
  quizSkillId?: string;
  quizAnswered?: boolean;
  artifactType?: string;
  artifactPayload?: Record<string, unknown>;
  pageContext?: PageContext;
  // Quiz question data (populated from response when posing a question)
  quizQuestion?: TutorChatResponse['quizQuestion'];
  // Suggested follow-ups (ephemeral — not persisted to DB)
  suggestedFollowUps?: string[];
}

// ─── Tutor Context (assembled server-side before Claude call) ────────────────

export interface TutorSkillSnapshot {
  skillId: string;
  skillName: string;
  domainId: number;
  proficiency: 'demonstrating' | 'approaching' | 'emerging' | 'not-started';
  accuracy: number | null;
  attempts: number;
  trend: 'improving' | 'declining' | 'stable' | 'unknown';
  isTentative: boolean;         // true if attempts < 6
}

export interface TutorUserContext {
  userId: string;
  displayName: string | null;
  diagnosticComplete: boolean;
  totalQuestionsSeen: number;
  skillSnapshots: TutorSkillSnapshot[];
  emergingSkills: TutorSkillSnapshot[];     // sorted by accuracy ascending
  approachingSkills: TutorSkillSnapshot[];
  demonstratingCount: number;
  notStartedCount: number;
  readinessRatio: number;                   // demonstrating / 32 (70% of 45)
}
