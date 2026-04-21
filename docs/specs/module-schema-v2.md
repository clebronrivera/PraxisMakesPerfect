# Module Schema v2 — Multi-Module Learning Paths

## Overview

The **v2 module schema** extends the `LearningModule` interface with optional fields that enable content authors to structure learning journeys in three distinct patterns:

1. **Primary modules** — foundational lessons that stand alone
2. **Extension modules** — parallel, independent deepeners that assume prior knowledge
3. **Sequence modules** — part of an ordered progression (e.g., "intro → intermediate → advanced")

This spec explains why these patterns matter, what each field does, and how to author modules using them.

---

## Problem: The "Why Multi-Module" Paradigm

Today, every module is treated as atomic — you read one, then pick the next. This works fine for isolated topics, but breaks down for scaffolded learning:

- **Scaffolded skill**: "Consultation Models" (CON) has 3 building blocks: Caplan's theory → collaborative principles → PLC frameworks. Each could be a lesson. But the system has no way to signal which comes first, or to show that lessons 2 and 3 are optional extensions of lesson 1.

- **Domain deepening**: A user masters "FERPA Basics" (primary) and wants to go deeper into "Parental Consent Exceptions" (extension). Both exist as separate modules, but there's no link between them in the learning path UI.

- **Sequential practice**: A user completes module 1 of a 3-part chain. They should not see module 3 until modules 1–2 are done.

The v2 schema solves this by letting authors declare:
- Which modules are related
- What order they belong in (if any)
- Which modules unlock others (prerequisites)

---

## New Fields — What Each Does

All fields are **optional**. Existing modules without them continue to work as before.

### `role?: 'primary' | 'extension' | 'sequence'`

**Purpose:** Declare the module's place in a multi-module structure.

**Rules:**
- `'primary'` — Foundational, can stand alone. No prerequisites. Typically 1–2 per topic.
- `'extension'` — Parallel or deeper. Assumes the reader has completed a related primary module first. Optional; visible after primary is done.
- `'sequence'` — Part of an ordered chain. Must have `sequenceGroup` and `sequenceIndex`.

**When to use:**
- Use `'primary'` for core, must-know content (e.g., "FERPA and Student Confidentiality").
- Use `'extension'` for optional go-deeper or parallel topics (e.g., "FERPA: Parental Consent Exceptions" assumes FERPA basics are known).
- Use `'sequence'` when modules genuinely must be read in order (e.g., three-part intro-intermediate-advanced chain).

**Example:**

```json
{
  "id": "MOD-D1-01",
  "title": "FERPA and Student Confidentiality",
  "role": "primary",
  "sections": [...]
}
```

```json
{
  "id": "MOD-D1-02",
  "title": "FERPA: Parental Consent Exceptions",
  "role": "extension",
  "prerequisiteModuleIds": ["MOD-D1-01"],
  "sections": [...]
}
```

---

### `sequenceGroup?: string`

**Purpose:** Label all modules in the same ordered progression.

**Rules:**
- Only meaningful when `role === 'sequence'`.
- All modules in the group share the same `sequenceGroup` value.
- Must be kebab-case (lowercase, hyphens). Examples: `"consultation-models-chain"`, `"iep-writing-progression"`.
- Acts as a key for UI reordering: when rendering a learning path, all modules in the same `sequenceGroup` appear together, sorted by `sequenceIndex`.

**Why:** Without this, the UI has no way to know that MOD-D2-05, MOD-D2-06, and MOD-D2-07 form a single progression and should be grouped and ordered together.

**Example:**

```json
{
  "id": "MOD-D2-05",
  "title": "Caplan's Consultation Model: Core Theory",
  "role": "sequence",
  "sequenceGroup": "consultation-models-chain",
  "sequenceIndex": 1,
  "sections": [...]
}
```

```json
{
  "id": "MOD-D2-06",
  "title": "Applying Caplan: Consultee-Centered Approach",
  "role": "sequence",
  "sequenceGroup": "consultation-models-chain",
  "sequenceIndex": 2,
  "sections": [...]
}
```

```json
{
  "id": "MOD-D2-07",
  "title": "Moving Beyond Caplan: Collaborative Consultation",
  "role": "sequence",
  "sequenceGroup": "consultation-models-chain",
  "sequenceIndex": 3,
  "sections": [...]
}
```

---

### `sequenceIndex?: number`

**Purpose:** Define the position within a `sequenceGroup`.

**Rules:**
- Only meaningful when `role === 'sequence'`.
- Must be 1-based (1, 2, 3, … not 0, 1, 2, …).
- Must be unique within the `sequenceGroup`.
- UI sorts sequence modules by this number.

**Why:** When multiple modules have `role === 'sequence'` and the same `sequenceGroup`, the UI needs to know their order. `sequenceIndex` provides it.

**Example:** See `sequenceGroup` examples above. The three modules have indices 1, 2, 3.

---

### `prerequisiteModuleIds?: string[]`

**Purpose:** Declare which modules must be completed before this one is unlocked.

**Rules:**
- Can contain multiple module IDs (e.g., `["MOD-D1-01", "MOD-D2-03"]` means both must be done first).
- Typical use: extension modules list the primary module they extend.
- Can also be used for arbitrary prerequisite chains (e.g., "IEP Writing" requires "IDEA Basics").
- Empty array means no prerequisites.

**When to use:**
- Use for extensions that assume knowledge from a primary (e.g., "Parental Consent Exceptions" requires "FERPA Basics").
- Use for any module that requires specific prior reading.
- Leave empty if the module is self-contained.

**Example:**

```json
{
  "id": "MOD-D1-02",
  "title": "FERPA: Parental Consent Exceptions",
  "role": "extension",
  "prerequisiteModuleIds": ["MOD-D1-01"],
  "sections": [...]
}
```

```json
{
  "id": "MOD-D3-05",
  "title": "Writing an IEP Accommodation Section",
  "role": "primary",
  "prerequisiteModuleIds": ["MOD-D3-01", "MOD-D3-02"],
  "sections": [...]
}
```

---

### `concepts?: string[]`

**Purpose:** Tag modules with concept keywords for flexible knowledge mapping.

**Rules:**
- Array of kebab-case strings (e.g., `["FERPA", "confidentiality-exceptions", "parental-consent"]`).
- No limit on array size; tags are free-form.
- Used by search/discovery and concept-level analytics (future).

**When to use:**
- Use for concept tagging that spans multiple skills (e.g., "FERPA" appears in CON, RES, and ACC skills; tag all three module sets with `"FERPA"`).
- Use for regulation references (e.g., `"IDEA"`, `"ADA"`, `"504-plan"`).
- Use for role tags (e.g., `"teacher-facing"`, `"admin-facing"`).
- Do not use to replace the skill-to-module mapping in SKILL_MODULE_MAP; concepts are additive metadata.

**Example:**

```json
{
  "id": "MOD-D1-01",
  "title": "FERPA and Student Confidentiality",
  "role": "primary",
  "concepts": ["FERPA", "confidentiality", "student-records", "disclosure-rules"],
  "sections": [...]
}
```

---

## UI Behavior — How Fields Change the Learning Path Display

Once modules populate these fields, the UI will render them with visual cues:

### Primary Modules
- Rendered with a **filled dot** (●) indicator.
- Appear first in the learning path UI, grouped by skill.
- No lock icon.

### Extension Modules
- Rendered with an **outline dot** (○) indicator.
- Only visible after their prerequisite primary module(s) are marked complete.
- Display a small info badge: "Deepens: [primary title]".

### Sequence Modules
- Rendered with a **number badge** (1, 2, 3, …) showing position within the chain.
- All modules in the same `sequenceGroup` are grouped together and sorted by `sequenceIndex`.
- Each module (except the first) shows a small lock icon until its predecessor in the sequence is complete.
- Example chain display:
  ```
  1. Caplan's Consultation Model: Core Theory [completed]
  2. Applying Caplan: Consultee-Centered Approach [in progress, lock unlocked]
  3. Moving Beyond Caplan: Collaborative Consultation [locked, waiting for step 2]
  ```

### Prerequisites
- Any module with `prerequisiteModuleIds` shows a **small lock icon** until all prerequisites are complete.
- Hovering over the lock shows: "Requires: [prerequisite titles]".
- Once all prerequisites are complete, the lock disappears and the module becomes clickable.

---

## Content Author Workflow

When writing or editing a module, ask these questions:

1. **Is this module self-contained or part of a larger structure?**
   - Self-contained → `role: 'primary'`
   - Part of a multi-step chain → `role: 'sequence'` (set `sequenceGroup` and `sequenceIndex`)
   - Deeper dive on a primary → `role: 'extension'` (set `prerequisiteModuleIds`)

2. **Does this module assume the reader has read another module first?**
   - If yes, add that module's ID to `prerequisiteModuleIds`.

3. **What concepts or regulations does this module cover?**
   - Add kebab-case tags to `concepts` for searchability and analytics.

4. **If this is a sequence module, what is its position in the chain?**
   - Set `sequenceGroup` to a kebab-case label shared by all modules in the chain.
   - Set `sequenceIndex` to 1, 2, 3, … (1-based).

### Example: Authoring a FERPA Extension

```json
{
  "id": "MOD-D1-02",
  "title": "FERPA: Parental Consent Exceptions",
  "role": "extension",
  "prerequisiteModuleIds": ["MOD-D1-01"],
  "concepts": ["FERPA", "parental-consent", "confidentiality-exceptions", "disclosure-rules"],
  "sections": [
    {
      "type": "paragraph",
      "text": "You've learned FERPA's core rules. Now, a critical exception: when parents must give written consent..."
    },
    // ... rest of sections
  ]
}
```

### Example: Authoring a Sequence Chain

```json
// Module 1 of 3
{
  "id": "MOD-D2-05",
  "title": "Caplan's Consultation Model: Core Theory",
  "role": "sequence",
  "sequenceGroup": "consultation-models-chain",
  "sequenceIndex": 1,
  "concepts": ["Caplan-theory", "consultation-models", "consultee-centered"],
  "sections": [...]
}

// Module 2 of 3
{
  "id": "MOD-D2-06",
  "title": "Applying Caplan: Consultee-Centered Approach",
  "role": "sequence",
  "sequenceGroup": "consultation-models-chain",
  "sequenceIndex": 2,
  "concepts": ["Caplan-theory", "consultation-models", "consultee-centered", "teacher-barriers"],
  "sections": [...]
}

// Module 3 of 3
{
  "id": "MOD-D2-07",
  "title": "Moving Beyond Caplan: Collaborative Consultation",
  "role": "sequence",
  "sequenceGroup": "consultation-models-chain",
  "sequenceIndex": 3,
  "concepts": ["Caplan-theory", "collaboration", "consultation-models", "pLC-frameworks"],
  "sections": [...]
}
```

---

## Migration Notes (Future Implementation)

This spec describes the **schema additions only**. Populating existing modules with these fields is a separate, future pass. When that pass happens:

1. A content author will review each module and decide its role.
2. For each primary module, identify any related extensions or sequences.
3. Add the fields to `src/data/learningModules.ts`.
4. Update `docs/HOW_THE_APP_WORKS.md` if UI behavior changes.
5. Test the learning path UI to verify correct grouping, sorting, and unlock behavior.

**No modules are required to populate these fields.** Modules without them will continue to render as standalone lessons, exactly as they do today.

---

## Summary

| Field | Purpose | Typical Value |
|---|---|---|
| `role` | Module's place in a multi-module structure | `'primary'`, `'extension'`, or `'sequence'` |
| `sequenceGroup` | Label for an ordered progression | `'consultation-models-chain'` (kebab-case) |
| `sequenceIndex` | Position within sequence (1-based) | 1, 2, 3, … |
| `prerequisiteModuleIds` | Modules that must be read first | `['MOD-D1-01']` |
| `concepts` | Topic tags for discovery and analytics | `['FERPA', 'confidentiality-exceptions']` |

**All fields are optional.** Existing modules work unchanged.
