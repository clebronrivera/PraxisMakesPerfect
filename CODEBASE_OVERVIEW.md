# PraxisMakesPerfect – Codebase Overview

> Status: Canonical source. Reviewed during documentation consolidation on 2026-03-14. Use this as the current implementation snapshot, but defer to code if any file-level detail has drifted.

This document summarizes all components, hooks, utilities, brain modules, and data flows after a full codebase read. Use it for rewrite planning and to avoid missing or duplicating behavior.

---

## 1. Entry and shell

- **`src/main.tsx`** – Renders `App`, imports `index.css` and `config/firebase` (Firebase init).
- **`App.tsx`** – Root UI. Wraps content in `AuthProvider`. If no `user`, renders `LoginScreen`; otherwise `PraxisStudyAppContent` with header and main content. Owns app `mode`, assessment question lists, `lastAssessmentResponses`, and handlers for starting/resuming assessments, viewing reports, practice, teach, and reset.

---

## 2. App modes (state in App.tsx)

| Mode             | Purpose |
|------------------|--------|
| `home`           | Dashboard: stats, View Report buttons, Resume session, Start Diagnostic / Full Assessment / Practice / Teach / View Progress, Domain Tiles, Reset Progress. |
| `preassessment`  | Quick Diagnostic (40Q). Uses `PreAssessment` with `preAssessmentQuestions`. |
| `fullassessment` | Full assessment (125Q). Uses `FullAssessment` with `fullAssessmentQuestions`. |
| `score-report`   | Post-assessment report. Uses `ScoreReport` with `lastAssessmentResponses` or data from `getAssessmentResponses(sessionId)`. |
| `practice`       | Adaptive practice. Uses `PracticeSession`. |
| `teach`          | Teach mode (review wrong answers with explanations). Uses `TeachMode`. |
| `results`        | Progress dashboard (domain/skill view). Uses `ResultsDashboard`. |

---

## 3. Components

### 3.1 Screens / flows

| Component         | Role | Key deps |
|------------------|------|----------|
| **LoginScreen**  | Auth: anonymous, email/password, Google, password reset. Used when `!user`. | `useAuth` |
| **PreAssessment**| 40Q diagnostic. One question at a time, timer (optional), confidence, save/resume via `sessionStorage` + `userSessionStorage`, calls `logResponse` and `updateLastSession` on submit. On complete → `onComplete(responses)`. | QuestionCard, ExplanationPanel, sessionStorage, userSessionStorage, distractor-matcher |
| **FullAssessment** | 125Q full exam. Same pattern as PreAssessment (session, logResponse, updateLastSession, onComplete). | Same as PreAssessment |
| **ScoreReport**  | Post-assessment report: overall score, domain breakdown, weakest domains, time metrics, “Start Practice” / “Retake” / “Go Home” / “Teach Mode” / “Practice with domains”. Handles missing data with recovery UI. | NASP_DOMAINS, UserResponse, AnalyzedQuestion |
| **PracticeSession** | Adaptive practice: intro, goal picker, `selectNextQuestion(profile, questions, history)`, per-question feedback, `updateSkillProgress`, `logResponse`, `updateLastSession`, local weakness updates. Can filter by `practiceDomain`. | QuestionCard, ExplanationPanel, useFirebaseProgress (profile), useAdaptiveLearning, detectWeaknesses, distractor-matcher |
| **TeachMode**    | Review mode: questions from full assessment (wrong or all), teaching context, explanations. Updates `flaggedQuestions` and **writes `practiceHistory`** (legacy field – see Issues). | QuestionCard, ExplanationPanel, NASP_DOMAINS, UserProfile |
| **ResultsDashboard** | “View Progress”: toggles Praxis sections vs NASP domains; shows domain scores and focus areas. **Reads `userProfile.practiceHistory.length`** (removed from profile – see Issues). | PraxisPerformanceView, NASP_DOMAINS, UserProfile |

### 3.2 Shared UI

| Component           | Role |
|--------------------|------|
| **QuestionCard**   | Renders question stem, choices (multi-select support), confidence selector, submit/next. Source badge (bank/generated). Opens **ReportQuestionModal** for “report question”. |
| **ExplanationPanel** | Correct/incorrect rationale, key concepts. In practice, uses **DiagnosticFeedback** (generateDiagnosticFeedback) when `userProfile` is provided. |
| **DiagnosticFeedback** | Expandable diagnostic feedback (explanation, framework guidance, skill guidance, remediation). | 
| **ReportQuestionModal** | Report a question: targets, issue type, severity, notes. Submits via **useQuestionReports** to Firestore `questionReports`. |
| **DomainTiles**    | Grid of NASP domains; expand for details (from NASP_DOMAINS, SKILL_MAP, ETS content topics). “Start practice” → `onDomainSelect(domainId)`. |
| **PraxisPerformanceView** | Praxis sections (Professional Practices, Student-Level, Systems-Level, Foundations) with domain breakdown and performance labels. Uses `userProfile.domainScores`, `skillScores`, etc. |
| **ErrorBoundary**  | Catches errors (e.g. in score report), shows fallback or default “Something went wrong” with Try again / Go Home. |

### 3.3 Unused / legacy

| Component   | Status |
|------------|--------|
| **UserLogin** | Not imported in App. Old localStorage-based “pick user” UI. Replaced by Firebase **LoginScreen**. |

---

## 4. Hooks

| Hook | Purpose |
|------|--------|
| **useFirebaseProgress** | Firestore user doc + responses. Exposes: `profile`, `updateProfile`, `updateSkillProgress`, `resetProgress`, `migrateFromLocalStorage`, `logResponse`, `updateLastSession`, `getAssessmentResponses`, `isLoaded`. Profile has no `practiceHistory` or `generatedQuestionsSeen`; has `practiceResponseCount`, `lastSession`, `lastPreAssessmentSessionId`, etc. |
| **useAdaptiveLearning** | `selectNextQuestion(profile, questions, history)`: weakest skills, bank vs generated ratio, can call **question-generator** for generated questions. **Uses `profile.generatedQuestionsSeen` and `skill.attemptHistory`** – both removed or not populated (see Issues). |
| **useQuestionReports** | Submit and fetch question reports (Firestore `questionReports`). Used by ReportQuestionModal. |
| **useUserProgress** | **Dead:** localStorage-based progress (practiceHistory, generatedQuestionsSeen). Not used by App; App uses useFirebaseProgress. |

---

## 5. Utils

| Module | Purpose |
|--------|--------|
| **sessionStorage** | Single assessment session: `AssessmentSession` (type, questionIds, currentIndex, responses, selectedAnswers, showFeedback, confidence, startTime). Key `praxis-assessment-session`. `saveSession`, `loadSession`, `clearSession`, `hasActiveSession`. |
| **userSessionStorage** | Per-user sessions in localStorage: `UserSession` (adds userName, sessionId, lastUpdated, createdAt). `createUserSession`, `getUserSessions`, `getCurrentSession`, `saveUserSession`, `getCurrentUser`, `setCurrentUser`, etc. Used with Firebase user display name for resume. |
| **assessment-builder** | **Used.** `buildFullAssessment(analyzedQuestions, options?)` – 125Q with Praxis distribution and exclusion. Used by App for full assessment. |
| **assessment-selector** | **Unused.** Also has `buildFullAssessment` (domain balancing). Not imported. |

---

## 6. Brain (domain / analysis)

| Module | Purpose |
|--------|--------|
| **question-analyzer** | `analyzeQuestion(q)` → `AnalyzedQuestion` (domains, dok, questionType, stemType, keyConcepts, skillId from question-skill-map). |
| **weakness-detector** | `detectWeaknesses(responses, questions)` → weakestDomains, factualGaps, errorPatterns, domainScores. Used after assessments and in practice. |
| **diagnostic-feedback** | `generateDiagnosticFeedback(question, userAnswer, isCorrect, userProfile)` → DiagnosticFeedback (patternId, framework guidance, skill guidance, remediation). Uses **distractor-matcher**, **error-library**, **framework-definitions**, **learning-state**. |
| **distractor-matcher** | `matchDistractorPattern(selectedText, correctAnswer?)` → PatternId. Used when logging wrong answers (PreAssessment, FullAssessment, PracticeSession). |
| **learning-state** | LearningState, SkillPerformance, SkillAttempt; `calculateLearningState`, `calculateConfidenceWeight`, `calculateWeightedAccuracy`, `countConfidenceFlags`. Used by useFirebaseProgress for skill updates. |
| **skill-map** | NASP domains → clusters → skills (SkillId, name, description, decisionRule, etc.). `getSkillById`, SKILL_MAP. Used by adaptive learning, diagnostic feedback, DomainTiles, PraxisPerformanceView. |
| **template-schema** | PatternId, TemplateType, slot definitions, correct-answer logic. Used by question-generator, distractor-matcher, diagnostic-feedback. |
| **question-generator** | `generateQuestion(skillId, options?)` → GeneratedQuestion from domain templates. Used by **useAdaptiveLearning** when selecting next question (generated path). |
| **answer-generator** | Generate distractors for generated questions. |
| **rationale-builder** | Build rationales for generated questions. |
| **question-validator** | Validate generated questions. |
| **distractor-patterns** | Distractor pattern definitions. Used by distractor-matcher. |
| **error-library** | Error explanations and framework step guidance. Used by diagnostic-feedback. |
| **framework-definitions** | Framework steps (e.g. problem-identification, data-collection). Used by diagnostic-feedback. |
| **assessment-builder** (brain) | **Unused.** Builds assessments from generated questions. App uses `utils/assessment-builder` (question bank). |

Templates live in **brain/templates/** (domain-1 through domain-10).

---

## 7. Contexts and config

| File | Purpose |
|------|--------|
| **contexts/AuthContext** | Firebase Auth: user, loading, error; signInAnonymous, signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, logout, clearError. |
| **config/firebase** | init Firebase (app, db, auth, analytics). |

---

## 8. Data and content

- **knowledge-base.ts** (root) – NASP_DOMAINS (keyConcepts, mustKnowTerms, questionPatterns, commonMistakes, etc.). Single source for domain metadata in app.
- **src/data/questions.json** – Question bank (id, question, choices, correct_answer, rationale, skillId, etc.).
- **src/data/question-skill-map.json** – questionId → skillId (and confidence). Used by question-analyzer and useAdaptiveLearning.
- **src/data/ets-content-topics.json** – ETS structure. Used by DomainTiles.
- Other data: ets-sample-questions, mappings, flippable-distractors, discard-distractors, distractor-map, tagging-* – used by scripts or future features, not core app flow.

---

## 9. Firestore usage

- **users/{uid}** – Profile document (completion flags, domainScores, skillScores, weakestDomains, factualGaps, errorPatterns, totalQuestionsSeen, streak, flaggedQuestions, distractorErrors, skillDistractorErrors, preAssessmentQuestionIds, fullAssessmentQuestionIds, recentPracticeQuestionIds, practiceResponseCount, lastSession, lastPreAssessmentSessionId, lastFullAssessmentSessionId, lastPreAssessmentCompletedAt, lastFullAssessmentCompletedAt, lastUpdated). No `practiceHistory` or `generatedQuestionsSeen`.
- **users/{uid}/responses** – Response log docs: questionId, skillId, domainId, assessmentType, sessionId, isCorrect, confidence, timeSpent, timestamp, selectedAnswer (single letter), distractorPatternId?, createdAt.
- **questionReports** – User question reports (questionId, targets, issueTypes, severity, notes, etc.).

---

## 10. Data flow (high level)

- **Auth:** AuthContext → App shows LoginScreen or main app; useFirebaseProgress subscribes to users/{uid}.
- **Assessments:** App builds pre/full question lists (pre: 4 per domain; full: buildFullAssessment). PreAssessment/FullAssessment save session to sessionStorage + userSessionStorage, call logResponse (Firestore) and updateLastSession. On complete, App updates profile (detectWeaknesses, completion flags, session IDs), sets lastAssessmentResponses, switches to score-report.
- **Reports:** ScoreReport reads lastAssessmentResponses (or App fetches via getAssessmentResponses(sessionId) for “View Report”).
- **Practice:** PracticeSession uses selectNextQuestion (useAdaptiveLearning), updateSkillProgress, logResponse, updateLastSession; updates profile and local weakness state.
- **Teach:** TeachMode uses profile and analyzed questions; on exit writes flaggedQuestions and **practiceHistory** (legacy).

---

## 11. Issues found (legacy / missing fields)

1. **ResultsDashboard** – Uses `userProfile.practiceHistory.length`. `UserProfile` no longer has `practiceHistory`. Should use `profile.totalQuestionsSeen` or `profile.practiceResponseCount` (or both) and guard for undefined.
2. **TeachMode** – Calls `onUpdateProfile({ practiceHistory: [...userProfile.practiceHistory, ...responses] })`. `UserProfile` has no `practiceHistory`; this will add an unknown field or error. Should stop writing practiceHistory; if needed, rely on response logging only.
3. **useAdaptiveLearning** – Uses `profile.generatedQuestionsSeen` (removed) and `skill.attemptHistory` (optional; useFirebaseProgress only keeps last 5 as `history: boolean[]`, not full attemptHistory). Generated-path and priority logic may fall back or behave incorrectly. Should use profile fields that exist (e.g. recentPracticeQuestionIds) and either populate attemptHistory from responses or change priority to use score/history only.

---

## 12. Scripts (src/scripts/)

Used for tooling, not at runtime in the app: analyze-coverage-gaps, blueprint-alignment, bottleneck-finder, capacity-test, coverage-audit, diagnostic-utils, distractor-audit, extract-distractors, feedback-quality-test, full-simulation, generate-categorization-report, generate-coverage-report, generate-crosswalk, learning-progression-test, question-counts, run-all-diagnostics, uniqueness-test. Root-level scripts (e.g. health-check.ts, generate-*.ts) are separate.

---

## 13. Tests

- **tests/adaptive-coaching.test.ts** – Adaptive coaching / question selection tests.

---

This overview reflects the codebase as of the review. Fixing the three issues in §11 will align the app with the current Firestore profile and response model before a rewrite.
