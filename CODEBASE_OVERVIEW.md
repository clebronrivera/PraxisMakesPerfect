# PraxisMakesPerfect – Codebase Overview

> Status: Canonical source. Reviewed during documentation consolidation on 2026-03-14. Use this as the current implementation snapshot, but defer to code if any file-level detail has drifted.

This document summarizes all components, hooks, utilities, brain modules, and data flows after a full codebase read. Use it for rewrite planning and to avoid missing or duplicating behavior.

---

## 1. Entry and shell

- **`src/main.tsx`** – Renders `App`, imports `index.css`, and wraps the app in `ContentProvider`.
- **`App.tsx`** – Root UI. Wraps content in `AuthProvider`. If no `user`, renders `LoginScreen`; otherwise `PraxisStudyAppContent` inside the shared signed-in shell. The live shell now uses a light editorial layout: desktop sidebar, sticky top bar, warm background, and shared surface/button classes from `src/index.css`. `App.tsx` owns app `mode`, assessment question lists, `lastAssessmentResponses`, the Home dashboard composition, and handlers for starting/resuming assessments, viewing reports, practice, teach, and reset.

---

## 2. App modes (state in App.tsx)

| Mode             | Purpose |
|------------------|--------|
| `home`           | Main dashboard: greeting hero, resume cards, screener/full-assessment entry states, spicy practice CTA, metric cards, daily-goal rail, and High-Impact Skills actions. |
| `screener`       | Skills screener. Uses `ScreenerAssessment` with `screenerQuestions`. |
| `fullassessment` | Full assessment (125Q). Uses `FullAssessment` with `fullAssessmentQuestions`. |
| `score-report`   | Post-assessment report. Uses `ScoreReport` with `lastAssessmentResponses` or data from `getAssessmentResponses(sessionId)`. |
| `practice`       | Adaptive practice. Uses `PracticeSession`. |
| `practice-hub`   | Practice destination wrapper. Uses `StudyModesSection` for By Domain / By Skill / Learning Path entry. |
| `learning-path-module` | Skill-specific Learning Path lesson/module view. |
| `teach`          | Teach mode (review wrong answers with explanations). Uses `TeachMode`. |
| `results`        | Progress dashboard (domain/skill view). Uses `ResultsDashboard`. |
| `study-guide`    | Study Guide destination. Uses `StudyPlanCard` / `StudyPlanViewer`. |
| `admin`          | Admin analytics and moderation view. Uses `AdminDashboard`. |

---

## 3. Components

### 3.1 Screens / flows

| Component         | Role | Key deps |
|------------------|------|----------|
| **LoginScreen**  | Auth: email/password sign-in, sign-up, and password reset. Used when `!user`. | `useAuth` |
| **ScreenerAssessment** | 50Q screener. One question at a time, timer, confidence, save/resume via `sessionStorage` + `userSessionStorage`, calls `logResponse`, `saveScreenerResponse`, and `updateLastSession` on submit. On complete → `onComplete(responses)`. | QuestionCard, ExplanationPanel, sessionStorage, userSessionStorage, distractor-matcher |
| **FullAssessment** | 125Q full exam. Same pattern as ScreenerAssessment (session, `logResponse`, `updateLastSession`, `onComplete`). | QuestionCard, ExplanationPanel, sessionStorage, userSessionStorage, distractor-matcher |
| **ScoreReport**  | Post-assessment report: overall score, domain breakdown, weakest domains, time metrics, “Start Practice” / “Retake” / “Go Home” / “Teach Mode” / “Practice with domains”. Handles missing data with recovery UI. | NASP_DOMAINS, UserResponse, AnalyzedQuestion |
| **PracticeSession** | Adaptive practice: intro, goal picker, `selectNextQuestion(profile, questions, history)`, per-question feedback, `updateSkillProgress`, `logResponse`, `updateLastSession`, local weakness updates. Can filter by `practiceDomain`. | QuestionCard, ExplanationPanel, useFirebaseProgress (profile), useAdaptiveLearning, detectWeaknesses, distractor-matcher |
| **TeachMode**    | Review mode: questions from full assessment (wrong or all), teaching context, explanations. Updates `flaggedQuestions`. | QuestionCard, ExplanationPanel, NASP_DOMAINS, UserProfile |
| **ResultsDashboard** | “View Progress”: toggles Praxis sections vs NASP domains; shows domain scores and focus areas inside the shared light-shell visual treatment. | PraxisPerformanceView, NASP_DOMAINS, UserProfile |
| **StudyModesSection** | Practice hub: By Domain / By Skill / Learning Path entry, readiness strip, lock states, skill actions, and lesson-help entry points. | PROFICIENCY_META, skill-map, learning-path data |
| **StudyPlanCard** | Study Guide destination card: generation settings, generation status, plan history chips, and entry to the full viewer. | StudyConstraintsForm, StudyPlanViewer |

### 3.2 Shared UI

| Component           | Role |
|--------------------|------|
| **QuestionCard**   | Renders question stem, choices (multi-select support), confidence selector, submit/next. Source badge (bank/generated). Opens **ReportQuestionModal** for “report question”. |
| **ExplanationPanel** | Correct/incorrect rationale, key concepts. In practice, uses **DiagnosticFeedback** (generateDiagnosticFeedback) when `userProfile` is provided. |
| **DiagnosticFeedback** | Expandable diagnostic feedback (explanation, framework guidance, skill guidance, remediation). | 
| **ReportQuestionModal** | Report a question: targets, issue type, severity, notes. Submits via **useQuestionReports** to Supabase `question_reports`. |
| **DomainTiles**    | Grid of NASP domains; expand for details (from NASP_DOMAINS, SKILL_MAP, ETS content topics). “Start practice” → `onDomainSelect(domainId)`. |
| **PraxisPerformanceView** | Praxis sections (Professional Practices, Student-Level, Systems-Level, Foundations) with domain breakdown and performance labels. Uses `userProfile.domainScores`, `skillScores`, etc. |
| **ErrorBoundary**  | Catches errors (e.g. in score report), shows fallback or default “Something went wrong” with Try again / Go Home. |

### 3.3 Unused / legacy

| Component   | Status |
|------------|--------|
| **UserLogin** | Removed. Old localStorage-based “pick user” UI replaced by the current auth flow. |

---

## 4. Hooks

| Hook | Purpose |
|------|--------|
| **useFirebaseProgress** | Legacy-named hook backed by Supabase `user_progress`, `responses`, and `practice_responses`. Exposes `profile`, `updateProfile`, `updateSkillProgress`, `resetProgress`, `logResponse`, `updateLastSession`, `getAssessmentResponses`, `getLatestAssessmentResponses`, `savePracticeResponse`, `saveScreenerResponse`, and `isLoaded`. |
| **useAdaptiveLearning** | `selectNextQuestion(profile, questions, history)`: weakest skills, bank vs generated ratio, can call **question-generator** for generated questions. **Uses `profile.generatedQuestionsSeen` and `skill.attemptHistory`** – both removed or not populated (see Issues). |
| **useQuestionReports** | Submit and fetch question reports from Supabase `question_reports`. Used by `ReportQuestionModal`. |
| **useUserProgress** | Removed legacy localStorage hook. App uses `useFirebaseProgress`. |

---

## 5. Utils

| Module | Purpose |
|--------|--------|
| **sessionStorage** | Single assessment session: `AssessmentSession` (type, questionIds, currentIndex, responses, selectedAnswers, showFeedback, confidence, startTime). Key `praxis-assessment-session`. `saveSession`, `loadSession`, `clearSession`, `hasActiveSession`. |
| **userSessionStorage** | Per-user sessions in localStorage: `UserSession` (adds userName, sessionId, lastUpdated, createdAt). `createUserSession`, `getUserSessions`, `getCurrentSession`, `saveUserSession`, `getCurrentUser`, `setCurrentUser`, etc. Used with the signed-in Supabase user's display name/email for resume. |
| **assessment-builder** | **Used.** `buildFullAssessment(analyzedQuestions, options?)` – 125Q with Praxis distribution and exclusion. `buildScreener(analyzedQuestions, excludeIds)` – 50Q screener using SKILL_BLUEPRINT with CC enforcement and round-robin interleave. `buildAdaptiveDiagnostic(analyzedQuestions, excludeIds)` – **primary assessment path**: 45 initial questions (1 per skill) + follow-up pool of 1–2 per skill (45–90Q adaptive). Used by App.tsx. |
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
| **contexts/AuthContext** | Supabase Auth: user, loading, error; signInWithEmail, signUpWithEmail, resetPassword, logout, clearError. |
| **config/supabase** | Supabase client initialization for auth and data access. |

---

## 8. Data and content

- **knowledge-base.ts** (root) – NASP_DOMAINS (keyConcepts, mustKnowTerms, questionPatterns, commonMistakes, etc.). Single source for domain metadata in app.
- **src/data/questions.json** – Question bank (id, question, choices, correct_answer, rationale, skillId, etc.).
- **src/data/question-skill-map.json** – questionId → skillId (and confidence). Used by question-analyzer and useAdaptiveLearning.
- **src/data/ets-content-topics.json** – ETS structure. Used by DomainTiles.
- Other data: ets-sample-questions, mappings, flippable-distractors, discard-distractors, distractor-map, tagging-* – used by scripts or future features, not core app flow.

---

## 9. Supabase usage

- **`user_progress`** – Per-user profile row with completion flags, domain scores, skill scores, weakest domains, question IDs, last session, screener metadata, and auth tracking fields.
- **`responses`** – Shared answer-event table for screener, full assessment, and practice responses.
- **`practice_responses`** – Practice-specific write path used by `savePracticeResponse`; currently underused for reads.
- **`question_reports`** – User question reports and admin moderation state.
- **`beta_feedback`** – General feedback submitted from the app.

---

## 10. Data flow (high level)

- **Auth:** `AuthContext` reads the current Supabase session and App shows `LoginScreen` or the main app accordingly.
- **Assessments:** App builds screener/full question lists, persists session state in local storage, logs response events through `useFirebaseProgress`, and writes profile/session metadata to Supabase.
- **Reports:** ScoreReport reads lastAssessmentResponses (or App fetches via getAssessmentResponses(sessionId) for “View Report”).
- **Practice:** PracticeSession uses selectNextQuestion (useAdaptiveLearning), updateSkillProgress, logResponse, updateLastSession; updates profile and local weakness state.
- **Teach:** TeachMode uses profile and analyzed questions; on exit writes flaggedQuestions.

---

## 11. Issues found (legacy / missing fields)

> All three issues below have been **resolved** as of 2026-03-23.

1. ~~**ResultsDashboard** – Uses `userProfile.practiceHistory.length`.~~ **Resolved.** The `practiceHistory` reference has been removed from ResultsDashboard.
2. ~~**TeachMode** – Calls `onUpdateProfile({ practiceHistory: [...] })`.~~ **Resolved.** The `practiceHistory` write has been removed from TeachMode.
3. ~~**useAdaptiveLearning** – Uses `profile.generatedQuestionsSeen` (removed) and `skill.attemptHistory`.~~ **Resolved.** `generatedQuestionsSeen` reference removed. `attemptHistory` is declared optional in `SkillPerformance` and all consuming code (ResultsDashboard, skillTrend) includes proper null guards.

---

## 12. Scripts (src/scripts/)

Used for tooling, not at runtime in the app: analyze-coverage-gaps, blueprint-alignment, bottleneck-finder, capacity-test, coverage-audit, diagnostic-utils, distractor-audit, extract-distractors, feedback-quality-test, full-simulation, generate-categorization-report, generate-coverage-report, generate-crosswalk, learning-progression-test, question-counts, run-all-diagnostics, uniqueness-test. Root-level scripts (e.g. health-check.ts, generate-*.ts) are separate.

---

## 13. Tests

- **tests/adaptive-coaching.test.ts** – Adaptive coaching / question selection tests.

---

This overview reflects the codebase as of 2026-03-23. The three issues previously listed in §11 have been resolved. The adaptive diagnostic (`buildAdaptiveDiagnostic`) is the primary assessment path — see §5.
