# C-B2 — Tighter etsTopicId proposals for the 22 skill-fallback modules

_Prepared by the Content/SME track (Coworker) on 2026-06-12 for Track E to re-derive._

**Handoff rule:** the Coworker proposes; **Engineering applies + re-derives** (`derive-module-ets-topics.mjs`) and runs the parity test (`tests/moduleEtsTopics.test.ts`). The Coworker did NOT run any derive.

**Constraints honored:** every proposed set is a subset of `skillObjectiveMap[primarySkillId]`, has 1–3 codes, and is descriptive-only (never scored).

**Summary:** 11 modules to tighten, 11 already optimal/forced (skill pool minimal).

## Proposals

| Module | Skill | Title | Current | Proposed | Action |
|---|---|---|---|---|---|
| MOD-D1-09 | DBD-01 | Curriculum-Based Measurement (CBM): Progress T | `I.A.1.a, I.A.1.c, I.A.2.i` | `I.A.1.c` | TIGHTEN |
| MOD-D1-12 | DBD-05 | Projective Tests: Supplementary, Not Standalon | `I.A.2.c, I.A.2.b, I.A.4.a` | `I.A.2.c` | TIGHTEN |
| MOD-D1-13 | DBD-10 | Background Information and Records Review: The | `I.A.1.b` | `I.A.1.b` | KEEP |
| MOD-D1-14 | DBD-09 | Ecological Assessment: The Environment Is Part | `I.A.2.h` | `I.A.2.h` | KEEP |
| MOD-D1-15 | PSY-01 | Reading Score Reports: Standard Scores, Percen | `I.A.3.b` | `I.A.3.b` | KEEP |
| MOD-D10-05 | LEG-01 | Parental Consent for Regular Education Student | `IV.C.2.a, IV.C.2.c` | `IV.C.2.c` | TIGHTEN |
| MOD-D10-06 | LEG-02 |  | `IV.C.2.a` | `IV.C.2.a` | KEEP |
| MOD-D10-09 | ETH-02 | Malpractice, Negligence, and Supervisory Liabi | `IV.C.2.d, IV.C.3.c` | `IV.C.2.d, IV.C.3.c` | KEEP |
| MOD-D10-10 | LEG-03 | Section 504 and ADA: Broader Protection, Lower | `IV.C.2.a` | `IV.C.2.a` | KEEP |
| MOD-D2-02 | CON-01 | Consultee-Centered Consultation: Building the  | `I.B.1.b, I.B.1.a, I.B.1.c` | `I.B.1.b` | TIGHTEN |
| MOD-D2-03 | CON-01 | Professional Learning Communities (PLCs): The  | `I.B.1.b, I.B.1.a, I.B.1.c` | `I.B.1.c` | TIGHTEN |
| MOD-D4-08 | SAF-03 | Confidentiality Limits: When to Breach and Whe | `III.B.1.c` | `III.B.1.c` | KEEP |
| MOD-D4-10 | ACA-09 | Health Conditions, Trauma, and Mental Health:  | `II.B.1.c, II.B.1.d, II.B.3.b` | `II.B.1.c, II.B.1.d, II.B.3.b` | KEEP |
| MOD-D4-11 | MBH-02 | Counseling in Schools: Individual, Group, and  | `II.B.2.a, II.B.1.b` | `II.B.2.a, II.B.2.f` | TIGHTEN |
| MOD-D5-03 | SAF-01 | CASEL and Social-Emotional Learning | `III.B.1.a, III.B.1.b, III.B.1.e` | `III.B.1.a` | TIGHTEN |
| MOD-D5-05 | SWP-03 | Selecting and Monitoring Evidence-Based School | `III.A.1.c, III.A.1.a` | `III.A.1.c, III.A.1.a` | KEEP |
| MOD-D6-02 | SAF-04 | Suicide Contagion: The First Priority After a  | `III.B.1.d` | `III.B.1.d` | KEEP |
| MOD-D6-04 | SAF-01 | Bullying Intervention: Restorative Practices O | `III.B.1.a, III.B.1.b, III.B.1.e` | `III.B.1.a, III.B.1.b` | TIGHTEN |
| MOD-D8-02 | DBD-03 | The Universal Nonverbal Intelligence Test (UNI | `I.A.2.a` | `I.A.2.a` | KEEP |
| MOD-D8-03 | PSY-04 | Systemic Racism and Disproportionality: Know t | `I.A.4.b, I.A.3.e, I.A.3.f` | `I.A.3.e, I.A.3.f` | TIGHTEN |
| MOD-D8-05 | DIV-01 | Designing Interventions That Fit the Student's | `IV.A.1.a, IV.A.1.b` | `IV.A.1.a` | TIGHTEN |
| MOD-D9-02 | RES-03 | Correlations: Negative Can Be Stronger Than Po | `IV.B.1.c, IV.B.1.a` | `IV.B.1.c` | TIGHTEN |

## Rationale (per module)

- **MOD-D1-09** (TIGHTEN): `I.A.1.a, I.A.1.c, I.A.2.i` → `I.A.1.c` — CBM is a screening/progress-monitoring measure → I.A.1.c; drop generic RIOT (I.A.1.a) and technology (I.A.2.i).
- **MOD-D1-12** (TIGHTEN): `I.A.2.c, I.A.2.b, I.A.4.a` → `I.A.2.c` — Projective tests are supplementary diagnostic measures → I.A.2.c; drop achievement (I.A.2.b) and adaptive (I.A.4.a) — not what the module covers.
- **MOD-D1-13** (KEEP): `I.A.1.b` → `I.A.1.b` — DBD-10 owns only I.A.1.b (background/records) — already the exact match for a records-review module.
- **MOD-D1-14** (KEEP): `I.A.2.h` → `I.A.2.h` — DBD-09 owns only I.A.2.h (ecological assessment) — exact match.
- **MOD-D1-15** (KEEP): `I.A.3.b` → `I.A.3.b` — I.A.3.b (test scores/norms: percentiles, standard scores) is already the precise single match.
- **MOD-D10-05** (TIGHTEN): `IV.C.2.a, IV.C.2.c` → `IV.C.2.c` — Module is about informed consent + confidentiality (student/parent rights) → IV.C.2.c; drop the broader federal-laws code IV.C.2.a.
- **MOD-D10-06** (KEEP): `IV.C.2.a` → `IV.C.2.a` — LEG-02 owns only IV.C.2.a; no tighter option in the pool (module content not extractable for finer routing).
- **MOD-D10-09** (KEEP): `IV.C.2.d, IV.C.3.c` → `IV.C.2.d, IV.C.3.c` — Precise 2-code match: malpractice/liability (IV.C.2.d) + supervisory liability (IV.C.3.c).
- **MOD-D10-10** (KEEP): `IV.C.2.a` → `IV.C.2.a` — LEG-03 owns only IV.C.2.a (federal laws); 504/ADA = federal laws — exact.
- **MOD-D2-02** (TIGHTEN): `I.B.1.b, I.B.1.a, I.B.1.c` → `I.B.1.b` — Consultee-centered consultation is a consultation MODEL → I.B.1.b; drop I.B.1.a/I.B.1.c. Differentiates from MOD-D2-03.
- **MOD-D2-03** (TIGHTEN): `I.B.1.b, I.B.1.a, I.B.1.c` → `I.B.1.c` — PLCs = facilitating communication/collaboration among stakeholders → I.B.1.c; drop I.B.1.a/I.B.1.b. Differentiates from MOD-D2-02 (currently identical).
- **MOD-D4-08** (KEEP): `III.B.1.c` → `III.B.1.c` — SAF-03 owns only III.B.1.c; forced single code (imperfect fit but no alternative in pool).
- **MOD-D4-10** (KEEP): `II.B.1.c, II.B.1.d, II.B.3.b` → `II.B.1.c, II.B.1.d, II.B.3.b` — Precise 3-code match: trauma (II.B.1.d) + MH-on-outcomes (II.B.3.b) + risk/protective (II.B.1.c).
- **MOD-D4-11** (TIGHTEN): `II.B.2.a, II.B.1.b` → `II.B.2.a, II.B.2.f` — Module = counseling methods + MEASURING outcomes → add II.B.2.f (data to evaluate MH intervention outcomes), which the fallback missed; keep II.B.2.a; drop II.B.1.b.
- **MOD-D5-03** (TIGHTEN): `III.B.1.a, III.B.1.b, III.B.1.e` → `III.B.1.a` — CASEL/SEL is a prevention practice → III.B.1.a; drop III.B.1.b/III.B.1.e (climate measurement not the focus).
- **MOD-D5-05** (KEEP): `III.A.1.c, III.A.1.a` → `III.A.1.c, III.A.1.a` — Precise 2-code match: EBP importance (III.A.1.c) + data for systems decisions/monitoring (III.A.1.a).
- **MOD-D6-02** (KEEP): `III.B.1.d` → `III.B.1.d` — SAF-04 owns only III.B.1.d (crisis prevention/intervention/postvention) — exact for suicide postvention.
- **MOD-D6-04** (TIGHTEN): `III.B.1.a, III.B.1.b, III.B.1.e` → `III.B.1.a, III.B.1.b` — Bullying prevention → III.B.1.a + risk/protective factors III.B.1.b; drop III.B.1.e (climate measurement).
- **MOD-D8-02** (KEEP): `I.A.2.a` → `I.A.2.a` — DBD-03 owns only I.A.2.a (intelligence/cognitive measures); UNIT = nonverbal IQ — exact.
- **MOD-D8-03** (TIGHTEN): `I.A.4.b, I.A.3.e, I.A.3.f` → `I.A.3.e, I.A.3.f` — Equity/racism vocabulary + bias → racial/cultural factors I.A.3.e + test fairness/bias I.A.3.f; drop I.A.4.b (ESL assessment), not this module's topic.
- **MOD-D8-05** (TIGHTEN): `IV.A.1.a, IV.A.1.b` → `IV.A.1.a` — Cultural fit of interventions → IV.A.1.a (influence of culture/background); drop IV.A.1.b (community liaisons), not central here.
- **MOD-D9-02** (TIGHTEN): `IV.B.1.c, IV.B.1.a` → `IV.B.1.c` — Correlation strength/sign = basic statistics → IV.B.1.c; drop IV.B.1.a (evaluating research quality), broader than this stats module.

## ETS codes referenced (for engineering convenience)

- `I.A.1.a` — Understands various methods of information gathering (e.g., record review, interview strategies, observations, and testing [RIOT])
- `I.A.1.b` — Understands appropriate use of background information (e.g., student records, medical records and reports, reviews of previous interventions, developmental history)
- `I.A.1.c` — Understands appropriate use and interpretation of screening measures and methods
- `I.A.2.a` — Understands theories of intelligence and the appropriate use and interpretation of measures of intellectual/cognitive functioning
- `I.A.2.b` — Understands appropriate use and interpretation of measures of educational achievement
- `I.A.2.c` — Knows appropriate use and interpretation of diagnostic/processing measures (e.g., memory, executive functioning, phonemic awareness)
- `I.A.2.h` — Knows appropriate use and interpretation of ecological assessment (e.g., classroom, family, community characteristics)
- `I.A.2.i` — Knows how to use information and technology resources to enhance data collection and decision making
- `I.A.3.b` — Understands the use and interpretation of different types of test scores and norms (e.g., grade- and age-referenced)
- `I.A.3.e` — Knows personal, social, linguistic, environmental, racial, and cultural factors that may influence assessment procedures
- `I.A.3.f` — Knows about test fairness and equity concepts (e.g., implicit bias, explicit bias)
- `I.A.4.a` — Understands appropriate use and interpretation of measures of developmental and adaptive functioning across all age groups
- `I.A.4.b` — Knows appropriate use and interpretation of assessment procedures for English as second language/English-language learners (e.g., the appropriate use of translators/interpreters, measurement selection, language of assessment)
- `I.B.1.a` — Knows strategies for consultation (e.g., goal setting, record keeping, evaluating progress) and how to use a problem-solving framework as the basis for all consultation and collaboration activities when planning, implementing, and evaluating academic and mental health services
- `I.B.1.b` — Knows the principles and strategies associated with varied models of consultation
- `I.B.1.c` — Knows how to facilitate communication and collaboration among diverse stakeholders (e.g., school personnel, families, community professionals)
- `II.B.1.b` — Knows how to conduct individual and small-group interventions and programs (e.g., social skills training, conflict resolution)
- `II.B.1.c` — Is familiar with risk and protective factors associated with learning and mental and behavioral health issues; designs appropriate intervention plans to address those issues
- `II.B.1.d` — Knows the impact of trauma on social, emotional, behavioral, and academic functioning; practices to reduce the effects of trauma on learning and behavior
- `II.B.2.a` — Understands fundamental counseling methods (e.g., individual, group) and techniques (e.g., active listening, unconditional positive regard, empathy)
- `II.B.2.f` — Knows how to use data to evaluate implementation and outcomes of mental and behavioral health interventions for individuals and groups
- `II.B.3.b` — Understands the impact mental health has on the educational outcomes of children and adolescents
- `III.A.1.a` — Is familiar with the importance of using data to inform systems-level decision making, such as needs assessment, universal screening, and resource mapping
- `III.A.1.c` — Recognizes the importance of using evidence-based practices
- `III.B.1.a` — Knows common school/system-wide prevention practices (e.g., promoting safe school environments, positive behavioral support, bullying prevention, school climate assessment, policy development, programs promoting good health)
- `III.B.1.b` — Knows risk and protective factors as they relate to a variety of issues such as school failure, truancy, dropout, bullying, youth suicide, school violence
- `III.B.1.c` — Knows interventions appropriate for the various levels of crisis and threat assessment associated with suicide and violence assessment
- `III.B.1.d` — Is familiar with factors and issues that should be addressed in crisis prevention, intervention, response, and recovery at the system level
- `III.B.1.e` — Is familiar with effective methods to measure and evaluate school safety and school climate (e.g., attendance; office discipline referrals; academic growth; universal screening of students, staff, and families; mental health referrals)
- `IV.A.1.a` — Recognizes the importance and influence of culture, background, and individual learning characteristics (e.g., age, gender identity, cognitive capabilities, social-emotional skills, developmental level, race, ethnicity, national origin, religion, sexual orientation, disability, chronic illness, language, socioeconomic status) when designing and implementing interventions to achieve learning and behavioral outcomes
- `IV.A.1.b` — Knows the importance of working with community liaisons to understand the needs of diverse learners
- `IV.B.1.a` — Knows how to evaluate research quality and interpret outcomes
- `IV.B.1.c` — Is familiar with types of research designs and basic statistics
- `IV.C.2.a` — Knows the major federal laws and regulations governing the practice of school psychology (e.g., FERPA, Section 504, ESSA, IDEA and its eligibility categories)
- `IV.C.2.c` — Knows the rights of students (e.g., informed consent, confidentiality, least restrictive environment, manifestation determination, seclusion and restraint)
- `IV.C.2.d` — Knows the ethical, professional, and legal liability of school psychologists (e.g., malpractice, negligence, supervision, conflict of interest)
- `IV.C.3.c` — Is familiar with the importance and value of supervision and mentoring
