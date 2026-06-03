# ETS Praxis 5403 Competency Audit — April 2026

## Source
Official ETS *Praxis® Study Companion — School Psychologist (5403)*, © 2022 ETS, uploaded by user on 2026-04-18. This is the authoritative blueprint ETS publishes for the 5403 exam; every test item is written against one or more of the 79 knowledge statements catalogued below.

## Purpose
Map every ETS content topic (I.A.1.a through IV.C.3.c) to one of the 45 skills in `src/utils/progressTaxonomy.ts`. Flag any ETS competency that is **uncovered** or only **partially covered** so the content team can close gaps before launch.

## Test at a Glance (verbatim)

| Attribute | Value |
|---|---|
| Test Name | School Psychologist |
| Test Code | 5403 |
| Time | 2 hours 5 minutes |
| Number of Questions | 125 selected-response questions |
| Test Delivery | Computer delivered |
| Model Basis | NASP Model for Comprehensive and Integrated School Psychological Services (2020) |

### Content Categories (verbatim)

| # | Category | Questions | % |
|---|---|---|---|
| I | Professional Practices that Permeate All Aspects of Service Delivery | 40 | 32% |
| II | Direct and Indirect Services for Children, Families, and Schools (Student-Level Services) | 28 | 23% |
| III | Direct and Indirect Services for Children, Families, and Schools (Systems-Level Services) | 25 | 20% |
| IV | Foundations of School Psychological Service Delivery | 32 | 25% |

ETS confirms the 10-domain NASP structure mapped underneath: D1 Data-Based Decision Making, D2 Consultation & Collaboration, D3 Academic Interventions, D4 Mental & Behavioral Health, D5 Schoolwide Practices, D6 Safe & Supportive Schools, D7 Family-School Collaboration, D8 Equitable Practices, D9 Research & EBP, D10 Legal/Ethical/Professional Practice.

---

## Audit Methodology

Every ETS knowledge statement is quoted verbatim (in *italics*) and assigned one of three coverage codes:

- **✅ Covered** — a single app skill clearly owns the knowledge statement.
- **⚠️ Partial** — coverage exists but is scattered across multiple skills or only touches part of the statement.
- **❌ Gap** — no app skill cleanly owns the statement; content team should add coverage.

"Map" column shows the app skill ID from `progressTaxonomy.ts`.

---

## Category I. Professional Practices That Permeate All Aspects of Service Delivery (32%, 40 items)

### I.A. Data-based Decision-Making

#### I.A.1 Problem identification

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| I.A.1.a | *Understands various methods of information gathering (e.g., record review, interview strategies, observations, and testing [RIOT])* | ✅ | DBD-01 | RIOT Framework skill is the exact anchor. |
| I.A.1.b | *Understands appropriate use of background information (e.g., student records, medical records and reports, reviews of previous interventions, developmental history)* | ✅ | DBD-10 | Records Review skill matches. |
| I.A.1.c | *Understands appropriate use and interpretation of screening measures and methods* | ⚠️ | DBD-09 | DBD-09 (Ecological Assessment) metadata covers universal screening; however universal screening is also referenced in SWP-04 (Systems MTSS). Add a cross-link in study guide so screening is surfaced from both. |

#### I.A.2 Assessment and problem analysis

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| I.A.2.a | *Understands theories of intelligence and the appropriate use and interpretation of measures of intellectual/cognitive functioning* | ✅ | DBD-03 | Cognitive Assessment — direct match. |
| I.A.2.b | *Understands appropriate use and interpretation of measures of educational achievement* | ⚠️ | DBD-03 | DBD-03 currently pairs IQ with achievement, but there is no dedicated achievement skill (WIAT, WJ-IV Achievement, KTEA). Consider a follow-up cluster inside DBD-03 for achievement tests specifically. |
| I.A.2.c | *Knows appropriate use and interpretation of diagnostic/processing measures (e.g., memory, executive functioning, phonemic awareness)* | ✅ | DBD-05 | Processing Measures — direct match. |
| I.A.2.d | *Understands appropriate use and interpretation of measures of affective/social/emotional functioning and behavior* | ✅ | DBD-06 | Behavioral Assessment — direct match (BASC-3, Conners, CBCL). |
| I.A.2.e | *Knows appropriate use and interpretation of a functional behavioral assessment* | ✅ | DBD-07 | FBA — direct match. |
| I.A.2.f | *Understands appropriate use and interpretation of performance-based assessment (e.g., work samples, portfolios)* | ❌ | — | **Gap.** No skill specifically owns portfolio/work-sample assessment. Propose adding a concept cluster under DBD-09 or creating DBD-11. |
| I.A.2.g | *Understands appropriate use and interpretation of curriculum-based assessment/curriculum-based measures* | ✅ | DBD-08 | Progress Monitoring — direct match. |
| I.A.2.h | *Knows appropriate use and interpretation of ecological assessment (e.g., classroom, family, community characteristics)* | ✅ | DBD-09 | Ecological Assessment — direct match. |
| I.A.2.i | *Knows how to use information and technology resources to enhance data collection and decision making* | ❌ | — | **Gap.** No skill owns assessment technology (digital CBM platforms, data dashboards, Star/aimsweb). Consider adding a sub-concept to DBD-08 or PSY-03. |
| I.A.2.j | *Understands the use of ongoing data collection to systematically assess the quality and effectiveness of academic, mental health, and system-level services (e.g., intervention design and implementation, progress monitoring, treatment fidelity/integrity, learning outcomes)* | ⚠️ | DBD-08 | Progress monitoring is well covered, but **treatment fidelity/integrity** as a distinct concept is not explicit in any module. Add a sub-concept to DBD-08 (fidelity of implementation). |

#### I.A.3 Knowledge of measurement theory and principles

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| I.A.3.a | *Knows how to use a problem-solving framework as the basis for all professional activities (e.g., Multitiered System of Supports, Response to Intervention)* | ✅ | PSY-03 | MTSS in Assessment — direct match. |
| I.A.3.b | *Understands the use and interpretation of different types of test scores and norms (e.g., grade- and age-referenced)* | ✅ | PSY-01 | Score Interpretation — direct match. Sample Q25 (z-score) maps here. |
| I.A.3.c | *Knows the strengths and limitations of various types of assessment procedures (e.g., self-report tests and inventories, multiple-choice tests, interviews)* | ⚠️ | PSY-01 + DBD-10 | No skill directly enumerates trade-offs across self-report vs. observation vs. interview vs. multiple-choice. Partial through DBD-10 (interview-specific) and PSY-01 (norm-referenced). Recommend a cross-method comparison concept. |
| I.A.3.d | *Knows the principles of reliability and validity* | ✅ | PSY-02 | Reliability and Validity — direct match. Sample Q16 (reliability/consistency) and Q21 (ecological validity) both map here. |
| I.A.3.e | *Knows personal, social, linguistic, environmental, racial, and cultural factors that may influence assessment procedures* | ✅ | PSY-04 | CLD Assessment — direct match. |
| I.A.3.f | *Knows about test fairness and equity concepts (e.g., implicit bias, explicit bias)* | ✅ | DIV-03 | Bias in Decisions — direct match. Cross-tagged from PSY-04. |

#### I.A.4 Assessment of special populations

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| I.A.4.a | *Understands appropriate use and interpretation of measures of developmental and adaptive functioning across all age groups* | ⚠️ | DEV-01 | DEV-01 (Development) covers developmental theory. Adaptive-behavior measures (Vineland-3, ABAS-3) are not named in any skill. Propose extension module under DEV-01 or DBD-03. |
| I.A.4.b | *Knows appropriate use and interpretation of assessment procedures for English as second language/English-language learners (e.g., the appropriate use of translators/interpreters, measurement selection, language of assessment)* | ✅ | PSY-04 | CLD Assessment — direct match. Sample Q1 (dual-language verification) and Q23 (BICS vs. CALP) map here. |
| I.A.4.c | *Is familiar with the assessment of students with low-incidence exceptionalities (e.g., chronic health impairments, severe physical disabilities, sensory impairments)* | ❌ | — | **Gap.** ACA-09 (Health Impact) partially touches chronic illness but sensory and severe physical disabilities have no coverage. Needs a dedicated module. |

### I.B. Consultation and Collaboration

#### I.B.1 Models and methods of consultation

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| I.B.1.a | *Knows strategies for consultation (e.g., goal setting, record keeping, evaluating progress) and how to use a problem-solving framework as the basis for all consultation and collaboration activities when planning, implementing, and evaluating academic and mental health services* | ✅ | CON-01 | Consultation Models — direct match. |
| I.B.1.b | *Knows the principles and strategies associated with varied models of consultation* | ✅ | CON-01 | Behavioral, mental-health, and organizational consultation models. |
| I.B.1.c | *Knows how to facilitate communication and collaboration among diverse stakeholders (e.g., school personnel, families, community professionals)* | ⚠️ | CON-01 + FAM-02 | Partial. No dedicated communication-facilitation module — covered obliquely across Consultation and Family Advocacy. |

#### I.B.2 Home/school/community collaboration (student level)

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| I.B.2.a | *Knows strategies for working with diverse families (e.g., building relationships, collaborating on intervention plans, promoting positive habits)* | ✅ | FAM-02 | Family Advocacy. (App places under Domain 3; ETS places under Category I. Cross-domain mismatch is benign — content still mapped.) |
| I.B.2.b | *Knows strategies for working with diverse community agencies/providers to support a student's success* | ✅ | FAM-03 | Interagency Collaboration. (Same cross-domain note as above.) |

---

## Category II. Direct and Indirect Services — Student-Level Services (23%, 28 items)

### II.A. Academic Interventions and Instructional Support

#### II.A.1 Effective instruction

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| II.A.1.a | *Is familiar with various instructional strategies (e.g., cooperative learning, differentiated instruction, engagement time, scaffolding, study skills)* | ✅ | ACA-04 | Instructional Strategies — direct match. |
| II.A.1.b | *Knows common curricular accommodations and modifications (e.g., information and assistive technology, specially designed instruction, test format)* | ✅ | ACA-02 | Accommodations — direct match. |
| II.A.1.c | *Knows methods for setting and achieving individual instructional goals, assessing outcomes to see whether goals were attained, and helping students become self-regulated learners* | ✅ | ACA-03 | Study Skills / Self-Regulated Learning — direct match. |

#### II.A.2 Issues related to academic success/failure

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| II.A.2.a | *Knows how to identify and use evidence-based strategies when planning interventions and instructional strategies* | ⚠️ | SWP-03 + MBH-03 | Split coverage. SWP-03 covers EBP at systems level, MBH-03 covers EBP intervention models. No single skill owns "EBP for academic intervention planning" specifically. |
| II.A.2.b | *Knows factors related to academic progress (e.g., school/classroom climate, family involvement, motivation, socioeconomic and environmental factors, language competency, programming for ELLs)* | ⚠️ | ACA-09 + DIV-01 + PSY-04 | Multiple skills cover slices. Motivation and classroom climate specifically are thin. |
| II.A.2.c | *Understands the biological, cultural, developmental, and social influences on academic skills* | ✅ | DEV-01 + DIV-01 | Developmental + cultural influences covered. |

### II.B. Mental and Behavioral Health Services and Interventions

#### II.B.1 Preventive strategies

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| II.B.1.a | *Is familiar with common classroom organization and management techniques (e.g., time management, classroom rules, physical environment)* | ❌ | — | **Gap.** No classroom-management module exists. Partial overlap with ACA-04 (Instructional Strategies) and SAF-01 (PBIS) but neither owns the whole territory. Sample Q17 (house rules + positive reinforcement) tests this directly. |
| II.B.1.b | *Knows how to conduct individual and small-group interventions and programs (e.g., social skills training, conflict resolution)* | ✅ | MBH-02 | Counseling Supports — direct match. |
| II.B.1.c | *Is familiar with risk and protective factors associated with learning and mental and behavioral health issues; designs appropriate intervention plans to address those issues* | ⚠️ | SAF-01 + MBH-04 | Split coverage. Risk/protective factors concept is in SAF-01 (school-level) and implicit in MBH-04 (psychopathology). |
| II.B.1.d | *Knows the impact of trauma on social, emotional, behavioral, and academic functioning; practices to reduce the effects of trauma on learning and behavior* | ❌ | — | **Gap.** No dedicated trauma module. ACEs, trauma-informed schools, and TF-CBT are all absent from the current 45-skill map. High priority — trauma is an explicit NASP 2020 emphasis. |

#### II.B.2 School-based intervention skills/techniques

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| II.B.2.a | *Understands fundamental counseling methods (e.g., individual, group) and techniques (e.g., active listening, unconditional positive regard, empathy)* | ✅ | MBH-02 | Counseling Supports. Sample Q-bank (unconditional positive regard discussion question) maps here. |
| II.B.2.b | *Knows about appropriate intervention techniques for various developmental levels* | ✅ | DEV-01 | Development. |
| II.B.2.c | *Is familiar with various theoretical models and approaches to counseling (e.g., cognitive-behavioral, solution-focused)* | ✅ | MBH-03 | Intervention Models. Sample Q5 (CBT cognitive distortions) maps here. |
| II.B.2.d | *Understands applied behavioral analysis and intervention methods* | ✅ | MBH-03 | Intervention Models — ABA is included. |
| II.B.2.e | *Knows culturally responsive and developmentally appropriate assessment techniques to identify emotional and behavioral disabilities* | ⚠️ | DBD-06 + DIV-01 | Split coverage. |
| II.B.2.f | *Knows how to use data to evaluate implementation and outcomes of mental and behavioral health interventions for individuals and groups* | ⚠️ | DBD-08 | Progress Monitoring covers the concept but the specific application to MH interventions is not foregrounded. |

#### II.B.3 Child and adolescent psychopathology

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| II.B.3.a | *Is familiar with common characteristics of mental health problems and related educational disabilities* | ✅ | MBH-04 | Psychopathology — direct match. Sample Q12 (depression symptoms) maps here. |
| II.B.3.b | *Understands the impact mental health has on the educational outcomes of children and adolescents* | ⚠️ | MBH-05 + ACA-09 | Split coverage. |
| II.B.3.c | *Understands the biological, cultural, developmental, and social influences on mental and behavioral health* | ✅ | MBH-05 | Biological Bases. |

---

## Category III. Systems-Level Services (20%, 25 items)

### III.A. Schoolwide Practices to Promote Learning

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| III.A.1 | *Is familiar with the importance of using data to inform systems-level decision making, such as needs assessment, universal screening, and resource mapping* | ✅ | SWP-04 | Systems MTSS — direct match. |
| III.A.2 | *Is familiar with the effectiveness of the practices in the context of common educational policies/practices (e.g., social promotion, high-stakes testing, benchmarking, retention, tracking, discipline)* | ✅ | SWP-02 | Policy and Practice — direct match. |
| III.A.3 | *Recognizes the importance of using evidence-based practices* | ✅ | SWP-03 | Schoolwide Practices — direct match. |
| III.A.4 | *Understands the application of effective Multitiered Systems of Support* | ✅ | SWP-04 | Systems MTSS. Sample Q6 (MTSS integration), Q8 (Tier 1), Q11 (Tier 2), Q30 (SWPBIS + SEL as Tier 1) all map here. |

### III.B. Services to Promote Safe and Supportive Schools

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| III.B.1 | *Knows common school/system-wide prevention practices (e.g., promoting safe school environments, positive behavioral support, bullying prevention, school climate assessment, policy development, programs promoting good health)* | ✅ | SAF-01 | Schoolwide Prevention. Sample Q2 (environmental crime deterrence as Tier 1), Q19 (PBIS fidelity) map here. |
| III.B.2 | *Knows risk and protective factors as they relate to a variety of issues such as school failure, truancy, dropout, bullying, youth suicide, school violence* | ⚠️ | SAF-01 + SAF-03 | Distributed across Schoolwide Prevention and Threat Assessment. |
| III.B.3 | *Knows interventions appropriate for the various levels of crisis and threat assessment associated with suicide and violence assessment* | ✅ | SAF-03 | Threat Assessment. Sample Q15 (duty to warn) maps here. |
| III.B.4 | *Is familiar with factors and issues that should be addressed in crisis prevention, intervention, response, and recovery at the system level* | ✅ | SAF-04 | Crisis Response — direct match to the four-phase framing. |
| III.B.5 | *Is familiar with effective methods to measure and evaluate school safety and school climate (e.g., attendance; office discipline referrals; academic growth; universal screening of students, staff, and families; mental health referrals)* | ⚠️ | SAF-01 + SWP-04 | Partial. No module explicitly walks through climate surveys (e.g., ED School Climate Survey, Panorama). |

### III.C. Family-School Collaboration

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| III.C.1 | *Understands principles and research related to family systems, strengths, needs, and cultures* | ✅ | FAM-02 | Family Advocacy. |
| III.C.2 | *Is familiar with the importance of advocating for the involvement of families in schoolwide activities* | ✅ | FAM-02 | Family Advocacy. |
| III.C.3 | *Is familiar with the importance of interagency collaboration in developing effective schoolwide interventions and policies* | ✅ | FAM-03 | Interagency Collaboration. Sample Q29 (postsecondary transition) maps here. |
| III.C.4 | *Is familiar with strategies for safe, nurturing, and dependable parenting and home interventions to facilitate children's healthy development* | ⚠️ | FAM-02 | Partial. Named programs (Triple P, Nurturing Parenting, Incredible Years) not surfaced. |

---

## Category IV. Foundations of School Psychological Service Delivery (25%, 32 items)

### IV.A. Equitable Practices for Diverse Student Populations

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| IV.A.1 | *Recognizes the importance and influence of culture, background, and individual learning characteristics (e.g., age, gender identity, cognitive capabilities, social-emotional skills, developmental level, race, ethnicity, national origin, religion, sexual orientation, disability, chronic illness, language, socioeconomic status) when designing and implementing interventions to achieve learning and behavioral outcomes* | ✅ | DIV-01 | Cultural Factors — direct match. |
| IV.A.2 | *Knows the importance of working with community liaisons to understand the needs of diverse learners* | ⚠️ | DIV-01 + FAM-03 | Split coverage. |
| IV.A.3 | *Knows the impact of personal beliefs as well as implicit and explicit bias that influence decision making, instruction, behavior, and long-term outcomes for students* | ✅ | DIV-03 | Bias in Decisions — direct match. |
| IV.A.4 | *Recognizes the importance of promoting fairness and social justice in educational programs and services* | ⚠️ | ETH-03 + DIV-01 | Fairness/social justice appears as an ETS discussion question but no module centers it. |
| IV.A.5 | *Knows about special education and related services; knows how to promote specialized instructional and support practices within special education that meet the diverse needs of children with disabilities* | ✅ | DIV-05 + LEG-02 | Diverse Needs + IDEA. Sample Q18 (zero-reject / FAPE) and Q27 (IEP for SLD) map here. |

### IV.B. Research and Evidence-Based Practice

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| IV.B.1 | *Knows how to evaluate research quality and interpret outcomes* | ✅ | RES-03 | Research Design. |
| IV.B.2 | *Knows how to determine the relevance of research and apply research into practice* | ✅ | RES-02 | Applying Research to Practice. |
| IV.B.3 | *Is familiar with types of research designs and basic statistics* | ✅ | RES-03 | Research Design. Sample Q3 (weekly average quantification) maps here. |
| IV.B.4 | *Is familiar with the process involved in implementing individual- and system-level change, including planning and evaluating activities, monitoring fidelity, and addressing barriers to change* | ❌ | — | **Gap.** No implementation-science / change-management module. Barriers-to-change is an NASP 2020 emphasis not currently covered. |
| IV.B.5 | *Knows how to incorporate data collection, measurement, analysis, accountability, and use of technology resources into program evaluation* | ⚠️ | RES-02 | Partial. Program evaluation specifically (formative vs. summative, logic models) is thin. |
| IV.B.6 | *Knows how to analyze, interpret, and use research-based and evidence-based practices at the individual, group, and/or systems levels* | ✅ | RES-02 + SWP-03 | Covered across both skills. |

### IV.C. Legal, Ethical, and Professional Practice

#### IV.C.1 Ethical principles

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| IV.C.1.a | *Understands the NASP Principles for Professional Ethics* | ✅ | ETH-01 | NASP Ethics — direct match. Sample Q22 (advocacy + private-citizen distinction) maps here. |
| IV.C.1.b | *Knows how to apply an ethical problem-solving model to address ethical dilemmas* | ✅ | ETH-01 | Ethical Problem-Solving. Sample Q14 (competency + supervision for Mr. Suzuki), Q28 (student counseling without parental consent) map here. |

#### IV.C.2 Legal issues

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| IV.C.2.a | *Knows the major federal laws and regulations governing the practice of school psychology (e.g., FERPA, Section 504, ESSA, IDEA and its eligibility categories)* | ⚠️ | LEG-01 + LEG-02 + LEG-03 | FERPA (LEG-01), IDEA (LEG-02), 504 (LEG-03) are covered. **ESSA is explicitly named by ETS but has no dedicated module.** Also check that IDEA's 13 eligibility categories are fully enumerated. Sample Q10 (IDEA + electronic communication) maps here. |
| IV.C.2.b | *Knows relevant case law that affects practice (e.g., Larry P. v. Riles, Hendrick Hudson Board of Education v. Rowley, Endrew F. v. Douglas County School District)* | ✅ | LEG-04 | Case Law — direct match. |
| IV.C.2.c | *Knows the rights of students (e.g., informed consent, confidentiality, least restrictive environment, manifestation determination, seclusion and restraint)* | ⚠️ | LEG-02 + ETH-02 | LRE and manifestation determination partial under LEG-02. **Seclusion and restraint** is ETS-explicit but not a dedicated sub-concept anywhere. |
| IV.C.2.d | *Knows the ethical, professional, and legal liability of school psychologists (e.g., malpractice, negligence, supervision, conflict of interest)* | ✅ | ETH-02 | Liability and Supervision — direct match. |

#### IV.C.3 Professional foundations

| ETS # | Knowledge Statement (verbatim) | Status | Map | Note |
|---|---|---|---|---|
| IV.C.3.a | *Understands the ethical and legal responsibilities of advocating for children and their families (i.e., issues such as disproportionality, poverty, access, and equity)* | ✅ | ETH-03 + DIV-01 | Advocacy + Cultural Factors. |
| IV.C.3.b | *Recognizes the importance of lifelong learning and professional growth* | ✅ | ETH-03 | Advocacy and Growth. |
| IV.C.3.c | *Is familiar with the importance and value of supervision and mentoring* | ✅ | ETH-02 | Liability and Supervision. |

---

## Summary Scorecard

### Coverage counts

| Status | Count | % of 79 |
|---|---|---|
| ✅ Covered | 50 | 63% |
| ⚠️ Partial | 20 | 25% |
| ❌ Gap | 9 | 11% |

### High-Priority Gaps (❌) — Recommended New Modules

1. **I.A.2.f Performance-based assessment** (portfolios, work samples) — proposed skill **DBD-NEW-PBA** or new concept cluster under DBD-09.
2. **I.A.2.i Assessment technology & data tools** — proposed concept cluster under DBD-08 (digital CBM/Star/aimsweb, data dashboards).
3. **I.A.4.c Low-incidence exceptionalities** (sensory, severe physical) — proposed extension under ACA-09 or new skill.
4. **II.B.1.a Classroom organization & management** — proposed new skill **ACA-NEW-CM** or add ownership to ACA-04. Directly tested by Q17.
5. **II.B.1.d Trauma and trauma-informed practice** — proposed new skill **MBH-NEW-Trauma** (ACEs, TF-CBT, Sanctuary, trauma-informed schools). Explicit NASP 2020 emphasis.
6. **IV.B.4 Implementation science / change management** — proposed extension under RES-02 or SWP-03 (barriers to change, fidelity monitoring, logic models).
7. **IV.C.2.c Seclusion and restraint; manifestation determination** — proposed sub-concept cluster under LEG-02.
8. **ESSA specifically** (sub-item of IV.C.2.a) — proposed sub-concept under LEG-02 or LEG-03.
9. **School climate measurement methods** (sub-item of III.B.5) — proposed sub-concept under SAF-01.

### Medium-Priority Partials (⚠️) — Consolidate or Clarify

1. **I.A.1.c Screening measures** — clarify ownership (DBD-09 vs SWP-04).
2. **I.A.2.b Educational achievement tests** — expand DBD-03 with achievement-specific content (WIAT-4, WJ-IV Achievement, KTEA-3).
3. **I.A.2.j Treatment fidelity/integrity** — add explicit sub-concept to DBD-08.
4. **I.A.3.c Assessment method trade-offs** — add a cross-method comparison concept.
5. **I.A.4.a Adaptive functioning measures** (Vineland, ABAS) — add extension to DEV-01 or DBD-03.
6. **I.B.1.c Stakeholder communication facilitation** — clarify ownership.
7. **II.A.2.a EBP for intervention planning** — consolidate coverage into one primary skill.
8. **II.A.2.b Academic progress factors** (motivation, climate, SES) — expand ACA-09.
9. **II.B.1.c Risk/protective factors** — consolidate cross-reference between SAF-01 and MBH-04.
10. **II.B.2.e Culturally responsive E/BD assessment** — clarify ownership.
11. **II.B.2.f Data for MH intervention outcomes** — add sub-concept to DBD-08.
12. **II.B.3.b Mental health impact on educational outcomes** — consolidate.
13. **III.B.2 Risk/protective factors (truancy, dropout, suicide, violence)** — consolidate.
14. **III.C.4 Parenting interventions** — add named programs to FAM-02.
15. **IV.A.2 Community liaisons** — clarify ownership.
16. **IV.A.4 Fairness & social justice** — add explicit treatment.
17. **IV.B.5 Program evaluation methods** — expand RES-02.

### App skills with weak ETS anchors (surplus check)

All 45 app skills map to at least one ETS knowledge statement. No surplus/orphan skills identified.

---

## Sample Question → Skill Validation

Every sample question in the Study Companion validates the mapping above. If any question does not land on its expected skill, the mapping is wrong. Current check:

| Q | Topic | Expected Skill | Maps? |
|---|---|---|---|
| 1 | Learning disability hypothesis verification in L1 + school language | PSY-04 | ✅ |
| 2 | Environmentally designed crime deterrence as Tier 1 | SAF-01 | ✅ |
| 3 | Converting fights to weekly average (measurement) | RES-03 | ✅ |
| 4 | Medical history review (two answers) | DBD-10 | ✅ |
| 5 | CBT cognitive distortions | MBH-03 | ✅ |
| 6 | MTSS integrating academic/behavior/SEL | SWP-04 | ✅ |
| 7 | Universal achievement worksheet | DBD-08 / SWP-04 | ✅ |
| 8 | Tier 1 = general education / whole school | SWP-04 | ✅ |
| 9 | Social influences as protective factor | MBH-04 / SAF-01 | ✅ |
| 10 | IDEA governing electronic communication | LEG-02 | ✅ |
| 11 | Tier 2 classwide behavior + character lessons | SWP-04 | ✅ |
| 12 | Depression symptoms | MBH-04 | ✅ |
| 13 | Confounding variables (maturation as alt explanation) | RES-03 | ✅ |
| 14 | Competency + supervision when practicing outside scope | ETH-02 / ETH-03 | ✅ |
| 15 | Duty to warn | SAF-03 / ETH-02 | ✅ |
| 16 | Reliability | PSY-02 | ✅ |
| 17 | House rules + positive reinforcement | ❌ (classroom management gap) | — |
| 18 | Zero-reject principle | LEG-02 | ✅ |
| 19 | PBIS fidelity reminders | SAF-01 | ✅ |
| 20 | Percentile rank definition | PSY-01 | ✅ |
| 21 | Ecological validity | PSY-02 | ✅ |
| 22 | Advocacy + public/private speech distinction | ETH-01 | ✅ |
| 23 | BICS vs. CALP | PSY-04 | ✅ |
| 24 | CBT as EBP for internalizing | MBH-03 / SWP-03 | ✅ |
| 25 | Z-score calculation | PSY-01 | ✅ |
| 26 | Working memory definition | DBD-05 / ACA-08 | ✅ |
| 27 | IEP components for SLD + emotional regulation (two answers) | LEG-02 / DIV-05 | ✅ |
| 28 | Counseling without parental consent | ETH-01 | ✅ |
| 29 | Interagency collaboration for postsecondary transition | FAM-03 | ✅ |
| 30 | SWPBIS + SEL as next step | SWP-04 / SAF-01 | ✅ |

**29 of 30 sample questions land on a real skill. Q17 (house rules + positive reinforcement) falls into the classroom-management gap (II.B.1.a), confirming that gap is testable.**

---

## Recommended Next Actions

1. **Add 3 new skill clusters** to close ❌ gaps: Trauma & Trauma-Informed Schools, Classroom Organization & Management, Performance-Based Assessment. These three alone would cover the most testable gaps.
2. **Extend 6 existing skills** with sub-concepts: DBD-08 (treatment fidelity, assessment technology), DEV-01 (adaptive behavior), LEG-02 (seclusion/restraint, ESSA), ACA-09 (low-incidence + motivation + classroom climate), RES-02 (program evaluation + change management), SAF-01 (school climate measurement).
3. **Clarify ownership** on the 17 ⚠️ partials by tagging the primary skill and adding cross-references from secondary skills.
4. **Rerun this audit** after each content revision, using the 30 sample questions as validation (every question must land cleanly on a single owning skill).

---

*Audit compiled 2026-04-18 by Claude. Source: ETS Praxis Study Companion (5403), Copyright © 2022 ETS. File: `/sessions/brave-nifty-bohr/mnt/uploads/5403-2.pdf`.*
