// Stage 1: P3 skills — 8 of 8 P3 skills implemented, 26 entries.
// Stage 2: Extended to all 45 progress skills — 98 entries across 48 unique metadata skills.
// Source of truth: skill-metadata-v1.ts commonMisconceptions (human-authored).
// ETH-01 bridge: legacy P3 skill maps to 5 v1 skills — LEG-S03 / LEG-S04 / LEG-S06 / LEG-S07 / NEW-10-EthicalProblemSolving
// SAF-03 bridge: legacy P3 skill maps to PC-S01 (threat assessment)
// All questionIds[] are empty pending distractor content authoring (0% valid coverage confirmed).

import { MisconceptionEntry, MisconceptionId, PatternId } from '../types/misconception';

export const MISCONCEPTION_TAXONOMY: MisconceptionEntry[] = [
  // DBDM-S01: Reliability Types
  {
    id: 'MC-DBDM-S01-001' as MisconceptionId,
    skillId: 'DBDM-S01',
    text: 'All reliability types are interchangeable across measurement contexts',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['similar-concept' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-DBDM-S01-002' as MisconceptionId,
    skillId: 'DBDM-S01',
    text: 'Test-retest reliability measures internal consistency rather than stability over time',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['definition-error' as PatternId, 'function-confusion' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-DBDM-S01-003' as MisconceptionId,
    skillId: 'DBDM-S01',
    text: 'Cronbach\'s alpha is appropriate for behavioral observation data',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['context-mismatch' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },

  // DBDM-S03: Standard Scores and Standard Error of Measurement
  {
    id: 'MC-DBDM-S03-001' as MisconceptionId,
    skillId: 'DBDM-S03',
    text: 'A percentile rank of 50 means the student got 50% of items correct',
    family: 'conceptual-precision',
    relatedPatternIds: ['definition-error' as PatternId, 'function-confusion' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-DBDM-S03-002' as MisconceptionId,
    skillId: 'DBDM-S03',
    text: 'Higher reliability always means smaller SEM in all cases',
    family: 'conceptual-precision',
    relatedPatternIds: ['absolute-rules' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-DBDM-S03-003' as MisconceptionId,
    skillId: 'DBDM-S03',
    text: 'A standard score of 85 puts a student at the 15th percentile',
    family: 'conceptual-precision',
    relatedPatternIds: ['definition-error' as PatternId],
    questionIds: [],
  },

  // LEG-S02: IDEA, FAPE, and Related Services
  {
    id: 'MC-LEG-S02-001' as MisconceptionId,
    skillId: 'LEG-S02',
    text: 'Schools can deny FAPE to students whose disabilities are considered too severe to benefit',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['law-confusion' as PatternId, 'optimal-education' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-LEG-S02-002' as MisconceptionId,
    skillId: 'LEG-S02',
    text: 'Related services like counseling are optional additions rather than IDEA entitlements',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['law-confusion' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },

  // MBH-S03: Replacement Behaviors
  {
    id: 'MC-MBH-S03-001' as MisconceptionId,
    skillId: 'MBH-S03',
    text: 'Any socially appropriate behavior can replace a problem behavior regardless of its function',
    family: 'behavioral-science-reasoning',
    relatedPatternIds: ['function-mismatch' as PatternId, 'function-confusion' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-MBH-S03-002' as MisconceptionId,
    skillId: 'MBH-S03',
    text: 'Replacement behaviors must look completely different from the problem behavior',
    family: 'behavioral-science-reasoning',
    relatedPatternIds: ['function-confusion' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },

  // SWP-S04: Implementation Fidelity
  {
    id: 'MC-SWP-S04-001' as MisconceptionId,
    skillId: 'SWP-S04',
    text: 'Implementation fidelity means teachers cannot make any adaptations to programs',
    family: 'instructional-procedural',
    relatedPatternIds: ['absolute-rules' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-SWP-S04-002' as MisconceptionId,
    skillId: 'SWP-S04',
    text: 'Fidelity can be assumed if teachers completed initial training',
    family: 'instructional-procedural',
    relatedPatternIds: ['data-ignorance' as PatternId, 'incomplete-response' as PatternId],
    questionIds: [],
  },

  // CC-S01: Consultation Models
  {
    id: 'MC-CC-S01-001' as MisconceptionId,
    skillId: 'CC-S01',
    text: 'All consultation models follow the same structure regardless of target or goal',
    family: 'conceptual-precision',
    relatedPatternIds: ['model-confusion' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-CC-S01-002' as MisconceptionId,
    skillId: 'CC-S01',
    text: 'Conjoint consultation involves only the home or only the school, not both simultaneously',
    family: 'conceptual-precision',
    relatedPatternIds: ['definition-error' as PatternId, 'incomplete-response' as PatternId],
    questionIds: [],
  },

  // ETH-01 bridge: legacy P3 skill → LEG-S03 / LEG-S04 / LEG-S06 / LEG-S07 / NEW-10-EthicalProblemSolving

  // LEG-S03: Confidentiality and Privilege
  {
    id: 'MC-LEG-S03-001' as MisconceptionId,
    skillId: 'LEG-S03',
    text: 'Confidentiality must always be maintained regardless of safety risk',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['absolute-rules' as PatternId, 'legal-overreach' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-LEG-S03-002' as MisconceptionId,
    skillId: 'LEG-S03',
    text: 'Everything a student shares in a counseling session is automatically legally privileged',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['law-confusion' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },

  // LEG-S04: Mandated Reporting
  {
    id: 'MC-LEG-S04-001' as MisconceptionId,
    skillId: 'LEG-S04',
    text: 'Mandated reporters must be certain abuse has occurred before filing a report',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['absolute-rules' as PatternId, 'law-confusion' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-LEG-S04-002' as MisconceptionId,
    skillId: 'LEG-S04',
    text: 'School psychologists should investigate suspected abuse before reporting',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['sequence-error' as PatternId, 'role-confusion' as PatternId],
    questionIds: [],
  },

  // LEG-S06: NASP Ethical Principles
  {
    id: 'MC-LEG-S06-001' as MisconceptionId,
    skillId: 'LEG-S06',
    text: 'Ethical dilemmas always have a single clearly correct answer',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['absolute-rules' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-LEG-S06-002' as MisconceptionId,
    skillId: 'LEG-S06',
    text: 'Consulting with a colleague when facing an ethical dilemma signals professional weakness',
    family: 'professional-scope',
    relatedPatternIds: ['role-confusion' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },

  // LEG-S07: Informed Consent and Minor Assent
  {
    id: 'MC-LEG-S07-001' as MisconceptionId,
    skillId: 'LEG-S07',
    text: 'Any counseling interaction — including a brief safety check — requires formal parental consent',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['absolute-rules' as PatternId, 'law-confusion' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-LEG-S07-002' as MisconceptionId,
    skillId: 'LEG-S07',
    text: 'Students under 18 have no rights regarding their own mental health services',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['adult-criteria' as PatternId, 'law-confusion' as PatternId],
    questionIds: [],
  },

  // NEW-10-EthicalProblemSolving: Ethical Problem-Solving Models
  {
    id: 'MC-NEW-10-EthicalProblemSolving-001' as MisconceptionId,
    skillId: 'NEW-10-EthicalProblemSolving',
    text: 'The first step in ethical problem-solving is identifying a solution',
    family: 'decision-sequence',
    relatedPatternIds: ['sequence-error' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-10-EthicalProblemSolving-002' as MisconceptionId,
    skillId: 'NEW-10-EthicalProblemSolving',
    text: 'Duty to protect never overrides confidentiality under any circumstances',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['absolute-rules' as PatternId, 'legal-overreach' as PatternId],
    questionIds: [],
  },

  // SAF-03 bridge: legacy P3 skill → PC-S01 (Threat Assessment)

  // PC-S01: Threat Assessment
  {
    id: 'MC-PC-S01-001' as MisconceptionId,
    skillId: 'PC-S01',
    text: 'All student threats must be treated as equally serious regardless of context',
    family: 'context-specificity',
    relatedPatternIds: ['absolute-rules' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-PC-S01-002' as MisconceptionId,
    skillId: 'PC-S01',
    text: 'A student expressing frustration or anger automatically represents a substantive threat',
    family: 'context-specificity',
    relatedPatternIds: ['definition-error' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Stage 2: Remaining 33 skills (alphabetical by progress ID)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── ACA-02 → NEW-3-AccommodationsModifications: Accommodations ────────────
  {
    id: 'MC-NEW-3-AccommodationsModifications-001' as MisconceptionId,
    skillId: 'NEW-3-AccommodationsModifications',
    text: 'Accommodations change the academic standards a student is held to',
    family: 'conceptual-precision',
    relatedPatternIds: ['definition-error' as PatternId, 'similar-concept' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-3-AccommodationsModifications-002' as MisconceptionId,
    skillId: 'NEW-3-AccommodationsModifications',
    text: 'Modifications and accommodations are interchangeable terms',
    family: 'conceptual-precision',
    relatedPatternIds: ['definition-error' as PatternId, 'similar-concept' as PatternId],
    questionIds: [],
  },

  // ── ACA-03 → NEW-3-MetacognitiveStrategies: Study Skills ──────────────────
  {
    id: 'MC-NEW-3-MetacognitiveStrategies-001' as MisconceptionId,
    skillId: 'NEW-3-MetacognitiveStrategies',
    text: 'Metacognitive strategies only benefit advanced learners',
    family: 'instructional-procedural',
    relatedPatternIds: ['context-mismatch' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-3-MetacognitiveStrategies-002' as MisconceptionId,
    skillId: 'NEW-3-MetacognitiveStrategies',
    text: 'Study skills instruction can substitute for content knowledge',
    family: 'instructional-procedural',
    relatedPatternIds: ['function-confusion' as PatternId, 'similar-concept' as PatternId],
    questionIds: [],
  },

  // ── ACA-04 → NEW-3-InstructionalHierarchy: Instructional Strategies ───────
  {
    id: 'MC-NEW-3-InstructionalHierarchy-001' as MisconceptionId,
    skillId: 'NEW-3-InstructionalHierarchy',
    text: 'All students at the same grade level need the same type of instruction',
    family: 'instructional-procedural',
    relatedPatternIds: ['context-mismatch' as PatternId, 'absolute-rules' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-3-InstructionalHierarchy-002' as MisconceptionId,
    skillId: 'NEW-3-InstructionalHierarchy',
    text: 'Fluency drills are appropriate even before a student has acquired the skill',
    family: 'decision-sequence',
    relatedPatternIds: ['sequence-error' as PatternId, 'premature-action' as PatternId],
    questionIds: [],
  },

  // ── ACA-06 → NEW-4-DevelopmentalInterventions: Learning Theory ────────────
  {
    id: 'MC-NEW-4-DevelopmentalInterventions-001' as MisconceptionId,
    skillId: 'NEW-4-DevelopmentalInterventions',
    text: 'The same counseling approach is equally effective across all developmental stages',
    family: 'context-specificity',
    relatedPatternIds: ['context-mismatch' as PatternId, 'absolute-rules' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-4-DevelopmentalInterventions-002' as MisconceptionId,
    skillId: 'NEW-4-DevelopmentalInterventions',
    text: 'Adolescents require the same level of parental involvement in counseling as young children',
    family: 'context-specificity',
    relatedPatternIds: ['context-mismatch' as PatternId, 'adult-criteria' as PatternId],
    questionIds: [],
  },

  // ── ACA-07 → ACAD-S02: Language and Literacy ──────────────────────────────
  {
    id: 'MC-ACAD-S02-001' as MisconceptionId,
    skillId: 'ACAD-S02',
    text: 'Reading fluency problems always indicate the need for more phonics instruction',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['function-confusion' as PatternId, 'similar-concept' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-ACAD-S02-002' as MisconceptionId,
    skillId: 'ACAD-S02',
    text: 'Comprehension strategies address all types of reading comprehension difficulties equally',
    family: 'instructional-procedural',
    relatedPatternIds: ['absolute-rules' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },

  // ── ACA-08 → ACAD-S03: Executive Function ─────────────────────────────────
  {
    id: 'MC-ACAD-S03-001' as MisconceptionId,
    skillId: 'ACAD-S03',
    text: 'Any wrong answer tells us the student simply needs more general practice',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['data-ignorance' as PatternId, 'function-confusion' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-ACAD-S03-002' as MisconceptionId,
    skillId: 'ACAD-S03',
    text: 'Error patterns are only meaningful in math, not in reading',
    family: 'conceptual-precision',
    relatedPatternIds: ['context-mismatch' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },

  // ── ACA-09 → NEW-3-AcademicProgressFactors: Health Impact ─────────────────
  {
    id: 'MC-NEW-3-AcademicProgressFactors-001' as MisconceptionId,
    skillId: 'NEW-3-AcademicProgressFactors',
    text: 'Academic performance is determined primarily by cognitive ability alone',
    family: 'conceptual-precision',
    relatedPatternIds: ['data-ignorance' as PatternId, 'incomplete-response' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-3-AcademicProgressFactors-002' as MisconceptionId,
    skillId: 'NEW-3-AcademicProgressFactors',
    text: 'Socioeconomic factors are outside the scope of a school psychologist\'s concern',
    family: 'professional-scope',
    relatedPatternIds: ['role-confusion' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },

  // ── DBD-01 → DBDM-S10: RIOT Framework, Multi-Method ──────────────────────
  {
    id: 'MC-DBDM-S10-001' as MisconceptionId,
    skillId: 'DBDM-S10',
    text: 'Recommendations can be made from teacher reports alone without reviewing existing data',
    family: 'decision-sequence',
    relatedPatternIds: ['data-ignorance' as PatternId, 'incomplete-response' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-DBDM-S10-002' as MisconceptionId,
    skillId: 'DBDM-S10',
    text: 'Reviewing data is only necessary before major placement decisions',
    family: 'decision-sequence',
    relatedPatternIds: ['data-ignorance' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },

  // ── DBD-03 → NEW-1-IQvsAchievement: Cognitive Assessment ─────────────────
  {
    id: 'MC-NEW-1-IQvsAchievement-001' as MisconceptionId,
    skillId: 'NEW-1-IQvsAchievement',
    text: 'IQ and achievement tests measure the same underlying construct',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['similar-concept' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-1-IQvsAchievement-002' as MisconceptionId,
    skillId: 'NEW-1-IQvsAchievement',
    text: 'Achievement tests predict future potential rather than measuring what has been learned',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['function-confusion' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },

  // ── DBD-05 → DBDM-S04: Diagnostic and Processing Measures ────────────────
  {
    id: 'MC-DBDM-S04-001' as MisconceptionId,
    skillId: 'DBDM-S04',
    text: 'High sensitivity means few false positives (it actually means few false negatives)',
    family: 'conceptual-precision',
    relatedPatternIds: ['definition-error' as PatternId, 'similar-concept' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-DBDM-S04-002' as MisconceptionId,
    skillId: 'DBDM-S04',
    text: 'Sensitivity and specificity can both be maximized without any trade-off',
    family: 'conceptual-precision',
    relatedPatternIds: ['absolute-rules' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },

  // ── DBD-06 → MBH-S01: Emotional/Behavioral Assessment ────────────────────
  {
    id: 'MC-MBH-S01-001' as MisconceptionId,
    skillId: 'MBH-S01',
    text: 'FBA identifies what to punish rather than understanding why the behavior occurs',
    family: 'behavioral-science-reasoning',
    relatedPatternIds: ['function-confusion' as PatternId, 'punishment-focus' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-MBH-S01-002' as MisconceptionId,
    skillId: 'MBH-S01',
    text: 'ABC data collection requires formal assessment instruments',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['definition-error' as PatternId, 'data-ignorance' as PatternId],
    questionIds: [],
  },

  // ── DBD-07 → MBH-S02: Functional Behavioral Assessment ───────────────────
  {
    id: 'MC-MBH-S02-001' as MisconceptionId,
    skillId: 'MBH-S02',
    text: 'All disruptive behavior is primarily attention-seeking',
    family: 'behavioral-science-reasoning',
    relatedPatternIds: ['function-confusion' as PatternId, 'correlation-as-causation' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-MBH-S02-002' as MisconceptionId,
    skillId: 'MBH-S02',
    text: 'Escape-maintained behavior means the student is lazy or unmotivated',
    family: 'behavioral-science-reasoning',
    relatedPatternIds: ['function-confusion' as PatternId, 'correlation-as-causation' as PatternId],
    questionIds: [],
  },

  // ── DBD-08 → DBDM-S08: Progress Monitoring ───────────────────────────────
  {
    id: 'MC-DBDM-S08-001' as MisconceptionId,
    skillId: 'DBDM-S08',
    text: 'Any assessment administered repeatedly can serve as valid progress monitoring',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['similar-concept' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-DBDM-S08-002' as MisconceptionId,
    skillId: 'DBDM-S08',
    text: 'Progress monitoring data should be reviewed monthly rather than weekly',
    family: 'decision-sequence',
    relatedPatternIds: ['delay' as PatternId, 'data-ignorance' as PatternId],
    questionIds: [],
  },

  // ── DBD-09 → DBDM-S09: Ecological Assessment / Screening ─────────────────
  {
    id: 'MC-DBDM-S09-001' as MisconceptionId,
    skillId: 'DBDM-S09',
    text: 'A positive screen result means the student has a disability',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['definition-error' as PatternId, 'function-confusion' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-DBDM-S09-002' as MisconceptionId,
    skillId: 'DBDM-S09',
    text: 'Screening provides sufficient data to make a special education placement decision',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['data-ignorance' as PatternId, 'premature-action' as PatternId],
    questionIds: [],
  },

  // ── DBD-10 → NEW-1-BackgroundInformation: Records Review ──────────────────
  {
    id: 'MC-NEW-1-BackgroundInformation-001' as MisconceptionId,
    skillId: 'NEW-1-BackgroundInformation',
    text: 'Background information is optional when cognitive test data is available',
    family: 'decision-sequence',
    relatedPatternIds: ['data-ignorance' as PatternId, 'incomplete-response' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-1-BackgroundInformation-002' as MisconceptionId,
    skillId: 'NEW-1-BackgroundInformation',
    text: 'Medical records can be requested without parental authorization',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['law-confusion' as PatternId, 'legal-overreach' as PatternId],
    questionIds: [],
  },

  // ── DEV-01 → NEW-4-DevelopmentalInterventions: Development (shared metadata) ──
  // Note: DEV-01 and ACA-06 both map to NEW-4-DevelopmentalInterventions.
  // The misconception entries above under ACA-06 cover this metadata skill.

  // ── DIV-01 → NEW-3-BioCulturalInfluences: Cultural Factors ────────────────
  {
    id: 'MC-NEW-3-BioCulturalInfluences-001' as MisconceptionId,
    skillId: 'NEW-3-BioCulturalInfluences',
    text: 'Cultural factors in learning only apply to ELL students',
    family: 'context-specificity',
    relatedPatternIds: ['context-mismatch' as PatternId, 'inclusion-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-3-BioCulturalInfluences-002' as MisconceptionId,
    skillId: 'NEW-3-BioCulturalInfluences',
    text: 'Academic difficulties always indicate underlying cognitive processing deficits',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['correlation-as-causation' as PatternId, 'data-ignorance' as PatternId],
    questionIds: [],
  },

  // ── DIV-03 → DIV-S01: Implicit Bias in Decision Making ───────────────────
  {
    id: 'MC-DIV-S01-001' as MisconceptionId,
    skillId: 'DIV-S01',
    text: 'Only overtly racist people have implicit biases',
    family: 'conceptual-precision',
    relatedPatternIds: ['definition-error' as PatternId, 'extreme-language' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-DIV-S01-002' as MisconceptionId,
    skillId: 'DIV-S01',
    text: 'Cultural differences in behavior are inherently signs of behavioral or social problems',
    family: 'context-specificity',
    relatedPatternIds: ['context-mismatch' as PatternId, 'correlation-as-causation' as PatternId],
    questionIds: [],
  },

  // ── DIV-05 → NEW-10-EducationLaw: Special Education Services and Diverse Needs ──
  {
    id: 'MC-NEW-10-EducationLaw-001' as MisconceptionId,
    skillId: 'NEW-10-EducationLaw',
    text: 'Section 504 and IDEA provide the same types and levels of services',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['law-confusion' as PatternId, 'similar-concept' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-10-EducationLaw-002' as MisconceptionId,
    skillId: 'NEW-10-EducationLaw',
    text: 'A student who does not qualify for IDEA cannot receive any school-based accommodations',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['law-confusion' as PatternId, 'absolute-rules' as PatternId],
    questionIds: [],
  },

  // ── ETH-03 → NEW-10-ProfessionalGrowth: Advocacy, Lifelong Learning ──────
  {
    id: 'MC-NEW-10-ProfessionalGrowth-001' as MisconceptionId,
    skillId: 'NEW-10-ProfessionalGrowth',
    text: 'Professional growth is only necessary early in one\'s career',
    family: 'professional-scope',
    relatedPatternIds: ['absolute-rules' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-10-ProfessionalGrowth-002' as MisconceptionId,
    skillId: 'NEW-10-ProfessionalGrowth',
    text: 'Attending any professional development activity is sufficient to maintain competence',
    family: 'professional-scope',
    relatedPatternIds: ['definition-error' as PatternId, 'incomplete-response' as PatternId],
    questionIds: [],
  },

  // ── FAM-02 → NEW-2-FamilyCollaboration: Family Involvement and Advocacy ──
  {
    id: 'MC-NEW-2-FamilyCollaboration-001' as MisconceptionId,
    skillId: 'NEW-2-FamilyCollaboration',
    text: 'Family involvement simply means parents attending school events',
    family: 'conceptual-precision',
    relatedPatternIds: ['definition-error' as PatternId, 'incomplete-response' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-2-FamilyCollaboration-002' as MisconceptionId,
    skillId: 'NEW-2-FamilyCollaboration',
    text: 'Low attendance at school meetings signals lack of parental care',
    family: 'context-specificity',
    relatedPatternIds: ['correlation-as-causation' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },

  // ── FAM-03 → NEW-7-InteragencyCollaboration: Interagency Collaboration ───
  {
    id: 'MC-NEW-7-InteragencyCollaboration-001' as MisconceptionId,
    skillId: 'NEW-7-InteragencyCollaboration',
    text: 'Interagency collaboration is only relevant during postsecondary transition planning',
    family: 'professional-scope',
    relatedPatternIds: ['context-mismatch' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-7-InteragencyCollaboration-002' as MisconceptionId,
    skillId: 'NEW-7-InteragencyCollaboration',
    text: 'School psychologists have no role in coordinating outside agency services for students',
    family: 'professional-scope',
    relatedPatternIds: ['role-confusion' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },

  // ── LEG-01 → NEW-10-RecordKeeping: FERPA and Educational Records ─────────
  {
    id: 'MC-NEW-10-RecordKeeping-001' as MisconceptionId,
    skillId: 'NEW-10-RecordKeeping',
    text: 'Non-custodial parents automatically have no right to access their child\'s school records',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['law-confusion' as PatternId, 'absolute-rules' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-10-RecordKeeping-002' as MisconceptionId,
    skillId: 'NEW-10-RecordKeeping',
    text: 'Medical records are automatically included as part of educational records under FERPA',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['law-confusion' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },

  // ── LEG-04 → LEG-S01: Case Law and Student Rights ────────────────────────
  {
    id: 'MC-LEG-S01-001' as MisconceptionId,
    skillId: 'LEG-S01',
    text: 'Tarasoff duty to warn applies to any general expression of risk, not only to specific identifiable targets',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['law-confusion' as PatternId, 'extreme-language' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-LEG-S01-002' as MisconceptionId,
    skillId: 'LEG-S01',
    text: 'The Rowley FAPE standard requires schools to maximize a student\'s educational potential',
    family: 'legal-ethical-boundary',
    relatedPatternIds: ['optimal-education' as PatternId, 'law-confusion' as PatternId],
    questionIds: [],
  },

  // ── MBH-02 → NEW-4-GroupCounseling: Individual and Group Counseling ───────
  {
    id: 'MC-NEW-4-GroupCounseling-001' as MisconceptionId,
    skillId: 'NEW-4-GroupCounseling',
    text: 'Any student who needs support is automatically a good candidate for group counseling',
    family: 'context-specificity',
    relatedPatternIds: ['context-mismatch' as PatternId, 'absolute-rules' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-4-GroupCounseling-002' as MisconceptionId,
    skillId: 'NEW-4-GroupCounseling',
    text: 'Group developmental stages are linear and never revisited',
    family: 'conceptual-precision',
    relatedPatternIds: ['model-confusion' as PatternId, 'absolute-rules' as PatternId],
    questionIds: [],
  },

  // ── MBH-04 → NEW-4-Psychopathology: Psychopathology ──────────────────────
  {
    id: 'MC-NEW-4-Psychopathology-001' as MisconceptionId,
    skillId: 'NEW-4-Psychopathology',
    text: 'Depression in children presents the same as in adults (sadness-dominant)',
    family: 'context-specificity',
    relatedPatternIds: ['adult-criteria' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-4-Psychopathology-002' as MisconceptionId,
    skillId: 'NEW-4-Psychopathology',
    text: 'ADHD is always characterized by hyperactivity in all children at all ages',
    family: 'conceptual-precision',
    relatedPatternIds: ['absolute-rules' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },

  // ── MBH-05 → NEW-4-MentalHealthImpact: Biological Bases ──────────────────
  {
    id: 'MC-NEW-4-MentalHealthImpact-001' as MisconceptionId,
    skillId: 'NEW-4-MentalHealthImpact',
    text: 'Mental health concerns are separate from and do not affect academic functioning',
    family: 'conceptual-precision',
    relatedPatternIds: ['data-ignorance' as PatternId, 'function-confusion' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-4-MentalHealthImpact-002' as MisconceptionId,
    skillId: 'NEW-4-MentalHealthImpact',
    text: 'Students with mental health problems always show behavioral warning signs first',
    family: 'context-specificity',
    relatedPatternIds: ['absolute-rules' as PatternId, 'correlation-as-causation' as PatternId],
    questionIds: [],
  },

  // ── MBH-05 (metadata duplicate) → MBH-S05: Intervention Models (CBT/SFT) ──
  // Note: MBH-03 progress skill maps to MBH-S05 metadata. Already covered in Stage 1 as MBH-S03.
  // The Stage 1 entries for MBH-S03 used the MBH-S03 metadata ID but contained the MBH-S05 misconception texts.
  // No duplication needed — MBH-03 is fully covered.

  // ── PSY-03 → NEW-1-ProblemSolvingFramework: MTSS in Assessment ────────────
  {
    id: 'MC-NEW-1-ProblemSolvingFramework-001' as MisconceptionId,
    skillId: 'NEW-1-ProblemSolvingFramework',
    text: 'The problem-solving framework applies only to academic concerns',
    family: 'conceptual-precision',
    relatedPatternIds: ['context-mismatch' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-1-ProblemSolvingFramework-002' as MisconceptionId,
    skillId: 'NEW-1-ProblemSolvingFramework',
    text: 'MTSS and RTI are unrelated frameworks with different purposes',
    family: 'conceptual-precision',
    relatedPatternIds: ['similar-concept' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },

  // ── PSY-04 → DIV-S02: CLD Assessment ──────────────────────────────────────
  {
    id: 'MC-DIV-S02-001' as MisconceptionId,
    skillId: 'DIV-S02',
    text: 'Nonverbal tests are always more valid for all ELL students regardless of context',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['absolute-rules' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-DIV-S02-002' as MisconceptionId,
    skillId: 'DIV-S02',
    text: 'Translating a test into the student\'s native language removes all cultural bias',
    family: 'assessment-tool-confusion',
    relatedPatternIds: ['absolute-rules' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },

  // ── RES-02 → NEW-9-ProgramEvaluation: Applying Research to Practice ───────
  {
    id: 'MC-NEW-9-ProgramEvaluation-001' as MisconceptionId,
    skillId: 'NEW-9-ProgramEvaluation',
    text: 'Program evaluation only occurs at the end of a program\'s implementation cycle',
    family: 'decision-sequence',
    relatedPatternIds: ['sequence-error' as PatternId, 'delay' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-9-ProgramEvaluation-002' as MisconceptionId,
    skillId: 'NEW-9-ProgramEvaluation',
    text: 'Positive stakeholder perception is sufficient evidence of a program\'s effectiveness',
    family: 'conceptual-precision',
    relatedPatternIds: ['data-ignorance' as PatternId, 'correlation-as-causation' as PatternId],
    questionIds: [],
  },

  // ── RES-03 → RES-S01: Research Design & Statistics ────────────────────────
  {
    id: 'MC-RES-S01-001' as MisconceptionId,
    skillId: 'RES-S01',
    text: 'Single-subject designs require large participant groups to produce valid results',
    family: 'conceptual-precision',
    relatedPatternIds: ['definition-error' as PatternId, 'model-confusion' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-RES-S01-002' as MisconceptionId,
    skillId: 'RES-S01',
    text: 'Returning to baseline in an A-B-A-B design means the intervention has failed',
    family: 'conceptual-precision',
    relatedPatternIds: ['definition-error' as PatternId, 'model-confusion' as PatternId],
    questionIds: [],
  },

  // ── SAF-01 → SWP-S02: Schoolwide Prevention (PBIS) ───────────────────────
  {
    id: 'MC-SWP-S02-001' as MisconceptionId,
    skillId: 'SWP-S02',
    text: 'PBIS eliminates the need for any disciplinary consequences',
    family: 'behavioral-science-reasoning',
    relatedPatternIds: ['absolute-rules' as PatternId, 'punishment-focus' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-SWP-S02-002' as MisconceptionId,
    skillId: 'SWP-S02',
    text: 'PBIS is simply a reward system for good behavior',
    family: 'behavioral-science-reasoning',
    relatedPatternIds: ['definition-error' as PatternId, 'incomplete-response' as PatternId],
    questionIds: [],
  },

  // ── SAF-04 → PC-S02: Crisis Response ──────────────────────────────────────
  {
    id: 'MC-PC-S02-001' as MisconceptionId,
    skillId: 'PC-S02',
    text: 'Crisis counseling means providing long-term therapy immediately during a crisis',
    family: 'professional-scope',
    relatedPatternIds: ['definition-error' as PatternId, 'role-confusion' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-PC-S02-002' as MisconceptionId,
    skillId: 'PC-S02',
    text: 'School psychologists should manage crisis situations alone without a crisis team',
    family: 'professional-scope',
    relatedPatternIds: ['role-confusion' as PatternId, 'incomplete-response' as PatternId],
    questionIds: [],
  },

  // ── SWP-02 → NEW-5-EducationalPolicies: Policy and Practice ──────────────
  {
    id: 'MC-NEW-5-EducationalPolicies-001' as MisconceptionId,
    skillId: 'NEW-5-EducationalPolicies',
    text: 'Grade retention is an effective intervention for academically struggling students',
    family: 'instructional-procedural',
    relatedPatternIds: ['correlation-as-causation' as PatternId, 'data-ignorance' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-5-EducationalPolicies-002' as MisconceptionId,
    skillId: 'NEW-5-EducationalPolicies',
    text: 'Ability grouping reliably improves outcomes for all students across groups',
    family: 'instructional-procedural',
    relatedPatternIds: ['absolute-rules' as PatternId, 'data-ignorance' as PatternId],
    questionIds: [],
  },

  // ── SWP-03 → NEW-5-EBPImportance: Evidence-Based Schoolwide Practices ────
  {
    id: 'MC-NEW-5-EBPImportance-001' as MisconceptionId,
    skillId: 'NEW-5-EBPImportance',
    text: 'Any widely-used or popular intervention is likely evidence-based',
    family: 'conceptual-precision',
    relatedPatternIds: ['definition-error' as PatternId, 'correlation-as-causation' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-NEW-5-EBPImportance-002' as MisconceptionId,
    skillId: 'NEW-5-EBPImportance',
    text: 'Suspension is an effective consequence for reducing conduct problems',
    family: 'behavioral-science-reasoning',
    relatedPatternIds: ['punishment-focus' as PatternId, 'data-ignorance' as PatternId],
    questionIds: [],
  },

  // ── MBH-S05: Intervention Models (CBT, ABA, Solution-Focused) ──────────────
  // MBH-03 maps here. Source: skill-metadata-v1.ts commonMisconceptions.
  {
    id: 'MC-MBH-S05-001' as MisconceptionId,
    skillId: 'MBH-S05',
    text: 'CBT focuses primarily on changing feelings rather than the relationship between thoughts and behaviors',
    family: 'behavioral-science-reasoning',
    relatedPatternIds: ['function-confusion' as PatternId, 'definition-error' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-MBH-S05-002' as MisconceptionId,
    skillId: 'MBH-S05',
    text: 'Solution-focused therapy is equally appropriate for all presenting concerns',
    family: 'behavioral-science-reasoning',
    relatedPatternIds: ['absolute-rules' as PatternId, 'context-mismatch' as PatternId],
    questionIds: [],
  },

  // ── SWP-S01: Systems MTSS / RTI ──────────────────────────────────────────
  // SWP-04 progress skill maps here. Different from SWP-S04 (implementation fidelity).
  // Source: skill-metadata-v1.ts commonMisconceptions.
  {
    id: 'MC-SWP-S01-001' as MisconceptionId,
    skillId: 'SWP-S01',
    text: 'RTI is exclusively a process for identifying students with learning disabilities',
    family: 'decision-sequence',
    relatedPatternIds: ['definition-error' as PatternId, 'function-confusion' as PatternId],
    questionIds: [],
  },
  {
    id: 'MC-SWP-S01-002' as MisconceptionId,
    skillId: 'SWP-S01',
    text: 'All three tiers must be fully implemented sequentially before eligibility can be considered',
    family: 'decision-sequence',
    relatedPatternIds: ['absolute-rules' as PatternId, 'temporal-confusion' as PatternId],
    questionIds: [],
  },

  // ── LEG-03 → NEW-10-EducationLaw (shared with DIV-05): Section 504 ───────
  // Note: LEG-03 and DIV-05 both map to NEW-10-EducationLaw metadata.
  // Entries already added above under DIV-05. No duplication needed.
];
