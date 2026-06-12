/**
 * skillObjectiveMap — curated many-to-many map from the 45 progress skills to the
 * 79 official ETS content topics (the "objective" / microscale layer).
 *
 * Keys   : progress skill IDs (src/utils/progressTaxonomy.ts), e.g. 'DBD-01'.
 * Values : ETS topic codes (src/data/ets-content-topics.json), verbatim, e.g. 'I.A.1.a'.
 *          The first element of each array equals primaryObjectiveBySkill[skill].
 *
 * ─── Architectural contract ────────────────────────────────────────────────────
 * The 45 skills remain the SCORED / mastery unit. Objectives are a DESCRIPTIVE /
 * routing / reporting facet only — they are NEVER read by scoring, mastery, adaptive
 * selection, or readiness logic (enforced by tests/objectiveBoundaryGuard.test.ts).
 * This is the ONE shared key (the ETS code); it is not a new ID scheme.
 *
 * Curation rule: each skill maps only to topics within its own app domain — the ETS
 * Roman-numeral prefix partitions cleanly (I→D1, II→D2, III→D3, IV→D4 at 27/19/13/20).
 * Coverage is guaranteed by tests/skillObjectiveMap.test.ts: every skill owns ≥1
 * objective and every one of the 79 ETS topics is owned by ≥1 skill.
 *
 * ID crosswalk: progress ID ↔ metadata ID in src/data/skillIdMap.ts.
 */

export const skillObjectiveMap: Record<string, string[]> = {
  // ── Domain 1 — Professional Practices (I.* — 27 topics) ─────────────────────
  'CON-01': ['I.B.1.b', 'I.B.1.a', 'I.B.1.c', 'I.B.2.a', 'I.B.2.b'], // Consultation Models and Methods
  'DBD-01': ['I.A.1.a', 'I.A.1.c', 'I.A.2.i'],                       // RIOT Framework & Multi-Method Information Gathering
  'DBD-03': ['I.A.2.a'],                                             // Cognitive and Intellectual Assessment
  'DBD-05': ['I.A.2.c', 'I.A.2.b', 'I.A.4.a', 'I.A.4.c'],            // Diagnostic and Processing Measures
  'DBD-06': ['I.A.2.d'],                                             // Emotional and Behavioral Assessment Instruments
  'DBD-07': ['I.A.2.e'],                                             // Functional Behavioral Assessment
  'DBD-08': ['I.A.2.g', 'I.A.2.f', 'I.A.2.j'],                       // Curriculum-Based Measurement & Progress Monitoring
  'DBD-09': ['I.A.2.h'],                                             // Ecological Assessment and Contextual Factors
  'DBD-10': ['I.A.1.b'],                                             // Background Information and Records Review
  'PSY-01': ['I.A.3.b', 'I.A.3.c'],                                  // Test Scores, Norms, and Interpretation
  'PSY-02': ['I.A.3.d'],                                             // Reliability and Validity Principles
  'PSY-03': ['I.A.3.a'],                                             // Problem-Solving Framework and MTSS in Assessment
  'PSY-04': ['I.A.4.b', 'I.A.3.e', 'I.A.3.f'],                       // Assessment of CLD Students

  // ── Domain 2 — Student-Level Services (II.* — 19 topics) ────────────────────
  'ACA-02': ['II.A.1.b'],                                            // Curricular Accommodations and Modifications
  'ACA-03': ['II.A.1.c'],                                            // Self-Regulated Learning, Metacognition, Study Skills
  'ACA-04': ['II.A.1.a', 'II.A.2.a', 'II.B.1.a'],                    // Instructional Strategies and Effective Pedagogy
  'ACA-06': ['II.A.2.c'],                                            // Learning Theories and Cognitive Development
  'ACA-07': ['II.A.2.b'],                                            // Language Development and Literacy
  'ACA-08': ['II.A.1.c', 'II.A.2.c'],                               // Cognitive Processes and Executive Functioning
  'ACA-09': ['II.B.1.c', 'II.B.3.b', 'II.B.1.d'],                   // Health Conditions and Educational Impact
  'DEV-01': ['II.B.2.b', 'II.B.3.c'],                               // Child and Adolescent Development
  'MBH-02': ['II.B.2.a', 'II.B.1.b', 'II.B.2.f'],                   // Individual and Group Counseling Interventions
  'MBH-03': ['II.B.2.c', 'II.B.2.d'],                               // Theoretical Models of Intervention (CBT, ABA, SFBT)
  'MBH-04': ['II.B.3.a', 'II.B.2.e'],                               // Child and Adolescent Psychopathology
  'MBH-05': ['II.B.3.c'],                                           // Biological Bases of Behavior and Mental Health

  // ── Domain 3 — Systems-Level Services (III.* — 13 topics) ───────────────────
  'FAM-02': ['III.C.1.b', 'III.C.1.a', 'III.C.1.d'],               // Family Involvement and Advocacy
  'FAM-03': ['III.C.1.c'],                                          // Interagency Collaboration
  'SAF-01': ['III.B.1.a', 'III.B.1.b', 'III.B.1.e'],               // Schoolwide Prevention Practices (PBIS, Bullying, Climate)
  'SAF-03': ['III.B.1.c'],                                          // Crisis and Threat Assessment
  'SAF-04': ['III.B.1.d'],                                          // Crisis Prevention, Intervention, Response, Recovery
  'SWP-02': ['III.A.1.b'],                                          // Educational Policy and Practice
  'SWP-03': ['III.A.1.c', 'III.A.1.a'],                            // Evidence-Based Schoolwide Practices
  'SWP-04': ['III.A.1.d'],                                          // MTSS at Systems Level

  // ── Domain 4 — Foundations of School Psychology (IV.* — 20 topics) ──────────
  'DIV-01': ['IV.A.1.a', 'IV.A.1.b'],                              // Cultural and Individual Factors in Intervention Design
  'DIV-03': ['IV.A.1.c', 'IV.A.1.d'],                              // Implicit and Explicit Bias in Decision Making
  'DIV-05': ['IV.A.1.e'],                                          // Special Education Services and Diverse Needs
  'ETH-01': ['IV.C.1.a', 'IV.C.1.b'],                              // NASP Ethics and Ethical Problem-Solving
  'ETH-02': ['IV.C.2.d', 'IV.C.3.c'],                              // Professional Liability and Supervision
  'ETH-03': ['IV.C.3.b', 'IV.C.3.a'],                              // Advocacy, Lifelong Learning, Professional Growth
  'LEG-01': ['IV.C.2.c', 'IV.C.2.a'],                              // FERPA and Educational Records Confidentiality
  'LEG-02': ['IV.C.2.a'],                                          // IDEA and Special Education Law
  'LEG-03': ['IV.C.2.a'],                                          // Section 504 and ADA Protections
  'LEG-04': ['IV.C.2.b', 'IV.C.2.c'],                              // Case Law and Student Rights
  'RES-02': ['IV.B.1.b', 'IV.B.1.f', 'IV.B.1.d', 'IV.B.1.e'],     // Applying Research to Practice
  'RES-03': ['IV.B.1.c', 'IV.B.1.a'],                             // Research Designs and Basic Statistics
};

/**
 * Explicit primary objective per skill — the single most representative ETS topic.
 * Hand-authored (NOT derived from array order) so a future reorder of skillObjectiveMap
 * cannot silently change a skill's primary. Each value is asserted ∈ its skill's array.
 * Used by the seeder to assign a foundational/cold-start item its one objective.
 */
export const primaryObjectiveBySkill: Record<string, string> = {
  // Domain 1
  'CON-01': 'I.B.1.b', 'DBD-01': 'I.A.1.a', 'DBD-03': 'I.A.2.a', 'DBD-05': 'I.A.2.c',
  'DBD-06': 'I.A.2.d', 'DBD-07': 'I.A.2.e', 'DBD-08': 'I.A.2.g', 'DBD-09': 'I.A.2.h',
  'DBD-10': 'I.A.1.b', 'PSY-01': 'I.A.3.b', 'PSY-02': 'I.A.3.d', 'PSY-03': 'I.A.3.a',
  'PSY-04': 'I.A.4.b',
  // Domain 2
  'ACA-02': 'II.A.1.b', 'ACA-03': 'II.A.1.c', 'ACA-04': 'II.A.1.a', 'ACA-06': 'II.A.2.c',
  'ACA-07': 'II.A.2.b', 'ACA-08': 'II.A.1.c', 'ACA-09': 'II.B.1.c', 'DEV-01': 'II.B.2.b',
  'MBH-02': 'II.B.2.a', 'MBH-03': 'II.B.2.c', 'MBH-04': 'II.B.3.a', 'MBH-05': 'II.B.3.c',
  // Domain 3
  'FAM-02': 'III.C.1.b', 'FAM-03': 'III.C.1.c', 'SAF-01': 'III.B.1.a', 'SAF-03': 'III.B.1.c',
  'SAF-04': 'III.B.1.d', 'SWP-02': 'III.A.1.b', 'SWP-03': 'III.A.1.c', 'SWP-04': 'III.A.1.d',
  // Domain 4
  'DIV-01': 'IV.A.1.a', 'DIV-03': 'IV.A.1.c', 'DIV-05': 'IV.A.1.e', 'ETH-01': 'IV.C.1.a',
  'ETH-02': 'IV.C.2.d', 'ETH-03': 'IV.C.3.b', 'LEG-01': 'IV.C.2.c', 'LEG-02': 'IV.C.2.a',
  'LEG-03': 'IV.C.2.a', 'LEG-04': 'IV.C.2.b', 'RES-02': 'IV.B.1.b', 'RES-03': 'IV.B.1.c',
};

/** Every distinct ETS topic code referenced by the map (for tests / downstream use). */
export const ALL_MAPPED_CODES: string[] = [
  ...new Set(Object.values(skillObjectiveMap).flat()),
];
