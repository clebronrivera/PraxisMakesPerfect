# How to Build This App (Rewrite Development Guide)

> Status: Canonical source. Reviewed during documentation consolidation on 2026-03-14. This remains the architectural authority when older docs conflict, especially on Praxis-first structure, taxonomy-driven classification, and `skillId`-based domain resolution.

This document is the single source for how to develop the Praxis study app from the ground up. It describes **what** to build, **in what order**, and **why**, using concepts and roles rather than existing file names. Follow it when rewriting the codebase so the result is stable, analytics-ready, and aligned with the app’s purpose and outcomes.

---

## Part 1: Purpose and Outcomes (Design Targets)

**What the app is for**

- **Purpose:** A smart study app for the **Praxis School Psychologist (5403) exam** that (1) organizes content by the **Praxis content areas** (the exam's primary structure), (2) diagnoses weaknesses via a skills screener, (3) adapts practice to deficit areas, (4) tracks not only correctness but how the user thinks, and (5) delivers targeted practice (from a bank and optionally generated items). NASP practice domains are used as an analytical lens for understanding *why* a user missed a question and *what* they need to study, but the Praxis content areas are the authoritative structure for assessment building, distribution, scoring, and user-facing reporting.

- **Target outcomes**
  - User clearly sees **where they are weak** (domains, skills, error types).
  - User **improves over time** via adaptive practice and feedback.
  - User is **exam-ready** (full-length simulation, timing, and format).
  - Platform can **improve long-term** (content quality, item difficulty, pedagogy) using response data.

Every major design choice should support at least one of these outcomes.

---

## Part 2: Foundational Principles

### 2.1 One source of truth for “what happened”

- **Response events** are the only record of each answer. Every submission (screener, full assessment, practice) writes one event to a single store (e.g. a “responses” collection keyed by user).
- **No parallel summaries.** Do not maintain a separate “history” or “practice log” array that duplicates or drifts from the event stream. Anything that looks like “progress” or “weakness” is derived from events (or a cached view that is updated only from events).

### 2.2 Profile is a derived view

- Domain scores, weakest domains, skill performance, factual gaps, error patterns, and “areas to work on” are **computed** from response events—on assessment completion, on demand, or via a background job.
- The persisted “profile” document is a **cache** of that computation (e.g. last completion flags, last session pointers, and last computed weakness summary). It is updated when you run the computation (e.g. after an assessment or when opening the dashboard), not by incrementally appending to arrays.

### 2.3 One session model

- A **session** is a single abstraction: an in-progress or completed run of a screener, full assessment, or practice.
- It has: type (screener / full / practice), list of question IDs, current index (if in progress), start time, and—when completed—end time and completion flag. Optionally attach a stable session ID and user ID for resume and “view report.”
- “Resume” and “start new” are operations on this model. There is one place that defines the session shape and one place that persists/loads it (whether in memory, local storage, or the backend).

### 2.4 One content source and one assessment builder

- **Content:** One question bank (e.g. a single JSON or module that exports the list of questions). One domain/skill taxonomy that defines the canonical hierarchy: **Praxis content area → domain → skill**. No duplicate copies of the same taxonomy or bank in different places.
- **Assessment building:** One module that knows how to build (a) the screener and (b) the full-length assessment. The screener should prioritize broad skill coverage for adaptive practice and study-plan seeding. The **Praxis content areas and their percentage weights** are the primary structure for distributing questions on the full assessment. Domains and skills are used *within* each content area for finer-grained selection, but the top-level distribution must match the Praxis blueprint. The UI only calls these builders; it does not implement its own selection logic.

### 2.5 Praxis content areas are the primary structure; NASP domains are the analytical lens

This distinction is critical and must not be blurred:

- **Praxis content areas** (Professional Practices, Student-Level Services, Systems-Level Services, Foundations) define **what the exam tests and how it is weighted.** Assessment distribution, scoring, and user-facing performance reporting are organized by Praxis content areas first.
- **NASP practice domains** (the 10 numbered domains) are a professional-practice framework that provides **analytical value**: understanding *why* a user got something wrong, *what* content area they need to study, and mapping skills to professional competencies. They are sub-dimensions within the Praxis structure, not the other way around.
- **Do not** use NASP domains as the primary unit for assessment building, question distribution, or top-level performance reporting. The exam is Praxis-structured; the app must match.
- **Do not** infer domain membership from question text keywords at runtime. Domain assignment comes from the question's `skillId`, which maps to a domain via the skill taxonomy. Keyword heuristics are fragile, produce incorrect tags, and corrupt everything downstream (weakness detection, adaptive practice, reporting).

---

## Part 3: Core Data Shapes (Foundational Information)

Define these first; everything else builds on them.

### 3.1 Response event (one per answer)

Every answer, in every flow, writes an event with this shape (or equivalent):

- **Identity:** user ID, session ID, assessment type (screener / full / practice).
- **Item:** question ID, skill ID (if any), list of domain IDs for that question.
- **Outcome:** correct/incorrect, full list of selected answer letters, full list of correct answer letters, time spent, confidence (e.g. low/medium/high).
- **Diagnostics (when wrong):** error type or distractor pattern ID (e.g. premature-action, role-confusion, similar-concept) so the app can say “you often skip the first step” and so analytics can aggregate by pattern.
- **Timestamp:** when the answer was submitted (for ordering and platform metrics).

Store these in one stream only (e.g. one collection or table per user). All reporting and weakness analysis read from this stream.

### 3.2 Session (in-progress or completed)

- **In-progress:** type, question IDs, current index, start time, and—if you need resume—a stable session ID and user ID. Optionally store the last few answers in memory only; the source of truth for “what was answered” is the response events.
- **Completed:** same IDs and type, plus completed-at time and a completed flag. Optional: store a small summary (e.g. score, domain breakdown) for fast “list my assessments” without re-reading all events.

### 3.3 Profile (cached derived view)

- **Completion flags:** e.g. “screener completed,” “full assessment completed.”
- **Last-session pointers:** e.g. last screener session ID, last full-assessment session ID, last practice session ID and index (for resume).
- **Derived weakness (cached):** domain scores, weakest domain IDs, skill-level performance, factual gaps, top error patterns. These are recomputed from response events and then written here so the UI does not recompute on every load. Optionally: total questions seen, streak, practice response count.
- **No long arrays:** do not store “all practice responses” or “all generated question IDs seen” in the profile. Use a count or a bounded recent list (e.g. last N question IDs for practice) if needed; the full truth is in the event stream.

### 3.4 Question and taxonomy

- **Question:** id, stem text, choices (e.g. letter → text), correct answer letters (one or more), rationale, and a **required `skillId`**. Optionally: source (bank vs generated), template ID for generated items. A question's domain and Praxis content area are **not stored on the question** — they are **resolved at runtime** from the `skillId` via the taxonomy (see below). If a question in the bank does not have a `skillId`, it must be assigned one during content curation; questions without a `skillId` cannot be reliably classified.
- **Domain/skill taxonomy (canonical hierarchy):** one structure that defines the chain: **Praxis content area → domain → skill cluster → skill**.
  - Each **Praxis content area** has an ID, name, percentage weight (matching the official Praxis blueprint), and a list of domain IDs it contains.
  - Each **domain** has an ID, name, short name, and a list of skill clusters.
  - Each **skill** has an ID, name, description, and belongs to exactly one domain (and therefore exactly one Praxis content area).
  - **Resolution rule:** given a `skillId`, the domain is determined by the taxonomy (e.g. `DBDM-S01` → domain 1 → Professional Practices). This is the *only* way to assign a domain to a question. Do not infer domains from question text, keywords, or rationale content.
  - The question bank and the assessment builder both use this taxonomy. The weakness detector, adaptive selector, and all reporting components also resolve domains through this chain.

---

## Part 4: Build Order (What to Build First)

Use this order so each step has a clear foundation and you never introduce a second source of truth.

### Phase A: Types and content (no UI)

1. **Define shared types** for: response event, session (in-progress and completed), profile (cached view), question, and domain/skill taxonomy (with the Praxis content area → domain → skill chain). Put them in one place so the rest of the app imports from there.
2. **Implement the single content source:** load the question bank and the domain/skill taxonomy from one module or one set of files. Expose all questions and the canonical taxonomy (Praxis content areas, domains, skills) from that module. Every question must have a `skillId`; domain and Praxis content area are resolved from the taxonomy, never inferred from question text.
3. **Implement the single assessment builder:** one function that builds the screener, one that builds the full assessment. The screener should distribute questions to ensure broad skill coverage for downstream adaptive guidance. The full assessment distributes questions by **Praxis content area percentages first** (Professional Practices ~32%, Student-Level ~23%, Systems-Level ~20%, Foundations ~25%), then within each content area distributes across its domains proportionally. Both take the full question list and optional exclusion set; both return an ordered list of questions. Domain assignment for each question comes from its `skillId` via the taxonomy — not from keyword inference. No other code should implement its own question-selection logic for assessments.

### Phase B: Response event store and session model

4. **Implement the response-event store:** “append one event” and “list events for a user (optionally by session ID, time range, or assessment type).” All flows will call “append one event” with the same event shape. Backend or local storage is an implementation detail.
5. **Implement the session model:** create session (generate session ID, store type and question IDs, start time), update session (e.g. current index, optional completion time), load session (by ID or “last in-progress for user”). One module or layer owns this; UI and resume logic use it only through this API.

### Phase C: Deriving the profile from events

6. **Implement weakness computation:** a pure function that takes a list of response events (and the question bank or a minimal question lookup) and returns: domain scores, weakest domain IDs, skill performance summary, factual gaps, top error patterns. This is the “derive profile from events” logic.
7. **Wire profile updates:** when an assessment is completed (or when the user opens the dashboard), load the relevant response events for that session (or for “all practice”), run the weakness computation, and write the result into the profile cache (completion flags, last-session IDs, and derived weakness). Do not update the profile by appending to arrays; only replace or merge the cached derived view.

### Phase D: Authentication and persistence

8. **Authentication:** identify the user (anonymous or signed-in). All response events and sessions are keyed by user ID. Profile is per user.
9. **Persistence:** ensure response events and profile (and optionally session metadata) are stored in a backend (e.g. Firestore) so they survive refresh and devices. Keep one response-event store and one profile document (or equivalent) per user.

### Phase E: User flows (UI)

10. **Login / home:** show sign-in options; after auth, show home (stats from profile, “view report” if completed, “resume” if there is an in-progress session, and buttons to start the screener, full assessment, or practice).
11. **Screener flow:** start screener (create session via assessment builder, create session record), show one question at a time, capture answer + confidence + time, append one response event per answer, update session index. On last question: mark session completed, load events for that session, run weakness computation, update profile cache, navigate to score report.
12. **Full assessment flow:** same as screener but use the full-assessment builder and full-assessment session type. Same event shape and same “on complete → compute → update profile → show report” path.
13. **Score report:** input is “list of response events for this session” (from state or from “load events by session ID”). Compute or reuse domain scores, weakest domains, and error patterns; show summary, domain breakdown, and “start practice” / “view teach” / “go home.” Reports are always rebuildable from events (e.g. “view last report” = load last session ID from profile, load events for that session, render report).
14. **Practice flow:** “next question” is chosen by a single adaptive selector that reads only from the profile cache (weakest domains, skill performance, optional recent-question IDs) and the question bank (and optionally a question generator). Append one response event per answer; update profile cache periodically (e.g. after each answer or on exit) from events so the selector stays accurate. Do not maintain a separate “practice history” array in the profile.
15. **Teach / review flow:** input = “questions from last full assessment (or wrong-only)” and “response events for that session.” Show questions with explanations; optionally let the user “flag for review” (store a small list of question IDs in profile or as tags). Do not write “practice history” or long arrays back to the profile.
16. **Resume and “view report”:** resume = load in-progress session by ID, restore question list and index, continue from there. View report = load session ID from profile, load response events for that session, run report UI. Both rely on the single session model and the single event store.

### Phase F: Polish and analytics-ready surface

17. **Error type per wrong answer:** when the user submits a wrong answer, run a small “match distractor to pattern” (or “infer error type”) step and store that pattern/type in the response event. Weakness computation and future analytics use this field; no need to re-parse answer text later.
18. **Platform metrics (optional):** if you want item difficulty or distractor analytics later, the event schema already supports it (question ID, correct/incorrect, time, pattern ID). Add a thin layer (e.g. batch job or export) that reads from the event store and aggregates; do not change the event shape.

---

## Part 5: Things to Keep in Mind

These are design constraints that keep the architecture stable. Treat them as the intended shape of the system rather than as reactions to problems.

- **One assessment builder:** There is exactly one place that builds the screener and one that builds the full assessment (or one function with a mode). The UI only calls that layer; it does not implement its own question selection for assessments.
- **Profile stays a cache:** The profile holds completion flags, last-session pointers, and a cached weakness summary. It does not hold “all practice responses” or “all generated question IDs.” Use a count or a bounded recent list (e.g. last N question IDs) if needed; the event stream remains the source of truth.
- **Reports are always rebuildable:** The score report can always be produced from “session ID → load events → compute.” It never depends only on in-memory state, so refresh or re-entry still shows the report.
- **No duplicate history:** Any “recent” or “history” view reads from the event store (or a cached slice derived from it). There is no separate “history” array in the profile that mirrors the event stream.
- **One content source:** Domain and skill definitions live in one taxonomy; the question bank has one canonical source. All features that need questions or taxonomy read from that place.
- **Praxis content areas are the top-level frame:** Assessment distribution, top-level scoring, and the primary user-facing performance view are organized by Praxis content areas. NASP domains are drill-down detail within each content area, not the top-level grouping.
- **Taxonomy-driven domain assignment only:** A question’s domain comes from its `skillId` via the skill taxonomy. No code should assign domains by scanning question text for keywords. If a question lacks a `skillId`, it must be tagged in content curation, not guessed at runtime.

---

## Part 6: Tracking Changes and Maintaining Quality

To keep the codebase from drifting or overcomplicating over time, maintain a few simple habits and a single place for “what we’re doing” and “what changed.”

### 6.1 Single source for scope and tasks

- **Scope document:** Keep one document (or section) that lists every user-facing capability and acceptance criteria—what the app does from the user’s point of view. When adding a feature, update this list. When in doubt about whether something is in scope, this is the reference.
- **Tasks and priorities:** Use one place (e.g. a task list, backlog, or plan file) to track what’s next and what’s in progress. Avoid scattering “what we need to do” across chat logs, comments, or multiple docs. That way the team (or future you) always has a single place to look for “what to build” and “what’s done.”

### 6.2 Changelog

- **Maintain a changelog:** Keep a changelog (e.g. a `CHANGELOG` file or a “Releases” section) that records notable changes: new features, behavior changes, and important fixes. Use a simple format (e.g. date or version + short bullets). This helps:
  - See how the app evolved and why certain decisions were made.
  - Avoid reintroducing removed behavior or “old” patterns.
  - Keep the rewrite guide and the actual code aligned: when you change architecture or data shape, note it in the changelog and, if needed, in this guide.
- **Link design decisions to the guide:** When you make a change that affects the foundational principles (e.g. event shape, profile fields, or “one builder”), note it in the changelog and ensure this development guide still matches the code. That keeps the guide the single source for “how we build” and prevents drift.

### 6.3 Guardrails against drift and overcomplication

- **Before adding a new “source of truth”:** Ask whether the new state could be derived from the event store or the profile cache. If yes, derive it instead of storing it separately.
- **Before adding a new builder or content path:** Ask whether it can live in the existing assessment builder or content source. If yes, extend that module instead of creating a second one.
- **When in doubt:** Prefer one place for each concept (events, session, profile, content, builder). The checklist in Part 7 and the “Things to Keep in Mind” above are the guardrails; the changelog and scope document help you notice when you’re about to step past them.

---

## Part 7: Checklist Before You Call the Rewrite Done

- [ ] Every answer (screener, full, practice) writes one event with the same shape to one store.
- [ ] Profile contains only completion flags, last-session pointers, and a cached weakness summary (domain scores, weakest domains, skill performance, gaps, error patterns). No long arrays of responses or question IDs beyond a small “recent” window if needed.
- [ ] Weakness and “areas to work on” are computed from response events (or from the cached summary that was computed from events).
- [ ] One session abstraction; resume and “view report” use it.
- [ ] One question bank and one domain/skill taxonomy; one assessment builder for screener and full.
- [ ] Score report can be produced from “session ID + load events” alone.
- [ ] Adaptive “next question” uses only the profile cache (and optionally the event store for a recent window); it does not depend on removed fields like “practice history” or “generated IDs seen.”
- [ ] Wrong answers store an error type or distractor pattern ID in the event.
- [ ] **Praxis content areas** are the top-level structure for full-assessment distribution, top-level scoring, and user-facing performance views. NASP domains appear as drill-down detail within each Praxis content area.
- [ ] Every question in the bank has a `skillId`. Domain assignment is resolved from `skillId` via the skill taxonomy — no runtime keyword inference.
- [ ] The taxonomy defines the canonical chain: Praxis content area → domain → skill cluster → skill. This chain is used by the assessment builder, weakness detector, adaptive selector, and all reporting components.
- [ ] No code assigns domains to questions by scanning question text or rationale for keywords.

---

## Part 8: Summary

Building the app with this guide means:

1. **Define** the response event, session, and profile shapes first.
2. **Implement** one content source and one assessment builder.
3. **Implement** one response-event store and one session model.
4. **Implement** weakness computation from events and wire it to the profile cache.
5. **Add** auth and persistence so events and profile live in the backend.
6. **Build** each user flow (screener, full, report, practice, teach, resume, view report) on top of these layers, without adding a second source of truth.

The result is a single, consistent way to develop the app: events are the source of truth, profile is a derived cache, sessions and assessments each have one model and one builder, and the UI stays a thin layer over this structure. That supports both user outcomes (see weakness, improve, get exam-ready) and long-term platform outcomes (analytics, item quality, pedagogy) without ad-hoc state or duplicate logic.

---

## Part 9: Lessons Learned from This Codebase (Stability Addendum)

This section captures mistakes that happened during development and turns them into explicit rewrite guardrails.

### 9.1 Mistake patterns we already hit (and what to do instead)

- **Schema drift between profile type and UI usage**
  - Example pattern: code paths read/write fields like `practiceHistory` or `generatedQuestionsSeen` after the profile model moved to response-count + recent-question fields.
  - **Rule:** every profile field used in UI/hooks must be declared in one shared type and covered by one migration/version path. If a field is removed, all reads/writes must be removed in the same change.

- **Duplicate logic for the same responsibility**
  - Example pattern: multiple assessment builders and multiple session-storage modules with overlapping shapes.
  - **Rule:** one owner per responsibility (assessment build, session persistence, profile derivation). If a second implementation appears, merge or delete before adding features.

- **Reports tied to in-memory state instead of durable events**
  - Example pattern: report works right after completion but fails after refresh/re-login because it depended on transient component state.
  - **Rule:** every report route must support `sessionId -> load events -> render` with no dependence on in-memory completion payload.

- **NASP domains treated as the primary structure instead of Praxis content areas**
  - Example pattern: the assessment builder distributes questions by NASP domain IDs (1-10) with Praxis percentages only as a secondary grouping layer. Pre-assessment allocates a fixed count per NASP domain rather than per Praxis content area. Dashboard, weakness detection, adaptive practice, and score reports all key off NASP domain numbers, making the NASP framework the de facto organizing principle even though the exam is structured by Praxis content areas.
  - **Consequence:** the app's question distribution, weakness targeting, and user-facing reporting do not align with how the actual Praxis exam is organized. Users see "NASP Domains" as the primary view rather than the Praxis sections they will be tested on.
  - **Rule:** Praxis content areas are the primary structure for assessment distribution, scoring, and user-facing reporting. NASP domains live inside that structure as an analytical tool. UI labels, assessment builders, and top-level performance views must use Praxis content areas as the first level.

- **Domain assignment inferred from question-text keywords instead of the skill taxonomy**
  - Example pattern: `analyzeQuestion()` scans question text and rationale for keyword lists (e.g. "reliability" → domain 1, "nasp" → domain 10) to assign `domains[]`. This is the sole source of domain tagging for bank questions that don't have an explicit `domain` field.
  - **Consequence:** (1) Questions mentioning NASP in any context get incorrectly tagged to domain 10 (Legal/Ethics), inflating that domain's count and distorting assessment distribution and weakness analysis. (2) Multi-keyword matches produce multi-domain tags that are often wrong. (3) The entire downstream pipeline — weakness detection, adaptive practice targeting, score reports — inherits these errors because it trusts `question.domains`.
  - **Rule:** domain assignment comes from the skill taxonomy: `skillId → domain (via skill-map lookup)`. If a question lacks a `skillId`, it must be assigned one in the content curation step. Runtime keyword inference must not be used as a substitute for proper taxonomy membership.

- **`praxisCategory` field existed but was never wired into runtime logic**
  - Example pattern: `knowledge-base.ts` defines `praxisCategory` on each NASP domain (e.g. `"Professional Practices"`), and `ets-content-topics.json` defines `praxisSection` (e.g. `"I.A"`), but no runtime code uses these fields for assessment building, scoring, or adaptive practice. They are display-only labels with no operational effect.
  - **Rule:** the Praxis content area mapping must be the authoritative source for assessment distribution weights and must be used in assessment building, not just displayed in UI labels. If a field exists in the taxonomy, it should have a clear runtime consumer or be removed.

- **Documentation and architecture drift**
  - Example pattern: docs mention modules/flows that are no longer used, which causes new work to target stale paths.
  - **Rule:** architecture docs are part of done criteria; if wiring changes, update this guide and changelog in the same PR.

### 9.2 Wiring contract (how pieces connect)

Use this contract as the canonical wiring map:

1. **Question source and taxonomy**
   - One question bank + one domain/skill taxonomy with the canonical chain: Praxis content area → domain → skill.
   - Every question has a `skillId`; domain and Praxis content area are resolved from the taxonomy, never inferred from text.
   - Assessment builders, adaptive selectors, weakness detectors, and reporting components all resolve domains through this chain.

2. **Assessment/session creation**
   - Start action calls one assessment builder and creates one session record with stable `sessionId`.
   - Session module owns create/load/update/complete behavior.

3. **Response logging**
   - Submit action appends one response event with full context (user/session/type/item/outcome/timestamp/error pattern).
   - No flow bypasses this append operation.

4. **Profile derivation and cache update**
   - On completion (or scheduled refresh), derive weakness/profile metrics from response events and write cache fields.
   - Cache fields are replace/merge outputs of derivation, not ad-hoc append arrays.

5. **UI reconstruction paths**
   - Home/dashboard reads profile cache.
   - Reports read `sessionId` + response events and can re-render at any time.
   - Practice selector reads profile cache + question source (+ bounded recent history if needed).

If a new feature cannot be placed in this map without adding a second source of truth, redesign it.

### 9.3 Stability rules (non-negotiable)

- **Type-first changes:** update shared types before writing feature logic.
- **Read/write symmetry:** every persisted field has one owner and one read path documented.
- **No silent optional fallbacks for required fields:** missing required data should surface a clear recoverable state, not hidden behavior changes.
- **Bounded profile documents:** store counts, pointers, and recent windows; keep long history in response events.
- **Idempotent recomputation:** profile derivation should produce the same output when rerun on the same event set.
- **Taxonomy-driven domain assignment only:** a question's domain is resolved from its `skillId` via the skill taxonomy. No runtime code may assign domains by scanning question text for keywords. If a question lacks a `skillId`, it is unclassified and must be tagged during content curation, not at runtime.
- **Praxis content areas are the top-level structure:** assessment distribution weights, top-level score reports, and user-facing performance views use Praxis content areas as the primary grouping. NASP domains appear as drill-down detail within a Praxis content area, not as the top-level frame.
- **Taxonomy fields must have runtime consumers:** if the taxonomy defines a field (e.g. Praxis content area, percentage weight), at least one runtime path must use it operationally (assessment building, scoring, adaptive selection). Display-only fields that duplicate operational data are a drift risk.

### 9.4 Change protocol for new features

For each new feature, complete this sequence:

1. **Design update**
   - Add the feature to scope/acceptance list.
   - State where it fits in the wiring contract (source, owner, and consumers).

2. **Data contract update**
   - If schema changes: bump profile/session schema version and define migration/backfill behavior.
   - Specify whether field is source-of-truth data or derived cache.

3. **Implementation**
   - Add/modify one owner module per responsibility.
   - Keep UI thin; call owner modules rather than reimplementing logic.

4. **Verification**
   - Fresh user flow.
   - Existing user with old data flow (migration path).
   - Refresh/re-login recovery.
   - Resume and report reconstruction from persisted data.

5. **Documentation sync**
   - Update this guide, architecture notes, and changelog in the same change.

### 9.5 Minimum regression suite (must pass before merge)

- **Assessment integrity**
  - Diagnostic and full assessments use only approved builder outputs and produce expected counts/distribution.

- **Persistence integrity**
  - Every submitted answer creates exactly one event with required fields.
  - Session pointers and completion flags are updated correctly.

- **Recovery integrity**
  - Refresh during assessment resumes correctly.
  - Completed assessment report is viewable after logout/login via session/event reload.

- **Adaptive integrity**
  - Selector uses existing profile fields only (no removed/legacy fields).
  - Practice flow updates data that selector depends on (or clearly documents update cadence).

- **Study-guide and mastery integrity**
  - AI study-guide output is grounded in response events, global scores, and canonical skill metadata rather than unsupported recommendations.
  - Vocabulary and foundational review items trace back to weak skills or prerequisite chains.
  - If a future final full assessment is added, its unlock rule should be driven by a centralized threshold check on currently tracked deficit skills rather than duplicated UI logic.

- **Schema integrity**
  - No unknown fields are written to profile/session documents.
  - Removed fields are not referenced anywhere in UI/hooks.

### 9.6 Definition of done for architecture-safe development

A feature is not done until:

- It respects one-source-of-truth boundaries.
- It is recoverable after refresh/re-login.
- It does not introduce duplicate builders/stores/models.
- It passes the minimum regression suite.
- It updates docs/changelog so future contributors can follow the same wiring.
