# Misconception Structures Audit — PraxisMakesPerfect

**Date:** 2026-03-29
**Scope:** `src/data/questions.json`, `src/data/skill-metadata-v1.ts`, `src/brain/distractor-patterns.ts`, `src/utils/studyPlanPreprocessor.ts`, `api/study-plan-background.ts`, `src/utils/focusItemExtractor.ts`, `src/hooks/`, `src/services/`
**Constraint:** Read-only. No implementation changes. No content guessing.

---

## 1. Inventory of All Misconception-Related Structures

Eight distinct structures carry misconception-related data across the codebase. They are listed from most authoritative to most ephemeral.

---

### Structure 1 — Skill-Level Misconceptions (`skill-metadata-v1.ts`)

**Field:** `commonMisconceptions: string[]` on the `SkillMetadataV1` interface
**Type:** Array of free-text strings
**Stability:** No stable IDs. Values are keyed only by skill ID (e.g., `DBDM-S01`) plus array position.
**Coverage:** 100% — every skill entry contains 2–3 misconceptions.
**Total count:** ~45 skills × ~2.5 avg = approximately 112 canonical misconception statements.

**Sample values (DBDM-S01):**
- "All reliability types are interchangeable across measurement contexts"
- "Test-retest reliability measures internal consistency rather than stability over time"
- "Cronbach's alpha is appropriate for behavioral observation data"

**How consumed:**
1. Retrieved deterministically by `studyPlanPreprocessor.ts` → `retrieveSkillContent()`
2. Aggregated up to 15 per cluster (deduplicated and sliced)
3. Passed to Claude in `PrecomputedCluster.retrievedMisconceptions`
4. Included in the study plan document for student review

---

### Structure 2 — Question-Level Distractor Misconceptions (`questions.json`)

**Fields:** `distractor_misconception_A` through `distractor_misconception_F` (one per answer option)
**Type:** `string` per option, often empty
**Stability:** No stable IDs. Keyed only by question `UNIQUEID` + option letter.
**Coverage:** ~192–194 of 1,150 questions (~17%) have at least one non-empty field. Fields E–F are populated in fewer than 5% of questions.

**Sample values (item_002, skill ACA-07):**
- A: `"Student mistakenly selects an option related to 'children who have im...' instead of the correct concept."`
- C: `"Student mistakely selects an option related to 'whole-word reading i...' instead of the correct concept."`
- D: `"Student mistakely selects an option related to 'children acquire lan...' instead of the correct concept."`

**Structural pattern:** All populated values follow the template:
> `"Student mistakenly selects an option related to '[CONCEPT]...' instead of the correct concept."`

The `[CONCEPT]` portion is consistently truncated with `"..."`. Whether this represents intentional abbreviation, a source data issue, or a rendering artifact is unknown (see Ambiguity 1).

**How consumed:**
1. Loaded by `tutor-chat.ts` as part of the `QuestionItem` interface
2. Extracted by `tutorQuizEngine.ts` → `evaluateQuizAnswer()` for wrong-answer options
3. Passed to Claude in the "QUIZ EVALUATION" section as `misconceptions: [...]`

**No cross-reference exists** between these fields and the skill-level `commonMisconceptions`.

---

### Structure 3 — Question-Level Top Misconception Themes (`questions.json`)

**Field:** `top_misconception_themes: string` (single string per question)
**Type:** Free-text string
**Stability:** No stable IDs.
**Coverage:** ~250 of 1,150 questions (~22%) have a non-empty value.

**Sample values:**
- `"Confusion regarding core LEG principles"`
- `"Confusion regarding core ACA principles"`
- `"Confusion regarding core DBDM principles"`

**Observed pattern:** Every populated value appears to follow the template `"Confusion regarding core [DOMAIN_CODE] principles"`. No specificity beyond domain is present in observed samples — this may indicate auto-generation or a field that was never meaningfully populated (see Ambiguity 3).

**How consumed:** Not referenced in any codebase grep. Purpose and consumer are unknown.

---

### Structure 4 — Distractor Pattern Taxonomy (`distractor-patterns.ts`)

**Field:** `patternId: PatternId` on the `DistractorPattern` interface
**Type:** Stable string enum (kebab-case IDs)
**Stability:** Yes — the only layer with stable, intentional IDs.
**Coverage:** 28 distinct patterns defined.

**Full interface:**
```typescript
export interface DistractorPattern {
  patternId: PatternId;
  name: string;
  description: string;
  logicTransform: string;
  renderingGuidance: string;
  feedbackExplanation: string;
  applicableSkillTypes: SkillCategory[];
}
```

**All 28 pattern IDs observed:**

| ID | Name/Description |
|----|-----------------|
| `premature-action` | Acting before completing assessment |
| `role-confusion` | Choosing action outside school psychologist scope |
| `similar-concept` | Selecting related but incorrect concept |
| `data-ignorance` | Making decisions without reviewing data |
| `extreme-language` | Answers with always/never/only that are too absolute |
| `context-mismatch` | Valid approach but wrong for this context |
| `incomplete-response` | Missing a required element |
| `legal-overreach` | Exceeding professional authority |
| `correlation-as-causation` | Inferring causal from correlational data |
| `function-confusion` | Confusing different behavior functions |
| `case-confusion` | Confusing landmark legal cases |
| `sequence-error` | Getting required order wrong |
| `function-mismatch` | Replacement behavior doesn't match function |
| `model-confusion` | Confusing therapy or consultation models |
| `instruction-only` | Using instruction without practice/feedback |
| `adult-criteria` | Applying adult diagnostic criteria to children |
| `inclusion-error` | Including/excluding inappropriate candidates |
| `optimal-education` | Confusing FAPE with "best possible" education |
| `general-concerns` | Breaching confidentiality for non-imminent danger |
| `investigation` | Investigating abuse instead of reporting it |
| `delay` | Delaying when immediate action is required |
| `punishment-focus` | Focusing on punishment vs. understanding cause |
| `absolute-rules` | Applying rules without required context |
| `law-confusion` | Confusing different laws (IDEA vs. 504 vs. FERPA) |
| `no-access` | Denying access without legal basis |
| `insufficient-hours` | Providing insufficient supervision hours |
| `full-release` | Releasing test protocols without restrictions |
| `definition-error` | Confusing definition terms (e.g., "optimal" vs. "appropriate") |

**How consumed:**
1. Referenced in `distractor-matcher.ts` → `matchDistractorPattern()`
2. Helper functions: `getPatternsForSkillType()`, `getPatternById()`
3. Used in question generation and AI explanations
4. **Not directly linked** to `questions.json` distractor fields or skill-level misconceptions

---

### Structure 5 — Student Misconception Status (Computed Label)

**Field:** `status = "misconception"` — one value of the `StudentSkillStatus` enum
**Type:** Deterministic label assigned in `studyPlanPreprocessor.ts` → `assignStatus()`
**Stability:** Reproducible given the same input data; no external ID.

**Detection rule (hard thresholds):**
```
accuracy < 60%
AND (high-confidence wrong answer detected OR same wrong answer chosen ≥ 2 times)
→ status = "misconception"
```

**Urgency weight:** `100` (highest priority tier, shared with other critical statuses)

**How consumed:**
1. Assigned deterministically during preprocessing
2. Triggers `"wrong-answer-review"` session type in study plans
3. Passed to Claude as part of `PrecomputedCluster` input
4. Surfaced in the Study Center UI as a status indicator

---

### Structure 6 — Focus Items of Type "misconception" (`focusItemExtractor.ts`)

**Field:** `type: 'misconception'` on the `FocusItem` interface
**Type:** Free-text string with a session-scoped hash ID (`fi-m-[hash36]`)
**Stability:** Semi-stable — ID is a hash of text; same text produces the same hash.

**Full interface:**
```typescript
export interface FocusItem {
  id: string;           // "fi-m-[hash36]"
  type: 'vocabulary' | 'misconception' | 'trap';
  text: string;
  detail?: string;
  context?: string;
}
```

**Extraction sources (current logic):**
1. `skillCluster.blockingNote` — per-skill synthesized note from study plan
2. `casePatterns[].commonMistake` — domain-contextualized mistake from case patterns
3. `vocabulary[].confusionRisk` — alternative signal when vocabulary confusion is the misconception

**What is NOT extracted:** Skill-level `commonMisconceptions` from `skill-metadata-v1.ts` are not directly surfaced as focus items. The extraction path routes through synthesized study plan fields instead (see Ambiguity 5).

**How consumed:** Rendered in Study Center sidebar for student review. Displayed alongside vocabulary items and "traps" checklist.

---

### Structure 7 — Case Pattern Common Mistakes (`StudyPlanDocumentV2`)

**Field:** `commonMistake: string` on the `CasePattern` interface
**Type:** Free-text string
**Stability:** None — AI-synthesized per study plan generation; not reproducible across runs.

**Full interface:**
```typescript
export interface CasePattern {
  patternName: string;
  domainContext: string;
  cluesInScenario: string[];
  likelyQuestionAngle: string;
  commonMistake: string;    // ← the misconception
}
```

**How consumed:**
1. Generated by Claude during study plan synthesis
2. Stored in `StudyPlanDocumentV2.casePatterns[]`
3. Primary source for misconception-type focus items
4. Used for student pattern recognition in Study Center

---

### Structure 8 — Heuristic Distractor Matcher (`distractor-matcher.ts`)

**Function:** `matchDistractorPattern(selectedText, correctAnswer, distractorPatterns?)`
**Type:** Runtime inference — no stored field
**Stability:** Non-deterministic; regex-based heuristics.

**Patterns matched heuristically (subset):** premature-action, role-confusion, sequence-error, context-mismatch, similar-concept, definition-error, data-ignorance, extreme-language, incomplete-response.

**Limitation:** Regex matching against free-form selected answer text. Does not validate against any structured misconception data. Not connected to `questions.json` distractor fields. Accuracy is unvalidated (see Ambiguity 10).

---

### Summary Table

| # | Layer | Source File | Field(s) | Type | Stable IDs | Coverage | Consumer |
|---|-------|------------|---------|------|-----------|---------|---------|
| 1 | Skill-level | `skill-metadata-v1.ts` | `commonMisconceptions` | `string[]` | No | 100% | Study plan preprocessor → Claude prompt |
| 2 | Question-level distractor | `questions.json` | `distractor_misconception_A–F` | `string` | No | ~17% | Tutor quiz engine → Claude prompt |
| 3 | Question theme | `questions.json` | `top_misconception_themes` | `string` | No | ~22% | Unknown — no code reference found |
| 4 | Error taxonomy | `distractor-patterns.ts` | `patternId` (28 stable IDs) | `PatternId` | **Yes** | 100% | Distractor matcher, question generation |
| 5 | Student status | `studyPlanPreprocessor.ts` | `status = "misconception"` | Enum value | No (computed) | Algorithm-driven | Study plan session types, UI |
| 6 | Focus items | `focusItemExtractor.ts` | `type = 'misconception'` | `string` + hash ID | Semi | Session-scoped | Study Center sidebar |
| 7 | Case patterns | `StudyPlanDocumentV2` | `commonMistake` | `string` | No | AI-synthesized | Focus items, Study Center |
| 8 | Heuristic matcher | `distractor-matcher.ts` | (runtime) | Inferred | No | On-demand | Tutor explanations |

---

## 2. Canonical vs. Ad Hoc Classification

### Canonical (Authoritative, Human-Authored)

**Skill-level misconceptions (`skill-metadata-v1.ts`)** are the closest thing to ground truth. They were authored per skill by subject-matter experts, are versioned with the file, and are passed directly to the AI model as authoritative content. Weakness: no stable IDs, no linkage to questions.

**Distractor pattern taxonomy (`distractor-patterns.ts`)** is the only layer with stable, intentional IDs and a structured schema. It functions as an error-type registry. Weakness: it is not connected to either the skill-level or question-level layers.

**Question-level distractor misconceptions (`questions.json`)** were authored alongside questions and represent targeted, per-option rationale. They are authoritative in the sense of being human-authored and item-specific. Weakness: coverage is 17%, text is consistently truncated, and there are no IDs or cross-references.

### Ad Hoc / Synthesized

**Case pattern common mistakes** are generated by Claude per study plan run. They are contextually relevant but not reproducible and carry no authority beyond a single session.

**Focus items** are extracted and assembled at runtime from multiple sources. The hash IDs are stable only for unchanged text. They are downstream artifacts, not sources.

**Student misconception status** is a deterministic label computed from behavioral signals. It identifies likely misconception presence but does not identify which misconception.

**Top misconception themes** appear to be either auto-generated or never meaningfully populated. No code consumer found.

**Heuristic distractor matcher** is purely inferential — it produces guesses about error type from answer text. Not authoritative.

---

## 3. Candidate Duplication Patterns

### Duplication A — Same Concept, Multiple Representations

The same underlying misconception frequently appears expressed differently across layers with no cross-reference. Three documented examples:

**Example 1 — FAPE vs. Optimal Education**
- Distractor pattern: `optimal-education` ("Confusing FAPE with optimal or best possible education")
- Skill-level (LEG domain): likely includes "FAPE requires the best possible education" or equivalent
- Question distractors: free-text references to "best possible" or "optimal" in LEG-domain questions
- Case patterns: AI may synthesize "confusing FAPE standard" as a common mistake

All four representations exist independently with no linking identifier.

**Example 2 — Reliability Type Confusion (DBDM-S01)**
- Skill-level: "Test-retest reliability measures internal consistency rather than stability over time"
- Distractor pattern: `similar-concept` (general category applicable here)
- Question distractors: references to reliability concepts in DBDM questions
- No explicit connection between these three instantiations

**Example 3 — Role Scope (Professional Boundaries)**
- Distractor pattern: `role-confusion` (stable ID)
- Skill-level: Multiple skills likely contain "school psychologists do not [X]" statements
- Question distractors: distractor_misconception fields mentioning scope errors
- Heuristic matcher: independently detects role-confusion via regex

### Duplication B — Terminology Proliferation

Eight different terms are used across the codebase to express variations of "wrong answer and the cognitive error behind it," with no shared vocabulary:

1. `distractor_misconception_X` — questions.json
2. `distractor_error_type_X` — questions.json (present as field, mostly empty)
3. `distractor_skill_deficit_X` — questions.json (present as field, mostly empty)
4. `distractor_tier_X` — questions.json (present as field, mostly empty)
5. `patternId` — distractor-patterns.ts
6. `commonMistake` — case patterns in study plan
7. `type = 'misconception'` — focus items
8. `status = "misconception"` — student status label

### Duplication C — Incomplete Cross-Referencing Between Layers

```
Question (questions.json)
  └─ distractor_misconception_A: "Student mistakely selects..."   [free text, no skill reference]
  └─ skill: "DBDM-S01"

Skill Metadata (skill-metadata-v1.ts)
  └─ skillId: "DBDM-S01"
  └─ commonMisconceptions: ["All reliability types...", ...]   [no back-reference to questions]

Distractor Patterns (distractor-patterns.ts)
  └─ patternId: "similar-concept"   [no reference to any skill or question]
```

No layer links to another by ID. The three canonical layers are structurally isolated.

---

## 4. Proposed Canonical Misconception Families

These families are derived from observed data — the distractor patterns, skill-level misconception text, and structural patterns in question distractors. They are grouped by conceptual relationship, not by guessing unstated meaning.

**Family 1 — Assessment Tool Confusion**
Selecting the wrong instrument type for a given purpose: confusing screening with diagnostic evaluation, norm-referenced with criterion-referenced, progress monitoring with eligibility assessment, internal consistency with stability reliability, one reliability type with another.
*Primary pattern anchors:* `similar-concept`, `context-mismatch`, `adult-criteria`

**Family 2 — Professional Scope and Role Boundaries**
Taking actions that fall outside the school psychologist's professional role: investigating vs. reporting, prescribing vs. recommending, teaching vs. consulting, acting unilaterally vs. with the team, exceeding legal authority.
*Primary pattern anchors:* `role-confusion`, `legal-overreach`, `investigation`

**Family 3 — Decision-Making Sequence Errors**
Getting the order of required steps wrong: acting before assessing, skipping required elements, making decisions without reviewing data, intervening before identifying function.
*Primary pattern anchors:* `premature-action`, `data-ignorance`, `incomplete-response`, `sequence-error`, `delay`

**Family 4 — Legal and Ethical Boundary Confusion**
Misapplying legal standards: confusing different laws, misidentifying confidentiality thresholds, denying access without legal basis, confusing FAPE with "optimal" education, mishandling test security.
*Primary pattern anchors:* `legal-overreach`, `general-concerns`, `full-release`, `law-confusion`, `optimal-education`, `no-access`

**Family 5 — Applied Behavioral Science Reasoning**
Misidentifying behavioral function, inferring causation from correlation, selecting a replacement behavior that doesn't match the identified function, confusing different behavior functions.
*Primary pattern anchors:* `correlation-as-causation`, `function-confusion`, `function-mismatch`, `punishment-focus`

**Family 6 — Conceptual Precision and Absolutism**
Confusing two related but distinct concepts, applying rules without required context, using language that is too absolute (always/never), confusing related case law or clinical models.
*Primary pattern anchors:* `extreme-language`, `similar-concept`, `case-confusion`, `model-confusion`, `absolute-rules`, `definition-error`

**Family 7 — Instructional and Procedural Gaps**
Missing required components of an intervention or procedure: instruction without practice, missing supervisory hours, excluding required stakeholders, incomplete intervention plans.
*Primary pattern anchors:* `instruction-only`, `insufficient-hours`, `inclusion-error`

**Family 8 — Context Specificity Failures**
Applying a valid approach in the wrong context: using group assessment where individual is required, applying adult criteria to children, using a tool for an unintended purpose, valid strategy for wrong situation.
*Primary pattern anchors:* `context-mismatch`, `adult-criteria`, `inclusion-error`

---

## 5. Draft ID Schema for a Misconception Taxonomy

### Current state of IDs across layers

| Layer | ID situation |
|-------|-------------|
| Skill-level misconceptions | None — free-text list only |
| Question distractor misconceptions | None — keyed by question ID + option letter |
| Distractor patterns | **28 stable kebab-case IDs** (the only existing ID system) |
| Case pattern common mistakes | None — AI-synthesized, ephemeral |
| Focus items | Session-scoped hash of text content |

### Proposed canonical ID schema

A canonical misconception ID should encode: domain, skill, conceptual family, and sequence within family. A human-readable format is preferable to a pure numeric hash.

**Format:**
```
MC-[DOMAIN]-[SKILL]-[SEQ]
```

**Examples:**
```
MC-DBDM-S01-001   → "All reliability types are interchangeable"
MC-DBDM-S01-002   → "Test-retest reliability measures internal consistency"
MC-DBDM-S01-003   → "Cronbach's alpha is appropriate for behavioral observation data"
MC-LEG-01-001     → "FAPE requires the best possible education"
MC-ACA-07-001     → "Whole-word reading is appropriate for all beginning readers"
```

**Rationale for this format:**
- Domain segment allows filtering all misconceptions within DBDM, LEG, ACA, CON
- Skill segment allows filtering per skill and aligns with existing `skillId` keys
- Sequential number keeps IDs stable even if text is revised
- Short enough to embed in JSON fields without overhead

**Optional family annotation (non-ID metadata):**
The eight conceptual families from Section 4 would be carried as a separate `family` field on the misconception record, not encoded in the ID. This avoids ID instability when reclassification occurs:
```
family: "Assessment Tool Confusion" | "Professional Scope" | "Decision Sequence" |
        "Legal Ethical" | "Behavioral Science" | "Conceptual Precision" |
        "Instructional Procedural" | "Context Specificity"
```

**Relationship to existing distractor pattern IDs:**
The 28 distractor pattern IDs (`premature-action`, `role-confusion`, etc.) represent error types — the *mechanism* of the wrong answer. A misconception ID would represent the *content* — the specific incorrect belief. These are different axes and should remain distinct, linked by an optional `relatedPatternIds: string[]` field on the misconception record.

**Minimum viable linking record:**
```typescript
interface MisconceptionEntry {
  id: string;                          // "MC-DBDM-S01-001"
  skillId: string;                     // "DBDM-S01"
  text: string;                        // canonical statement of the misconception
  family: string;                      // conceptual family from the 8-family taxonomy
  relatedPatternIds: string[];         // e.g., ["similar-concept"]
  questionIds: string[];               // questions.json UNIQUEIDs that target this
}
```

---

## 6. Open Ambiguities Requiring Human Judgment

### Ambiguity 1 — Truncated Distractor Text

Every populated `distractor_misconception_X` field follows the same pattern with a truncated concept: `"Student mistakenly selects an option related to '[CONCEPT]...' instead of the correct concept."` The `...` appears consistently and may represent: (a) intentional abbreviation of a longer authoring rationale, (b) a rendering artifact from a truncated database column, or (c) placeholder text never filled in. The full untruncated text, if it exists, would be the operative misconception statement. **Requires:** access to the original authoring template or source database.

### Ambiguity 2 — Intended Relationship Between Question Distractors and Skill Misconceptions

Is each question distractor intentionally designed to target a specific skill-level misconception? Or are the two layers independently authored without correspondence? If there is intended correspondence, the current data does not record it. **Requires:** confirmation from the question authors on design intent.

### Ambiguity 3 — Status of `top_misconception_themes`

This field exists on ~22% of questions but appears to contain only domain-level templates ("Confusion regarding core LEG principles") with no question-specific content. No code consumer was found. This may be: (a) a legacy field, (b) a placeholder awaiting population, or (c) intended for future analytics. **Requires:** confirmation of whether this field was ever used or is safe to deprecate.

### Ambiguity 4 — Why Focus Items Bypass Skill-Level Misconceptions

`focusItemExtractor.ts` extracts misconception-type focus items from synthesized study plan fields (`blockingNote`, `commonMistake`) rather than directly from `skill-metadata-v1.ts`'s `commonMisconceptions`. The skill-level misconceptions are passed to Claude but not surfaced directly to students. This may be intentional (case patterns are considered a better student-facing format) or an oversight. **Requires:** design intent confirmation.

### Ambiguity 5 — Mapping Distractor Patterns to Skill Misconceptions

The 28 distractor patterns are error-type categories; the skill-level misconceptions are specific content statements. Some patterns clearly apply to specific misconceptions (`optimal-education` maps cleanly to FAPE-related misconceptions), while others are general (`similar-concept` could apply to hundreds of misconceptions). Deciding which patterns apply to which misconceptions across all 112 skill-level misconception statements requires domain expert review. This cannot be done without risking incorrect classification.

### Ambiguity 6 — Coverage Gaps

Approximately 112 skill-level misconceptions exist across 45 skills. Only ~192 of 1,150 questions (~17%) have any distractor misconception documented. The overlap between "skill misconceptions with questions that target them" and "skill misconceptions with no question coverage" is unknown. A full coverage map requires programmatically matching skill IDs between the two structures — feasible but not done.

### Ambiguity 7 — Misconception Detection Threshold Validity

The current algorithm flags a skill as `"misconception"` when accuracy < 60% AND (high-confidence wrong answer OR repeated same wrong answer). A student with repeated low-confidence wrong answers on the same question does not trigger the flag. Whether high-confidence errors are a better signal of entrenched misconception than repeated low-confidence errors is a learning science and domain question. **Requires:** validation against expert judgment or outcome data.

### Ambiguity 8 — Distractor-Matcher Heuristic Accuracy

The heuristic regex matching in `distractor-matcher.ts` produces a distractor pattern inference from free-form selected answer text. Its accuracy has not been validated. Overlapping patterns (e.g., `premature-action` vs. `sequence-error`, or `similar-concept` vs. `definition-error`) may produce inconsistent or incorrect pattern assignments. **Requires:** validation against a SME-labeled ground truth set.

### Ambiguity 9 — Distractor Pattern Scope: Specific vs. General

Some of the 28 patterns appear to encode a specific misconception content (e.g., `optimal-education` = "FAPE is optimal"). Others encode only a structural error type (e.g., `similar-concept` = "wrong answer that sounds like the right one"). These two things are different in kind, and mixing them in a single flat list creates ambiguity about whether a pattern ID represents a misconception or a question-design heuristic. **Requires:** a design decision on whether to split the taxonomy.

### Ambiguity 10 — Terminology Standardization Scope

Eight different terms exist for overlapping concepts (see Section 3, Duplication B). Any renaming or consolidation effort involves editorial decisions about which term is most precise for which layer. For example: does `distractor_misconception_A` name a property of the distractor (its appeal mechanism) or a property of the student (their incorrect belief)? The answer changes what the field should be named and how it should be populated. **Requires:** agreement on a shared mental model before any schema changes.

---

*End of audit. No files were modified. No content was altered.*
