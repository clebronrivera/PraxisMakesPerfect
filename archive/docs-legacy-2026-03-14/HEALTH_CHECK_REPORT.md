# Question Bank & Skill System Health Check Report

**Generated:** 2025-02-23

---

## PART 1: Domain Structure Verification

**Source:** `src/brain/skill-map.ts`

All **10 domains** exist (domainId 1–10). Summary:

| Domain ID | Name | Clusters | Skills | Skill IDs |
|-----------|------|----------|--------|-----------|
| 1 | Data-Based Decision Making & Accountability | 4 | 16 | DBDM-S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, NEW-1-PerformanceAssessment, NEW-1-DynamicAssessment, NEW-1-IQvsAchievement, NEW-1-BackgroundInformation, NEW-1-ProblemSolvingFramework, NEW-1-LowIncidenceExceptionalities |
| 2 | Consultation & Collaboration | 3 | 7 | CC-S01, NEW-2-ConsultationProcess, NEW-2-ProblemSolvingSteps, CC-S03, NEW-2-CommunicationStrategies, NEW-2-FamilyCollaboration, NEW-2-CommunityAgencies |
| 3 | Academic Interventions & Instructional Support | 3 | 10 | ACAD-S01, S02, S03, S04, S05, NEW-3-InstructionalHierarchy, NEW-3-MetacognitiveStrategies, NEW-3-AccommodationsModifications, NEW-3-AcademicProgressFactors, NEW-3-BioCulturalInfluences |
| 4 | Mental & Behavioral Health Services | 4 | 10 | MBH-S01, S02, S03, S04, S05, S06, NEW-4-Psychopathology, NEW-4-GroupCounseling, NEW-4-DevelopmentalInterventions, NEW-4-MentalHealthImpact |
| 5 | School-Wide Practices to Promote Learning | 3 | 7 | SWP-S01, S04, S02, S03, NEW-5-SchoolClimate, NEW-5-EducationalPolicies, NEW-5-EBPImportance |
| 6 | Preventive & Responsive Services | 2 | 8 | PC-S01, S02, S03, S04, S05, NEW-6-BullyingPrevention, NEW-6-TraumaInformed, NEW-6-SchoolClimateMeasurement |
| 7 | Family-School Collaboration Services | 1 | 7 | FSC-S01, S03, S04, NEW-7-BarriersToEngagement, NEW-7-FamilySystems, NEW-7-InteragencyCollaboration, NEW-7-ParentingInterventions |
| 8 | Diversity in Development & Learning | 4 | 9 | DIV-S01, S05, NEW-8-Acculturation, NEW-8-SocialJustice, DIV-S02, S03, NEW-8-LanguageAcquisition, DIV-S04, S07 |
| 9 | Research & Program Evaluation | 3 | 10 | RES-S01, NEW-9-Variables, NEW-9-ValidityThreats, NEW-9-ImplementationFidelity, NEW-9-ProgramEvaluation, RES-S03, S05, S06, NEW-9-StatisticalTests, NEW-9-DescriptiveStats |
| 10 | Legal, Ethical & Professional Practice | 3 | 13 | LEG-S01, S02, NEW-10-EducationLaw, LEG-S05, LEG-S03, LEG-S04, LEG-S06, NEW-10-EthicalProblemSolving, LEG-S07, NEW-10-RecordKeeping, NEW-10-TestSecurity, NEW-10-Supervision, NEW-10-ProfessionalGrowth |

**Flags:** None. All 10 domains exist; no domain has 0 skills. Total skills: **87**.

---

## PART 2: Question–Skill Mapping Health

**Sources:** `src/data/questions.json`, `src/data/question-skill-map.json`

| Metric | Value |
|--------|--------|
| **Total questions** | 378 |
| **Total mappings** (rows in question-skill-map) | 304 |
| **Questions with valid skillId** (skillId in skill-map) | 378 |
| **Questions missing skillId** | 0 — (none) |
| **Questions with invalid skillId** | 0 — (none) |
| **Orphaned mappings** (map references non-existent question) | 0 |
| **Duplicate question IDs** (in questions.json) | 0 — (none) |

**Note:** 264 unique question IDs appear in `question-skill-map.json`; 114 questions in `questions.json` have an inline `skillId` but no row in the map. Consider syncing the map so every question has at least one mapping entry if the map is the source of truth for practice/assessment.

---

## PART 3: Skill Coverage Check

Question counts are from **question-skill-map.json** (each row = one question–skill pair). Status: ✅ 3+ questions, ⚠️ 1–2 questions, ❌ 0 questions.

| Skill ID | Skill Name | Question Count | Status |
|----------|------------|----------------|--------|
| DBDM-S01 | Reliability Type Selection | 3 | ✅ |
| DBDM-S02 | Validity Type Recognition | 1 | ⚠️ |
| DBDM-S03 | Score Interpretation | 12 | ✅ |
| DBDM-S04 | Sensitivity/Specificity Distinction | 1 | ⚠️ |
| DBDM-S05 | Assessment-Purpose Matching | 8 | ✅ |
| DBDM-S06 | Norm vs Criterion Reference Distinction | 3 | ✅ |
| DBDM-S07 | Assessment Type Recognition | 1 | ⚠️ |
| DBDM-S08 | Progress Monitoring Protocol | 4 | ✅ |
| DBDM-S09 | Universal Screening Purpose | 2 | ⚠️ |
| DBDM-S10 | Data-First Decision Making | 4 | ✅ |
| NEW-1-PerformanceAssessment | Performance-Based Assessment Recognition | 1 | ⚠️ |
| NEW-1-DynamicAssessment | Dynamic Assessment Application | 1 | ⚠️ |
| NEW-1-IQvsAchievement | Intelligence vs. Achievement Distinction | 1 | ⚠️ |
| NEW-1-BackgroundInformation | Background Information Use | 0 | ❌ |
| NEW-1-ProblemSolvingFramework | Problem-Solving Framework | 0 | ❌ |
| NEW-1-LowIncidenceExceptionalities | Low-Incidence Exceptionalities Assessment | 5 | ✅ |
| CC-S01 | Consultation Type Recognition | 9 | ✅ |
| NEW-2-ConsultationProcess | Consultation Process Knowledge | 7 | ✅ |
| NEW-2-ProblemSolvingSteps | Problem-Solving Model Application | 3 | ✅ |
| CC-S03 | Collaborative Role & Approach | 5 | ✅ |
| NEW-2-CommunicationStrategies | Communication & Resistance Management | 5 | ✅ |
| NEW-2-FamilyCollaboration | Working with Diverse Families | 8 | ✅ |
| NEW-2-CommunityAgencies | Working with Community Agencies | 5 | ✅ |
| ACAD-S01 | Tier Selection & Intensity | 1 | ⚠️ |
| ACAD-S02 | Reading Intervention Selection | 2 | ⚠️ |
| ACAD-S03 | Error Pattern Analysis | 1 | ⚠️ |
| ACAD-S04 | Fluency Building Strategies | 2 | ⚠️ |
| ACAD-S05 | Instructional Level Determination | 1 | ⚠️ |
| NEW-3-InstructionalHierarchy | Instructional Hierarchy Application | 2 | ⚠️ |
| NEW-3-MetacognitiveStrategies | Metacognitive & Study Skills | 2 | ⚠️ |
| NEW-3-AccommodationsModifications | Accommodations & Modifications | 20 | ✅ |
| NEW-3-AcademicProgressFactors | Factors Related to Academic Progress | 3 | ✅ |
| NEW-3-BioCulturalInfluences | Biological, Cultural, and Social Influences on Academics | 0 | ❌ |
| MBH-S01 | FBA Purpose | 3 | ✅ |
| MBH-S02 | Behavior Function Identification | 3 | ✅ |
| MBH-S03 | Replacement Behavior Selection | 2 | ⚠️ |
| MBH-S04 | Suicide Risk Assessment | 2 | ⚠️ |
| MBH-S05 | Therapy Model Recognition | 5 | ✅ |
| MBH-S06 | Behavioral Principles | 4 | ✅ |
| NEW-4-Psychopathology | Child & Adolescent Psychopathology | 4 | ✅ |
| NEW-4-GroupCounseling | Group Counseling Dynamics | 3 | ✅ |
| NEW-4-DevelopmentalInterventions | Developmental-Level Interventions | 11 | ✅ |
| NEW-4-MentalHealthImpact | Mental Health Impact on Education | 10 | ✅ |
| SWP-S01 | RTI/MTSS Framework | 5 | ✅ |
| SWP-S04 | Implementation Fidelity | 2 | ⚠️ |
| SWP-S02 | PBIS Principles | 4 | ✅ |
| SWP-S03 | Tier 1 Universal Practices | 4 | ✅ |
| NEW-5-SchoolClimate | School Climate Components | 2 | ⚠️ |
| NEW-5-EducationalPolicies | Educational Policies | 9 | ✅ |
| NEW-5-EBPImportance | Evidence-Based Practices Importance | 0 | ❌ |
| PC-S01 | Threat Assessment | 1 | ⚠️ |
| PC-S02 | Crisis Response Role | 3 | ✅ |
| PC-S03 | Psychological First Aid | 1 | ⚠️ |
| PC-S04 | Crisis Preparedness | 2 | ⚠️ |
| PC-S05 | Postvention Services | 1 | ⚠️ |
| NEW-6-BullyingPrevention | Bullying & Harassment Prevention | 2 | ⚠️ |
| NEW-6-TraumaInformed | Trauma-Informed Care | 1 | ⚠️ |
| NEW-6-SchoolClimateMeasurement | School Safety & Climate Measurement | 1 | ⚠️ |
| FSC-S01 | Partnership Goals | 1 | ⚠️ |
| FSC-S03 | Communication Strategies | 2 | ⚠️ |
| FSC-S04 | Cultural Competence | 1 | ⚠️ |
| NEW-7-BarriersToEngagement | Barriers to Engagement | 2 | ⚠️ |
| NEW-7-FamilySystems | Family Systems Theory | 5 | ✅ |
| NEW-7-InteragencyCollaboration | Interagency Collaboration | 5 | ✅ |
| NEW-7-ParentingInterventions | Parenting & Home Interventions | 1 | ⚠️ |
| DIV-S01 | Implicit Bias Recognition | 1 | ⚠️ |
| DIV-S05 | Cultural Broker Role | 1 | ⚠️ |
| NEW-8-Acculturation | Acculturation Dynamics | 1 | ⚠️ |
| NEW-8-SocialJustice | Social Justice & Advocacy | 1 | ⚠️ |
| DIV-S02 | Nonverbal Assessment Selection | 2 | ⚠️ |
| DIV-S03 | ELL Consideration | 2 | ⚠️ |
| NEW-8-LanguageAcquisition | Second Language Acquisition | 2 | ⚠️ |
| DIV-S04 | Disproportionality Interpretation | 1 | ⚠️ |
| DIV-S07 | Interpreter Best Practices | 1 | ⚠️ |
| RES-S01 | Single-Subject Design Recognition | 2 | ⚠️ |
| NEW-9-Variables | Variable Identification | 1 | ⚠️ |
| NEW-9-ValidityThreats | Research Validity Threats | 3 | ✅ |
| NEW-9-ImplementationFidelity | Implementation Fidelity | 0 | ❌ |
| NEW-9-ProgramEvaluation | Program Evaluation | 11 | ✅ |
| RES-S03 | Effect Size Interpretation | 1 | ⚠️ |
| RES-S05 | Type I & Type II Errors | 1 | ⚠️ |
| RES-S06 | Correlation Interpretation | 1 | ⚠️ |
| NEW-9-StatisticalTests | Statistical Test Selection | 2 | ⚠️ |
| NEW-9-DescriptiveStats | Descriptive Statistics | 1 | ⚠️ |
| LEG-S01 | Landmark Cases | 11 | ✅ |
| LEG-S02 | IDEA Requirements | 7 | ✅ |
| NEW-10-EducationLaw | Section 504 vs. IDEA | 4 | ✅ |
| LEG-S05 | Manifestation Determination | 3 | ✅ |
| LEG-S03 | Confidentiality Breach | 2 | ⚠️ |
| LEG-S04 | Mandated Reporting | 1 | ⚠️ |
| LEG-S06 | Ethical Dilemmas | 3 | ✅ |
| NEW-10-EthicalProblemSolving | Ethical Problem-Solving Model | 5 | ✅ |
| LEG-S07 | Informed Consent Requirements | 2 | ⚠️ |
| NEW-10-RecordKeeping | FERPA & Record Access | 4 | ✅ |
| NEW-10-TestSecurity | Test Security & Copyright | 1 | ⚠️ |
| NEW-10-Supervision | Supervision Standards | 1 | ⚠️ |
| NEW-10-ProfessionalGrowth | Lifelong Learning & Professional Growth | 0 | ❌ |

**Skills with 0 questions in map (❌):** 6  
- NEW-1-BackgroundInformation  
- NEW-1-ProblemSolvingFramework  
- NEW-3-BioCulturalInfluences  
- NEW-5-EBPImportance  
- NEW-9-ImplementationFidelity  
- NEW-10-ProfessionalGrowth  

*(Note: Some of these have questions in questions.json with that skillId; the 0 count is from question-skill-map.json only.)*

---

## PART 4: Recently Generated Questions (GEN-*, FLIP-*, SP5403_Q161+)

Questions with IDs starting with `GEN-`, `FLIP-`, or `SP5403_Q16x` and above. (FLIP IDs are `SP5403_FLIP_*`.)

| Question ID | Skill ID | First 100 characters of stem | Correct |
|-------------|----------|------------------------------|--------|
| GEN-DBDM-S02-a3k9m2 | DBDM-S02 | A school psychologist is reviewing a new behavior rating scale before using it with students. The ps... | B |
| GEN-DBDM-S02-q7t1x8 | DBDM-S02 | A school psychologist wants to determine whether scores from a new reading screener predict students... | A |
| GEN-DBDM-S04-h8p0d5 | DBDM-S04 | A behavior screener accurately identifies most students who do not have significant behavior concern... | B |
| GEN-DBDM-S04-v4n2c6 | DBDM-S04 | A district is selecting a brief screener to identify students who may be at risk for depression. The... | A |
| GEN-DBDM-S07-h8v3s6 | DBDM-S07 | A school psychologist is working with a student who is not responding to a Tier 2 reading interventi... | C |
| GEN-DBDM-S07-m2f5k0 | DBDM-S07 | A school psychologist graphs a student's daily on-task behavior for two weeks, introduces a self-mon... | B |
| GEN-DBDM-S07-r6b9z1 | DBDM-S07 | A fourth-grade teacher gives students short weekly quizzes and uses the results to adjust small-grou... | A |
| GEN-DBDM-T20-20b72b | NEW-1-BackgroundInformation | Before conducting an assessment, a school psychologist should:... | A |
| GEN-NEW-1-BackgroundInformation-p3s1h6 | NEW-1-BackgroundInformation | A school psychologist is asked to evaluate a student for attention difficulties. Which of the follow... | A |
| GEN-NEW-1-BackgroundInformation-y6j8p0 | NEW-1-BackgroundInformation | Before initiating a comprehensive evaluation, a school psychologist reviews a student's prior evalua... | A |
| GEN-NEW-1-DynamicAssessment-g1r3p7 | NEW-1-DynamicAssessment | A second-grade student who recently moved to the United States performs poorly on a cognitive measur... | A |
| GEN-NEW-1-DynamicAssessment-t5m0v8 | NEW-1-DynamicAssessment | A school psychologist is concerned that a student's low scores may reflect limited prior educational... | A |
| GEN-NEW-1-IQvsAchievement-d2p7m9 | NEW-1-IQvsAchievement | A school psychologist is conducting an evaluation for a student suspected of having a specific learn... | A |
| GEN-NEW-1-IQvsAchievement-k2v7q1 | NEW-1-IQvsAchievement | A parent asks why their child's cognitive test score is average but the achievement test score in ma... | C |
| GEN-NEW-1-IQvsAchievement-n9c2d4 | NEW-1-IQvsAchievement | A fifth-grade student has strong reasoning skills but consistently low performance on reading compre... | B |
| GEN-DBDM-T22-* (4 ids) | NEW-1-LowIncidenceExceptionalities | When assessing a student with... | various |
| GEN-NEW-1-PerformanceAssessment-* (2) | NEW-1-PerformanceAssessment | ... | A |
| GEN-DBDM-T21-20bu1u | NEW-1-ProblemSolvingFramework | A problem-solving framework (MTSS/RTI) should be used as the basis for:... | C |
| GEN-NEW-1-ProblemSolvingFramework-* (2) | NEW-1-ProblemSolvingFramework | ... | A |
| GEN-CC-T10-* (4) | NEW-2-CommunityAgencies | A school psychologist needs to coordinate services... | various |
| GEN-CC-T09-* (10) | NEW-2-FamilyCollaboration | A school psychologist is working with a family... | various |
| GEN-ACAD-S01-* (2), GEN-ACAD-S03-* (2), GEN-ACAD-S05-* (4) | ACAD-S01, ACAD-S03, ACAD-S05 | ... | various |
| GEN-ACAD-T10-* (12), GEN-ACAD-T11-* (3), GEN-ACAD-T12-* (4) | NEW-3-AccommodationsModifications, NEW-3-AcademicProgressFactors, NEW-3-BioCulturalInfluences | ... | various |
| GEN-MBH-T03-*, GEN-MBH-T03B-* (4), GEN-MBH-T15-* (11), GEN-MBH-T16-* (12), GEN-MBH-T08C/D (2) | MBH-S03, NEW-4-DevelopmentalInterventions, NEW-4-MentalHealthImpact, NEW-4-GroupCounseling | ... | various |
| GEN-SWP-T10-* (10), GEN-NEW-5-* (4) | NEW-5-EducationalPolicies, NEW-5-SchoolClimate, NEW-5-EBPImportance | ... | various |
| GEN-NEW-6-*, GEN-PC-T09, GEN-PC-S01/03/05 (multiple) | NEW-6-SchoolClimateMeasurement, NEW-6-TraumaInformed, PC-* | ... | various |
| GEN-FSC-* (multiple) | FSC-S01, S04, NEW-7-FamilySystems, NEW-7-InteragencyCollaboration, NEW-7-ParentingInterventions | ... | various |
| GEN-DIV-* (multiple) | DIV-S01, S04, S05, S07, NEW-8-Acculturation, NEW-8-SocialJustice | ... | various |
| GEN-RES-*, GEN-NEW-9-* (multiple) | NEW-9-*, RES-S03, S05, S06 | ... | various |
| SP5403_Q160 | LEG-S02 | Under IDEA and professional standards, when is the use of seclusion or restraint with a student with... | B |
| GEN-LEG-S04-* (2), GEN-LEG-T15, GEN-NEW-10-* (multiple) | LEG-S04, NEW-10-ProfessionalGrowth, NEW-10-Supervision, NEW-10-TestSecurity | ... | various |
| SP5403_FLIP_001–011 | MBH-S06, MBH-S01, MBH-S02, MBH-S05, PC-S02, PC-S04, LEG-S01 | (FLIP distractor-conversion questions) | various |

**Counts (approximate):**  
- **GEN-***: ~170+ questions  
- **SP5403_FLIP_***: 11 questions  
- **SP5403_Q160** (and any Q161+): 1 (SP5403_Q160)

*(Full GEN/FLIP/SP5403_Q160+ list is in `questions.json`; the table above summarizes by pattern and skill.)*

---

## PART 5: Template Coverage

For each skill in the skill-map, at least one template exists in `src/brain/templates/domain-X-templates.ts`. Template IDs are from the grep of `templateId`/`skillId` in the template files.

| Skill ID | Has Template? | Example Template ID(s) |
|----------|---------------|-------------------------|
| DBDM-S01 … DBDM-S10 | ✅ | DBDM-T01 … DBDM-T10 |
| NEW-1-PerformanceAssessment, NEW-1-DynamicAssessment, NEW-1-IQvsAchievement | ✅ | DBDM-T13, T14, T15 |
| NEW-1-BackgroundInformation, NEW-1-ProblemSolvingFramework, NEW-1-LowIncidenceExceptionalities | ✅ | DBDM-T20, T21, T22 |
| CC-S01, NEW-2-* (all), CC-S03 | ✅ | CC-T01 … CC-T10 |
| ACAD-S01 … ACAD-S05, NEW-3-* (all) | ✅ | ACAD-T01 … ACAD-T14 |
| MBH-S01 … MBH-S06, NEW-4-* (all) | ✅ | MBH-T01 … MBH-T16 |
| SWP-S01 … SWP-S04, NEW-5-* (all) | ✅ | SWP-T01 … SWP-T11 |
| PC-S01 … PC-S05, NEW-6-* (all) | ✅ | PC-T01 … PC-T09 |
| FSC-S01, S03, S04, NEW-7-* (all) | ✅ | FSC-T01 … FSC-T09 |
| DIV-S01, S02, S03, S04, S05, S07, NEW-8-* (all) | ✅ | DIV-T01 … DIV-T11 |
| RES-S01, S03, S05, S06, NEW-9-* (all) | ✅ | RES-T01 … RES-T14 |
| LEG-S01 … LEG-S07, NEW-10-* (all) | ✅ | LEG-T01 … LEG-T15 |

**Flags:** None. Every skill has at least one template in its domain’s template file.

---

## PART 6: Summary Report

### Domain structure
- **10/10 domains** present (IDs 1–10), **87 skills** total, **30 clusters**.
- No missing domains; no domain has 0 skills.

### Question–skill mapping
- **378** questions in `questions.json`; **304** mapping rows in `question-skill-map.json` (264 unique questions).
- **0** questions missing `skillId`; **0** invalid `skillId`; **0** orphaned mappings; **0** duplicate question IDs.
- **114** questions have inline `skillId` but no entry in the map — consider adding them to the map if it drives practice/assessment.

### Skill coverage (from map)
- **✅ 3+ questions:** 33 skills  
- **⚠️ 1–2 questions:** 49 skills  
- **❌ 0 questions in map:** 6 skills (NEW-1-BackgroundInformation, NEW-1-ProblemSolvingFramework, NEW-3-BioCulturalInfluences, NEW-5-EBPImportance, NEW-9-ImplementationFidelity, NEW-10-ProfessionalGrowth). Some of these have questions in `questions.json`; the gap is in the map.

### Recently generated (GEN/FLIP/SP5403_Q160+)
- **GEN-***: 170+ questions across all domains.  
- **SP5403_FLIP_***: 11 questions (distractor flips).  
- **SP5403_Q160**: 1 question (LEG-S02).

### Templates
- **87/87 skills** have at least one template in the corresponding `domain-X-templates.ts` file.

### Recommended actions
1. **Map sync:** Add the 114 questions that have `skillId` but no row in `question-skill-map.json` so coverage and reporting use one source.
2. **Low-coverage skills:** Add or map more questions for the 5 skills that show 0 in the map and for skills with only 1–2 mapped questions (49 skills).
3. **No structural issues:** Domains, templates, and ID integrity are consistent; no orphaned mappings or invalid skill IDs.
