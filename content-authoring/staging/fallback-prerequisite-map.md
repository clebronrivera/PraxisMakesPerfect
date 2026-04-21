# C12 — Per-Skill Fallback Prerequisite Map (Decision 0.3)

**Status:** Substantially complete — pending SME review alongside C3.
**Blocks content task:** C7a, C7b, C7c, C7d (question authoring).
**Blocks code task:** K15 (adaptive loop verification in screener engine).
**Decision reference:** `/docs/decisions/2026-04-skill-taxonomy-v2.md` §0.3.

## Purpose

Decision 0.3 expanded the screener to 55 primaries with an adaptive fallback loop: **when a user misses a primary-application question, the engine serves a matching fallback-recall question that probes the foundational concept behind that primary.** This document defines, for each new top-level skill and sub-concept, what the fallback questions are expected to probe.

Writers of C7 batches use this map to scope fallback item authoring. The code in K15 uses the `cognitiveTier` tag to route between primary and fallback; it does NOT read this file at runtime — the map is strictly a writing/review artifact.

---

## Schema per skill block

Each skill block below has three sections:

| Row element | Purpose |
|------|---------|
| **Primary application probes** | 2–4 scenarios the primary questions test (integrated application level — the student must synthesize multiple facts into a recommendation). |
| **Fallback recall probes** | Paired foundational concepts the fallback items probe when the primary is missed. These are *definitionally prior* to the application scenario — a student who missed the primary should still have a chance to show recall of the foundation. |
| **Vocabulary tie-ins** | Pull from C3 vocabulary list for that skill so writers can name the recall target in concrete terms. |

**Authoring rule:** For each primary item, the paired fallback's correct answer must express the foundational concept that the primary implicitly requires. If a student knows the recall fact but cannot apply it to the scenario, the primary-miss + fallback-hit pattern should surface that gap cleanly.

---

## MBH-06 — Trauma-Informed Educational Practice

### Primary application probes

- **Marcus-style displacement case:** A 2nd grader with recent housing instability freezes during a fire drill and later shoves a peer. Best trauma-informed teacher response (reframe to window-of-tolerance/trauma response rather than defiance; avoid escalating consequence; use Tier 1 regulation supports).
- **Tier placement scenario:** A student with a disclosed trauma history shows mild attention and regulation difficulties. Most appropriate tier (Tier 1 + Tier 2 small-group — NOT immediate Tier 3 clinical referral).
- **Universal-ACEs-screening proposal:** Administrator proposes scoring every incoming student on the ACEs questionnaire and flagging scores ≥ 4. School psychologist's most defensible response (decline individual scoring; propose adapted SEL screener with trauma-sensitive subscales).
- **Role-boundary scenario:** Teacher asks the school psychologist to provide weekly trauma therapy to a student. Most defensible response (school psychologist does NOT deliver TF-CBT/EMDR/CPP; refers to licensed community clinician; school provides Tier 1/Tier 2 supports and systems consultation).

### Fallback recall probes

- **ACE definition components** — the 10 original ACEs; knowing that ACEs span abuse/neglect/household dysfunction, not single acute events.
- **SAMHSA's Four R's** — Realize, Recognize, Respond, Resist re-traumatization (identify which R a practice example exemplifies).
- **Window of tolerance vs. fight/flight/freeze/fawn** — naming the autonomic state a described behavior reflects.
- **Tier distinction** — identifying which tier a practice belongs to (Tier 1 = universal routines; Tier 2 = CBITS/Bounce Back/SPARCS; Tier 3 = TF-CBT/EMDR/CPP).
- **Population-vs-individual distinction** — ACEs count is an epidemiological population tool, not an individual predictor.

### Vocabulary tie-ins (from C3)

Trauma · Trauma-informed practice · ACEs · Original 10 ACEs · Toxic stress · Cortisol · Amygdala · Prefrontal cortex · SAMHSA 4 R's · Re-traumatization · Window of tolerance · Fight/Flight/Freeze/Fawn · Tier 1/2/3 · TF-CBT · CBITS · Bounce Back · SPARCS · EMDR · CPP · Dose-response relationship.

---

## ACA-10 — Classroom Organization and Management

### Primary application probes

- **Mr. Santos high-referral case:** Second-year teacher sending 14 referrals in 6 weeks from one classroom. Most appropriate next step (classroom ecology observation / Tier 1 consultation BEFORE individual FBA/BIP work).
- **Negative-rules-chart scenario:** Teacher posts four prohibitions ("No running, No shouting, No interrupting, No cell phones"). Best recommendation (rewrite as 3–5 positively-stated expectations, teach explicitly, reinforce).
- **Long-transition scenario:** Classroom transitions average 7–10 minutes. Best intervention (explicit routine with cue/signal + practice during first weeks; sub-2-minute target).
- **Praise-ratio scenario:** Observer counts a 1:3 positive-to-redirection ratio. Teacher consultation priority (move toward the 4:1 evidence-based target with specific praise).

### Fallback recall probes

- **Rules vs. routines distinction** — rules are stable positively-stated expectations (3–5); routines are micro-sequences for recurring procedures.
- **4:1 reinforcement ratio** — identifying the evidence-based target ratio.
- **Specific vs. generic praise** — recognizing that "I like how you put away your folder before the timer ended" is more effective than "good job."
- **Transition-time recovery figure** — Evertson & Emmer finding that effective routinization recovers 15–20 minutes of instruction per day.
- **Ecology-first rule** — classroom ecology observation precedes individual FBA/BIP when multiple referrals originate from one room (Tier 1 before Tier 2/3).

### Vocabulary tie-ins (from C3)

Classroom management · Tier 1 behavior support · Physical environment · Routines · Rules · Positive reinforcement · Specific praise · 4:1 reinforcement ratio · Opportunity to respond (OTR) · Co-construction of rules · Visual schedule · Cue/signal · Direct instruction zone · High-traffic area · Evertson & Emmer · Classroom ecology observation · House rules · Good Behavior Game.

---

## DBD-11 — Performance-Based Assessment

### Primary application probes

- **Diego reevaluation triangulation case:** WIAT-4 scores improve but scaffold-dependent portfolio evidence shows strategy gaps. Best IEP-team action (continue services; shift goals to inference and independent strategy use; document portfolio evidence in evaluation report).
- **Classroom-vs-test discrepancy case:** WIAT-4 low-average range but classroom writing samples show coherent grade-level work. Most appropriate next step (collect rubric-scored samples; treat discrepancy as clinically meaningful evidence for the team, not a ceiling/floor dismissal).
- **Portfolio admissibility debate:** IEP team debates whether a portfolio can inform eligibility. Defensible stance (yes — when scored with a documented analytic rubric and reported inter-rater reliability; as supplement, not replacement).
- **CLD evaluation scenario:** Culturally and linguistically diverse student whose standardized scores may reflect bias. Most defensible complementary source (curriculum-embedded work samples + PBA).

### Fallback recall probes

- **Analytic vs. holistic rubric** — analytic breaks performance into traits with descriptors per level; holistic assigns one overall score.
- **Inter-rater reliability thresholds** — Cohen's kappa > .70 or ICC > .80 for defensible PBA.
- **Triangulation definition** — combining standardized + work samples + teacher/family report to converge on a decision.
- **Reliability vs. authenticity trade-off** — norm-referenced = high-reliability/low-authenticity; portfolios = high-authenticity/lower-reliability without rubric structure.
- **Multiple-sources-of-data requirement** — IDEA requires a variety of assessment tools and strategies; PBA is one such tool.

### Vocabulary tie-ins (from C3)

Performance-based assessment · Work sample · Portfolio · Performance task · Authentic assessment · Curriculum-embedded assessment · Analytic rubric · Holistic rubric · Rater training and calibration · Inter-rater reliability · Triangulation · Curriculum-based measurement · Reliability-vs-authenticity trade-off · Clinically meaningful discrepancy · CLD considerations in PBA.

---

## DBD-12 — Assessment of Low-Incidence Exceptionalities

### Primary application probes

- **Jaya ASL-user case:** 8-year-old profoundly deaf student fluent in ASL requires triennial evaluation. Best assessment plan (convene ASL interpreter + TOD + educational audiologist; use Leiter-3 for cognitive; Vineland-3 for adaptive; report nonverbal IQ — NOT a Full-Scale IQ).
- **Untrained-interpreter scenario:** Bilingual cafeteria staff member is proposed as interpreter for standardized testing. Most defensible stance (decline; engage certified interpreter trained in standardized administration; disclose interpreter use in the report).
- **Multiple-disabilities coordination:** Student with cerebral palsy and severe hearing impairment referred for cognitive assessment. Best approach (multidisciplinary team — school psychologist integrates findings rather than solo-administering).
- **Accommodations-vs-instrument scenario:** Educator proposes extended time on WISC-V for a blind student. Most appropriate response (extended time does not resolve access; alternative instruments with tactile/verbal access are required).

### Fallback recall probes

- **Nonverbal instrument names** — Leiter-3, UNIT-2, TONI-4 (which population each targets).
- **Adaptive measure names** — Vineland-3, ABAS-3 (why adaptive is essential when cognitive measures cannot validly capture functional skill).
- **Role boundaries** — TVI for functional vision; educational audiologist for functional hearing; TOD for signed language assessment; school psychologist integrates.
- **Certified-interpreter rule** — testing requires certified interpreter trained in standardized administration; disclosure required in report (RID or EIPA certification in many states).
- **FSIQ validity rule** — if only a nonverbal composite is validly obtained, reporting a Full-Scale IQ that includes invalidly measured subtests is indefensible.

### Vocabulary tie-ins (from C3)

Low-incidence exceptionalities · HI / Deaf-Blindness / VI / OI / OHI / MD / TBI · Leiter-3 · UNIT-2 · TONI-4 · WISC-V with certified ASL interpreter · Vineland-3 · ABAS-3 · Functional vision/hearing assessment · TVI · TOD · O&M specialist · Educational audiologist · Expanded Core Curriculum (ECC) · Braille literacy assessment · Certified interpreter for testing · Disclosure-of-interpreter-use · Multidisciplinary team integration · Norms-based invalidity · Construct validity preservation.

---

## RES-04 — Implementation Science and Change Management

### Primary application probes

- **Riverside / Dr. Lin district failure case:** Assistant superintendent declares Second Step "doesn't work" after one year without fidelity data. Most defensible recommendation (conduct implementation audit — check stages, drivers, fidelity — before abandoning the EBI; relaunch with pilot + coaches + fidelity checklist).
- **Premature-evaluation scenario:** District wants outcome evaluation at 12 months on a newly-launched EBI. Best counsel (implementation audit first; Fixsen timeline places full-implementation effects at 2–4 years).
- **Fidelity-interpretation scenario:** RCT-supported intervention yields null result in the district. Without fidelity data, conclusion about efficacy (uninterpretable — cannot distinguish "doesn't work" from "wasn't delivered").
- **Exploration-stage scenario:** District preparing to adopt a new behavior-management program. Most appropriate Stage 1 activity (fit assessment — staff buy-in, resources, competing programs, anticipated barriers — BEFORE commitment).

### Fallback recall probes

- **Fixsen's four implementation stages** — Exploration → Installation → Initial Implementation → Full Implementation (identify which stage a described activity belongs to).
- **Implementation drivers (3)** — Competency (selection/training/coaching), Organization (data systems/facilitative admin/systems intervention), Leadership (technical + adaptive).
- **Five dimensions of treatment fidelity** — Adherence, Exposure/Dosage, Quality of delivery, Student responsiveness, Program differentiation.
- **ESSA evidence tiers** — Tier 1 Strong (RCT) / Tier 2 Moderate (quasi-experimental) / Tier 3 Promising (correlational with controls) / Tier 4 Demonstrates a rationale (logic model + evaluation plan).
- **2–4 year full-implementation timeframe** — [VERIFY:] from source module; typical timeline before full-implementation effects stabilize.

### Vocabulary tie-ins (from C3)

Implementation science · Implementation quality · Fixsen's implementation stages · Exploration · Installation · Initial Implementation · Full Implementation · Stage-skipping · Implementation drivers · Competency/Organization/Leadership drivers · Treatment fidelity · Adherence · Exposure/Dosage · Quality of delivery · Student responsiveness · Program differentiation · Active ingredients · Peripheral components · Fidelity checklist · Barriers-and-facilitators assessment · Sustainability · EBI · What Works Clearinghouse · Evidence for ESSA · NIRN · Implementation audit.

---

## SSV-09 — School Climate Measurement and Evaluation

### Primary application probes

- **Central Middle / Dr. Patel case:** ESSA flags rising chronic absenteeism. Best assessment approach (triangulate — EDSCLS survey + archival ODR/attendance/suspension review + SET walkthrough — before committing to interventions).
- **Survey-only-measurement scenario:** School reports 78% "feel safe" overall score and is ready to declare climate healthy. Most appropriate next step (disaggregate by subgroup — race, disability, LGBTQ+, EL, SES — before drawing conclusions).
- **ESSA non-academic indicator scenario:** State must submit a non-academic school-quality indicator for its accountability plan. Most common defensible choice (chronic absenteeism — ESSA-eligible and validated climate signal).
- **Year-one-evaluation scenario:** Climate intervention shows weak year-one effects. Most defensible interpretation (assess implementation fidelity before judging outcomes; full effects expected at 2–3 years).

### Fallback recall probes

- **EDSCLS three dimensions** — Engagement / Safety / Environment (naming the dimension an item measures).
- **ESSA 5th-indicator definition** — state accountability plans must include ≥ 1 non-academic school-quality/student-success indicator.
- **Triangulation rule** — climate measurement requires survey + behavioral/archival + observational sources; a single source is insufficient.
- **Chronic-absenteeism threshold** — missing ≥ 10% of enrolled school days.
- **Subgroup-disaggregation requirement** — school-wide averages can mask subgroup scores; disaggregation is required for defensible reporting (with cell-size suppression for privacy).
- **Climate-improvement timeline** — 2–3 years to stabilize Tier 1 climate-intervention effects.

### Vocabulary tie-ins (from C3)

School climate · Triangulation in climate measurement · Engagement/Safety/Environment (ED dimensions 1/2/3) · EDSCLS · Panorama School Climate Survey · California Healthy Kids Survey · Georgia/Delaware surveys · Chronic absenteeism · Office discipline referrals · Suspension/expulsion disproportionality · Bullying report rates · Teacher turnover · School-Wide Evaluation Tool · Walkthrough protocol · Subgroup disaggregation · Cell-size suppression · Climate-action cycle · ESSA 5th indicator · Climate-improvement timeline.

---

## Sub-concepts (lighter treatment — nested under parent skill)

### LEG-05 — ESSA Accountability (nested under LEG-02)

#### Primary application probes

- **Evidence-tier selection scenario:** District is selecting an intervention for a Title I CSI school. Rank-ordering which evidence tier is acceptable vs. most defensible under ESSA.
- **Federalism-distinction scenario:** Parent asks whether ESSA lets the federal government prescribe the school's turnaround plan. Best answer (no — ESSA devolves plan design to states; USDOE approves/oversees rather than prescribes).

#### Fallback recall probes

- **ESSA four evidence tiers** — Tier 1 Strong (RCT) / Tier 2 Moderate (quasi-experimental) / Tier 3 Promising (correlational) / Tier 4 Demonstrates a rationale (logic model + evaluation).
- **CSI vs. TSI distinction** — CSI = lowest-performing schools; TSI = schools with underperforming subgroups.
- **ESSA-vs-IDEA separation** — ESSA (accountability/funding) and IDEA (individual FAPE entitlement) coexist; one does not replace the other.
- **ESSA enactment and replacement** — December 2015; replaces NCLB in full by 2017–2018 school year; NCLB's 2014 universal-proficiency deadline eliminated.

---

### LEG-06 — Seclusion, Restraint, and Manifestation Determination (nested under LEG-02)

#### Primary application probes

- **Seclusion-for-noncompliance scenario:** Staff member proposes isolating a student in a time-out room for repeated refusal to follow directions. Most defensible response (seclusion is restricted to imminent danger of serious physical harm — never for discipline, convenience, or noncompliance).
- **Manifestation-determination scenario:** Student with IEP accumulates 11 school days of suspension for fighting. MD team must apply the two-prong test. Best framing (causation question — NOT behavior severity; ask whether conduct was caused by / directly related to disability, OR a direct result of IEP-implementation failure).
- **Special-circumstances IAES scenario:** Student with IEP brings a weapon to school. Most accurate application (up to 45-school-day IAES applies regardless of MD outcome).
- **FAPE-during-removal scenario:** Student with IEP has been removed for 12 school days. Most accurate application (FAPE must continue — typically in an IAES — regardless of MD outcome).

#### Fallback recall probes

- **10-school-day change-of-placement threshold** — cumulative or consecutive removals beyond which MD is triggered.
- **Two-prong manifestation test** — (1) caused by / directly related to disability; (2) direct result of failure to implement the IEP.
- **Special-circumstances exception** — weapons, drugs, serious bodily injury → up to 45-school-day IAES regardless of MD.
- **Imminent-danger threshold** — the federal-guidance limiting condition for any seclusion or restraint use.
- **Prohibited restraint categories** — prone restraint prohibited in many states; mechanical and chemical restraint generally prohibited or tightly regulated in schools.
- **FBA/BIP post-manifestation requirement** — FBA required if not already completed; BIP implemented or reviewed/modified following a manifestation finding.

---

### DBD-13 — Assessment Technology and Data Tools (nested under DBD-01)

#### Primary application probes

- **Risk-flag-as-diagnosis scenario:** Teacher wants to retain a student based on a single aimsweb risk flag. Most defensible response (risk flags inform professional judgment — they are not diagnoses; require follow-up assessment and layered data before placement decisions).
- **Free-tool FERPA scenario:** Staff member begins uploading student-identifiable data to a free internet screening tool without a district agreement. Most defensible response (pause — free tools without a FERPA data-sharing agreement create institutional legal exposure).
- **Platform-discrepancy scenario:** A student is flagged at-risk by FastBridge but not by aimsweb. Best interpretation (platforms are not interchangeable — cut-scores and norms vary; layer data and use professional judgment).
- **Over-dashboard scenario:** District proposes a 40-indicator tier-placement dashboard. Most defensible counsel (data quality and clear decision rules matter more than quantity; a 6-indicator system with explicit criteria outperforms a sprawling dashboard without rules).

#### Fallback recall probes

- **CBM platform names** — aimsweb Plus, FastBridge (formerly FAST), STAR Assessments, DIBELS Data System, easyCBM (identify platform category from description).
- **4-point decision rule** — four consecutive progress-monitoring data points below the aim line warrants an intervention change.
- **FERPA data-sharing requirement** — institutional agreements required before student-identifiable data flow to any vendor tool; free-to-teacher tools often lack this.
- **Role-based / minimum-necessary access** — each role (teacher / case manager / administrator) sees only data needed for function; this is a data-security requirement, not UX convenience.
- **Risk-flag vs. diagnosis distinction** — platforms flag risk and warrant follow-up; they do not diagnose.

---

## Integration note for C7 writers

When authoring a primary-application item, produce its matched fallback-recall item in the same session. Pair them so the fallback item's correct answer expresses the foundational concept the primary implicitly requires. This prevents authoring drift where primaries and fallbacks in the same skill bank test unrelated sub-areas.

### Pairing heuristics

- **Primary stem = scenario** (teacher situation, student vignette, IEP-team debate). **Fallback stem = definition/identification** (which tier is this? which Fixsen stage? which ED dimension? name the evidence tier).
- **Primary distractors = plausible but non-defensible actions** (punishment, retention, solo-assessment, premature conclusion). **Fallback distractors = plausible-but-adjacent foundational confusions** (Tier 2 vs. Tier 3; initial vs. full implementation; Tier 1 Strong vs. Tier 2 Moderate evidence).
- **Avoid test-wiseness shortcuts.** If a fallback stem ends with the vocab term appearing in the primary's correct answer, revise so surface-match cannot substitute for recall.
- **Tag every item** with `cognitiveTier: 'primary-application' | 'fallback-recall'` and `pairedItemId` so K15 can route the adaptive loop without reading this file at runtime.

### Coverage targets (from Phase ε of execution plan)

| Per new skill | Primary-application items | Fallback-recall items |
|---|---|---|
| Minimum for screener | 3 | 3 |
| Recommended for bank growth | 10+ | 10+ |
| Total across 9 skills (min) | 27 | 27 |
| Total across 9 skills (rec) | 90+ | 90+ |
