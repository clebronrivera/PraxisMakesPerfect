/**
 * Skill ID Mapping — progressTaxonomy ↔ skill-metadata-v1
 *
 * progressTaxonomy.ts uses runtime IDs like "DBD-01", "CON-01"
 * skill-metadata-v1.ts uses content IDs like "DBDM-S01", "CC-S01"
 *
 * This mapping connects them so metadata lookups (vocabulary,
 * misconceptions, case archetypes) resolve correctly at runtime.
 *
 * Matching was done by comparing fullLabel (progressTaxonomy) against
 * vocabulary terms and content descriptions (skill-metadata-v1).
 * Where no clear 1:1 match exists, the entry maps to null.
 */

export const progressToMetadataId: Record<string, string> = {
  // ── Domain 1: Professional Practices ──────────────────────────────────────
  'CON-01': 'CC-S01',                      // Consultation Models → behavioral/organizational/multicultural consultation
  'DBD-01': 'DBDM-S10',                    // RIOT Framework, Multi-Method → baseline data, data review, hypothesis, problem-solving sequence
  'DBD-03': 'NEW-1-IQvsAchievement',       // Cognitive Assessment → intelligence test, achievement test, fluid reasoning, crystallized intelligence
  'DBD-05': 'DBDM-S04',                    // Diagnostic and Processing Measures → sensitivity, specificity, true/false positive
  'DBD-06': 'MBH-S01',                     // Emotional/Behavioral Assessment → FBA, antecedent, behavior, consequence (ABC)
  'DBD-07': 'MBH-S02',                     // Functional Behavioral Assessment → attention/escape/tangible/sensory function
  'DBD-08': 'DBDM-S08',                    // Progress Monitoring → curriculum-based measurement (CBM), aim line, trend line
  'DBD-09': 'DBDM-S09',                    // Ecological Assessment → universal screening, at-risk, risk identification
  'DBD-10': 'NEW-1-BackgroundInformation',  // Records Review → developmental history, educational records, medical records
  'PSY-01': 'DBDM-S03',                    // Score Interpretation → confidence interval, SEM, standard score, percentile rank
  'PSY-02': 'DBDM-S01',                    // Reliability and Validity → test-retest, Cronbach's alpha, interrater reliability
  'PSY-03': 'NEW-1-ProblemSolvingFramework', // MTSS in Assessment → MTSS, RTI, tiered support, problem-solving model
  'PSY-04': 'DIV-S02',                     // CLD Assessment → nonverbal assessment, linguistic bias, ELL, test bias

  // ── Domain 2: Student-Level Services ──────────────────────────────────────
  'ACA-02': 'NEW-3-AccommodationsModifications', // Accommodations → accommodation, modification, assistive technology, extended time
  'ACA-03': 'NEW-3-MetacognitiveStrategies',    // Study Skills → metacognition, self-regulation, self-monitoring, executive function
  'ACA-04': 'NEW-3-InstructionalHierarchy',      // Instructional Strategies → acquisition, proficiency, generalization, modeling
  'ACA-06': 'NEW-4-DevelopmentalInterventions',  // Learning Theory → developmental appropriateness, Piaget stages, cognitive development
  'ACA-07': 'ACAD-S02',                    // Language and Literacy → phonemic awareness, phonics, decoding, reading fluency
  'ACA-08': 'ACAD-S03',                    // Executive Function → error analysis, error pattern, diagnostic teaching — closest match for cognitive processes
  'ACA-09': 'NEW-3-AcademicProgressFactors',     // Health Impact → classroom climate, socioeconomic factors, environmental context
  'DEV-01': 'NEW-4-DevelopmentalInterventions',  // Development (Erikson, Piaget) → developmental appropriateness, Piaget stages
  'MBH-02': 'NEW-4-GroupCounseling',       // Individual and Group Counseling → group formation, group stages, group cohesion
  'MBH-03': 'MBH-S05',                     // Intervention Models (CBT, ABA, Solution-Focused) → CBT, SFBT, DBT
  'MBH-04': 'NEW-4-Psychopathology',       // Psychopathology → ADHD, depression, anxiety, ASD, ODD
  'MBH-05': 'NEW-4-MentalHealthImpact',    // Biological Bases → academic impact, anxiety and test performance, depression

  // ── Domain 3: Systems-Level Services ──────────────────────────────────────
  'FAM-02': 'NEW-2-FamilyCollaboration',    // Family Involvement → family-school partnership, culturally responsive, parent engagement
  'FAM-03': 'NEW-7-InteragencyCollaboration', // Interagency Collaboration → transition planning, service coordination
  'SAF-01': 'SWP-S02',                     // Schoolwide Prevention (PBIS) → PBIS, positive reinforcement, proactive discipline
  'SAF-03': 'PC-S01',                      // Threat Assessment → transient/substantive threat, plan, intent, means
  'SAF-04': 'PC-S02',                      // Crisis Response → crisis response, psychological first aid, triage
  'SWP-02': 'NEW-5-EducationalPolicies',   // Policy and Practice → grade retention, ability grouping, tracking
  'SWP-03': 'NEW-5-EBPImportance',         // Evidence-Based Schoolwide Practices → EBP, empirical support, What Works Clearinghouse
  'SWP-04': 'SWP-S01',                     // Systems MTSS → MTSS, RTI, tiered support, universal screening

  // ── Domain 4: Foundations ─────────────────────────────────────────────────
  'DIV-01': 'NEW-3-BioCulturalInfluences',  // Cultural Factors → biological factors, cultural learning styles, cultural capital
  'DIV-03': 'DIV-S01',                     // Implicit Bias → implicit bias, cultural bias, microaggression, stereotype
  'DIV-05': 'NEW-10-EducationLaw',         // Special Education Services → Section 504, IDEA, disability definition
  'ETH-01': 'NEW-10-EthicalProblemSolving', // NASP Ethics → ethical problem-solving model, competing principles, dual relationship
  'ETH-02': 'LEG-S06',                     // Professional Liability → ethical principles, beneficence, nonmaleficence, professional boundaries
  'ETH-03': 'NEW-10-ProfessionalGrowth',   // Advocacy, Lifelong Learning → continuing education, professional development, scope of competence
  'LEG-01': 'NEW-10-RecordKeeping',         // FERPA → FERPA, educational records, record access rights, directory information
  'LEG-02': 'LEG-S02',                     // IDEA → IDEA, FAPE, zero-reject, IEP, LRE
  'LEG-03': 'NEW-10-EducationLaw',         // Section 504 / ADA → Section 504, IDEA, civil rights access — shared with DIV-05
  'LEG-04': 'LEG-S01',                     // Case Law → Tarasoff, Larry P., Rowley, FAPE standard
  'RES-02': 'NEW-9-ProgramEvaluation',     // Applying Research to Practice → program evaluation, outcome data, formative/summative evaluation
  'RES-03': 'RES-S01',                     // Research Design & Statistics → single-subject design, A-B-A-B, multiple baseline
};

// Build reverse mapping
const _reverse: Record<string, string> = {};
for (const [progressId, metadataId] of Object.entries(progressToMetadataId)) {
  // First mapping wins (some metadata IDs are shared by multiple progress IDs)
  if (!_reverse[metadataId]) {
    _reverse[metadataId] = progressId;
  }
}

/**
 * Convert a progressTaxonomy skill ID to a metadata skill ID.
 * Returns the metadata ID if a mapping exists, or null if not.
 */
export function toMetadataId(progressId: string): string | null {
  return progressToMetadataId[progressId] ?? null;
}

/**
 * Convert a metadata skill ID to a progressTaxonomy skill ID.
 * Returns the progress ID if a mapping exists, or null if not.
 */
export function toProgressId(metadataId: string): string | null {
  return _reverse[metadataId] ?? null;
}
