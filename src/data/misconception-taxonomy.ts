// Stage 1: P3 skills — 8 of 8 P3 skills implemented, 26 entries. Stage 1 complete.
// ETH-01 bridge: legacy P3 skill maps to 5 v1 skills — LEG-S03 / LEG-S04 / LEG-S06 / LEG-S07 / NEW-10-EthicalProblemSolving
// SAF-03 bridge: legacy P3 skill maps to PC-S01 (threat assessment)

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
];
