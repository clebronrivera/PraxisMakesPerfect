# Study Guide — Architecture Handoff

**Date:** 2026-06-01 · **Branch:** `explore/dashboard-redesign` · **Audience:** an outside study-guide / curriculum expert reviewing how the guide is built, where its content comes from, and whether the pedagogy is sound.

> **How to read this.** This documents the study guide **exactly as it ships today** — not a proposal. Every claim is cited as `file:line`. Section 10 lists the discrepancies and open questions an expert should weigh in on. A separate, *tabled* redesign mockup exists (`public/mockup-study-guide-staged.html`) but is **not** what this describes.

---

## 1. TL;DR (read this first)

- The "Study Guide" the user opens is a **3-tab wrapper**: **Platform Guide** (static how-to), **Your Study Plan** (the AI-personalized plan), **Vocabulary** (link to Term Sprint). Most of this doc is about tab 2.
- The personalized plan ("Your Study Plan") is a **single AI-generated document** (`StudyPlanDocumentV2`) rendered across **6 sub-tabs** (Overview · Priorities · Domains · Concepts · Weekly · Milestones).
- It is produced by a **3-layer pipeline**: (1) **deterministic preprocessing** in the browser computes all the *numbers and structure*; (2) **static metadata** supplies the *factual content* (vocabulary, misconceptions, case archetypes); (3) **one Claude API call** writes only the *prose* (interpretation, "why it matters", weekly task wording). The model is explicitly **forbidden** from changing scores, skill statuses, time allocations, session types, or inventing facts/links.
- It **does use an API**: a **Netlify Background Function** (`api/study-plan-background.ts`) that calls Anthropic once (`claude-sonnet-4-20250514`, `max_tokens: 12000`, `temperature: 0.2`), writes the result to Supabase, and the browser **polls Supabase** for it. **Rate limit: 1 successful generation per 7 days**, enforced client- and server-side.
- **Differentiation is high and per-user**, driven by the student's own assessment responses — but it is *re-generated on demand*, not continuously updated.
- ⚠ **Two skill/domain models coexist.** User-facing copy says **"45 skills across 4 domains"**; the study-guide data layer actually enumerates **52 skills across 10 NASP domains**. See §10.

---

## 2. What the user actually sees

### 2.1 Outer wrapper — `StudyGuideTabWrapper` (`App.tsx:78-194`)
Three top-level tabs ([App.tsx:94-98](App.tsx:94)):

| Tab | Content | Source |
|---|---|---|
| **Platform Guide** | A static 6-card "how to use the platform" grid (Adaptive Diagnostic, Learning Path, Term Sprint, Spaced Review, Redemption Rounds, AI Tutor). Hard-coded copy. | [App.tsx:138-166](App.tsx:138) |
| **Your Study Plan** | The personalized AI plan. Renders `<StudyPlanCard>` (lazy-loaded), which holds generation state and, once a plan exists, the `StudyPlanViewer`. | [App.tsx:168-179](App.tsx:168) |
| **Vocabulary** | A short blurb + button that routes to the Glossary / Term Sprint. No plan data. | [App.tsx:181-191](App.tsx:181) |

Default tab = `plan` if the user already has a plan, else `platform` ([App.tsx:90-92](App.tsx:90)).

The whole guide renders inside the app's **dark "atelier" shell** (`study-guide` ∈ `ATELIER_MODES`, [App.tsx:207-210](App.tsx:207)).

### 2.2 Generation surface — `StudyPlanCard` (`src/components/StudyPlanCard.tsx`)
This is the gate between "no plan" and "plan". It renders:
- A **Generate / Regenerate** button; label is `Generating…` / `Regenerate` (if a plan exists) / `Generate study guide` ([StudyPlanCard.tsx:54-58](src/components/StudyPlanCard.tsx:54)).
- A **study-constraints panel** (`settingsOpen`) the user fills before generating (test date, study days/week, session length, intensity) — these feed the deterministic time budget.
- Disabled states + a `!canGenerate` explainer block + an `isGenerating` progress block ([StudyPlanCard.tsx:79-148](src/components/StudyPlanCard.tsx:79)).
- `canGenerate` is passed down from the main component ([App.tsx:362](App.tsx:362), [App.tsx:1629](App.tsx:1629)); it gates on assessment completeness and the 7-day rate limit.

### 2.3 The plan itself — `StudyPlanViewer` (`src/components/StudyPlanViewer.tsx`)
A **pure presentation component** — it receives a `StudyPlanDocumentV2` and renders **6 sub-tabs** ([StudyPlanViewer.tsx:103-112](src/components/StudyPlanViewer.tsx:103)):

| Sub-tab | Renders | V2 fields read |
|---|---|---|
| **Overview** (`TabOverview`, L198) | Readiness ring + data-pattern insights | `readinessSnapshot`, `dataInterpretation` |
| **Priorities** (`TabPriorities`, L258) | Urgency-ranked skill clusters + tactical actions | `priorityClusters`, `tacticalInstructions` |
| **Domains** (`TabDomains`, L385) | Per-domain deep dive | `domainStudyMaps` |
| **Concepts** (`TabConcepts`, L511) | Vocabulary + case-pattern recognition | `vocabulary`, `casePatterns` |
| **Weekly plan** (`TabWeekly`, L609) | Week-by-week sessions | `weeklyStudyPlan` |
| **Milestones** (`TabMilestones`, L695) | Checkpoint/monitoring logic | `checkpointLogic` |

> The "9 sections" you may see referenced = the **9 top-level fields** of `StudyPlanDocumentV2`; the **6 tabs** are how they're grouped for the user. (`tacticalInstructions` rides under Priorities; `dataInterpretation` under Overview; `casePatterns` under Concepts.)

The viewer has **no generation logic and no unlock logic** — it only renders a plan it's handed. Empty-field fallbacks exist per section (e.g. "No vocabulary entries were generated." [StudyPlanViewer.tsx:535](src/components/StudyPlanViewer.tsx:535)).

---

## 3. Is it differentiated? (Yes — heavily, per student)

All of the following branch on the **individual's own data**:

- **Readiness level** → 4-way visual + framing: `early / developing / approaching / ready` ([StudyPlanViewer.tsx:73-82](src/components/StudyPlanViewer.tsx:73)).
- **Cluster urgency** → `urgent_now / important_next / maintain` styling + labels ([StudyPlanViewer.tsx:47-71](src/components/StudyPlanViewer.tsx:47)).
- **Per-skill status** → 6-state badge: `unlearned / misconception / unstable / developing / near_mastery / mastered` ([StudyPlanViewer.tsx:36-45](src/components/StudyPlanViewer.tsx:36)).
- **Domain score thresholds** → color-coded ≥80 / ≥60 / <60 ([StudyPlanViewer.tsx:391-395](src/components/StudyPlanViewer.tsx:391)).
- **Narrative** → `whyItMatters`, `interpretation`, `nextBestMove`, `majorBlockers`, etc. are all student-specific prose.

**Important nuance:** the plan is a **point-in-time snapshot**, regenerated on demand (max once / 7 days). It does **not** live-update as the student practices afterward.

---

## 4. The 3-layer pipeline — where every data point comes from

```
Browser (studyPlanService.ts)                         Netlify fn (study-plan-background.ts)
┌─────────────────────────────────────────┐           ┌──────────────────────────────────┐
│ LAYER 1  Deterministic preprocessing     │           │  Single Claude call (synthesis)  │
│   studyPlanPreprocessor.ts               │  prompt   │  - writes prose ONLY             │
│   → skill states, statuses, trends,      │ ───────►  │  - forbidden to change numbers   │
│     urgency, clusters, time budget,      │  (HTTP)   │  - forbidden to invent facts     │
│     weekly schedule FRAME (types+mins)   │           │  → returns 9-section JSON        │
│                                          │           └──────────────┬───────────────────┘
│ LAYER 2  Static content retrieval        │                          │ writes plan_document
│   skill-metadata-v1.ts (+ taxonomy)      │                          ▼
│   → vocabulary, misconceptions,          │           ┌──────────────────────────────────┐
│     case archetypes, laws/frameworks     │  poll ◄── │  Supabase  study_plans table     │
│   bundled INTO the prompt                │  (4s)     └──────────────────────────────────┘
└─────────────────────────────────────────┘
```

### LAYER 1 — Deterministic preprocessing (`src/utils/studyPlanPreprocessor.ts`) — *no AI*
Computes everything quantitative. Thresholds are constants in `src/types/studyPlanTypes.ts`:

- **Skill status (hard thresholds):** `<3 attempts → unlearned`; `≥3 attempts & accuracy <60% & (confidence-issue OR repeated-distractor) → misconception`; `≥80% → mastered`; `≥60% → near_mastery`; `≥40% → developing`; else `unstable`.
- **Trend:** needs ≥6 attempts; ±15 percentage-point swing between first and second half → `improving`/`declining`, else `flat`/`insufficient_data`.
- **Confidence signals:** `confidenceIssue` (high-confidence wrong answer), `repeatedDistractorPattern` (same wrong letter ≥2×), `fragilityFlag` (correct-but-low-confidence on ≥50% of last 6).
- **Urgency score:** weighted sum of status + trend penalty + confidence boost + fragility + accuracy gap.
- **Clusters:** active skills grouped by their `contentCluster`, sorted by urgency; cluster urgency derived from member statuses.
- **Time budget:** weeks-to-test × (study days/week, session length, intensity) → minutes, split **50% urgent / 35% next / 15% maintain**, distributed across clusters.
- **Weekly schedule FRAME:** per-week cluster focus + per-session **type and duration are fixed here** (`vocabulary / concept-review / case-practice / mixed-retrieval / wrong-answer-review`). The AI cannot change these.

### LAYER 2 — Static content retrieval (`src/data/skill-metadata-v1.ts`) — *no AI*
Per skill, supplies the factual raw material the model is allowed to use:
- `vocabulary` (3–6 terms/skill), `commonMisconceptions` (2–3), `caseArchetypes` (2–3), `lawsFrameworks` (0–3).
- Deduped + capped before prompting (≈20 vocab / 15 misconceptions / 12 cases / 8 laws per cluster).
- Misconceptions are cross-referenced to a canonical taxonomy (`src/data/misconception-taxonomy.ts`) for stable IDs.
- Supporting data files: `master-glossary.json` (396 terms, editorial reference), `misconception-taxonomy.ts`, `skill-phase-d.json` (NASP domain + prerequisite narratives), `skill-vocabulary-map.json`, `question-skill-map.json`.

### LAYER 3 — Model synthesis (`buildPromptV2` in `src/services/studyPlanService.ts:229-433`)
The browser builds one big prompt = **instructions + the Layer-1/Layer-2 payload**, and the Netlify function sends it to Claude. The model is told:
- **Forbidden:** re-narrating scores; inventing links/books/resources; changing session types/durations/cluster structure; using vocabulary/misconceptions/cases not in the provided lists; duplicating content across sections.
- **Required when signals present:** flag fragile skills ("answers correctly but self-rates low confidence"), name the `dominantMisconception` verbatim, call out error-cluster patterns (3+ misses) by tag, surface `misconceptionSkillCount > 3` in urgent insights, lead vocabulary with `topAtRiskVocabulary`.
- **Writes:** `summary`, `interpretation`, `whyItMatters`, `weekGoal`, session `focus`/`tasks`, `checkpointLogic`, etc.

---

## 5. Field-by-field provenance (condensed)

Legend: 🟦 deterministic preprocessor · 🟩 static metadata · 🟨 AI-written.

| Section | Field | Source |
|---|---|---|
| readinessSnapshot | readinessLevel, summary, blockers, strongestArea, nextBestMove | 🟨 (reasoned from 🟦 inputs) |
| dataInterpretation | headline, patterns[], urgentInsights[] | 🟨 |
| priorityClusters | clusterName, urgency, skills[], allocatedMinutes | 🟦 |
| priorityClusters | whyItMatters, blockingNote, recommendedContentTypes | 🟨 |
| domainStudyMaps | domainId, domainName, domainScore | 🟦 |
| domainStudyMaps | keyVocabulary, caseTypesToRecognize | 🟩 (filtered by 🟨) |
| domainStudyMaps | interpretation, contentToKnow, commonTraps, masteryIndicator | 🟨 |
| vocabulary | term | 🟩 (ordered by 🟦 risk) |
| vocabulary | plainDefinition, whyItMatters, whereItShowsUp, confusionRisk | 🟨 |
| casePatterns | (all fields) | 🟨 (seeded by 🟩 archetypes) |
| weeklyStudyPlan | weekNumber, datesLabel, clusterFocus, allocatedMinutes, session type+duration | 🟦 (**fixed**) |
| weeklyStudyPlan | weekGoal, session focus, session tasks, checkpointQuestion | 🟨 |
| tacticalInstructions | immediateActions, thisWeekGoals, avoidList | 🟨 |
| checkpointLogic | week2Check, midpointAssessment, shiftSignal, readinessSignal | 🟨 |

**One-line takeaway for the expert:** *numbers, statuses, time, and structure are code; facts are a curated static bank; only the wording and clinical interpretation are AI.* If the pedagogy of the **thresholds, the 50/35/15 split, the session-type mapping, or the static content bank** is wrong, that's a code/data fix — not a prompt fix.

---

## 6. The API — exact call flow

1. **Trigger.** Browser POSTs to `/api/study-plan-background` (rewritten to `/.netlify/functions/study-plan-background` via `netlify.toml`), `Authorization: Bearer <user JWT>`, body = `{ userId, prompt, sourceSummary, requestedAt, preComputedAddons }`. Falls back to the `/.netlify/functions/...` path on 404/405. (`studyPlanService.ts` request builder.)
2. **Background function** (`api/study-plan-background.ts`): it's a **Netlify Background Function** — returns **202 immediately**, runs up to 15 min, returns no result body.
   - Verifies the JWT with the **anon key** via `auth.getUser()` (no service-role key needed); DB write uses a **user-scoped client** so RLS `auth.uid() = user_id` is satisfied ([study-plan-background.ts:30-49](api/study-plan-background.ts:30)).
   - **Server-side rate check** (§7).
   - **One Anthropic call** ([study-plan-background.ts:175-189](api/study-plan-background.ts:175)): `model: claude-sonnet-4-20250514`, `max_tokens: 12000`, `temperature: 0.2`, single user message = the prompt.
   - Strips markdown fences, parses JSON, **validates all 9 sections present** (else HTTP 502).
   - Assembles `{ schemaVersion:'2', ...plan, generatedAt, model, sourceSummary, studyConstraints }` and **inserts one row** into Supabase `study_plans.plan_document` (JSONB). On insert failure, writes a `{ error:true }` row.
3. **Delivery by polling** (`studyPlanService.ts`): browser polls `study_plans` **every 4s** (`BACKGROUND_POLL_INTERVAL_MS = 4000`) for up to **4 min** (`BACKGROUND_POLL_TIMEOUT_MS = 240_000`), filtering `created_at > requestedAt`, newest first. On a parseable v2 row → returns the document; on timeout → throws.
4. **Render.** `normalizeStudyPlanDocument` requires `schemaVersion === '2'`; old v1 plans normalize to `null` → UI prompts a regenerate.

---

## 7. Rate limiting (1 / 7 days, two layers)

- **Client** (`studyPlanService.ts` ~L768): if any `study_plans` row exists in the last 7 days, throw a friendly "already generated this week" with the next-available date *before* calling the API.
- **Server** (`study-plan-background.ts` ~L133): looks at the last 5 rows in 7 days, counts only **successful** ones (`plan_document.error !== true && schemaVersion === '2'`); if found, returns **HTTP 429** + `Retry-After: <seconds>`. Failed generations therefore **don't** lock the user out.

---

## 8. File index (for the expert to open)

| Concern | File |
|---|---|
| Outer 3-tab wrapper, unlock plumbing | `App.tsx:78-194`, `App.tsx:362,1624-1629` |
| Generate/regenerate UI + constraints | `src/components/StudyPlanCard.tsx` |
| The 6-tab plan renderer | `src/components/StudyPlanViewer.tsx` |
| Deterministic preprocessing (all the math) | `src/utils/studyPlanPreprocessor.ts` |
| Prompt construction + client polling + rate limit | `src/services/studyPlanService.ts` |
| Static content bank (52 skills) | `src/data/skill-metadata-v1.ts` |
| Misconception taxonomy | `src/data/misconception-taxonomy.ts` |
| Master glossary (396 terms) | `src/data/master-glossary.json` |
| Output schema + thresholds + cluster labels | `src/types/studyPlanTypes.ts` |
| Backend (Anthropic call, persistence, server rate limit) | `api/study-plan-background.ts` |
| Domain-name map (10 NASP domains) | `src/services/studyPlanService.ts:40-51` |

---

## 9. Visual / theme state (relevant to the recolor task, NOT to the pedagogy)

- The study guide renders in the app's **dark "atelier" shell** and uses a **pastel CSS-variable accent palette** defined in `src/index.css:266-270`: `--d1-peach #fcd5b4`, `--d2-mint #b8f2d8`, `--d3-ice #cde9f5`, `--d4-lavender #d8d5fc`, `--accent-rose #fbcfe8`, plus `.badge-*` classes (`src/index.css:196-216`).
- The **indigo/violet "re-theme"** (vibrant `violet-500 → indigo-600` gradients) that other mockups show is **NOT implemented in `src/` anywhere** — 0 occurrences in `index.css`; it exists only as static mockups. Applying it to the study guide is therefore part of the broader re-theme rollout, not a study-guide-local change. (See §10 open item.)

---

## 10. ⚠ Discrepancies & open questions for the expert / product owner

1. **Skill/domain model mismatch (highest priority).** User-facing copy says **"45 skills across 4 domains"** ([App.tsx:143](App.tsx:143), [HelpFAQ.tsx:20](src/components/HelpFAQ.tsx:20), [LoginScreen.tsx:355](src/components/LoginScreen.tsx:355), [StudyModesSection.tsx:334,617](src/components/StudyModesSection.tsx:334)). The **study-guide data layer enumerates 52 skills across 10 NASP domains** (`skill-metadata-v1.ts` prefixes: ACAD 5, CC 2, DBDM 10, DIV 6, FSC 3, LEG 7, MBH 6, PC 5, RES 4, SWP 4; domain names at `studyPlanService.ts:40-51`). The "4 domains" appears to be the four NASP **practice-domain groupings** the 10 roll up into. **An expert should confirm which model is canonical and whether the counts in copy are wrong.**
2. **Exam identity.** Content is unambiguously **School Psychologist / NASP** (10 domains, "396 school psychology terms" [App.tsx:145,185](App.tsx:145)). Yet `master-glossary.json`'s metadata describes it as **"Special Education … Praxis 5403."** Praxis **5403** is officially *Special Education: Core Knowledge & Mild-to-Moderate Applications*; the **School Psychologist** test is **5402**. **Confirm the target exam** — the labeling is internally inconsistent.
3. **Stale psychometric claim.** `LoginScreen.tsx:355` still asserts **"1,150 calibrated items"** — flagged previously as unsupported (no IRT calibration exists). Out of scope for the study guide but worth the expert's awareness; likely a separate-branch fix not yet on this branch.
4. **Model pin.** Code uses `claude-sonnet-4-20250514` (Sonnet 4.0). `CLAUDE.md` says "`claude-sonnet-4-5` or similar current Sonnet." Decide whether to pin to a newer Sonnet.
5. **Snapshot vs. living document.** The plan is regenerated at most once / 7 days and does not reflect practice done after generation. Is that the intended cadence pedagogically?
6. **Recolor scope (for us, not the expert).** Because the re-theme isn't in code yet, "apply the new color scheme to the current study guide" means either (a) a study-guide-local pastel→indigo/violet token pass, or (b) waiting for the global re-theme rollout. Needs a product decision before we touch React.

---

## 11. Verification commands (the expert can re-derive every claim)

```bash
# skill count + domain prefixes in the study-guide data layer
grep -oE '"[A-Z]+-S?[0-9]+":' src/data/skill-metadata-v1.ts | sort -u | wc -l            # → 52
grep -oE '"[A-Z]+-S?[0-9]+":' src/data/skill-metadata-v1.ts | sed -E 's/-S?[0-9]+":.*//' | sort | uniq -c

# the 10 domain names
sed -n '40,51p' src/services/studyPlanService.ts

# model, tokens, temperature
grep -n "MODEL =\|max_tokens\|temperature" api/study-plan-background.ts

# rate limit (both layers)
grep -n "oneWeekAgo\|429\|Retry-After\|schemaVersion === '2'" api/study-plan-background.ts src/services/studyPlanService.ts

# theme tokens currently in use
sed -n '266,270p' src/index.css

# re-theme is NOT in code (expect 0)
grep -c "from-violet-500\|to-indigo-600" src/index.css
```
