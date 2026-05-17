# Phase 1C — Extract API Prompt Templates

## Goal

Move hardcoded "Praxis 5403" / "45 skills" / "4 domains" / domain-name strings out of `api/study-plan-background.ts` and `api/tutor-chat.ts` into per-test prompt templates with `{{handlebars}}`-style interpolation.

Verified hardcoded strings in `api/tutor-chat.ts` (per critique §3 verification):
- Line 234: `"You are PraxisBot, an AI study assistant for the Praxis 5403 (School Psychology) licensure exam."`
- Line 236: `"Only answer questions about Praxis 5403 content..."`
- Line 238: `"EXAM: 4 domains, 45 skills, single-select and multi-select questions."`
- Line 391: `"definitions should be 1–2 concise sentences in school psychology / Praxis 5403 context"`

`api/study-plan-background.ts` has analogous hardcoded references; full enumeration is part of step 1C.1's grep.

## Scope

### Allowed files
- `src/tests/PRAXIS_5403/prompts/study-plan-system.md` (new)
- `src/tests/PRAXIS_5403/prompts/tutor-system.md` (new)
- `src/tests/PRAXIS_5403/prompts/question-explainer.md` (new)
- `src/tests/PRAXIS_5403/index.ts` (wire prompts into the package)
- `api/study-plan-background.ts`
- `api/tutor-chat.ts`
- `api/_lib/loadTestPackage.ts` (new — server-side package loader)
- `api/_lib/interpolatePrompt.ts` (new — handlebars-style)

### Forbidden
- Validation changes (Phase 1B done)
- New tests (Phase 2A)

## Hard blockers

None.

## Steps

### 1C.1 Extract study-plan system prompt
Allowed: `src/tests/PRAXIS_5403/prompts/study-plan-system.md`, `api/study-plan-background.ts`
Acceptance:
- Prompt file uses `{{testName}}`, `{{skillCount}}`, `{{domainNames}}`, `{{readinessTarget}}`, etc.
- API endpoint loads prompt by `testId` (default `'PRAXIS_5403'` for back-compat with existing requests that don't yet send `testId`)
- Generated study plan is byte-identical to pre-1C (modulo whitespace) for the same input
Verification: generate a plan in dev:netlify, compare 9 sections to a stored snapshot.

### 1C.2 Extract tutor system prompt
Allowed: `src/tests/PRAXIS_5403/prompts/tutor-system.md`, `api/tutor-chat.ts`
Acceptance:
- Tutor responses unchanged
- Quiz mode still works
- Vocabulary artifact still generates with the right context
Verification: dev:netlify smoke — tutor quiz, vocabulary artifact download.

### 1C.3 Build server-side package loader
Allowed: `api/_lib/loadTestPackage.ts`, `api/_lib/interpolatePrompt.ts`
Acceptance:
- Reads packages from bundled imports (Netlify functions can't `await import()` from disk; they bundle at deploy time)
- The bundler resolves `@/tests/<TEST_ID>` imports into the function bundle
- Caches per-process
- Used by both endpoints
Verification: deploy to a Netlify branch preview; verify function logs show clean prompt loading; test plan + tutor end-to-end.

## Phase Exit Criteria

- No literal "Praxis 5403" / "45 skills" / "4 domains" / domain-name strings in `api/` (post-audit grep returns zero)
- Study plan + tutor smoke pass
- `STATE.md` updated to Phase 1D step 1D.1

## Rollback

Each prompt file extraction is one commit. If a prompt change degrades output quality, revert that commit; the API falls back to the prior hardcoded version (preserved in git).
