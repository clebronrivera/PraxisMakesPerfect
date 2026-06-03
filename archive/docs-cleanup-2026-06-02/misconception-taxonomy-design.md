# Misconception Taxonomy Design
## PraxisMakesPerfect — Pre-Implementation Design Document

**Status:** Awaiting approval before implementation begins
**Branch this document gates:** `feature/misconception-taxonomy-implementation`
**Depends on:** Audit findings from `feature/misconception-taxonomy-and-diagnostic-content-audit`
**Does not touch:** Source code, TypeScript files, registry files, AdaptiveDiagnostic.tsx, scoring logic

---

## 1. Purpose and Context

The adaptive diagnostic is the product's core value. Its long-term goal is to identify not just which skills a student is struggling with, but *why* — specifically, which misconception or knowledge gap is most likely driving failure. To do that, the diagnostic needs a stable, referenceable misconception model it can branch on.

That model does not currently exist.

This document defines what a canonical misconception taxonomy for PraxisMakesPerfect should look like — its ID format, conceptual family structure, and mapping rules — so that an implementation branch can be scoped and approved. The taxonomy is **prerequisite infrastructure** for the adaptive diagnostic redesign branch (`feature/adaptive-diagnostic-redesign`). It is not part of that redesign. It must exist first.

### The Three-Layer Problem

The codebase currently has three disconnected layers that all relate to misconceptions, but share no cross-references:

- **Layer 1 — Skill-level misconceptions** (`skill-metadata-v1.ts`): human-authored, authoritative, but no stable IDs
- **Layer 2 — Distractor pattern taxonomy** (`distractor-patterns.ts`): the only layer with stable IDs, but encodes error *mechanisms*, not specific misconception *content*
- **Layer 3 — Question-level distractor fields** (`questions.json`): structurally present but diagnostically inert — confirmed 100% boilerplate in the diagnostic bank

A student's wrong answer on a diagnostic item currently cannot be attributed to a specific named misconception. It can be associated with a skill, and a heuristic pattern can be guessed at runtime, but there is no stable record linking the error to an identified belief. This is the gap the taxonomy closes.

---

## 2. Current State of Each Layer

Labels: **(CONFIRMED)** = directly evidenced in audit files. **(INFERRED)** = reasonable from evidence, requires live source confirmation during branch work.

### Layer 1 — Skill-Level Misconceptions (`skill-metadata-v1.ts`)

- Field: `commonMisconceptions: string[]` on each `SkillMetadataV1` entry **(CONFIRMED)**
- Coverage: 100% of 45 skills, 2–3 entries per skill, approximately 112 canonical statements total **(CONFIRMED)**
- These are the only human-authored, subject-matter-expert-reviewed misconception statements in the system **(CONFIRMED)**
- They are passed to Claude via `studyPlanPreprocessor.ts → retrieveSkillContent()` and aggregated into study plan prompts **(CONFIRMED)**
- They are not directly surfaced to students as discrete items; they flow only through study plan → Claude → synthesized content **(CONFIRMED)**
- No stable IDs exist on any entry; keyed only by `skillId` and array position **(CONFIRMED)**
- No cross-reference exists to question-level distractor fields or to distractor patterns **(CONFIRMED)**

**Implication for taxonomy:** This layer is the source of truth. Every taxonomy entry must trace back to a statement in this layer. No taxonomy entry may be invented that does not have a corresponding `commonMisconceptions` source.

### Layer 2 — Distractor Pattern Taxonomy (`distractor-patterns.ts`)

- Exactly 28 patterns with stable kebab-case `PatternId` values — the only layer in the codebase with intentional, stable, referenceable IDs **(CONFIRMED)**
- Each pattern has a structured record: `patternId`, `name`, `description`, `logicTransform`, `renderingGuidance`, `feedbackExplanation`, `applicableSkillTypes` **(CONFIRMED)**
- Patterns encode **error mechanisms** — the structural nature of wrong reasoning — not specific misconception content **(CONFIRMED)**
- Not connected to skill-level misconceptions or question-level distractor fields **(CONFIRMED)**
- Used in `distractor-matcher.ts` (heuristic regex-based runtime inference) and in question generation **(CONFIRMED)**
- The heuristic matcher's accuracy is unvalidated **(CONFIRMED)**

The full set of 28 `PatternId` values:

`premature-action` · `role-confusion` · `similar-concept` · `data-ignorance` · `extreme-language` · `context-mismatch` · `incomplete-response` · `legal-overreach` · `correlation-as-causation` · `function-confusion` · `case-confusion` · `sequence-error` · `function-mismatch` · `model-confusion` · `instruction-only` · `adult-criteria` · `inclusion-error` · `optimal-education` · `general-concerns` · `investigation` · `delay` · `punishment-focus` · `absolute-rules` · `law-confusion` · `no-access` · `insufficient-hours` · `full-release` · `definition-error`

**Important distinction:** Some patterns correspond cleanly to a specific misconception content (`optimal-education` → the belief that FAPE means "best possible education"). Others are structural categories that can apply to dozens of different misconceptions (`similar-concept` → any error where a student conflates two related concepts). Both are valid pattern types; the distinction is important when building relatedPatternIds references in the taxonomy.

**Implication for taxonomy:** Distractor patterns are the *error-mechanism layer*. The taxonomy is the *content-belief layer*. These are different axes. The taxonomy does not replace or absorb the pattern list. They are linked by reference, not merged.

### Layer 3 — Question-Level Distractor Fields (`questions.json`)

- Fields present: `distractor_misconception_A–F`, `distractor_skill_deficit_A–F`, `distractor_tier_A–F`, `distractor_error_type_A–F` on each item **(CONFIRMED)**
- Diagnostic bank: 250 items, 750 distractor slots, 748 structurally present (99.7%) **(CONFIRMED)**

**`distractor_misconception` fields:** 0 of 748 are content-valid **(CONFIRMED)**. Every populated value follows an identical auto-generated template derived mechanically from the first 20 characters of the wrong answer option text:

> *"Student mistakenly selects an option related to '{first 20 chars of option text}...' instead of the correct concept."*

This text provides no information about why a student would choose the option, what knowledge gap drives the error, or how the error pattern differs across items. It is diagnostically inert.

**`distractor_skill_deficit` fields:** 0 of 748 are content-valid **(CONFIRMED)**. All contain 1–3 word title-cased fragments lifted from answer option text. None reference any of the 45 skill identifiers in the taxonomy.

**`dominant_error_pattern`:** `"concept_substitution"` for all 250 diagnostic items — zero variance **(CONFIRMED)**. Provides no item-level signal.

**`error_cluster_tag`:** Only 2 values across 250 items: `theory_substitution` (86.4%) and `procedure_inversion` (13.6%) **(CONFIRMED)**. Near-constant; no per-item differentiation.

**`top_misconception_themes`:** Populated on ~22% of questions, all following the template `"Confusion regarding core [DOMAIN_CODE] principles"`. No code consumer found in a codebase grep — confirmed orphaned field **(CONFIRMED)**.

**`distractor_tier` and `distractor_error_type`:** Structurally present and use plausible taxonomies (L1/L2/L3 and Conceptual/Procedural/Lexical). AI-assigned; not human-reviewed at the distractor level. `distractor_tier` contains an undocumented 4th value (`foundational_gap`) appearing on 4 slots, outside the stated L1/L2/L3 schema **(CONFIRMED; accuracy unverified)**.

**Implication for taxonomy:** Nothing in Layer 3 can serve as a source for taxonomy content. The boilerplate is not a starting point — it must be replaced with authored content during Phase C (distractor content authoring), which comes *after* the taxonomy exists.

---

## 3. Why the Existing Structure Cannot Drive the Adaptive Diagnostic

The adaptive diagnostic needs to do more than report a skill failure. It needs to generate the strongest defensible hypothesis about what the student believes incorrectly. Without a stable cross-referenced misconception model, the system can only:

- Attribute errors to a skill
- Guess an error mechanism at runtime via regex matching (heuristic, unvalidated)
- Surface boilerplate text to the AI evaluation layer

It cannot attribute a wrong answer to a named, stable, trackable misconception, because no such named misconceptions exist in a referenceable form.

The three layers are structurally isolated. Layer 1 has the authoritative content but no IDs. Layer 2 has stable IDs but only encodes mechanisms. Layer 3 has the structural slots but 100% boilerplate content. The taxonomy is the bridge: it assigns stable IDs to Layer 1's content, maps those IDs to Layer 2's mechanism patterns, and provides the reference system that will eventually allow authored Layer 3 content to point at specific named misconceptions.

---

## 4. Proposed Taxonomy Design

### 4.1 ID Format

Proposed format:

```
MC-[DOMAIN]-[SKILL_ID]-[SEQ]
```

- **DOMAIN:** Two-to-four-letter domain code from the existing skill taxonomy. Examples: `DBDM`, `LEG`, `ETH`, `ACA`, `MBH`, `SAF`, `CON`, `SWP`, `PSY`, `RES`, `DEV`, `FAM`, `DIV`
- **SKILL_ID:** The skill identifier segment from the existing `skillId` key (e.g., `S01`, `01`, `02`)
- **SEQ:** Three-digit zero-padded sequence number within that skill, assigned during authoring

Illustrative format examples (not pre-assigned entries):

```
MC-DBDM-S01-001   MC-DBDM-S01-002   MC-DBDM-S01-003
MC-LEG-01-001     MC-ETH-02-001     MC-ACA-07-001
MC-MBH-03-001     MC-SAF-03-001     MC-CON-01-001
```

**Why this format:**

The domain segment enables filtering all misconceptions within a content area (e.g., all LEG misconceptions for a legal-domain follow-up probe). The skill segment aligns directly with existing `skillId` keys, making cross-reference trivial. The sequential number is stable once assigned regardless of whether the text of the misconception is later revised for clarity.

**What is not encoded in the ID:** Family classification. Family is a separate metadata field on the misconception entry. This keeps IDs stable when reclassification occurs — which will happen as the taxonomy matures.

### 4.2 Misconception Entry Structure (Conceptual Description — Not TypeScript)

A misconception entry is a record that captures:

- **Unique identifier** — the MC- ID assigned during authoring
- **Source skill identifier** — the `skillId` from `skill-metadata-v1.ts` that contains the source misconception text
- **Canonical text** — the misconception statement, sourced directly from `commonMisconceptions`. May be lightly edited for clarity during authoring; meaning must not change
- **Conceptual family** — one of the eight families defined in Section 4.3. A single misconception belongs to exactly one family
- **Related distractor pattern references** — a list of one or more `PatternId` values from `distractor-patterns.ts` that represent how this misconception typically manifests as a wrong answer. Mapping is many-to-many
- **Diagnostic item references** — a list of `questions.json` item IDs whose distractors plausibly target this misconception. Partial at authoring time; extended during distractor content work. An empty list is valid during initial authoring

**Important:** This section describes the *conceptual structure* of an entry. TypeScript type definitions and registry file authoring happen in the post-approval implementation branch (`feature/misconception-taxonomy-implementation`), not here.

### 4.3 The Eight Conceptual Families

Each family below includes: definition, what belongs, what does not belong, and anchor `PatternId` values from `distractor-patterns.ts`.

---

#### Family 1: `assessment-tool-confusion`

**Definition:** Selecting or recommending the wrong assessment instrument, reliability type, or measurement approach for a given purpose or population — confusing what a tool measures with what it is being used to answer.

**Belongs:**
- Confusing screening with diagnostic evaluation
- Confusing norm-referenced with criterion-referenced interpretation
- Confusing internal consistency reliability with test-retest stability
- Confusing progress monitoring with eligibility determination
- Applying an instrument designed for one construct or population to a purpose it does not serve
- Selecting a group instrument for an individually-administered decision

**Does not belong:**
- Errors about who has the authority to administer an instrument (→ `professional-scope`)
- Errors about legal eligibility criteria (→ `legal-ethical-boundary`)
- Applying a valid instrument in the wrong setting or population (→ `context-specificity`)

**Anchor PatternIds:** `similar-concept` · `context-mismatch` · `adult-criteria` · `definition-error`

---

#### Family 2: `professional-scope`

**Definition:** Taking an action or making a decision that falls outside the school psychologist's professional role, legal authority, or scope of practice — either overreaching or underreaching what the role requires.

**Belongs:**
- Investigating a suspected abuse situation instead of reporting it
- Prescribing or recommending medication as a treatment decision
- Acting unilaterally without required team involvement
- Exceeding legal authority by making eligibility decisions alone
- Taking on a clinical therapy role that exceeds school-based scope

**Does not belong:**
- Performing a valid within-scope action in the wrong sequence (→ `decision-sequence`)
- Misidentifying the legal threshold that defines an obligation (→ `legal-ethical-boundary`)
- Confusion about which specific law governs the role boundary (→ `legal-ethical-boundary`)

**Anchor PatternIds:** `role-confusion` · `legal-overreach` · `investigation`

---

#### Family 3: `decision-sequence`

**Definition:** Performing required procedural steps in the wrong order, skipping required prerequisites before acting, or failing to act when immediacy is required — errors of timing and sequencing rather than errors of what is appropriate.

**Belongs:**
- Acting before a required assessment is completed
- Making intervention decisions without reviewing existing data
- Skipping required consent or notification steps before proceeding
- Delaying action when the situation requires immediacy
- Reversing the required order of evaluation before placement steps

**Does not belong:**
- Errors about whether an action is within the professional's authority (→ `professional-scope`)
- Errors about what legal standard governs a notification (→ `legal-ethical-boundary`)
- Errors about which instrument to select at a given step (→ `assessment-tool-confusion`)

**Anchor PatternIds:** `premature-action` · `data-ignorance` · `sequence-error` · `delay` · `incomplete-response`

---

#### Family 4: `legal-ethical-boundary`

**Definition:** Misapplying a legal standard, confidentiality rule, or ethical threshold — either imposing an obligation that does not apply or failing to recognize one that does.

**Belongs:**
- Confusing IDEA with Section 504 or FERPA in determining what obligations apply
- Misidentifying what constitutes "imminent danger" sufficient to breach confidentiality
- Confusing FAPE with the "best possible" or "optimal" education
- Denying record access without a legally valid basis
- Releasing test protocols or raw data without required restrictions
- Applying the wrong legal standard to an eligibility or disciplinary determination

**Does not belong:**
- Role overreach errors that are not specifically about a legal standard (→ `professional-scope`)
- Sequencing errors in legally required notification steps (→ `decision-sequence`)
- Confusion between two similar legal concepts due to definitional fragility without a misidentified threshold (→ `conceptual-precision`)

**Anchor PatternIds:** `law-confusion` · `optimal-education` · `general-concerns` · `full-release` · `no-access`

---

#### Family 5: `behavioral-science-reasoning`

**Definition:** Misapplying behavioral science principles — particularly around function identification, behavioral causation, and the design of behavior support plans.

**Belongs:**
- Confusing behavioral functions (attention-seeking, escape, sensory, tangible access)
- Inferring a causal relationship from correlational behavioral data
- Selecting a replacement behavior that does not match the identified function of the problem behavior
- Focusing on punishment or consequence without analyzing the function first
- Designing a behavior plan that addresses topography rather than function

**Does not belong:**
- Instructional delivery errors unrelated to function identification (→ `instructional-procedural`)
- Role-scope errors about who conducts an FBA (→ `professional-scope`)
- General sequence errors in the assessment-before-intervention process (→ `decision-sequence`)

**Anchor PatternIds:** `correlation-as-causation` · `function-confusion` · `function-mismatch` · `punishment-focus`

---

#### Family 6: `conceptual-precision`

**Definition:** Confusing two related but genuinely distinct concepts, terms, cases, or frameworks in ways that indicate definitional fragility — knowing the general domain but getting the precise distinction wrong.

**Belongs:**
- Confusing similar landmark case names or misattributing their holdings
- Confusing related therapy models or consultation frameworks
- Applying a rule or standard categorically without attending to required contextual conditions
- Using absolute language (always, never, only) where the standard requires attending to conditions
- Conflating definitional terms where the distinction is clinically or legally operative (e.g., "optimal" vs. "appropriate")

**Does not belong:**
- Errors about a specific law or threshold that imposes a legal obligation (→ `legal-ethical-boundary`)
- Errors that involve selecting the wrong instrument type (→ `assessment-tool-confusion`)
- Errors about the sequence of applying a concept (→ `decision-sequence`)

**Anchor PatternIds:** `similar-concept` · `extreme-language` · `case-confusion` · `model-confusion` · `absolute-rules` · `definition-error`

---

#### Family 7: `instructional-procedural`

**Definition:** Applying an incomplete, undersupported, or structurally inadequate version of an intervention or professional procedure — errors of missing components or inadequate implementation fidelity.

**Belongs:**
- Providing instruction without practice opportunities or corrective feedback
- Missing required supervisory hours or contact criteria
- Excluding required participants from a team decision or intervention plan
- Delivering an intervention without its required structural or dosage components
- Submitting an incomplete evaluation or plan that is missing a mandated element

**Does not belong:**
- Using a valid procedure in the wrong context or population (→ `context-specificity`)
- Role-scope errors about who has authority to deliver the intervention (→ `professional-scope`)
- Errors about the order in which intervention components are delivered (→ `decision-sequence`)

**Anchor PatternIds:** `instruction-only` · `insufficient-hours` · `inclusion-error`

---

#### Family 8: `context-specificity`

**Definition:** Applying a valid, appropriate approach in the wrong context or for the wrong population — errors where the strategy itself is sound but the application is mismatched to the situation.

**Belongs:**
- Applying adult diagnostic criteria or normative standards to a pediatric population
- Using a group-administered instrument for an individual diagnostic decision
- Applying a general population intervention to a student with specific needs that require adaptation
- Using a valid general strategy in a specialized situation that requires population-specific approach

**Does not belong:**
- Selecting the wrong instrument type entirely — not knowing what it measures (→ `assessment-tool-confusion`)
- Errors that are specifically about legal eligibility standards that vary by context (→ `legal-ethical-boundary`)
- Sequencing errors where the approach is valid but applied too early or too late (→ `decision-sequence`)

**Anchor PatternIds:** `context-mismatch` · `adult-criteria` · `inclusion-error`

---

### 4.4 Mapping Rules

#### Rule 1: Taxonomy to Skill-Level Misconceptions (Source of Truth)

Every taxonomy entry traces to exactly one statement in `skill-metadata-v1.ts` `commonMisconceptions[]`. The array position of the source statement does not determine the MC- ID; sequential numbering is assigned during authoring, starting at 001 within each skill.

The canonical text of a taxonomy entry is the source `commonMisconceptions` text, which may be lightly edited for clarity (correcting grammar, improving specificity) but whose core meaning must not change. New misconception content may not be invented during taxonomy authoring.

During authoring, if a source statement is ambiguous or incomplete, that ambiguity is documented as an authoring note on the entry rather than resolved by inference.

#### Rule 2: Taxonomy to Distractor Patterns (Error Mechanism Linkage)

Each taxonomy entry carries a list of related `PatternId` values representing how this misconception typically manifests as a wrong answer choice. Mapping is many-to-many:

- One misconception entry may relate to multiple patterns (e.g., an FAPE misconception may relate to both `optimal-education` and `definition-error`)
- One pattern may apply to many misconceptions (e.g., `similar-concept` applies across dozens of entries in multiple families)

The two layers serve different purposes and must not be merged. Patterns describe *how* a student goes wrong. Taxonomy entries describe *what incorrect belief* drives the error. Both are necessary; neither replaces the other.

When a pattern maps cleanly to a specific misconception content (`optimal-education` → the belief that FAPE requires optimal education), the relationship is 1:1. When a pattern is a structural category (`similar-concept`), the relationship is 1:many. Both are valid; the relationship type is implicit in the mapping, not encoded separately.

#### Rule 3: Taxonomy to Diagnostic Items (Item Linkage)

Each taxonomy entry carries a list of diagnostic item IDs for `questions.json` items whose distractors plausibly target this misconception. This list is built by:

1. Matching the taxonomy entry's `skillId` to questions with the same `skill` field in `questions.json` (narrows to the relevant skill)
2. Reviewing whether the distractor options' intended appeal aligns with the misconception statement

This list will be partial at initial taxonomy authoring time. It is extended during distractor content authoring (Phase C), not during taxonomy creation. An entry with an empty item list is valid during the initial authoring phase.

The item linkage is the bridge between the taxonomy and the diagnostic items that will eventually carry authored distractor descriptions referencing specific MC- IDs.

---

## 5. What Belongs in the Taxonomy vs. What Stays Item-Specific

### In the taxonomy

Named, recurring, human-authored incorrect beliefs that:

- Appear in `skill-metadata-v1.ts` `commonMisconceptions[]`
- Are stable enough to track across multiple questions over time
- Represent a specific identifiable belief, not just a category of error

The taxonomy's ~112 entries cover all skill-level misconceptions with stable IDs and family classifications.

### Stays item-specific

The per-distractor appeal rationale: why *this specific* wrong answer option is plausible on *this specific* question. This belongs in an authored `distractor_misconception_X` field in `questions.json`, not in the shared taxonomy. It is too granular and context-dependent to normalize. A good authored distractor description does not replace the taxonomy entry — it references it. The distractor description explains the specific situational appeal; the taxonomy entry names the underlying belief.

### Not in either

- Auto-generated boilerplate from the current `distractor_misconception` fields — not authoritative
- Ephemeral case-pattern `commonMistake` strings from AI-synthesized study plans — not reproducible or stable
- Runtime inferences from `distractor-matcher.ts` — unvalidated heuristics
- The content of `top_misconception_themes` — domain-level templates with no specificity, confirmed orphaned

---

## 6. Confirmed Facts vs. Open Design Questions

### Confirmed Facts

All findings below are directly evidenced in audit files from the `feature/misconception-taxonomy-and-diagnostic-content-audit` branch.

- `skill-metadata-v1.ts` contains ~112 human-authored misconception statements across 45 skills with 100% skill coverage
- No stable IDs exist on any skill-level misconception entry
- `distractor-patterns.ts` defines exactly 28 stable `PatternId` values — the only stable misconception-related IDs in the codebase
- Question-level `distractor_misconception` fields: 0 of 748 content-valid in the diagnostic bank; all are auto-generated boilerplate
- Question-level `distractor_skill_deficit` fields: 0 of 748 content-valid; all are word fragments from option text
- `dominant_error_pattern` = `"concept_substitution"` for all 250 diagnostic items — zero variance
- `error_cluster_tag` has 2 values across 250 items: `theory_substitution` (86.4%) and `procedure_inversion` (13.6%)
- `top_misconception_themes` is an orphaned field with no code consumer
- `distractor_tier` and `distractor_error_type` are plausible AI-assigned taxonomies, unverified at the distractor level; `distractor_tier` has an undocumented 4th value (`foundational_gap`) on 4 slots
- `focusItemExtractor.ts` sources misconception-type focus items from synthesized case patterns and study plan fields, not directly from `skill-metadata-v1.ts` `commonMisconceptions`
- No `MisconceptionId` type exists in `src/types/` **(INFERRED from comprehensive structure inventory — confirm via direct inspection during implementation branch)**
- None of the three misconception-related layers cross-reference each other by stable ID

### Open Design Questions

These questions require answers before the implementation branch (`feature/misconception-taxonomy-implementation`) can be scoped. They are listed in Section 7.

---

## 7. Approval Decisions Required Before Implementation

This section defines the four decisions that must be made before the implementation branch begins. Each is framed with options and implications.

---

**Decision 1 — ID Schema**

*Question:* Is `MC-[DOMAIN]-[SKILL_ID]-[SEQ]` the right format?

*Options:*
- (a) Approve as proposed
- (b) Richer encoding — embed family code in the ID (e.g., `MC-DBDM-S01-FAM1-001`)
- (c) Flat numeric registry — no domain or skill encoding (e.g., `MC-0001`)
- (d) Propose a different format

*Implication:* The ID format locks before registry authoring begins. Changing it after 112 entries are authored requires renaming all IDs.

---

**Decision 2 — Eight-Family Structure**

*Question:* Do the eight families defined in Section 4.3 correctly partition the misconception space for the diagnostic use case?

*Options:*
- (a) Approve as defined
- (b) Merge two or more families (specify which)
- (c) Split a family (specify which and how)
- (d) Rename families without structural change

*Implication:* Family names and boundaries lock before any taxonomy entries are assigned families. The family field on each entry must be drawn from the approved set.

---

**Decision 3 — Linking Strategy**

*Question:* Where does the taxonomy registry live relative to existing files, and how is it cross-referenced?

*Options:*
- (a) Separate registry — a new standalone file (format and location to be decided in the implementation branch) cross-referenced by MC- ID from other files
- (b) Inline annotation — entries added directly to `skill-metadata-v1.ts` as companion fields alongside existing `commonMisconceptions` arrays
- (c) Hybrid — separate registry with a light reference annotation in `skill-metadata-v1.ts` (e.g., each `commonMisconceptions` entry gains an `mcId` string field pointing to the registry entry)

*Implication:* This decision determines which files are created and which (if any) are modified in the implementation branch. Options (b) and (c) require modification of `skill-metadata-v1.ts`; Option (a) does not.

---

**Decision 4 — focusItemExtractor.ts Routing**

*Question:* The current `focusItemExtractor.ts` sources misconception-type focus items from synthesized study plan fields rather than from the canonical skill-level misconception layer. Is this intentional design, or should the taxonomy eventually wire into this extractor?

*Context:* The audit confirmed the bypass behavior but did not resolve whether it is by design (case patterns are considered a better student-facing format than raw misconception statements) or an oversight. This question requires confirmation from the original design intent, reviewable via git history or code comments.

*Options:*
- (a) Intentional — case pattern path stays; taxonomy serves the diagnostic branching path only, not the study plan focus item path
- (b) Oversight — the implementation branch should include a wiring step to route taxonomy entries as a source for misconception-type focus items
- (c) Defer — wire taxonomy first in the implementation branch; assess the extractor routing question in a subsequent branch

*Implication:* Option (b) expands the scope and risk profile of the implementation branch. Option (a) keeps it narrower. Option (c) is the lowest-risk starting point if the design intent cannot be confirmed before the branch begins.

---

*End of document. No source code changes proposed. No TypeScript types drafted. No registry files created. All four decisions in Section 7 must be resolved before implementation begins.*
