# Incidental Findings — 2026-04-09

Issues discovered during the prerequisite cleanup that are **outside the scope** of this task. Listed here for future triage — no action was taken.

---

## 1. `audit:bank` script has a broken import

- **Script:** `scripts/audit-question-bank.ts` (invoked via `npm run audit:bank`)
- **Error:** `ERR_MODULE_NOT_FOUND: Cannot find module '/Users/lebron/Documents/PraxisMakesPerfect/knowledge-base'`
- **Cause:** The script imports a `knowledge-base` module that does not exist at the expected path. This is a pre-existing issue unrelated to the April 2026 changes.
- **Impact:** The bank audit script cannot run. Manual `jq` verification was used as a substitute during this cleanup.
- **Suggested fix:** Update the import path in `scripts/audit-question-bank.ts` to point to the correct module location, or remove the dependency if it is no longer needed.

---

## 2. `rebuildProgressFromResponses.ts` applies single-row confidence to all history slots

- **File:** `src/utils/rebuildProgressFromResponses.ts`, lines 94–104
- **Issue:** When skill scores are rebuilt after an admin reset, the code constructs `recentAttempts` from `newHistory` (a boolean array of only the last 5 correct/wrong results) and applies the **single current row's confidence** to all 5 slots. This conflates the confidence from one response onto all 5 recent outcomes.
- **Impact:** Only affects the admin reset path (`POST /api/admin-reset-assessment`), not the normal play path. After an admin reset, the reconstructed `weightedAccuracy` for affected skills will be slightly inaccurate because all 5 history entries share the same confidence value instead of their original per-answer confidence.
- **Suggested fix:** Either reconstruct per-answer confidence from the `responses` table (which stores `confidence TEXT` per row), or accept the lossy re-computation as a known limitation of the admin reset flow and document it.
