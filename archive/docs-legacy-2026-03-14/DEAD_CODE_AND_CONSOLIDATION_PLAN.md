# Dead Code & Consolidation Plan

This plan identifies unused code, duplicate logic, and consolidation opportunities in the PraxisMakesPerfect codebase. Use it as a checklist; verify each item before removing or changing code.

---

## 1. Confirmed dead or unused (candidates for removal)

### 1.1 Components

| Item | Location | Evidence |
|------|----------|----------|
| **UserLogin** | `src/components/UserLogin.tsx` | Not imported anywhere. `FIREBASE_SETUP_COMPLETE.md` states it was replaced by Firebase/LoginScreen. |

**Action:** Remove `UserLogin.tsx` after confirming no dynamic imports or string references.

### 1.2 Hooks

| Item | Location | Evidence |
|------|----------|----------|
| **useUserProgress** | `src/hooks/useUserProgress.ts` | Not imported by any component or App. App uses `useFirebaseProgress` instead. Still referenced in ARCHITECTURE.md and FIREBASE_SETUP_COMPLETE. |

**Action:** Either delete the hook and update docs, or keep it only for tests/local fallback and document that clearly.

### 1.3 Utils / brain

| Item | Location | Evidence |
|------|----------|----------|
| **assessment-selector** | `src/utils/assessment-selector.ts` | Exports `buildFullAssessment` but no file imports it. App uses `buildFullAssessment` from `src/utils/assessment-builder.ts` only. |
| **brain/assessment-builder** | `src/brain/assessment-builder.ts` | Not imported anywhere. Builds assessments from *generated* questions (question-generator). App uses `utils/assessment-builder.ts` which builds from the static question bank. |

**Action:**  
- Remove `src/utils/assessment-selector.ts` if its logic is fully superseded by `utils/assessment-builder.ts` (compare distribution logic first).  
- For `brain/assessment-builder.ts`: either remove if generated-question full assessments are not used, or keep and add a single import path (e.g. from a script or a future “generated exam” feature) and document.

---

## 2. Duplicate or overlapping logic (consolidate)

### 2.1 Two “build full assessment” implementations

- **`src/utils/assessment-builder.ts`** – Used by App. Builds 125-question assessment from question bank using Praxis distribution and availability caps.  
- **`src/utils/assessment-selector.ts`** – Unused. Also has `buildFullAssessment` with domain balancing (largest-remainder style).

**Action:**  
1. Compare distribution rules and options (e.g. `excludeQuestionIds`, `minPerDomain`).  
2. If they are redundant, keep one (e.g. `utils/assessment-builder.ts`) and delete the other.  
3. If assessment-selector has useful behavior (e.g. different balancing), merge that into assessment-builder and then remove assessment-selector.

### 2.2 Session storage: two modules, similar shapes

- **`src/utils/sessionStorage.ts`** – Single assessment session: `AssessmentSession` (type, questionIds, currentIndex, responses, etc.), key `praxis-assessment-session`.  
- **`src/utils/userSessionStorage.ts`** – Per-user sessions: `UserSession` (same shape plus `userName`, `sessionId`, `createdAt`), multiple keys per user.

Both are used: App uses `sessionStorage` (loadSession, hasActiveSession, clearSession) and `userSessionStorage` (createUserSession, UserSession). PreAssessment and FullAssessment use both.

**Consolidation options:**  
1. **Shared types:** Define a single “session payload” type (e.g. in `sessionStorage.ts` or a small `sessionTypes.ts`) and have both modules use it to avoid drift.  
2. **Single module:** If after Firebase migration you only need one of these (e.g. only userSessionStorage for “resume”), consider one module with a “current session” vs “list of user sessions” API and deprecate the other.  
3. **Document:** At minimum, add a short comment in both files explaining when to use which (e.g. “anonymous in-memory session” vs “per-user saved sessions”).

---

## 3. Session storage vs Firebase

App uses both localStorage session utilities and Firebase (`useFirebaseProgress`, `updateLastSession`, `getAssessmentResponses`). Migration runs once (`migrateFromLocalStorage`).

**Action:**  
- Decide whether localStorage session is still required for unauthenticated or offline flows.  
- If not, you can eventually remove or narrow usage of `sessionStorage` / `userSessionStorage` and rely on Firebase only, then consolidate as in §2.2.

---

## 4. Root-level and one-off scripts

Many `.ts` files at repo root look like one-off or ad-hoc scripts (generation, conversion, audits). They clutter the root and are easy to forget.

**Root-level script-like files (examples):**

- `output-content-topic-questions.ts`  
- `generate-visual-tree.ts`  
- `generate-gap-questions.ts`  
- `question-format-converter.ts`  
- `sync-question-ids.ts`  
- `regenerate-distractors.ts`  
- `generate-hierarchy-tree.ts`  
- `export-flagged-questions.ts`  
- `deduplicate-questions.ts`  
- `health-check.ts`  
- `test-question-generation.ts`  
- `apply-approved-tags.ts`  
- `question-quality-analyzer.ts`  
- `question-quality-fixer.ts`  

**Action:**  
1. For each script: run it once or read its purpose; if still needed, move to `scripts/` (or `tools/`) and add a one-line README or comment.  
2. If a script is obsolete (e.g. one-time migration), delete it or move to an `archive/` or `scripts/archive/` folder.  
3. Prefer a single entry point (e.g. `scripts/run-all-diagnostics.ts`) for recurring diagnostics rather than many root-level files.

---

## 5. Knowledge base location

- **Used in app:** `./knowledge-base` (root-level `knowledge-base.ts`) – NASP_DOMAINS.  
- **ARCHITECTURE.md** mentions `src/brain/knowledge-base.ts` and `src/data/` (e.g. nasp-domains.json).

**Action:**  
- Confirm there is no duplicate `src/brain/knowledge-base.ts` or `src/data/nasp-domains.json` that shadows the root.  
- If the single source of truth is root `knowledge-base.ts`, update ARCHITECTURE.md to match and avoid future duplicate data.

---

## 6. Verification steps before deleting

1. **Search for imports and string refs**  
   - `grep -r "UserLogin\|useUserProgress\|assessment-selector\|assessmentSelector" --include="*.ts" --include="*.tsx" .`  
   - Confirm no dynamic imports (e.g. `import(\`./${name}\`)`) reference the removed module.

2. **Build and test**  
   - `npm run build`  
   - Run tests (e.g. `tests/adaptive-coaching.test.ts` and any other suites).  
   - Manually run: login → pre-assessment → full assessment → practice → resume.

3. **Session behavior**  
   - After any session-storage change: test “Resume” and “Start New” with and without login to ensure no regressions.

---

## 7. Suggested order of work

1. **Low risk:** Remove `UserLogin.tsx`; add comments to `sessionStorage` vs `userSessionStorage` and to `useUserProgress` (or remove it and update docs).  
2. **Compare and consolidate:** assessment-selector vs assessment-builder; then remove dead one.  
3. **Decide:** Keep or remove `brain/assessment-builder.ts` based on whether you use generated-question full assessments.  
4. **Organize scripts:** Move root-level `.ts` scripts into `scripts/` (or archive) and document.  
5. **Optional:** Unify session types and/or reduce to one session module once Firebase/localStorage strategy is final.

---

## 8. Quick reference – what’s used from where

| Consumed by | sessionStorage | userSessionStorage | assessment-builder (utils) |
|------------|----------------|--------------------|----------------------------|
| App.tsx    | loadSession, hasActiveSession, clearSession, AssessmentSession | createUserSession, UserSession | buildFullAssessment |
| PreAssessment | saveSession, loadSession, clearSession, AssessmentSession | getCurrentUser, getCurrentSession, saveUserSession, UserSession | – |
| FullAssessment | saveSession, loadSession, clearSession, AssessmentSession | getCurrentUser, getCurrentSession, saveUserSession, UserSession | – |
| useUserProgress | clearSession | – | – |

- **assessment-selector:** no imports.  
- **brain/assessment-builder:** no imports.  
- **UserLogin:** no imports.  
- **useUserProgress:** no imports (App uses useFirebaseProgress).
