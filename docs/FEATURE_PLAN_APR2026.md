# Praxis Makes Perfect — Feature Plan
**Session: April 7, 2026 | Status: Design-phase planning document**

This document captures every feature discussed in the April 7, 2026 session, organized for implementation planning. It covers study plan refinements, new practice modes, platform integrity systems, tiered access logic, and the mathematical mastery model. Open questions are flagged explicitly at the end of each section.

---

## 1. Study Plan — Corrections & First-Time Onboarding

### 1a. Mastered Skills Are Additive in the Readiness Display

The current mockup shows "14 of 45 skills at Demonstrating" as a gap metric, which is correct. The framing in the plan narrative needs to explicitly position mastered skills as earned progress, not as a baseline. The readiness score (currently shown as a percentage) should communicate that every mastered skill is a permanent contribution toward the 32-of-45 goal, not something that can decay or be lost.

Concretely: the readiness bar and score card should read "14 skills locked in — 18 more to go" rather than just "14 / 32." This makes the progress feel cumulative and motivating. Skills at Demonstrating should be visually separated in the plan from the gap skills — perhaps shown in a distinct "Locked In" section before the priority cluster table.

### 1b. First Study Plan — Platform Onboarding Section

When the system detects that a study plan is being generated for the first time (no prior plan exists in `study_plans` for this user), the plan prepends a distinct **How to Use This Platform** section that does not appear in subsequent plans. This section is short (100–150 words maximum) and covers exactly four things:

1. Where to find your practice modes (Practice tab — By Domain, By Skill, Learning Path, Feeling Spicy)
2. What the Redemption Rounds are and that they need to be cleared to restore questions to the normal pool
3. How the countdown to the next plan refresh works (they'll see it in the AI Tutor)
4. A single action item: "Start with the first skill in your Misconception cluster before anything else."

This onboarding block disappears from all subsequent plans automatically. It is injected by the preprocessor as a flag (`is_first_plan: true`) and the prompt template includes the section conditionally.

**Open question:** Should the first-plan onboarding also trigger the Dashboard Tutorial sequence, or is the plan text sufficient? These could be redundant if the dashboard tutorial already covers platform navigation.

---

## 2. The Skill Indexer

### What It Is

A searchable reference layer that maps any skill, topic, or keyword to every piece of content associated with it on the platform — modules, vocabulary, case roulette entries, practice questions (by count, not by content), and study plan references. Think of it as a table of contents for the entire question bank and learning path, surfaced through a search interface.

### Why It Exists

Students who use external practice materials (Pearson study guides, university coursework, tutoring notes) will encounter concepts in a different organizational structure than the platform uses. The indexer lets them type "CHC theory" or "IDEA eligibility" or "Caplan consultation" and immediately land on the module section, vocabulary set, and practice pool for that concept — without guessing which skill tab it lives under.

### Where It Lives

Inside the AI Tutor as a dedicated tab or command. The user types a keyword or selects a domain, and the indexer returns a structured card showing: which of the 45 skills this concept belongs to, the corresponding Learning Path module and specific section, how many practice questions are in the pool for that skill, the vocabulary terms associated with it, and whether a case roulette entry exists for this skill.

### How It Works Technically

The indexer is a client-side search against pre-built metadata: the 45-skill taxonomy, the module section manifest, and the vocabulary term list. No server call needed. A simple fuzzy-match against skill names, module titles, and vocabulary terms is sufficient for V1. This is a read-only feature with no adaptive logic.

**Open question:** Should the indexer surface "You've answered X questions in this skill — your accuracy is Y%" in the results, making it also a skill status lookup? This would make it more useful but requires a live query per search.

---

## 3. Speed-Guessing Detection & Test Integrity

### The Problem

Students who race through the adaptive diagnostic in 4–8 minutes (answering each question in 1–5 seconds without genuine engagement) produce a garbage baseline. The diagnostic then generates a misleading skill map, which corrupts the study plan, the practice queue, and the readiness score for the rest of their time on the platform.

### Detection Logic

Every question response already records `time_on_item_seconds`. The integrity check runs at diagnostic completion (not during, to avoid disrupting the test flow) and flags a session as speed-suspicious if any two of the following conditions are true:

- More than 30% of questions answered in under 6 seconds
- Median time-on-item across the entire diagnostic is under 8 seconds
- Standard deviation of response times is extremely low (under 3 seconds), indicating robotic uniformity rather than natural variation
- Accuracy is below 35% (below random chance for 4-choice questions, suggesting no engagement)

If flagged, the system does not silently discard the data. Instead, after the last diagnostic question is submitted, the user is shown a **Test Integrity Screen** before the Score Report. This screen:

1. Informs the user that the system detected an unusually fast response pattern
2. Shows their aggregate timing data ("Your median response time was 4 seconds per question — the typical range is 35–90 seconds")
3. Explains that results from this session may not accurately reflect their knowledge
4. Offers two paths: **Accept results and continue** (with a clear caveat that the study plan may be less accurate) or **Retake the diagnostic** (resets the diagnostic, not other practice data)

The screen is not a wall — it's a fork. Students who genuinely read fast and happened to score well won't be punished. But students who guessed randomly will see their low scores and most will choose to retake.

### What Is Not Done

The system does not lock accounts, does not auto-invalidate results, and does not prevent the user from continuing. This is a diagnostic integrity feature, not a punishment system. The flag is stored in the user's profile (`diagnostic_integrity_flag: 'speed_warning'`) so that admin can see it in the User dashboard.

**Open question:** Should a second consecutive speed-warning diagnostic (retake also flagged) trigger an admin alert? This would catch users gaming the system deliberately.

---

## 4. Anti-Scraping & Content Protection

### The Threat Model

There are two distinct threats: automated scraping (bots harvesting questions programmatically) and human-assisted scraping (someone manually reading and copying questions to share externally). The defenses for each are different.

### Against Automated Scraping

All question content should be rendered server-side as authenticated-only responses — never exposed in public API endpoints or static HTML. The current Supabase architecture already requires authentication for all data queries, which is the primary defense. Additional layers to implement:

**Rate limiting:** A maximum of 300 question requests per hour per authenticated user. This is well above any legitimate study session (typical session is 25–50 questions) but blocks bulk extraction scripts. Implemented as a Netlify Edge Function middleware that counts requests per JWT.

**User-agent filtering:** Reject requests from known bot user-agent strings at the Netlify edge layer. This won't catch sophisticated scrapers but stops casual automated tools.

**Session token rotation:** Question content requests require a short-lived session token (generated fresh per practice session, valid for 90 minutes) in addition to the JWT. This prevents replay attacks where a token is captured and reused outside the app.

### Against Human-Assisted Copying

**CSS anti-select:** Apply `user-select: none` to question text and answer options in the browser. This isn't a hard barrier but raises the friction for casual copying significantly. Determined users can still view source, so this is not a security measure — it's a friction layer.

**Text watermarking:** Each question display session injects a nearly-invisible Unicode watermark into the rendered text — a unique identifier tied to the user's session. If question content shows up elsewhere online and contains this watermark, it can be traced back to the session that originated the leak. This requires a watermarking utility that modifies the rendered text without changing its appearance (using homoglyph substitution or zero-width characters).

**No print/screenshot shortcut:** Suppress default print behavior on question screens. This does not prevent screenshots but removes the easy path.

**Important caveat:** No technical measure fully prevents a determined human from copying content manually. The strongest protection is having original question content (see Section 5) such that even if questions are shared, they don't match any known copyrighted exam material.

**Open question:** Is there a legal/terms-of-service layer needed here? A ToS prohibition on redistributing question content, with an enforcement path, is often the most practical protection layer. This is a legal drafting task, not a code task.

---

## 5. Question Originality & Copyright Protection

### The Current Risk

Questions that closely paraphrase ETS/Pearson Praxis 5403 exam items, even without direct copying, create copyright exposure if a substantial portion of the bank is derivative of released test materials. The risk increases as the platform grows and attracts attention.

### The Standard to Meet

Each question in the bank should be an **original pedagogical composition** that tests a specific Praxis 5403 competency using scenario framing and distractor logic that was independently created. The competency it tests is not copyrightable (you can test "Ethics & Legal Standards" — that's a domain of knowledge, not ETS property). The specific scenario, stem wording, and distractor set need to be original.

### The Audit & Rewrite Process

A structured rewrite pass over the 1,150-question bank should be planned in phases:

**Phase 1 — Flag high-risk questions:** Any question whose stem or answer choices are traceable to a specific released ETS practice item, study guide passage, or published Praxis prep book. These should be identified first and rewritten immediately.

**Phase 2 — Systematic paraphrase review:** For all remaining questions, check whether the scenario framing uses distinctive phrasing patterns from known ETS materials. Questions that "feel like" ETS items even without direct copying should be rewritten with novel case scenarios.

**Phase 3 — Original scenario generation standard:** Going forward, all new questions should follow an original scenario generation protocol. For application-level questions, this means inventing named fictional students, schools, and contexts rather than using generic "a school psychologist is asked to..." framing that mirrors textbook examples. For recall-level questions, the stem should test the concept from a direction that is unlikely to match any specific exam item.

**Phase 4 — Legal review:** Before launch of paid tiers, have an IP attorney review a sample of the question bank (50–100 items) to assess copyright exposure. This is not optional if the platform charges users.

**Open question:** Is there a review process in place for questions already in the bank, or has the assumption been that all 1,150 questions were originally composed? The answer determines the scope of Phase 1.

---

## 6. Brief vs. Full Plan Tiers

### Brief Plan (Free Tier)

The Brief plan is a compact, actionable summary designed to give a free user enough signal to know where to focus — but not enough to replace a structured study approach. It is limited to three sections with strict word budgets:

**Section 1: Where You Stand** (~150 words) — Overall readiness tier (Emerging / Approaching / Demonstrating), total skills mastered, and one sentence per domain describing the overall picture. No skill-level detail.

**Section 2: Your Top 3 Priorities** (~120 words) — The three highest-urgency skills by name, with a one-sentence description of why each is urgent (status label only — "Misconception" or "Unlearned" — no distractor analysis or specific misconception text). No cluster table, no accuracy percentages.

**Section 3: This Week** (~80 words) — A single, simple weekly target: X questions, Y focus area, Z sessions. No domain maps, no checkpoint logic, no vocabulary.

The Brief plan has no PDF export and no print option. It is shown as a text card inside the AI Tutor. It can be regenerated at any time (no question-count gate for the free tier, because there is no detailed data to protect). The explicit message at the bottom of the Brief plan is: "Upgrade to see full misconception analysis, domain study maps, vocabulary fluency activities, case pattern training, and a 14-week detailed schedule."

### Full Plan (Paid Tier)

All 9 sections as currently designed, plus three additional sections that are exclusive to the paid plan:

**Vocabulary Fluency** — A curated list of vocabulary terms for each priority skill, with definition, usage in context, and a practice set indicator (see Section 8 below for how these integrate with modules).

**Cloze Reading Activity** — A fill-in-the-blank passage for each priority domain (see Section 9 below).

**YouTube Concept Links** — Curated video resources mapped to priority skills (see Section 12 below).

The Full plan generates a PDF, supports print, and is governed by the 100-question refresh cycle.

---

## 7. Skill Type Differentiation: Memorization vs. Application

### The Classification

Every one of the 45 skills should be classified into one of two cognitive demand categories. This classification already partially exists in the question bank through the Recall / Application per-question tag. At the skill level, the classification is an aggregate:

**Memorization-dominant skills** are those where the majority of exam questions test recognition and recall of definitions, law names, procedural steps, or diagnostic criteria — information that, once learned and rehearsed, tends to be retained. Examples likely include: IDEA eligibility categories, specific assessment instrument names, professional ethics codes (specific rule citations), diagnostic criteria for common conditions (DSM classifications as they appear in school psych context).

**Application-dominant skills** are those where the majority of questions require the student to interpret a scenario, weigh competing considerations, or select among responses that all have some merit. These skills cannot be "memorized" — they require genuine conceptual understanding. Examples likely include: Consultation Models (distinguishing model types in context), Cognitive Assessment (selecting appropriate assessment based on referral question), RTI/MTSS tier decisions, and anything involving case-based ethical reasoning.

### How This Changes the Study Plan

In the Full plan, each priority skill is labeled with its cognitive demand type. The recommended intervention differs:

For memorization-dominant skills, the plan recommends: vocabulary fluency practice first, then spaced retrieval (not open-ended questions — just targeted recall sets), then integration into full practice sessions. The study schedule allocates shorter, more frequent sessions for these skills (15–20 minutes, higher frequency).

For application-dominant skills, the plan recommends: Learning Path module first (conceptual grounding), then case roulette exposure (see Section 11), then practice questions. The schedule allocates longer, less frequent sessions with reflection time built in (30–45 minutes, lower frequency, no back-to-back cramming).

**Open question:** Should the 45-skill cognitive demand classification be done manually by a content expert, or derived algorithmically from the existing Recall/Application question tags? The algorithmic approach (skill is "memorization-dominant" if >60% of its questions are Recall-tagged) is fast but may not match the educational reality for every skill.

---

## 8. Vocabulary / Concept Fluency System

### Structure

Each of the 45 skills has a vocabulary set drawn from the platform's existing 396-term glossary. These vocabulary sets are already associated with skills in the metadata. The Vocabulary Fluency system activates these terms as an interactive practice mode rather than a static list.

### Unlock Condition

Vocabulary Fluency for a skill activates when the student opens the associated Learning Path module for that skill. It does not require completing the module — just opening it. This creates a natural layering: the student starts the module, sees the vocabulary that will appear in it, practices the terms first, and returns to the module with better grounding.

### Activity Format

The vocabulary practice is a simple flash-card style retrieval exercise: the term appears, the student tries to recall the definition, then reveals it and self-rates (Knew it / Almost / Blank). This data is not used for skill accuracy scoring — it feeds a separate `vocabulary_fluency_score` per skill that the study plan and AI tutor can reference. A student who rates themselves "Blank" on 5 terms in a skill gets a vocabulary-first recommendation in the plan.

This is a memorization-targeting tool specifically. It does not count toward the 32-of-45 Demonstrating threshold, which remains purely accuracy-based. But it contributes to the Tier unlock logic (see Section 10).

### Neurological Chunking Design

The vocabulary sets for each skill should be organized into chunks of 5–7 terms (the span of working memory). Within each chunk, terms should be sequenced from foundational to elaborated — not alphabetically. The system presents one chunk per session, and only surfaces the next chunk once the student has self-rated at least 4 of 7 terms as "Knew it" across two separate sessions. This is the spaced repetition mechanism applied to vocabulary, and it mirrors the Leitner box logic already in the platform.

**Open question:** Should vocabulary fluency ratings be captured through the existing `section_interactions` table, or does this need a new `vocabulary_attempts` table? The distinction matters for schema migration planning.

---

## 9. Cloze Reading Activity (Full Plan Only)

### What It Is

A cloze reading (fill-in-the-blank) activity presents the student with a short passage (150–250 words) drawn from the module content for a priority skill, with key vocabulary terms or concept phrases removed and replaced with blanks. The student types or selects the missing terms.

### Purpose

Cloze activities are particularly effective for application-dominant skills because they force the student to engage with the conceptual structure of a passage — not just recognize terms in isolation. Reading comprehension + vocabulary retrieval + conceptual sequencing all activate simultaneously.

### Content Source

The passages are written versions of module section content, not reproductions of external materials. They should be original explanatory paragraphs authored specifically for the cloze format. One passage per priority skill in the Full plan (not all 45 skills — only the skills identified as priority by the study plan generation). A maximum of 6 cloze activities per plan to prevent overload.

### Scoring

Cloze completion is not scored against the 45-skill accuracy threshold. It generates a `concept_fluency_score` per skill (separate from both `vocabulary_fluency_score` and practice accuracy). In the mastery model (Section 11), concept fluency is one of three inputs to the memorization component of a skill's composite score.

---

## 10. Tiered Access Model (Tier 1 / Tier 2 / Tier 3)

### Tier 1 — General Adaptive Access

Unlocks after completing the adaptive diagnostic. Includes all current features: practice by skill/domain/random, learning path modules, vocabulary fluency, spicy mode, AI tutor (general conversation), Brief study plan. This is the free tier experience post-diagnostic.

### Tier 2 — Structured Practice Access

Unlocks when the student reaches **65% readiness** OR has answered **500+ questions** — whichever comes first. Tier 2 adds:

- Case Roulette (see Section 11)
- Full study plan with PDF export
- Concept fluency (cloze reading activities)
- Detailed misconception analysis in practice feedback (currently the distractor metadata is shown — this expands it with contextualized explanation)
- The AI Tutor's study plan generation mode

The 65% readiness threshold is chosen because it represents the transition from Emerging to solidly Approaching — the student has enough baseline that structured intermediate intervention is appropriate. Before 65%, the most effective intervention is still foundational practice.

### Tier 3 — Intensive Support Access

Unlocks when the student reaches **80% readiness** on Tier 2 content — meaning 80% of the skills they had access to at Tier 2 are now at Demonstrating. This threshold is deliberately stringent. Tier 3 adds:

- A downloadable Mastery Intensive plan — a targeted remediation document for the specific skills that remain below Demonstrating after extensive practice. This is not a new study plan generation; it is a specialized output that focuses exclusively on the remaining gaps and provides explicit strategies for crossing the mastery threshold.
- Extended AI Tutor access including concept generation and quiz generation from the tutor conversation (the tutor can generate custom practice questions based on a topic the student identifies)
- Redemption Round priority mode — a modified redemption session that focuses only on the highest-urgency quarantined questions, not the full bank

**Open question:** Is Tier 2 tied to a paid subscription, or is it a progress-gated free tier? This is the central paywall decision. If Tier 2 requires payment, the 65% readiness gate becomes irrelevant for users who don't pay. If Tier 2 is progress-gated (free but earned), the monetization question shifts to Tier 3 and premium features like PDF export.

---

## 11. Case Roulette

### What It Is

A two-phase practice mode that presents a clinical vignette scenario and a single question, with a structured reading window before answer choices appear. Modeled on the kind of case-based reasoning the Praxis 5403 assesses.

### Two-Phase Structure

**Phase 1 — Reading Window:** The case scenario is displayed in full. No answer choices are visible. A countdown timer runs for a duration set based on the scenario's word count (approximately 1 second per 10 words, minimum 20 seconds, maximum 60 seconds). The student reads the scenario and begins forming their reasoning. No hint button, no skip.

**Phase 2 — Answer Window:** When the reading timer expires, the answer choices appear and a second timer begins (90 seconds, consistent with Redemption Round timing). The case scenario remains visible. The student selects their answer within the answer window. If the timer expires without a selection, it is recorded as an incorrect/no-answer response.

### Case Structure

Each case roulette entry has the following components: a scenario header (demographic and referral context), a scenario body (the clinical situation), and a question stem with 4 answer choices. The question should be a single best answer, not a "select all that apply." The cognitive complexity is always Application — recall questions do not belong in case roulette format.

The example given in the session ("a student who is an English language learner — what is the first consideration for a monolingual evaluator?") illustrates the target format well: a specific contextual setup that requires the student to apply procedural and legal knowledge to a real-world constraint.

### Scoring

Case Roulette accuracy is recorded per case per skill and contributes to the Application component of the composite skill mastery score (see Section 13). Because case roulette questions are high-cognitive-complexity Application items, correct answers carry a higher weight in the mastery model than standard practice questions.

Case Roulette does not trigger the Redemption Round quarantine system — these questions are long-form scenarios that don't fit the 90-second timed redemption format. However, wrong answers in Case Roulette do increment the skill's misconception signals (particularly if the same wrong answer pattern repeats across multiple cases for the same skill).

**Open question:** How many case roulette entries are in the initial bank? This is a content authoring question. A minimum of 2 cases per skill (90 cases total) is needed for the roulette to feel genuinely random. With 45 skills and an average of 3 cases each, that's 135 entries — a substantial authoring effort before launch.

---

## 12. YouTube Video Integration

### The Idea

For each of the 45 skills (or at minimum the 20–25 most commonly struggled skills), a curated list of 1–3 YouTube videos is maintained that explains the underlying concepts clearly. These links appear in the Full study plan and in the Learning Path module for that skill.

### The Curation Challenge

YouTube links rot — videos get taken down, channels go private, content changes. Any static list will degrade over time. The practical approach for V1 is:

A manually curated and periodically reviewed list of links maintained in the platform's skill metadata file. Links are reviewed quarterly. The admin dashboard gets a "verify video links" utility that checks each URL for HTTP 200 status. Dead links are flagged for replacement.

For V2, the AI Tutor can search YouTube on behalf of the student for a given concept when asked, rather than relying on a static curated list.

### Placement

In the Full study plan PDF, video links appear at the bottom of the Vocabulary section for each priority skill, formatted as: **[Skill Name] — Suggested viewing:** [Video title] (duration). The link is a hyperlink in the digital PDF but prints as a short URL.

In the Learning Path module, a "Video resource" card appears at the top of the relevant module section.

**Open question:** Are the video links intended to be embedded in the platform (iframe player) or external links that open YouTube? Embedding has content policy implications (YouTube's terms of service restrict embedding in paywalled content). External links are safer.

---

## 13. Mathematical Mastery Model — Logic & Soundness Check

### The Problem with a Simple Average

If all practice questions from all sources (diagnostic, regular practice, redemption rounds, case roulette, learning path quizzes) simply feed into one accuracy percentage, the number will be noisy and hard to interpret. A student who answered 3 questions correctly early and 10 incorrectly later would have a lower score than one who answered 10 incorrectly then 3 correctly — but both would show the same raw accuracy.

### The Proposed Composite Model

Each skill's mastery state is computed from three components:

**Memorization component (M):** Feeds from recall-tagged practice questions, vocabulary fluency self-ratings (converted to a 0–1 score: Knew it = 1.0, Almost = 0.5, Blank = 0.0), and cloze completion accuracy. Weighted average across these sources.

**Application component (A):** Feeds from application-tagged practice questions and case roulette accuracy. Case roulette answers carry a weight of 1.5× relative to standard practice questions within this component, because they represent higher-order synthesis.

**Composite skill score (S):** For memorization-dominant skills, S = 0.6M + 0.4A. For application-dominant skills, S = 0.35M + 0.65A. This reflects the different cognitive demands of each skill type.

**Confidence weighting:** The existing confidence weighting (Sure/Guess) remains active. A Sure+Correct answer contributes 1.1× and a Sure+Wrong answer contributes 0.7× to whatever component it falls into.

**Recency weighting:** Later responses carry more weight than earlier ones. A simple exponential decay factor (λ = 0.95 per question, so that the 10th-most-recent question has ~60% of the weight of the most recent) prevents early diagnostic errors from permanently depressing a skill's score once the student has genuinely improved.

### Redemption Round Integration

Questions cleared in Redemption (3 correct answers) add a one-time `redemption_bonus` of +0.05 to the skill's composite score. This is small but meaningful — it rewards the extra effort of clearing quarantined questions. Questions that remain in Redemption (not yet cleared) do not negatively penalize the composite score; they are simply not in the active pool.

### Spaced Practice Integration

As currently designed, the Leitner box intervals track when a skill is next due for review. When a skill is past due (not practiced within its interval) and the student answers a question for that skill, the response carries full weight. When a skill is answered ahead of schedule, the response carries 0.9× weight (slight reduction, since over-drilling slightly inflates accuracy without deepening retention). This is a minor adjustment and should not be surfaced to the user.

### The 32-of-45 Readiness Threshold

The existing threshold (S ≥ 0.80 = Demonstrating) maps to the composite score, not raw accuracy. This means a student who has completed vocabulary fluency and case roulette for a skill, and achieved high accuracy on application-tagged questions, will reach Demonstrating faster than a student who only drills recall questions. This is intentional — the composite score rewards depth of engagement.

### Soundness Check

Three properties this model should satisfy:

1. **Monotonicity:** More correct answers for a skill should never decrease the skill's score. The recency weighting and confidence penalty for Sure+Wrong can reduce a score temporarily if recent performance is worse than earlier performance, which is the correct behavior (it reflects genuine decline, not a model flaw).

2. **Convergence:** A student who answers every question correctly with high confidence should eventually reach S = 1.0 for every skill. The model should not have a ceiling below 1.0.

3. **Sensitivity:** A student who answers all questions correctly but with "Guess" confidence should reach Approaching (0.60–0.79) but not Demonstrating (≥0.80) until they either demonstrate Sure+Correct patterns or demonstrate through volume that accuracy is not a fluke. This is the confidence weighting doing its job.

**Open question:** The weighting constants (0.6/0.4 for memorization-dominant, 0.35/0.65 for application-dominant, λ = 0.95, redemption bonus = 0.05) are proposed estimates. These should be validated against a small dataset of real user responses before being hardcoded. Do you want to commission a learning scientist review of these parameters, or proceed with the proposed values and adjust based on observed outcomes?

---

## 14. Open Questions — Consolidated

The following decisions are unresolved and block specific implementation tasks. Listed in approximate priority order:

1. **Paywall structure (Section 10):** Is Tier 2 free-but-earned or paid? This is the most consequential product decision in this plan. Everything else can be built without resolving it, but the user-facing flows are fundamentally different depending on the answer.

2. **Case roulette bank size (Section 11):** How many cases are in the initial bank? 90 minimum (2 per skill) is the floor. This is a content authoring timeline question.

3. **Cognitive demand classification (Section 7):** Manual expert classification or algorithmic derivation from Recall/Application question tags?

4. **First-plan onboarding vs. dashboard tutorial (Section 1b):** Are these redundant, or do they address different moments in the user's journey?

5. **Vocabulary schema (Section 8):** New `vocabulary_attempts` table or use existing `section_interactions`?

6. **Speed-warning retake: admin alert (Section 3):** Should a second consecutive speed-flagged diagnostic trigger an admin notification?

7. **YouTube embedding vs. external links (Section 12):** Legal/UX decision with YouTube ToS implications.

8. **Mastery model validation (Section 13):** Proceed with proposed parameters or engage a learning scientist for review?

9. **Legal/ToS layer for content protection (Section 4):** This needs a legal drafting task, separate from code work.

10. **Question bank copyright audit (Section 5):** What is the current assumption about the originality of the existing 1,150 questions?

---

## 15. Implementation Sequence Recommendation

Given the CLAUDE.md rule that the UI redesign must be completed before any backend work, and given the scope of new features above, the recommended implementation sequence is:

**Phase 0 (Current — blocking):** Complete the remaining 3 unimplemented mockup screens in MOCKUP_STATUS.md (post-assessment, two-tone bars, admin charts). No new feature work until these are done.

**Phase 1 (Design):** Mockup the following new screens: Case Roulette two-phase UI, Vocabulary Fluency flash-card interface, the Skill Indexer search view, the Speed Warning screen, and the Brief vs. Full plan selection flow. Get visual approval before any code.

**Phase 2 (Foundation):** Resolve open questions 1, 2, 3, and 5 above. These determine the schema, the content production plan, and the paywall architecture — all of which must be decided before implementation begins.

**Phase 3 (Build order):** Skill Indexer (read-only, low risk) → Vocabulary Fluency (schema + UI) → Speed-Guessing Detection (analytics layer, no UI change) → Case Roulette (new question format + two-phase timer) → Brief/Full plan tiering → Tier unlock logic → Mastery model composite scoring → Cloze activities → YouTube links.

---

*Document version: 1.0 | April 7, 2026 | For internal planning use only*
