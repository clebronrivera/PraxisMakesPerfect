# Study-Plan Generation Pipeline — Generic Spec

**Purpose.** This document specifies, in vendor-neutral terms, a three-stage pipeline that turns a learner's raw answer history into a structured, personalized study plan. It is extracted from a working single-exam reference implementation and rewritten with abstracted types (`Response[]`, `SkillState[]`, `StudyPlan`) so it can be reimplemented against a multi-exam platform. No product, exam, or domain names are assumed.

The governing idea: **a deterministic code layer does all the analysis and structure; the language model does only synthesis** — interpretation, sequencing, and prose. The model never computes a score, never invents a fact, and never decides the plan's skeleton.

---

## 1. The three stages

The pipeline has three stages. Stages 1–2 and the prompt assembly run **client-side**; stage 3 runs **server-side** in a long-running background function. The boundary between client and server is *exactly the prompt string*: the client hands the server a fully-built prompt, and the server adds nothing analytical.

### Stage 1 — Deterministic preprocessing
- **In:** `Response[]` — the learner's raw answer history (per-item: skill id, correct/incorrect, self-reported confidence, chosen-distractor, timestamp).
- **Out:** `SkillState[]` plus three side artifacts: `TimeBudget`, `DomainSummary[]`, and `ScheduleFrame[]`.
- **Signature:** `Response[] → { SkillState[], TimeBudget, DomainSummary[], ScheduleFrame[] }`
- Pure functions only; no I/O and no model call. Computes per-skill mastery, status labels, trend, urgency, clustering, time allocation, and the week-by-week session skeleton.

### Stage 2 — Content retrieval
- **In:** `SkillId[]` (the skills grouped into a priority cluster).
- **Out:** `RetrievedContent` = `{ vocabulary[], misconceptions[], resolvedMisconceptionIds[], caseArchetypes[], lawsFrameworks[] }`, merged into each cluster.
- **Signature:** `SkillId[] → RetrievedContent`
- Reads only **static, pre-authored per-skill metadata** (a skill-metadata table, a misconception taxonomy, a distractor resolver, an item index). No network, no model. This grounds the model: it may only reference content that the retrieval layer surfaced.

### Stage 3 — Model synthesis
- **In:** a single `Prompt` string (skeleton + the JSON payload produced by stages 1–2).
- **Out:** `StudyPlan` (a structured document with a fixed set of named sections).
- **Signature:** `Prompt → StudyPlan`
- The model fills text fields inside a pre-structured schema. It does not change cluster structure, session types, or durations — those are pre-set.

### Client/server boundary
- **Client** owns: gating + rate-limit checks, stages 1–2, prompt build, dispatch, and result polling.
- **Server (background function)** owns: auth, an independent rate-limit check, the single model call, minimal structural validation, document assembly (it re-attaches the client's pre-computed structural data so it never re-fetches), and persistence under row-level security.

### Implementation notes (divergences from the clean three-stage model)
1. **Stage 2 is nested inside stage 1's clustering**, not a separate top-level call — content retrieval happens while priority clusters are being built. The mental model is three stages; the code has two passes (analysis+retrieval, then synthesis).
2. **The time budget is computed twice** (a fast seed pass before clusters exist, then a real pass once cluster urgencies are known). A reimplementation can do this in one pass if cluster urgency is available up front.
3. **A few "deterministic inputs" live in the orchestrator, not the preprocessing module** — specifically the aggregate confidence-signal counts and the "top at-risk vocabulary" list. Treat all of section 3 as the deterministic contract regardless of which file computes it.

---

## 2. Why each stage exists

**Determinism and predictability (stages 1–2).** Everything the model "should not have to reason about" is computed in code: status labels from hard thresholds, urgency ranking, cluster assignment, content retrieval, the time budget, and the weekly skeleton. The same history always yields the same structure. This makes the output auditable and testable, and it removes whole classes of model error (miscounting, inventing a score, misranking priorities).

**Narrow the model's blast radius (stage 3).** Because the analysis is already done, the model's job is reduced to: interpret what the data *pattern* means (not re-narrate scores), write explanation and sequencing language, and fill the text fields of a pre-structured schema. Explicit guardrails forbid it from inventing external resources, changing the session structure, or duplicating content across sections. A smaller job means fewer failure modes and a smaller, cheaper, more reliable call.

**Cost control.** The single expensive model call is rate-limited (reference: **one successful generation per 7 days**, enforced on *both* client and server so a direct authenticated call cannot bypass the client check and run up spend). The server counts only *successful* generations toward the limit, so failed attempts don't lock the learner out. Low temperature (reference: `0.2`) further reduces variance and retries.

**Long-running work off the request path.** Synthesis can take many seconds, so it runs as a background job (HTTP 202 + poll), never blocking a normal request (see § 5).

---

## 3. The deterministic inputs

This is the full contract the preprocessing layer must compute before any model call.

### (a) Skill-state shape
`SkillState` per skill. In the reference, **mastery is accuracy-based** — `round(correct / attempts × 100)`, `null` when there are no attempts — not a probabilistic estimate. Fields:
- `currentAccuracy`, `attempts`
- `firstHalfAccuracy`, `lastHalfAccuracy`, `trend`
- `confidenceIssue` — at least one *high-confidence wrong* answer
- `repeatedDistractorPattern` — the same wrong option chosen **≥ 2** times
- `fragilityFlag` — requires **≥ 6** attempts; true when *low-confidence-correct* answers are **≥ 50%** of the last 6 (right answers the learner wasn't sure of)
- `uncertainSkillFlag` — **shadow signal**: computed and stored but *not consumed* (≥ 6 attempts; high-confidence-rate ≥ 0.25 AND low-confidence-rate ≥ 0.25). Kept for future calibration, intentionally not wired in.
- `missedQuestionIds`, `dominantMisconceptionKey?`, `dominantErrorClusterTag?`, `errorClusterTagCount?`

### (b) Status labels and exact thresholds
Six statuses, assigned in **priority order (first match wins)**:

| Condition (checked in order) | Status |
|---|---|
| `attempts < 3` | `unlearned` |
| `accuracy < 60` AND (`confidenceIssue` OR `repeatedDistractorPattern`) | `misconception` |
| `accuracy ≥ 80` | `mastered` |
| `accuracy ≥ 60` | `near_mastery` |
| `accuracy ≥ 40` | `developing` |
| otherwise | `unstable` |

Thresholds: `MIN_ATTEMPTS_FOR_STATUS = 3`, `MISCONCEPTION_ACCURACY_CEILING = 60`, `MASTERED = 80`, `NEAR_MASTERY = 60`, `DEVELOPING = 40`.

**Trend** needs **≥ 6** attempts (else `insufficient_data`). Split history in half; `delta = secondHalfAvg − firstHalfAvg`; `delta ≥ +15 → improving`, `delta ≤ −15 → declining`, else `flat` (`TREND_THRESHOLD = 15`).

### (c) Urgency / priority
Per-skill `urgencyScore` (higher = more urgent) = `statusWeight + trendPenalty + confBoost + fragility + accFactor`, where:
- `statusWeight`: misconception 100, unstable 80, developing 60, unlearned 50, near_mastery 20, mastered 0
- `trendPenalty`: declining 20, flat 10, insufficient_data 5, improving 0
- `confBoost`: 15 if `confidenceIssue` else 0
- `fragility`: 10 if `fragilityFlag` else 0
- `accFactor`: `(100 − accuracy) / 10`, or 5 if accuracy is null

**Cluster urgency**: a cluster is `urgent_now` if any member is misconception/unstable/unlearned; else `important_next` if any is developing (or not all members are near/mastered); else `maintain`. Clusters sort `urgent_now → important_next → maintain`, tiebroken by summed member `urgencyScore`.

### (d) Time budget
Defaults: `studyDaysPerWeek = 5`, `minutesPerSession = 45`, `weekendMinutes = 60`, `intensity = moderate`. Intensity multiplier: light 0.7, moderate 1.0, aggressive 1.3.
`minutesPerWeek = round((min(days, 5) × session + (days > 5 ? weekend : 0)) × multiplier)`.
Weeks: use a provided `weeksToTest`, else derive from a test date (`max(1, round((testDate − now) / oneWeek))`), else default 8. `totalMinutes = minutesPerWeek × weeks`.
**Allocation by cluster urgency share:** urgent_now 0.50, important_next 0.35, maintain 0.15. Empty buckets are dropped and the remaining shares **renormalized** to sum to 1; each bucket's minutes split evenly across its clusters; per-cluster `allocatedWeeks = round(clusterMinutes / minutesPerWeek)`.

### (e) Weekly frame
One `ScheduleFrame` per week (1…weeks). Weekday sessions = `min(days, 5)`, labeled Mon–Fri, each `minutesPerSession`; if `days > 5`, add a weekend session (`weekendMinutes`) whose type alternates by week parity. Each week's focus is pulled from a rotating queue of non-`maintain` clusters (rotated every `allocatedWeeks`; maintain clusters appended for review weeks; fallback "General Review"). Optional human-readable date labels are computed backward from the test date.
**Session type** is assigned deterministically: cluster-with-misconception + first session → `wrong-answer-review`; cluster-with-unlearned + first session → `vocabulary`; every 3rd session → `mixed-retrieval`; vocabulary-heavy clusters alternate `vocabulary`/`concept-review`; otherwise alternate `concept-review`/`case-practice`. Session-type enum: `vocabulary | concept-review | case-practice | mixed-retrieval | wrong-answer-review`.

### (f) Clustering, content caps, signals
- **Clustering**: skills grouped by a `contentCluster` metadata field; `mastered` skills excluded; a `near_mastery` skill may seed an otherwise-absent cluster at `maintain`.
- **Content retrieval caps** (dedup then slice): vocabulary ≤ 20, misconceptions ≤ 15, case archetypes ≤ 12, laws/frameworks ≤ 8. Free-text misconceptions resolve to canonical taxonomy IDs.
- **Dominant misconception**: most-repeated wrong option (≥ 2) → representative item → distractor resolver → misconception + skill-deficit label.
- **Error-cluster tags**: per skill, the top error tag across missed items if it appears ≥ 2 times; per cluster, tags appearing ≥ 3 times.
- **Aggregate signals** (orchestrator): counts of skills that are misconception-status / have a confidence issue / repeated distractor / fragility flag, plus `topAtRiskVocabulary` = deduped vocabulary from the urgent + important clusters, first 20.
- **Domain summaries**: per domain `score`, `skillCount`, and `deficitSkillCount` (skills with accuracy < 60), sorted ascending by score.

---

## 4. The model prompt skeleton

The prompt is assembled client-side and joined in this exact order:

1. **Preamble (role + guardrails).** States the task, then: *the preprocessing layer has already done the analysis; write interpretation, explanation, sequencing, and concise synthesis; do NOT re-narrate scores; do NOT invent external links, books, or websites; do NOT change session types, durations, or cluster structure; only use the provided retrieved vocabulary, misconceptions, and case archetypes.*
2. **Output section rules** — a literal `OUTPUT SECTION RULES — read before generating:` block with one line per output section describing exactly what goes there and what must NOT (no analysis here, no scores repeated, no duplication across sections). This is the primary anti-duplication control.
3. **Output-format instruction** — `Return JSON only. No markdown fences. No commentary…`, followed by a literal example object (`JSON.stringify(schema, null, 2)`) enumerating every field of all required sections with inline type hints (e.g. `urgency: 'urgent_now | important_next | maintain'`).
4. **Grounding rules** — ~18 bullets: cluster names must match the provided clusters; the weekly plan must use the provided week numbers / focus / session structure; vocabulary only from retrieved content; one case pattern per provided archetype (max 8); cover every domain below a score threshold or with any deficit skill; 3–6 items per array; conditional phrasing templates keyed on `fragilityFlag`, `dominantMisconception`, shared error-cluster tags, prerequisite chains; and the literal `schemaVersion` constant.
5. **Payload** — `Assessment data (pre-processed):` then `JSON.stringify(payload)`. The payload carries: assessment state (completion flags, total responses, flagged-skill count); study constraints; the aggregate confidence signals; `topAtRiskVocabulary`; domain summaries; the priority clusters (name, urgency, allocated minutes, skills, and per-cluster retrieved vocabulary / misconceptions / resolved-ids / case archetypes / laws); and the weekly schedule frame.

**Required output sections (all enforced).** The `StudyPlan` document must contain, non-empty: `readinessSnapshot`, `dataInterpretation`, `priorityClusters`, `domainStudyMaps`, `vocabulary`, `casePatterns`, `weeklyStudyPlan`, `tacticalInstructions`, `checkpointLogic`.

**Model params (reference).** A mid-tier general LLM; `max_tokens ≈ 12000` (the structured schema is large); `temperature 0.2`; a single user message containing the whole prompt.

**Output-format enforcement (no native schema/tool mode).** Enforcement is layered: (1) the "Return JSON only" instruction; (2) brace-extraction that strips code fences and slices from the first `{` to the last `}`; (3) server-side minimal validation — each required section present and non-empty; (4) client-side strict validation — per-field type coercion and enum checks, throwing on any malformed field. Documents that don't match the current schema version normalize to null, which forces regeneration.

---

## 5. Dispatch & polling (summary)

The synthesis call runs as a background job: the client POSTs the prompt to the background endpoint, which returns **HTTP 202** immediately and keeps running. The reference returns **no job id** — the client polls the persistence layer for the newest row created after the request timestamp (interval 4s, timeout 4 min), correlating by user + time. A failure row (`{ error: true, … }`) is written on insert failure so the poller can surface it. Rate limiting is enforced on both client and server (1 successful plan / 7 days; server returns 429 + `Retry-After`). The full long-running-AI-call pattern is specified separately in **`PMP_NETLIFY_BACKGROUND_FN_PATTERN.md`**.

---

## 6. Notes for a multi-exam reimplementation

- **Mastery input is pluggable.** The reference computes `SkillState.currentAccuracy` as raw percent accuracy. A platform with a probabilistic engine should map its own per-skill posterior mean to the same band thresholds (≥ 0.80 / ≥ 0.60 / ≥ 0.40 → mastered / near_mastery / developing), keep the `misconception` rule (low accuracy + a confidence/distractor signal), and feed posterior **variance** into the fragility/uncertainty flags instead of the raw confidence counts. The band cutoffs (0.80 / 0.60) should match the platform's proficiency definitions so the study plan and the adaptive engine agree (see `PMP_ADAPTIVE_ENGINE_MATH.md`).
- **Skill granularity = the finest valid diagnostic unit per exam**, not a fixed level — `SkillState` should key on whatever leaf the platform's taxonomy resolves to per exam, so clustering and urgency generalize across exams with different depths.
- **Clusters and domains are exam-scoped.** The `contentCluster` field and domain summaries must come from each exam's competency map, not a hard-coded list. Vocabulary-heavy vs. case-heavy cluster behavior should be derived from the exam's content, not enumerated cluster names.
- **Keep the boundary.** The single most important property to preserve is that *all analysis is deterministic and the model only synthesizes prose into a fixed schema*. Everything in section 3 is testable without the model; only section 4's text fields require it.
- **Content grounding requires authored metadata.** Stage 2 only works if per-skill vocabulary, misconceptions, and case archetypes exist in the content layer. On a platform where some exams are content-rich and others are thin, the retrieval step should degrade gracefully (empty arrays → the model simply omits those grounded sections) rather than invent content.
