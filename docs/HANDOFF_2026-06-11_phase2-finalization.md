# Phase 2 Finalization — Execution Handoff (2026-06-11)

Branch: `claude/hopeful-benz-866a30` · Repo: `/Users/lebron/Documents/PMP-hopeful-benz`
Companion: [DECISION_REGISTER_2026-06-10.md](DECISION_REGISTER_2026-06-10.md) (the record of *why*) ·
[PHASE2_REVIEW_BACKLOG.md](PHASE2_REVIEW_BACKLOG.md) (Phase 2 state).
This doc is the **execution plan**: finalized decisions, phased, split into two parallel tracks.

---

## 0 · HOW TO USE THIS HANDOFF — read this first, every session (anti-drift)

> **This document is the single source of truth for finishing Phase 2.**
> 1. **Re-read this whole file at the start of every work session and after each completed task.** Do not work from memory.
> 2. **Work phases in order.** Never start a task whose dependency (⛔) is unmet.
> 3. **Update the Status box (☐ → 🔄 → ✅) here as you go**, in the same commit as the work.
> 4. **Run the gate green before every commit:** `npm run scan:types && npm run scan:colors && npm run lint && npm test && npm run build`.
> 5. **If reality diverges from this plan, fix this doc first, then proceed.** Do not let the plan drift.
> 6. **Respect the file lanes (§4).** Two tracks run in parallel; they must never edit the same file.

---

## 1 · Finalized decisions (stamped 2026-06-11 — "go with recommendations")

| # | Decision | FINAL CALL | Resulting action |
|---|---|---|---|
| A1 | Deploy timing | **One content-only Phase 2 deploy AFTER both tracks land + branch reconcile** | Track E, Phase E3 (last) |
| A2 | Exam weights | **Accept as-is** | None (optional: normalization assertion — E0) |
| A3 | "1,150" claim | **Use durable descriptive language ("1,000+"), drop the exact number** | Track E, E0 |
| A4 | Retake scoring | **Replace (latest-wins) + prefer-unseen questions** (see §2) | Track E, E1 (big) |
| A5 | Proficiency labels | **Keep** (Emerging/Approaching/Demonstrating) | None |
| A6 | Study Notebook scope | **Park** (design with the glossary overhaul) | Deferred |
| A7 | Engagement metric surface | **Backend-only first** | Deferred |
| A8 | Alert delivery | **In-app only (v1)** | Deferred |
| A9 | NCSP "accreditation body" | **Leave both module + `item_062` as-is** (only 1 item; common simplification) | None |
| A10 | Implementation framework | **Accept** (2 items, each self-names its model); **+1-line note to MOD-D9-05** | Track E, E0 (tiny) |
| A11 | Multi-select questions | **Retire the requirement** (bank has 0 MS items; not an ETS 5403 format) | Track E, E0 (docs) |
| B1 | Prereq edges | **Sign off — sound** (read all 45; only MBH-04←MBH-03 mildly arguable) | None |
| B2 | etsTopicIds fallback (22) | **Tighten opportunistically** (descriptive-only, never scored) | Hybrid (C proposes → E re-derives) |
| B3 | Misconception precision | **Trust as-is** (spot-checks were real matches; descriptive-only) | None (optional SME tighten) |
| E6 | 45-vs-52 skill model | **Confirmed intentional** (45 scored; rest are non-scored mapping entries) | Track E, E0 (document) |

---

## 2 · A4 — retake / reassessment spec (finalized)

The biggest engineering item. Finalized behavior:

- **Trigger (D8 unlock):** the third/final assessment unlocks when every tracked deficit skill reaches
  **≥ 60%** (the existing study-guide readiness-gate concept). Confirm/refine this gate when building.
- **Question selection:** **prefer UNSEEN** items per skill; when a thin skill's unseen pool is
  exhausted, **fall back to reuse** (reframed as before, dedupe prevents score inflation). This is
  consistent with the already-shipped Track B / B3 decision — **no hard reservation pool now.** Supply
  is sufficient for assessments alone even on the 20-question skills (~6 of 20 consumed across
  screener + diagnostic + retake); the thin-skill list is in §5.
- **Scoring:** **REPLACE (latest-wins)** — the retake **supersedes** the prior screener/diagnostic
  score for the skills it covers (it does NOT average with the stale first attempt). Practice continues
  to blend at its lower weight. "Supersede = replace the score," confirmed with the user.

> ### 🅿️ PARKED FUTURE THOUGHT — do NOT implement now (user, 2026-06-11)
> Revisit reassessment scoring later: build a comparison of what reassessments look like under
> **REPLACE (current decision)** vs **AVERAGING prior + retake**. Study the difference before ever
> switching. This is a deliberate pending design question, not current work — leave the implementation
> as latest-wins/replace.

---

## 3 · The two parallel tracks

### TRACK E — Engineering (run in a **new Claude Code chat**)
Status: ☐ not started · 🔄 in progress · ✅ done

| Phase | Task | Dep | Status |
|---|---|---|---|
| **E0** | A3: replace exact "1,150" with durable descriptive copy ("1,000+") in `LoginScreen.tsx` + tutorial + anywhere the count appears | — | ✅ |
| **E0** | A11: formally retire the multi-select requirement — update `ISSUE_LEDGER.md` (P3 item) + remove the stale "27 MS" framing; note 0 MS items, UI support stays | — | ✅ |
| **E0** | A10: add a 1-line note to MOD-D9-05 in `learningModules.ts` acknowledging both implementation frameworks (Forman/Dissemination here; Fixsen/NIRN/Exploration elsewhere) | — | ✅ |
| **E0** | E6: document the 45-scored-skills dual model in `HOW_THE_APP_WORKS.md` | — | ✅ |
| **E0** | A2 (optional): add a normalization-regression assertion to `derive-skill-exam-weights.mjs` | — | ✅ |
| **E1** | **A4/D8 retake build** per §2 — (a) latest-wins replace logic for assessment buckets in `globalScoreCalculator.ts`; (b) prefer-unseen selection in the assessment builder; (c) the third-assessment builder + unlock wiring + UI entry. Mockup-first for any new UI. | — | ✅ |
| **E1** | B2 re-derive: after Coworker proposes tighter etsTopicIds (C-side), re-run `derive-module-ets-topics.mjs` + parity test | ⛔ C-B2 | ✅ |
| **E1** | Expansion re-derive: after Coworker adds new questions, re-run the misconception + objective derives + parity | ⛔ C4 | ✅ |
| **E2** | Apply migrations `0024_vocab_attempts` + `0025_account_deletion_request` to Supabase; triage Dependabot vuln #11 | — | ✅ |
| **E3** | Branch reconciliation (`hopeful-benz` ↔ `explore/dashboard-redesign` ↔ `main`) **then** the batched content-only deploy (A1) | ⛔ E1, C-track | ☐ |

> **E2 completion note (2026-06-12):** Project `ypsownmsoyljlqhcnrwa` (PraxisMakesPerfect).
> `0024_vocab_attempts` + `0025_account_deletion_request` were **already applied** in a prior
> session (remote history versions `20260602192231` / `20260602192247`; `vocab_attempts` table +
> `miss_count` col + `increment_glossary_miss` fn + `deletion_requested_at` col all verified present).
> `0026_retake_complete` (from E1) **applied this session** and verified (`retake_complete bool default
> false`, `retake_completed_at timestamptz`). **Dependabot #11** (`ws` CVE-2026-45736, "uninitialized
> memory disclosure", medium, vulnerable `<8.20.1`): `ws@8.19.0` was a transitive dep of
> `@supabase/realtime-js` + `openai` (the latter used only by `scripts/generate-practice.ts`, kept).
> Fixed via `overrides: { "ws": "^8.20.1" }` → lockfile now resolves `ws@8.21.0`; closes on merge to
> default branch. (Used `npm install --package-lock-only` — node_modules is symlinked to a sibling
> clone and must not be mutated from this worktree.) **Out-of-scope advisories surfaced** (not E2):
> Supabase security linter flags `function_search_path_mutable` + anon-executable SECURITY DEFINER on
> `increment_glossary_miss` (mitigated by its `auth.uid()` owner-guard) — candidate for a follow-up
> hardening pass, tracked separately. **✅ RESOLVED (2026-06-12):** migrations `0027` (pin search_path
> on 5 fns) + `0028` (SECURITY DEFINER→INVOKER on 4 fns, closes the increment_*_count IDOR) were applied
> to the live DB; advisor `function_search_path_mutable` is cleared. The files were missing from the
> repo (DB↔repo drift) — checked in verbatim from the remote migration history (commit `9f4559f`).

### TRACK C — Content / SME (run on **Claude Coworker**, in parallel)

| Phase | Task | Dep | Status |
|---|---|---|---|
| **C1** | **692-question `construct_actually_tested` / `complexity_rationale`** — regen was already applied (commit 459442f, 2026-04-02): 100% unique, 0 templating, properly formatted. Remaining work was a **targeted cleanup**: rewrote 13 construct formatting outliers (5 banned-lead, 8 short) + resolved 148 `cognitive_complexity`↔rationale level disagreements (107 tags corrected, 45 rationales rewritten). Bank now 0 mismatches, 100% unique constructs. | — | ✅ |
| **C2** | misconception framing + duplicate distractors — **already resolved in live data** (verified 2026-06-12): all 3,430 real `distractor_misconception_*` fields use compliant "The student…" framing (100%), 0 within-question duplicates (item_039/item_221/item_072 differentiated), 0 generic filler. Fixed the one remaining sub-9-word item (`PQ_DBD-07_5` C). | ⛔ C1 (same file) | ✅ |
| **C3** | `frameworkRegistry.ts` holdings/applicability SME read (32 entries) — **done**. Legal content accurate across all 32; corrected one substantive holding (Endrew F. now leads with the controlling "progress appropriate in light of the child's circumstances" standard, rejecting "merely more than de minimis"). Flagged one citation issue (see log). | — | ✅ |
| **C-B2** | Tighter etsTopicId proposals for the 22 skill-fallback modules — **proposals delivered** (`docs/C-B2_etsTopicId_proposals_2026-06-12.md`): 11 tighten, 11 already optimal. All ⊆ `skillObjectiveMap[skill]`, 1–3 codes. **Awaiting Track E re-derive** (`derive-module-ets-topics.mjs` + `moduleEtsTopics` parity test). Coworker did not run the derive. | — | ✅ |
| **C4** | **Bank expansion — DONE** (2026-06-12). Floor-5: DBD-10, ACA-09, FAM-03, DIV-01, DIV-05 each 20→30 (+50). Remaining 5: DIV-03(21→30, +9), DBD-09(22→30, +8), PSY-01(22→30, +8), PSY-04(22→30, +8), FAM-02(22→30, +8) = **+41**. Bank **1,200→1,241**. Full tagging, manual objective entries (`verified:false`), keys off-B, adversarial-reviewed (5 per-skill refuters; 6 dup/precision fixes applied). Re-derives run (`--preserve-manual` + misconception). All 11 ≤22-Q skills now at 30. | ⛔ C1 | ✅ |

---

> **Track C progress log (Coworker)**
> - **C4 ✅ COMPLETE (2026-06-12, engineering session)** — the 5 queued skills authored: DIV-03/DBD-09/PSY-01/PSY-04/FAM-02
>   each lifted to 30 (+41 items, `PQ_<skill>_21..`). Bank **1,200→1,241**; all 11 ≤22-Q skills now at 30. Authored via
>   the append-only generator `scripts/content/c4-expand-five-skills.mjs` (off-B keys, ≥9-word misconceptions, manual
>   `verified:false` objective tags — 301 manual entries kept by `--preserve-manual`, 0 orphaned). Adversarial content
>   review (5 per-skill refuters): **0 keyed-answer/factual/multiple-correct errors**; 6 duplication/precision findings
>   fixed in the spec and regenerated (DIV-03_27 retargeted off eligibility, DIV-03_25 equity phrasing, DBD-09_26
>   "exosystem"→community label, PSY-04_25→language-of-administration, PSY-04_26→IDEA no-single-measure, FAM-02_22→
>   schoolwide-systems framing). Misconception derive re-run (227 linked). Gate green (271 tests, build).
> - **C-B2 ✅ proposals delivered (2026-06-12)**
> - **C4 🔄 Floor-5 done (2026-06-12)** — +50 verified items across DBD-10/ACA-09/FAM-03/DIV-01/DIV-05 (each 20→30),
>   bank 1,150→1,200. Full distractor/misconception/objective tagging; new-item keys placed off-B (≈4A/3C/3D each).
>   Objective-map parity kept via `method:"manual"` `verified:false` entries (engineering's seeder `--preserve-manual`
>   will keep them). **ENGINEERING (E1):** after these land, re-run the misconception + objective derives and the parity
>   tests; then the 50 new manual objective tags become the review queue. **Remaining C4:** 5 skills (~41 items) queued.
 — `docs/C-B2_etsTopicId_proposals_2026-06-12.md`. 11 modules tightened
>   (incl. differentiating the two CON-01 modules MOD-D2-02→I.B.1.b vs MOD-D2-03→I.B.1.c, and recovering II.B.2.f for
>   MOD-D4-11). **Engineering action (E1):** apply these as manual overrides + re-run derive-module-ets-topics + parity.
> - **C3 ✅ (2026-06-12)** — SME-reviewed all 32 framework holdings/applicability; legally accurate. Fixed Endrew F.
>   keyHolding to lead with the controlling standard. **FLAG (citations are out of C3 scope, marked verified):**
>   `FW-nasp-ethics-beneficence` cites NASP "Standard I.1 (Respecting the Dignity and Rights of All Persons)", but
>   beneficence/responsible caring sits under NASP Principle II (Professional Competence & Responsibility), not I.1 —
>   worth an engineering/SME citation check. Commit on `claude/hopeful-benz-866a30`.
> - **C2 ✅ (2026-06-12)** — The 47-framing + 3-duplicate debt was already applied; verified live data is 100%
>   compliant with 0 duplicates/filler. Only residual was one 8-word misconception (`PQ_DBD-07_5` C), now expanded
>   to a ≥9-word belief statement. Commit on `claude/hopeful-benz-866a30`.
> - **C1 ✅ (2026-06-12)** — Reality check: the 692-question regen was already applied and high quality;
>   C1 reduced to a targeted consistency cleanup (Carlos-approved). Two commits on `claude/hopeful-benz-866a30`:
>   `770cf9c` (13 construct formatting fixes) + `1fda02a` (148 cognitive_complexity↔rationale level alignments).
>   Net: bank Recall/Application tags 376/774 → 449/701; 0 remaining cc↔rationale mismatches. Gate green.
> - **FLAG for engineering/SME:** `item_056` has a construct/stem mismatch — stem asks about *fostering intrinsic
>   motivation* (answer: choice/autonomy) but `construct_actually_tested` describes *fixed-ratio reinforcement /
>   token economy*. Left as-is (outside the C1 consistency scope); flagging for a separate construct-accuracy fix.

> **E1 re-derive landing note (Engineering, 2026-06-12)** — Track C content bundle applied to
> `claude/hopeful-benz-866a30` (commits `770cf9c`…`16e671e`). Engineering work this pass:
> - **C4 expansion re-derive:** re-ran `derive-misconception-questions.mjs` (misconceptionQuestionMap +28/-7,
>   the 50 new items now linked) and `seed-question-ets-topics.mjs --preserve-manual` (260 manual entries kept,
>   0 verified tags wiped). objMap/moduleEtsTopicMap confirmed canonical (a stray 380-line reorder churn + 1
>   regression were reverted, keeping the Coworker's authored objMap).
> - **C-B2 re-derive:** added a persistent `SME_OVERRIDES` map to `derive-module-ets-topics.mjs` (+ fail-loud guard
>   on invalid codes). All 11 TIGHTEN proposals applied → `moduleEtsTopicMap.json` now 45 routed / 11 skill-fallback /
>   11 sme-override, 0 invalid; parity test extended to count `sme-override`. (The 11 KEEP modules were already optimal.)
> - **Flags fixed:** `item_056` construct rewritten to match the intrinsic-motivation stem; `FW-nasp-ethics-beneficence`
>   citation → NASP Principle II.
> - **Adversarial content review** (5 per-skill reviewers over the 50 new items + citation sweep + eng-fix check,
>   each finding default-refute verified): the 50 C4 items and all engineering fixes passed clean. The sweep caught
>   **3 more NASP miscitations** the C3 pass missed — `FW-nasp-ethics-confidentiality` (→ Principle I.2),
>   `-informed-consent` (→ Principle I.1), `-dual-relationships` (→ Principle III.4) — all corrected and verified
>   against the official NASP Principles. (`-records` → II.4 and `-practice-model` were already correct.)
> - Gate green (types, colors, lint, 267 tests, build). **C4 remainder:** 5 skills (~41 items) still queued (Track C).

## 4 · Parallelization, file lanes & branch strategy

**What runs in parallel from minute 0** (different files → safe):
- Track C **C1** (regen) ∥ Track E **E0** (finalize edits) ∥ Track E **E1** (A4 build). C1 edits
  `questions.json` *metadata fields*; A4 edits *code/logic* and only *reads* questions — no collision.

**Coordination points (NOT parallel — a track hands off to the other):**
- **C-B2 → E1 re-derive** (Coworker proposes etsTopicIds; Engineering runs the derive).
- **C4 → E1 re-derive** (Coworker adds questions; Engineering re-runs misconception/objective derives + parity). Schedule C4's apply for a window when Engineering can immediately re-derive.

**Sequential / last (after both tracks):** E3 branch reconcile + deploy.

**FILE LANES — do not cross:**
| Lane | Owner | Files |
|---|---|---|
| Content data | **Coworker** | `questions.json` (metadata fields), `frameworkRegistry.ts`, `learningModules.ts` *content* |
| Code / logic / derives | **Engineering** | everything in `src/utils`, `src/components`, `src/hooks`, `api/`, **all** `scripts/migrations/*` derive/seeder runs |

**Hard rules (from a past near-miss):**
- **Coworker NEVER runs a derive or seeder script.** Engineering owns every derive re-run + parity test.
  (A prior session's no-flag seeder re-run almost wiped 210 verified tags — see PHASE2 backlog.)
- Both tracks: **`git pull` before starting**, commit in **small logical chunks**, push often, gate green.
- If Coworker must touch `learningModules.ts` (A10 note is Engineering's; content deepening is Coworker's),
  coordinate so the two never edit it in the same window.

**Branch strategy:** Coworker commits content directly on `claude/hopeful-benz-866a30`. The new Claude
Code chat does Track E on a feature branch `feat/phase2-finalization` cut from `hopeful-benz`, merging
back at phase boundaries — keeps code churn out of Coworker's content commits.

---

## 5 · Reference — thinnest skills (for C4 expansion + A4 supply)

20 questions (floor): **DBD-10** Records Review · **ACA-09** Health Impact · **FAM-03** Interagency
Collaboration · **DIV-01** Cultural Factors · **DIV-05** Special Education Services.
22 or fewer: DIV-03 Bias (21) · DBD-09 Ecological Assessment (22) · PSY-01 Scores & Norms (22) ·
PSY-04 CLD Assessment (22) · FAM-02 Family Advocacy (22). Lifting all 11 ≤22-Q skills to 30 ≈ **+99 items.**

---

## 6 · Deferred (captured so it isn't lost — NOT in this push)

D1 vocab-registry consolidation (Call 4) · D2 shuffle consistency (menu c) · D3 Track B B3 "reframe
repeats" presentation · D4 Staged Study Guide · D5 Glossary overhaul (#1 product priority, migration
0026) · D6 Fluency Drill follow-ups · D7 roadmap §C–§H · Phase-3 exclusive modules for the ~30 skills
without one · post-diagnostic skill-tile color map idea (PENDING_IDEAS) · A6/A7/A8 product stances above.

---

## 7 · Paste-ready launch prompts

### 7a — COWORKER (paste into Claude Coworker)

```
You're doing the CONTENT / SME work for Phase 2 finalization of "Praxis Makes Perfect" (a school-
psychology exam-prep app). A parallel engineering session handles code; you handle content only.

REPO/BRANCH: work on claude/hopeful-benz-866a30 (locally /Users/lebron/Documents/PMP-hopeful-benz).
`git pull` first. Commit in small logical chunks; `git push origin claude/hopeful-benz-866a30`.

READ FIRST, AND RE-READ AT THE START OF EVERY SESSION AND AFTER EACH TASK:
docs/HANDOFF_2026-06-11_phase2-finalization.md  (the plan — work it IN ORDER, update the Track C status
boxes as you go, do not drift). Also docs/PHASE2_REVIEW_BACKLOG.md for context.

GOLDEN RULES: skill is the scored unit, objectives are descriptive (objectiveBoundaryGuard test); cool
indigo/violet palette only; module ids stable (add, never rename). FILE LANE: you edit content data
only (questions.json metadata fields, frameworkRegistry.ts, learningModules content). YOU NEVER RUN A
DERIVE OR SEEDER SCRIPT — hand etsTopicId / new-question work to engineering to re-derive. After any
change run the gate green before committing:
  npm run scan:types && npm run scan:colors && npm run lint && npm test && npm run build

YOUR TASKS, IN ORDER (see the handoff §3 Track C for detail):
1. C1 — regen construct_actually_tested for the 692 collapsed-skill questions
   (content-authoring/phase-B/PHASE-B-REGEN-WORKFLOW.md; variety ≥80% before apply). BIGGEST ITEM.
2. C2 — fix 47 misconception-text framing items + 3 duplicate distractors.
3. C3 — SME read of frameworkRegistry.ts holdings/applicability (32 entries).
4. C-B2 — propose tighter etsTopicIds for the 22 skill-fallback modules; hand the proposals to
   engineering (do NOT run the derive).
5. C4 — expand the thinnest skills (handoff §5) to ~30 Q each (~99 verified items, full tagging,
   balanced answer keys). Tell engineering when applied so they re-derive.

When you finish a chunk: gate green, commit, push, update the handoff status box, tell Carlos.
```

### 7b — NEW CLAUDE CODE CHAT (paste to start the engineering track)

```
Engineering track for Phase 2 finalization of Praxis Makes Perfect. A parallel Coworker session is
doing content; you do code/logic only.

Work in /Users/lebron/Documents/PMP-hopeful-benz. Cut a branch feat/phase2-finalization from
claude/hopeful-benz-866a30.

READ FIRST, AND RE-READ AT THE START OF EVERY SESSION AND AFTER EACH TASK:
docs/HANDOFF_2026-06-11_phase2-finalization.md. Work the Track E phases IN ORDER, respect ⛔ deps,
update the Track E status boxes in the same commit, and DO NOT let the plan drift. The finalized
decisions are in §1; the A4 spec (replace + prefer-unseen) and the PARKED averaging-vs-replace thought
are in §2 — implement replace/latest-wins, do NOT build averaging.

FILE LANE: you own src/ code, api/, and ALL derive/seeder runs. Do not edit questions.json content
fields or frameworkRegistry content (Coworker's lane). Gate green before every commit:
  npm run scan:types && npm run scan:colors && npm run lint && npm test && npm run build
Mockup-first for any new UI (CLAUDE.md). Update docs/HOW_THE_APP_WORKS.md when user-facing behavior changes.

PHASES (handoff §3 Track E):
- E0 (no deps, do first): A3 descriptive copy; A11 retire MS requirement (docs); A10 MOD-D9-05 note;
  E6 document the 45-skill dual model; A2 optional normalization assertion.
- E1: A4/D8 retake build (replace logic + prefer-unseen selection + 3rd-assessment builder/unlock/UI).
  Then the re-derives gated on Coworker's C-B2 and C4 handoffs.
- E2: apply migrations 0024 + 0025 to Supabase; triage Dependabot vuln #11.
- E3 (last): branch reconciliation (hopeful-benz / explore-dashboard-redesign / main) + the batched
  content-only Phase 2 deploy.
```

---

_Status legend: ☐ todo · 🔄 in progress · ✅ done. Keep this file current — it is the contract between the two tracks._
