# Decision & Review Register — 2026-06-10

**Purpose:** one consolidated list of everything that needs a **decision**, a **review/sign-off**, or
**routing to Claude Coworker** — pulled from `PHASE2_REVIEW_BACKLOG.md`, `PENDING_IDEAS.md`,
`PRODUCT_ROADMAP_2026-06-02.md`, the `HANDOFF_*` docs, and `ISSUE_LEDGER.md` so items stop hiding in
docs nobody reopens. Organized by **who is blocked**, not by topic.

> Status keys: 🔴 needs Carlos · 🟠 needs SME review · 🟣 → Coworker · 🔵 engineering (no decision) ·
> ⚫ cross-cutting blocker. "Rec" = my recommendation.

---

## A · 🔴 NEEDS YOUR DECISION (product owner)

| # | Decision | Why it's blocked on you | Rec | Source |
|---|---|---|---|---|
| A1 | **Deploy now or keep batching?** Nothing is live (Netlify `stop_builds=true`); all of Phase 0/1/2 is unshipped. | Manual deploy + you wanted reviews first (Call 5). | Do a **content-only Phase 2 deploy** once §B reviews clear — it's additive/low-risk — *before* the bigger product features. | PHASE2 backlog Call 5 |
| A2 | **Exam-weight ranking** — accept blueprint-faithful weights? This is the one change that alters *live* priority ranking. | Product call on whether ETS-blueprint weighting is the ranking signal you want. | **Accept** (anchored to official ETS 5403 category weights). | PHASE2 Call 2 |
| A3 | **"1,150 questions" claim** in tutorial/boot — keep the true count or drop the raw number for tone? | Verified true + doc-sanctioned; now a *preference*, not an honesty fix. | Keep it (it's real and a credible proof point). | Roadmap §A1 |
| A4 | **Retake / second-assessment scoring** — when a learner re-tests, do newly-passed skills *master*, or *average/weight-in*? Also gates the unbuilt "third full assessment." | Defines readiness re-check behavior; no code can proceed without the rule. | Needs a short design convo — I'll draft options. | Roadmap §C; Ledger 2026-03-14 (unlock flow open) |
| A5 | **Proficiency labels** (Emerging / Approaching / Demonstrating) — keep or rename? | They're the user-facing vocabulary; just freshly aligned across the app. | **Keep** (single source of truth in `skillProficiency.ts`). | Roadmap §H |
| A6 | **Study Notebook** reconception scope. | Open-ended; needs a target before mockup. | Park until glossary overhaul lands (shares plumbing). | Roadmap §G |
| A7 | **Engagement metric** — surface a user-facing card now, or keep backend-only until the correlation report proves it matters? | Product call on exposing engagement signals. | Backend-only first; surface after the admin correlation report. | Engagement handoff §7 |
| A8 | **Alert delivery** — in-app dashboard only, or later email/push? | Scope of the review-nudge system. | In-app only for v1. | Engagement handoff §7 |
| A9 | **NCSP wording in the bank** — `item_062`'s keyed answer calls NASP the "accreditation body for the NCSP credential" (real-world-imprecise: NCSP is *administered* via the NSPCB; programs are *accredited*). Fixing it means editing the **item's answer key**, not just the module. | Answer-key change = scoring impact; your call. | Low priority; fix item + module together if you want precision. | This session's verification |
| A10 | **Implementation-stage framework** — the bank is internally mixed: most items + MOD-D9-05 use Forman "Dissemination," a few use NIRN "Exploration." Pick one framework bank-wide. | Consistency decision across items + module. | Standardize on **Forman** (it's the app's cited source) and re-key the NIRN outliers. | This session's verification |
| A11 | **Multi-select questions** — add the ~27 MS items or formally retire that requirement? | Long-open product call on bank composition. | Retire the requirement unless MS is exam-critical. | Ledger 2026-03-23 (P3) |

---

## B · 🟠 NEEDS YOUR / SME REVIEW (sign-off on provisional work — don't let it ship as "final")

| # | Item | Risk if unreviewed | Source |
|---|---|---|---|
| B1 | **Prereq edges** (`skillPrereqGraph.ts`) — provisional first pass; drives "do X first" routing. | Mis-routes learners; acyclic + better than before, but unverified. | PHASE2 pending review |
| B2 | **Pack 4 `etsTopicIds`** — 22/67 modules fell back to skill-level routing (no specific objectives). | Coarser question/content routing for those modules. *(= menu item (a))* | PHASE2 pending review |
| B3 | **Misconception links** — 66/98 linked via distractor-overlap; spot-check precision + the LEG-S04→ETH-01 re-key home. | False matches surface wrong remediation. *(= menu item (b))* | PHASE2 pending review |
| B4 | **frameworkRegistry holdings/applicability text** — citations verified this stretch; the substantive legal *holdings* text still wants an SME read. | A wrong holding teaches wrong law. | PHASE2 remaining work |
| B5 | **~30 module wording notes** (minor) from the Pack 3 verification — low-severity imprecision. | Cosmetic; catalogued in the workflow output. | This session |

---

## C · 🟣 READY FOR COWORKER (content/SME-heavy, parallel, no architecture decision needed)

| # | Task | Scope | Notes |
|---|---|---|---|
| C1 | **Phase B `construct_actually_tested` regen** | **692 questions across 29 "collapsed" skills** — LLM context-fatigue reused 1–5 strings per file; need `construct_actually_tested` + `complexity_rationale` regenerated. | The ledger *explicitly* names this a Coworker multi-agent job. Workflow + batch script ready (`content-authoring/phase-B/PHASE-B-REGEN-WORKFLOW.md`). **Biggest single content debt.** |
| C2 | **Phase A misconception-text cleanup** | 47 items using generic framing instead of first-person belief format + 3 duplicate-distractor items. | Low priority; correction prompts already written. |
| C3 | **frameworkRegistry SME read** (B4 above) | Substance/holdings pass over 32 entries. | Could be Coworker if you have an SME; else stays a review item. |
| C4 | **Glossary citations** | Source citations for the 396 master-glossary terms. | Per `PENDING_IDEAS`, already spawned 2026-06-01 — **confirm status** before re-spawning. |

> Items (a)/(b) (= B2/B3) are SME-*judgment* but also need an engineering re-derive afterward — **hybrid**:
> Coworker (or you) proposes the mappings, engineering (me) re-runs the derive + parity tests.

---

## D · 🔵 ENGINEERING QUEUE (no decision needed — just sequencing)

| # | Task | Status / gate |
|---|---|---|
| D1 | **Vocab-registry consolidation** (Call 4) | Deferred on purpose — touches `studyPlanPreprocessor`, scoring-adjacent. Do alone, guarded by study-plan tests. |
| D2 | **Practice-surface shuffle consistency** (menu c) | Cosmetic/auditability — unify PracticeSession / LearningPathModulePage / Redemption onto `optionShuffle.ts`. Touches working code → confirm first. |
| D3 | **Track B (B3) presentation work** | Decision made (B3); scoring dedupe shipped (`cea4af9`). Remaining = reframe a repeated item as reinforcement (presentation only). |
| D4 | **Staged / simplified Study Guide** | ACTIVE per `PENDING_IDEAS`; mockup-first, not started. |
| D5 | **Glossary overhaul** (#1 product priority) | Big; fully designed (roadmap §B). Mockup-first + migration `0026`. |
| D6 | **Fluency Drill follow-ups** | select-all variant · vocab-feedback v2 · per-skill display names. |
| D7 | **Roadmap §C–§H workstreams** | Dashboard+test-date · Practice reorg · Progress "Full Report" tab · AI-Tutor flashcards · Study Notebook · smaller QA. |
| D8 | **Third full-assessment builder** | Defined but unbuilt; gated on **A4** decision. |
| D9 | **Phase 3 content** (PHASE2 backlog) | Exclusive modules for the ~30 skills without one · question-verification pass over machine items · reusable case bank. |

---

## E · ⚫ CROSS-CUTTING BLOCKERS / RISKS (affect everything above)

| # | Risk | Action needed |
|---|---|---|
| E1 | **Nothing is deployed** — `stop_builds=true`; manual deploy only. | Gated on **A1**. |
| E2 | **Unapplied migrations** — `0024_vocab_attempts` (flagged NOT applied), `0025_account_deletion_request` (verify), future `0026_glossary`. | Apply `0024`/`0025` to Supabase before their features can work in prod. |
| E3 | **1 moderate Dependabot vuln** on the default branch. | Triage `github.com/clebronrivera/PraxisMakesPerfect/security/dependabot/11`. |
| E4 | **Branch fragmentation** — Phase 2 lives on `claude/hopeful-benz-866a30`; activity/engagement + dashboard re-theme on `explore/dashboard-redesign`; `main` behind both. | Needs a **reconciliation/merge plan** before any coherent deploy. |
| E5 | **Product backlog is stale** — `PENDING_IDEAS` last updated 2026-06-01; prior audits found *some "remembered" features were mockup-only, never built*. | Run a **freshness pass** (verify built vs mocked) before trusting §D priorities. |
| E6 | **Skill/domain dual-model** — copy says "45 skills / 4 domains"; study-guide data layer once enumerated "52 skills / 10 NASP domains." | **Verify** this is the intentional progress-skills (45) vs metadata-skills distinction, not drift. Likely a non-issue — confirm + document. |
| E7 | **Health-check content warnings** (watch) — Generation Capacity / Distractor Audit / Blueprint Alignment. | Track; address with template/distractor/blueprint work, not shell code. |

---

## Recommended regroup sequence

1. **You spend ~15 min on Section A** (the 11 decisions). I can drive it as a checklist; A1/A4/A10 are the high-leverage ones.
2. **In parallel, dispatch Section C to Coworker** — C1 (692-question regen) is the biggest content debt and is purpose-built for it.
3. **I take Section B reviews** in priority order — start with **(a) Pack 4 etsTopicIds** or **(b) misconception precision** (both finish Phase 2 and unblock the deploy gate).
4. **Then E4 (branch reconciliation) + E2 (migrations)** so a Phase 2 deploy (A1) is actually coherent.
5. **Re-baseline §D** with an E5 freshness pass before committing to product-feature order.

_This register supersedes the scattered "open decisions" sections in the individual handoff docs for tracking purposes. Update statuses here instead of in those docs._
