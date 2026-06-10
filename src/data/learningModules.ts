// src/data/learningModules.ts
//
// ─── Learning Module Content Library ──────────────────────────────────────────
//
// NAMING CONVENTION (DO NOT CHANGE — used for code linkage and progress tracking)
// ─────────────────────────────────────────────────────────────────────────────
//   Module ID format:  MOD-D{doc_domain}-{seq}
//   Example:           MOD-D1-01
//
//   doc_domain = Document domain number (1–10), which is a CONTENT grouping
//                distinct from the 4 app progress domains (Professional
//                Practices / Student-Level / Systems-Level / Foundations).
//
//   seq        = Zero-padded sequence within that doc domain (01, 02, …)
//
// These IDs are stable identifiers. Never rename or reorder them.
// The SKILL_MODULE_MAP below links app skill IDs (e.g. "CON-01") to module IDs.
//
// ─── Module Content Structure ─────────────────────────────────────────────────
//
// Each module is a micro-lesson covering ONE testable concept.
// Sections use typed blocks so the UI can render each appropriately:
//   paragraph   — body text, plain prose
//   anchor      — highlighted callout box (memory anchor, clinical logic, etc.)
//   comparison  — two-column contrast table
//   list        — bulleted list items
//
// ─── Source Documents ─────────────────────────────────────────────────────────
//   Praxis_Learning_Modules_v2.docx  — primary content source
//   PraxisVisualPlan v2.docx         — visual / activity specifications (future)
// ──────────────────────────────────────────────────────────────────────────────

// Pack 4: derived ETS objective ids per module (generated, provisional). Kept in a separate
// file so re-derivation never churns the module literals below. See derive-module-ets-topics.mjs.
import moduleEtsTopicMap from './moduleEtsTopicMap.json';

export type ModuleSectionType = 'paragraph' | 'anchor' | 'comparison' | 'list' | 'interactive' | 'visual';

export interface ComparisonRow {
  left: string;
  right: string;
}

// ─── Interactive section sub-types ───────────────────────────────────────────

export interface InteractiveScenario {
  id: string;
  text: string;
  category?: string;  // e.g., "BREACH REQUIRED", "NO BREACH"
}

export interface InteractivePair {
  term: string;
  definition: string;
}

export interface InteractiveOption {
  id: string;
  label: string;
  explanation?: string;
  isCorrect?: boolean;
}

export interface InteractiveCard {
  id: string;
  front: string;
  back: string;
}

// ─── Section union ───────────────────────────────────────────────────────────

interface BaseSection {
  label?: string;
}

interface ParagraphSection extends BaseSection {
  type: 'paragraph';
  text: string;
}

interface AnchorSection extends BaseSection {
  type: 'anchor';
  text: string;
}

interface ListSection extends BaseSection {
  type: 'list';
  items: string[];
}

interface ComparisonSection extends BaseSection {
  type: 'comparison';
  leftHeader: string;
  rightHeader: string;
  rows: ComparisonRow[];
}

interface InteractiveSection extends BaseSection {
  type: 'interactive';
  interactiveType: 'scenario-sorter' | 'drag-to-order' | 'term-matcher' | 'click-selector' | 'card-flip';
  prompt?: string;
  scenarios?: InteractiveScenario[];
  categories?: string[];
  items?: string[];
  pairs?: InteractivePair[];
  options?: InteractiveOption[];
  cards?: InteractiveCard[];
}

interface VisualSection extends BaseSection {
  type: 'visual';
  visualType: 'image' | 'diagram';
  prompt?: string;
}

export type ModuleSection =
  | ParagraphSection
  | AnchorSection
  | ListSection
  | ComparisonSection
  | InteractiveSection
  | VisualSection;

export interface LearningModule {
  /** Stable ID. Format: MOD-D{doc_domain}-{seq}. Never rename. */
  id: string;
  /** Short human-readable title shown in the Learning Path list. */
  title: string;
  /**
   * Canonical skill owner — the single progress skill this module primarily teaches.
   * Used for domain attribution and reporting; replaces the old "arbitrary first-declared
   * home" derivation. SKILL_MODULE_MAP remains the authoritative many-to-many index of every
   * skill that references this module (a module can legitimately support several skills).
   * Derivation + curated exceptions are documented in MODULE_PRIMARY_OVERRIDES below.
   */
  primarySkillId: string;
  /**
   * The ETS objectives this module teaches (Pack 4). Derived from the verified
   * questionObjectiveMap of the questions it routes (skill-question fallback when a module has
   * no routed questions) and attached from moduleEtsTopicMap.json below. Provisional + SME-
   * confirmable; descriptive only — never read by scoring. ⊆ skillObjectiveMap[primarySkillId].
   */
  etsTopicIds?: string[];
  /** Full rich sections rendered inside the lesson viewer. */
  sections: ModuleSection[];

  // ──── Stage 1 Schema Extensions (optional, non-breaking) ────────────────────
  // These fields enable multi-module scaffolding, sequencing, and prerequisite tracking.
  // All optional; existing modules continue to typecheck without them.

  /** Module role in learning design: primary (foundational), extension (parallel/independent), or sequence (part of an ordered chain). */
  role?: 'primary' | 'extension' | 'sequence';

  /** Shared label for all modules in the same ordered progression (e.g., "consultation-models-chain"). Only meaningful when role === 'sequence'. */
  sequenceGroup?: string;

  /** 1-based position within the sequenceGroup. Only meaningful when role === 'sequence'. */
  sequenceIndex?: number;

  /** Module IDs that should be read first. Enforced by UI lock/unlock logic during learning path render. */
  prerequisiteModuleIds?: string[];

  /** Concept tags for flexible knowledge mapping (e.g., ["FERPA", "confidentiality-exceptions", "parental-consent"]). */
  concepts?: string[];
}

// ─── 58 Modules ───────────────────────────────────────────────────────────────

export const LEARNING_MODULES: LearningModule[] = [

  // ── Domain 1: Data-Based Decision Making & Accountability ─────────────────

  {
    id: 'MOD-D1-01',
    primarySkillId: 'LEG-01',
    title: 'FERPA and Student Confidentiality',
    sections: [
      { type: 'anchor', label: 'The scenario that trips people up', text: 'A teacher casually shares a student\'s test results with a helpful colleague — even a reading specialist next door. Feels like good teamwork. It is actually a FERPA violation.' },
      { type: 'paragraph', text: 'FERPA — the Family Educational Rights and Privacy Act — governs all student educational records. It does not matter whether the person receiving the information is qualified, well-meaning, or even employed by the same district. What matters is whether the disclosure was authorized. FERPA allows schools to share student records only with school officials who have a legitimate educational interest and parents who have rights to the records. Informal sharing outside that framework — even with a specialist — is a violation.' },
      { type: 'paragraph', text: "Worked example: A district reading specialist asks the school psychologist for test score breakdowns on several students to inform small-group reading instruction. The specialist is a school official with a documented legitimate educational interest — FERPA permits this disclosure. Compare that to a parent who calls requesting a neighbor child's scores ('I just want to help') — that is a violation regardless of intent. One more: a student turns 18 in October of her senior year. In November, her parents call to review her counseling records. FERPA rights transferred to the student in October; the parents can no longer access records without the student's written consent." },
      { type: 'comparison', leftHeader: 'Who CAN access records (FERPA)', rightHeader: 'Who CANNOT — even if qualified', rows: [
        { left: 'School officials with a documented legitimate educational interest (IEP team members, assigned teachers, counselors)', right: 'Any school employee without a specific, documented need-to-know for that student' },
        { left: 'Parents/guardians of students under age 18', right: 'Parents of a student age 18+ (rights transfer unless student authorizes)' },
        { left: 'The student themselves, once they turn 18', right: 'Outside professionals (community counselors, specialists) without a formal data-sharing agreement' },
        { left: 'Law enforcement under specific lawful subpoena conditions', right: 'Neighbors, family friends, or community members regardless of credentials or good intent' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'scenario-sorter',
        label: 'FERPA Access Control',
        prompt: 'Sort each access request into the correct category.',
        scenarios: [
          { id: 's1', text: 'School counselor requests the student\'s IEP to coordinate services', category: 'ALLOWED' },
          { id: 's2', text: 'Parent submits a written request to inspect and review their child\'s complete education record', category: 'ALLOWED' },
          { id: 's3', text: 'A teaching assistant without assigned responsibilities shares test results with an unrelated teacher', category: 'VIOLATION' },
          { id: 's4', text: 'School psychologist shares comprehensive eval results with parents at an IEP meeting', category: 'ALLOWED' },
          { id: 's5', text: 'Community counselor not employed by the school calls to request student behavior data', category: 'VIOLATION' },
          { id: 's6', text: 'Student at age 18 requests their own educational records', category: 'ALLOWED' },
        ],
        categories: ['ALLOWED (FERPA permits)', 'VIOLATION (FERPA prohibits)'],
      },
      { type: 'anchor', label: 'Memory anchor', text: 'FERPA = Family Educational Rights and Privacy Act. The shortcut: if there is no formal authorization, the answer is almost always FERPA.' },
    ],
  },

  {
    id: 'MOD-D1-02',
    primarySkillId: 'DBD-08',
    title: 'RTI Data: Universal Screening vs. Progress Monitoring',
    sections: [
      { type: 'anchor', label: 'Critical distinction', text: "Universal screening = all students, one point in time, identifies risk. Progress monitoring = one student (or small group), repeated over time, tracks intervention response. 'Universal Monitoring' and 'Progress Screening' are not valid terms — eliminate them if you see them." },
      { type: 'paragraph', text: "Response to Intervention (RTI) runs on two specific data engines. Universal screening is a brief, low-cost assessment given to all students at the same time — its purpose is to identify who may be at risk before problems become serious. Progress monitoring is a different tool entirely: frequent, repeated assessments on a specific skill for students already receiving intervention, used to track whether the intervention is working. Both are essential but they serve completely different functions." },
      { type: 'paragraph', text: "Worked example: Lincoln Elementary screens all 3rd graders in September using a one-minute oral reading fluency (ORF) probe. The 14 students who score below the benchmark are flagged for Tier 2 support — this is universal screening in action. Three weeks later, those 14 students begin a small-group reading intervention. Every two weeks, each student completes a new ORF probe to track their rate of improvement against the aim line — this is progress monitoring. The screening told the team who needs help. The progress monitoring tells them whether the help is working." },
      { type: 'comparison', leftHeader: 'Universal Screening', rightHeader: 'Progress Monitoring', rows: [
        { left: 'Given to: ALL students simultaneously', right: 'Given to: individual students receiving intervention (or small groups)' },
        { left: 'Frequency: 3 times per year (fall, winter, spring)', right: 'Frequency: every 1–2 weeks continuously' },
        { left: 'Purpose: identify students at risk before problems escalate', right: 'Purpose: determine whether the intervention is producing expected growth' },
        { left: 'Data use: populate Tier 2/3 intervention groups', right: 'Data use: inform intervention decisions (continue, intensify, or change)' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'term-matcher',
        label: 'RTI Terminology',
        prompt: 'Match each RTI term with its correct definition.',
        pairs: [
          {
            term: 'Universal Screening',
            definition: 'Brief assessment given to all students simultaneously to identify those at risk',
          },
          {
            term: 'Progress Monitoring',
            definition: 'Frequent, repeated measures of specific skills for students receiving intervention',
          },
          {
            term: 'Tier 1',
            definition: 'Universal, preventive supports available to all students',
          },
          {
            term: 'Tier 2',
            definition: 'Targeted intervention for students showing risk indicators',
          },
        ],
      },
    ],
  },

  {
    id: 'MOD-D1-03',
    primarySkillId: 'DBD-07',
    title: 'Functional Behavioral Assessment (FBA): Required First Step',
    sections: [
      { type: 'anchor', label: 'The gatekeeping rule', text: 'FBA must come BEFORE any Behavior Intervention Plan (BIP). When a disciplinary change of placement triggers a manifestation determination and the behavior is found to be a manifestation of the disability, IDEA requires the IEP team to conduct an FBA (if one was not already done) and implement a BIP. No FBA = no BIP.' },
      { type: 'paragraph', text: 'Before writing any formal behavior support plan, a school psychologist must conduct a Functional Behavioral Assessment. This is not optional — it is the legally expected and best-practice foundation for any individualized behavior plan. An FBA identifies the ABCs of behavior: Antecedent (what triggers the behavior), Behavior (the specific observable action), and Consequence (what follows and may be maintaining it). Without understanding function, any intervention is a guess. A student may be disrupting class to escape difficult work (escape function) or to get peer attention (attention function) — these look identical on the surface but require completely different interventions.' },
      { type: 'paragraph', text: "Worked example: Devon, a 5th grader with an IEP, frequently shouts out in math class and refuses to complete worksheets. The team wants to write a behavior plan. Before any plan can be written, the school psychologist conducts an FBA. She observes that Devon's outbursts cluster around multi-digit multiplication tasks (antecedent: academically demanding task beyond current skill level), the behavior is calling out and shoving worksheets away (behavior), and the consequence is that the teacher sends Devon to work alone at the back table — away from the task (consequence: task escape). Function = escape from academic frustration. The BIP built from this FBA targets the function directly: adjust the academic demand, pre-teach skills, provide a structured break request system. A generic 'be quiet' plan would have failed because it ignores the escape function." },
      { type: 'comparison', leftHeader: 'FBA Component', rightHeader: 'Practical question it answers', rows: [
        { left: 'Antecedent (A)', right: 'What happens immediately before the behavior? (time, task, setting, person, demand)' },
        { left: 'Behavior (B)', right: 'What exactly does the student do? (observable, measurable, specific)' },
        { left: 'Consequence (C)', right: 'What follows the behavior that may be reinforcing or maintaining it?' },
        { left: 'Behavioral function (escape/attention/tangible/sensory)', right: 'Why is the student engaging in this behavior? What need does it serve?' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'drag-to-order',
        label: 'FBA Sequence: The ABC Model',
        prompt: 'Arrange the FBA steps in the correct order.',
        items: [
          'Antecedent: Identify the trigger or situation that precedes the behavior',
          'Behavior: Describe the specific, observable action the student exhibits',
          'Consequence: Determine what follows the behavior and maintains it',
        ],
      },
    ],
  },

  {
    id: 'MOD-D1-04',
    primarySkillId: 'DBD-06',
    title: 'Starting Broad: Why the BASC Comes First',
    sections: [
      { type: 'anchor', label: 'Start broad, then narrow', text: 'Multiple symptoms = BASC (or Conners, BRIEF) first — broad-spectrum tools capture internalizing AND externalizing across multiple raters. Single symptom = narrow-band tool is appropriate (CDI for depression, MASC for anxiety). Never start narrow when multiple concerns are present.' },
      { type: 'paragraph', text: "When a student presents with multiple concerns — withdrawal, sadness, AND anxiety — the correct starting tool is a broad-spectrum behavioral and emotional assessment. The Behavior Assessment System for Children (BASC) is the gold-standard choice because it captures a wide range of internalizing and externalizing concerns across multiple raters (parent, teacher, and self-report). Narrow-band tools like the Beck Depression Inventory or the CDI-2 are valuable supplements, but they only measure one thing. Starting narrow risks missing the larger picture: a student who appears primarily anxious may also have significant depression that goes unassessed if only an anxiety scale is administered. The BASC opens the case; targeted tools deepen it." },
      { type: 'paragraph', text: "Worked example: A middle school teacher refers a student who is 'just shutting down.' She cries sometimes, refuses to come to school on test days, and has been eating alone at lunch. The school psychologist designs the evaluation battery. Starting with the CDI (depression scale only) would miss the anxiety component. Starting with a social skills scale would miss both mood and anxiety. Starting with the BASC-3 (parent form, teacher form, and self-report) captures: internalizing concerns (anxiety, depression, withdrawal, somatization), externalizing concerns (conduct, aggression, attention problems), school problems, and functional communication. The BASC results show elevated Anxiety, Depression, and Withdrawal scores — and notably low Social Skills. Now the psychologist knows where to drill: she follows up with the MASC-2 (anxiety) and CDI-2 (depression) for diagnostic precision. The BASC told her what to look for next." },
      { type: 'comparison', leftHeader: 'Broad-Spectrum Tool (BASC)', rightHeader: 'Narrow-Band Tool (CDI, MASC)', rows: [
        { left: 'Captures wide range: internalizing, externalizing, adaptive behavior', right: 'Measures one domain in depth (e.g., depression only, anxiety only)' },
        { left: 'Multiple rater forms: parent, teacher, self-report', right: 'Typically self-report or parent only; fewer rater perspectives' },
        { left: 'Best when: multiple concerns, unknown profile, initial evaluation', right: 'Best when: single symptom focus, follow-up to broad screening, treatment monitoring' },
        { left: 'Starting narrow risks missing comorbid conditions', right: 'Provides diagnostic precision but misses what it does not measure' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Assessment Tool Selector',
        prompt: 'For each scenario, which assessment tool should you start with?',
        options: [
          { id: 'basc-multi', label: 'BASC-3 (Broad-spectrum)', explanation: 'Best for: Multiple symptoms (anxiety + depression + withdrawal). Captures wide range across multiple raters.', isCorrect: true },
          { id: 'cdi-narrow', label: 'CDI-2 (Narrow - Depression)', explanation: 'Useful for: Following up on a specific symptom after broad screening, but misses the full picture.' },
          { id: 'masc-narrow', label: 'MASC-2 (Narrow - Anxiety)', explanation: 'Useful for: Deep dive on one symptom (anxiety), but starts too narrow when multiple concerns exist.' },
        ],
      },
    ],
  },

  {
    id: 'MOD-D1-05',
    primarySkillId: 'DBD-06',
    title: 'Vineland Discrepancies: Rater Perception Differences',
    sections: [
      { type: 'anchor', label: 'Large discrepancy → rater perception, not SEM', text: 'When parent and teacher Vineland scores diverge by 20+ points, the best explanation is rater perception differences across environments — not test error. SEM accounts for small gaps (±5 pts), not large ones. Even when both parents disagree with each other, the answer is perception, not measurement error.' },
      { type: 'paragraph', text: 'When a parent and teacher complete the same adaptive behavior scale (e.g., Vineland) and the scores differ significantly, the most defensible interpretation is that the raters perceive the child\'s behavior differently across different environments — not that the test is broken. Standard error of measurement exists in every test, but SEM does not typically account for a 20+ point difference between raters. Contextual differences are real, but when scores vary dramatically even between the two parents, the most likely explanation is subjective perception differences between raters.' },
      { type: 'paragraph', text: "Worked example: Sofia is a 7-year-old referred for adaptive behavior assessment. Her mother completes the Vineland-3 and gives a Composite of 94 (average range). Her classroom teacher completes the same scale and gives a Composite of 68 (below average). The 26-point gap is striking. The school psychologist considers three interpretations: (1) measurement error — unlikely, SEM is typically ±5 pts for the Vineland; (2) contextual behavioral differences — possible, but 26 points is extreme for typical home/school variation; (3) rater perception differences — the most defensible interpretation. The mother may not observe the struggles Sofia shows in the structured classroom, or may have different expectations for what counts as adaptive. The psychologist notes both scores in the report, explains the discrepancy, and triangulates with direct observation and teacher narrative before drawing conclusions." },
      { type: 'comparison', leftHeader: 'Large rater discrepancy (>15 pts)', rightHeader: 'Small discrepancy (within SEM)', rows: [
        { left: 'Best explanation: rater perception differences across environments', right: 'Best explanation: normal measurement error (SEM)' },
        { left: 'Suggests child\'s behavior varies meaningfully across settings', right: 'Suggests consistent behavior; minor reporting differences' },
        { left: 'Action: note both scores; triangulate with direct observation', right: 'Action: average scores or weight based on context-relevance' },
        { left: 'Do NOT conclude the test has poor reliability', right: 'SEM is expected and does not indicate a test quality problem' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Rater Discrepancy Interpretation',
        prompt: 'Parent gave Vineland SS 95, Teacher gave SS 68. What is the best interpretation?',
        options: [
          { id: 'perception', label: 'Rater perception differences across environments', explanation: 'Parent and teacher observe the child in different contexts; behavior varies accordingly.', isCorrect: true },
          { id: 'sem', label: 'Standard error of measurement', explanation: 'Real issue, but SEM typically does not account for 27-point gaps.' },
          { id: 'test-broken', label: 'The test has poor reliability', explanation: 'Unlikely; Vineland has strong reliability. A 27-point gap suggests real behavioral differences, not test failure.' },
        ],
      },
      { type: 'anchor', label: 'Test-taking note', text: 'This question type will include distractors like "measurement error" and "contextual factors." Both are partially true, but when the discrepancy is extreme and occurs even between the same-household raters, perception difference is the best answer.' },
    ],
  },

  {
    id: 'MOD-D1-06',
    primarySkillId: 'PSY-03',
    title: 'MTSS Tiers: What Belongs at Tier 1 vs. Tier 3',
    sections: [
      { type: 'anchor', label: 'Tier 1 vs. Tier 3 signal words', text: "Tier 1 = UNIVERSAL (all students, preventive). Tier 2 = TARGETED (small groups at risk). Tier 3 = INTENSIVE (specific individual students). 'Intensive' or 'specific students' in an answer → Tier 3. 'All students' or 'school-wide' → Tier 1." },
      { type: 'paragraph', text: "Tier 1 of the Multi-Tiered System of Supports is universal — it applies to ALL students. It emphasizes clear expectations, explicit and direct instruction, and corrective feedback for the entire school population. The defining feature of Tier 1 is its universal, preventive nature: it does not target particular students or address specific deficits. Tier 3 is intensive and individualized — it involves specialized, individualized intervention plans with frequent progress monitoring for students who have not responded adequately to Tier 1 and Tier 2 supports. When you see the word 'intensive' or 'specific students' in an answer choice about MTSS, that is a Tier 3 signal — it does not belong at Tier 1." },
      { type: 'paragraph', text: "Worked example: An exam question presents four options for what should be included in a school's Tier 1 MTSS plan: (a) clear school-wide behavioral expectations and explicit reading instruction for all students, (b) weekly individual progress monitoring for students below benchmark, (c) intensive individualized intervention plans for students with chronic behavior issues, and (d) a data-based process for identifying students who need Tier 2 support. Option (a) is correct — universal, applies to all. Option (b) is Tier 2 territory (targeted, for at-risk students). Option (c) is Tier 3 (intensive, individualized). Option (d) is a cross-tier process, not a Tier 1 element. The exam frequently includes distractor options that sound school-wide but are actually about specific student populations." },
      { type: 'comparison', leftHeader: 'Tier 1 (Universal)', rightHeader: 'Tier 3 (Intensive)', rows: [
        { left: 'Applies to ALL students in the school', right: 'Applies to SPECIFIC students with the most significant needs (typically 1–5%)' },
        { left: 'Core curriculum with explicit/direct instruction and corrective feedback', right: 'Individualized, evidence-based interventions matched to intensive needs' },
        { left: 'Universal screening 3× per year to identify who needs more', right: 'Frequent (weekly or biweekly) progress monitoring per individual student' },
        { left: 'Preventive — reduces number who need higher tiers', right: 'Responsive — intensive support for students Tiers 1 and 2 did not help adequately' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'scenario-sorter',
        label: 'MTSS Tier Classifier',
        prompt: 'Sort each practice to the tier where it belongs.',
        scenarios: [
          { id: 's1', text: 'School-wide clear behavioral expectations posted in hallways', category: 'TIER_1' },
          { id: 's2', text: 'Individualized intensive intervention for a student with chronic behavior violations', category: 'TIER_3' },
          { id: 's3', text: 'Explicit, direct reading instruction for all students using a core curriculum', category: 'TIER_1' },
          { id: 's4', text: 'Daily, individualized progress monitoring for one student on an intensive, individualized intervention plan', category: 'TIER_3' },
          { id: 's5', text: 'Universal corrective feedback system applied consistently across the school', category: 'TIER_1' },
          { id: 's6', text: 'Specialized, individualized intervention plan for a student with chronic, intensive needs', category: 'TIER_3' },
        ],
        categories: ['TIER_1 (Universal)', 'TIER_3 (Intensive)'],
      },
    ],
  },

  {
    id: 'MOD-D1-07',
    primarySkillId: 'DBD-03',
    title: 'Reading Standard Scores on Cognitive Assessments',
    sections: [
      { type: 'anchor', label: 'The number system', text: 'Mean = 100, SD = 15. Two SDs below = 70 (ID threshold). SS 85 = 16th percentile (low average, NOT disability range). SS 61 = 2.6 SDs below mean = firmly ID range. Know these numbers cold.' },
      { type: 'paragraph', text: 'On most mainstream cognitive assessments (WISC, WJ, RIAS, DAS), the normative mean is 100 with a standard deviation of 15. Scores from 85 to 115 fall within the average range (the middle 68% of the population). Scores below 70 fall more than two standard deviations below the mean — the intellectual disability range. Key benchmark scores: SS 130+ = Very Superior; SS 115–129 = Above Average / High Average; SS 85–115 = Average range; SS 70–84 = Below Average / Borderline; SS 69 and below = Intellectual Disability range. A score of 61 sits firmly in the ID range (2.6 SDs below). A score of 85 is at the 16th percentile — low average, but not a disability range score.' },
      { type: 'paragraph', text: "Worked example: A school psychologist evaluates three students and receives the following WISC Full Scale IQ scores: Student A = 115, Student B = 85, Student C = 68. Student A (SS 115) is in the high end of the average range — exactly at the 84th percentile. Student B (SS 85) is at the 16th percentile, which is the low end of average; this is below average but definitively NOT in the borderline or ID range. A common exam trap is assuming that anything below 100 is a problem — it is not; anything between 85 and 115 is average. Student C (SS 68) is below the 70 threshold — in the intellectual disability range. However, an IQ of 68 alone is not sufficient for an ID determination; adaptive behavior must also show significant deficits (see MOD-D8-04)." },
      { type: 'list', items: ['SS 130+ = Very Superior (2 SDs above mean)', 'SS 115–129 = Above Average / High Average', 'SS 85–115 = Average range (16th–84th percentile)', 'SS 70–84 = Below Average / Borderline', 'SS 69 and below = Intellectual Disability range (2+ SDs below mean)'] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Standard Score Interpretation',
        prompt: 'What is the correct classification for a standard score of 61?',
        options: [
          { id: 'id-range', label: 'Intellectual Disability range (2+ SDs below 100)', explanation: 'SS 61 = 39 points below mean, or 2.6 standard deviations below. Firmly in ID range.', isCorrect: true },
          { id: 'below-avg', label: 'Below average but not disability range', explanation: 'No; SS 70 is the threshold. Scores below 70 are ID range.' },
          { id: 'borderline', label: 'Borderline range', explanation: 'Borderline is SS 70-84. A score of 61 falls below borderline into ID range.' },
        ],
      },
      { type: 'comparison', leftHeader: "Standard Score (SS)", rightHeader: "Percentile Rank (PR)", rows: [
          { left: "Equal-interval scale built on mean = 100, SD = 15", right: "Ranks performance relative to the norm group (1st to 99th)" },
          { left: "SS 100 is exactly average; SS 85 and SS 115 are one SD out", right: "PR 50 is exactly average; PR 16 and PR 84 sit one SD out" },
          { left: "SS 70 marks two SDs below the mean (the ID benchmark)", right: "PR 2 marks roughly two SDs below the mean" },
          { left: "Differences are uniform across the scale (15 points = 1 SD everywhere)", right: "Differences are compressed near the middle, stretched at the tails" },
        ] },
    ],
  },

  {
    id: 'MOD-D1-08',
    primarySkillId: 'PSY-02',
    title: 'Reliability and Validity: What the Numbers Mean',
    sections: [
      { type: 'anchor', label: 'The coefficient thresholds', text: 'Reliability preferred: ≥ 0.80. A coefficient of 0.79 = acceptable but marginal. Validity (convergent) preferred: ≥ 0.70. A coefficient of 0.58 = moderate — not strong enough to endorse the new test as a replacement.' },
      { type: 'paragraph', text: "Psychometric adequacy is judged by specific coefficient benchmarks. Test-retest reliability of 0.79 is acceptable but on the lower end of convention — most experts prefer 0.80 or higher. A convergent validity coefficient of 0.58 indicates only moderate association between the new test and the established one. When validity is only moderate (below 0.70), practitioners should be cautious about recommending a new test solely on that basis. The correct answer frames this as a moderate relationship that is not strong enough to endorse the new test as a replacement for an established measure." },
      { type: 'paragraph', text: "Worked example: A research team develops a new brief behavioral screening tool (BAS-3) and reports the following psychometric data: test-retest reliability = 0.79; convergent validity with the BASC-3 = 0.58. An exam question asks: 'What should a school psychologist conclude about the BAS-3?' The answer: the reliability is acceptable but on the lower end of the preferred range (0.80+), and the validity coefficient is moderate — it correlates with the BASC-3, but not strongly enough to replace it. The psychologist would be cautious about using the BAS-3 as a standalone diagnostic tool. If the question asks 'Is this test reliable?' — yes, marginally. 'Is this test valid enough to replace the BASC-3?' — no. 'Is this test worthless?' — no. The precise language matters on the exam." },
      { type: 'comparison', leftHeader: 'Reliability (consistency)', rightHeader: 'Validity (accuracy)', rows: [
        { left: 'Preferred: ≥ 0.80. Acceptable: 0.70–0.79. Below 0.70: questionable.', right: 'Convergent validity preferred: ≥ 0.70. Below 0.70: moderate, use cautiously.' },
        { left: 'A coefficient of 0.79 = acceptable but marginal; most experts prefer higher', right: 'A coefficient of 0.58 = moderate — correlated, but not strongly enough to endorse or replace' },
        { left: 'Measures consistency of scores across time or across items', right: 'Measures whether the test is actually capturing the construct it claims to measure' },
        { left: 'Necessary but not sufficient for validity', right: 'Requires adequate reliability as a prerequisite' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Coefficient Interpretation',
        prompt: 'A new assessment shows test-retest reliability = 0.79. What does this mean?',
        options: [
          { id: 'acceptable-marginal', label: 'Acceptable but marginal', explanation: 'Convention is ≥0.80. At 0.79, it meets minimum criteria but practitioners prefer stronger reliability.', isCorrect: true },
          { id: 'strong-reliable', label: 'Strongly reliable; recommended', explanation: 'No; 0.79 is below the preferred 0.80 threshold. It is acceptable but not strong.' },
          { id: 'unacceptable', label: 'Unacceptable; test should not be used', explanation: 'No; 0.79 is still acceptable, just on the lower end of the range.' },
        ],
      },
    ],
  },

  {
    id: 'MOD-D1-09',
    primarySkillId: 'DBD-01',
    title: 'Curriculum-Based Measurement (CBM): Progress Tracking, Not Replacement',
    sections: [
      { type: 'anchor', label: 'CBM supplements — never replaces', text: "CBM = brief, repeatable, curriculum-sourced probes that measure rate of improvement (ROI) over time using LOCAL norms (grade-level peers). Standardized testing measures status at a single point using NATIONAL norms. On the exam: if the question involves weekly probes, progress monitoring, or instructional decision-making mid-year, the answer involves CBM." },
      { type: 'paragraph', text: "A Curriculum-Based Measurement is a brief, repeatable assessment taken directly from a student's own curriculum materials. It measures how a student is progressing in basic academic skills over time — reading fluency, math computation, spelling. CBMs supplement standardized testing; they do not replace it. They are local-norm referenced (compared to classmates or grade peers), not national norm referenced. A CBM reading probe uses a passage from the classroom's own reading program — not a nationally standardized passage. The defining feature of CBM is the rate of improvement — measured by giving the same type of probe every one to two weeks and graphing the slope of progress. If the slope is flat or declining, the intervention is changed." },
      { type: 'paragraph', text: "Worked example: Marcus is a 2nd grader receiving Tier 2 reading intervention. His school psychologist administers one-minute oral reading fluency (ORF) probes from 2nd-grade passages every Wednesday. At Week 1 Marcus reads 42 words correct per minute (WCPM); by Week 8 he reads 61 WCPM — a slope of approximately 2.4 WCPM per week. The district benchmark for 2nd-grade mid-year is 72 WCPM. The psychologist plots Marcus's trajectory against the aimline from his baseline to the end-of-year goal (90 WCPM). Because his actual slope falls slightly below the aimline, the team adjusts the intervention intensity. This is CBM in action: not a snapshot of where Marcus is, but a live tracking tool that drives instructional decisions every two weeks." },
      { type: 'comparison', leftHeader: 'CBM', rightHeader: 'Standardized Norm-Referenced Test', rows: [
        { left: 'Brief (1–3 min), repeated weekly or biweekly', right: 'Long (45–90 min), administered once or twice per year' },
        { left: 'Local norms — compared to grade peers in the same curriculum', right: 'National norms — compared to a standardization sample' },
        { left: 'Measures rate of improvement (ROI) — slope over time matters', right: 'Measures status at one point in time' },
        { left: 'Drives instructional decisions mid-intervention', right: 'Determines eligibility and diagnostic classification' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'scenario-sorter',
        label: 'Assessment Type Classifier',
        prompt: 'Classify each assessment as CBM, CBA, or Standardized.',
        scenarios: [
          { id: 's1', text: 'Weekly fluency probes from the classroom reading series, compared to grade-level peers', category: 'CBM' },
          { id: 's2', text: 'WISC-5 cognitive assessment with national norm tables', category: 'STANDARDIZED' },
          { id: 's3', text: 'Teacher-created spelling test from weekly spelling words', category: 'CBA' },
          { id: 's4', text: 'Repeated ORF (Oral Reading Fluency) measures from curriculum passages', category: 'CBM' },
          { id: 's5', text: 'Woodcock-Johnson Tests of Achievement with standardized scores', category: 'STANDARDIZED' },
          { id: 's6', text: 'Work sample portfolio including student writing and problem-solving artifacts', category: 'CBA' },
        ],
        categories: ['CBM (standardized curriculum-based)', 'CBA (curriculum-based assessment)', 'STANDARDIZED (norm-referenced)'],
      },
      { type: 'anchor', label: 'CBA vs. CBM', text: 'A Curriculum-Based Assessment (CBA) is the broader umbrella: any assessment drawn from the curriculum, which may include CBMs, structured observations, work samples, and teacher-made tests. A CBM is a specific, standardized measurement tool within that umbrella.' },
    ],
  },

  {
    id: 'MOD-D1-10',
    primarySkillId: 'ACA-08',
    title: "Working Memory: Keeping Information 'Online'",
    sections: [
      { type: 'anchor', label: 'Working memory vs. processing speed', text: "Working memory = hold AND manipulate (digits backward, mental math). Processing speed = complete simple tasks quickly. Both are separate WISC/WJ factors. Both are commonly impaired in ADHD and learning disabilities. Do not conflate them." },
      { type: 'paragraph', text: "Working memory is the cognitive ability to hold and manipulate information in an active mental workspace while simultaneously completing a task. It is distinct from short-term memory (passive holding — digits forward) and long-term memory (stored information retrieved from the past). On cognitive assessments like the WISC or WJ, working memory tasks might ask a student to hear a string of numbers and repeat them backward — holding the information while mentally reorganizing it. This is the classic working memory demand. A student with strong short-term memory but impaired working memory can hold information momentarily but loses it the moment they try to do something else at the same time. This directly impairs multi-step math, reading comprehension, writing, and following multi-part instructions." },
      { type: 'paragraph', text: "Worked example: A 4th grader, Tomás, scores in the average range on vocabulary and reasoning tasks but consistently fails on math calculation — he understands the concept of long division but forgets the steps while executing them. His WISC Working Memory Index is 78 (borderline range). This profile fits: he understands the content (intact reasoning) but cannot hold intermediate steps in mind while executing the algorithm (impaired working memory). Instructional accommodations for working memory deficits include: written step-by-step procedures the student can reference, reducing the number of steps held in memory at once, using graph paper or whiteboards to externalize intermediate steps, and breaking multi-step instructions into single steps delivered one at a time." },
      { type: 'comparison', leftHeader: 'Working Memory', rightHeader: 'Processing Speed', rows: [
        { left: 'Holds and manipulates information while completing a task', right: 'Executes simple, familiar tasks quickly and efficiently' },
        { left: 'WISC example: digits backward, letter-number sequencing', right: 'WISC example: coding (symbol-copying), symbol search' },
        { left: 'Impacts: multi-step math, reading comprehension, following multi-part instructions', right: 'Impacts: timed assessments, writing fluency, test completion' },
        { left: 'Intervention: externalize steps, reduce load, chunking', right: 'Intervention: extended time, reduce clerical demands, fluency practice' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'term-matcher',
        label: 'Memory Types',
        prompt: 'Match each memory type with its definition and example.',
        pairs: [
          {
            term: 'Short-Term Memory',
            definition: 'Passive holding of information for a brief period (seconds); no manipulation',
          },
          {
            term: 'Working Memory',
            definition: 'Holding and manipulating information while completing a task (e.g., digits backward)',
          },
          {
            term: 'Long-Term Memory',
            definition: 'Stored information retrieved from past experience and learning',
          },
          {
            term: 'Processing Speed',
            definition: 'Cognitive efficiency in completing simple tasks quickly (distinct from working memory)',
          },
        ],
      },
    ],
  },

  {
    id: 'MOD-D1-11',
    primarySkillId: 'DBD-03',
    title: 'Matrices Subtests = Nonverbal / Fluid Reasoning',
    sections: [
      { type: 'anchor', label: 'The exam mapping', text: "Matrices = fluid reasoning (Gf) = nonverbal. 'Novel problem-solving without prior knowledge' → Gf → matrices. Found on WISC, DAS, Raven's Progressive Matrices, Stanford-Binet. No reading or language required." },
      { type: 'paragraph', text: "Matrix Reasoning subtests require the student to identify a missing piece of a visual pattern — rows and columns of shapes, designs, or objects with a piece removed. The student must reason by induction and analogy to solve the pattern. This is considered a measure of fluid reasoning (Gf) — the ability to solve novel problems without relying on previously learned facts. It is primarily a nonverbal task, though some verbal mediation may occur internally. Fluid reasoning is distinguished from crystallized intelligence (Gc), which reflects accumulated knowledge and vocabulary. A student who has been under-schooled may have strong fluid reasoning but lower crystallized knowledge scores — matrices can reveal that hidden capacity." },
      { type: 'paragraph', text: "Worked example: A school psychologist evaluates a 10-year-old who was recently resettled as a refugee and has had inconsistent schooling. Her WISC Verbal Comprehension Index (heavily language and knowledge dependent) is 72, but her Visual Spatial and Fluid Reasoning indexes are 105 and 108. The Matrix Reasoning subtest is one of the strongest scores in the battery. This profile is consistent with a student who has strong problem-solving capacity (high fluid reasoning, high matrices) but limited accumulated academic knowledge due to interrupted schooling — not a cognitive disability. Without the fluid reasoning data, the low verbal scores could be misinterpreted as indicating intellectual disability. Matrices are especially informative for students with limited English, inconsistent schooling, or cultural factors that may depress knowledge-based scores." },
      { type: 'comparison', leftHeader: 'Fluid Reasoning (Gf) — Matrices', rightHeader: 'Crystallized Intelligence (Gc) — Vocabulary, Similarities', rows: [
        { left: 'Solving novel visual patterns by induction and analogy', right: 'Retrieving and applying learned knowledge, vocabulary, and concepts' },
        { left: 'Not dependent on prior learning; reflects raw problem-solving capacity', right: 'Reflects educational opportunity, language exposure, and cultural experience' },
        { left: 'Less susceptible to educational disadvantage or language barriers', right: 'May underperform in ELL students or those with limited schooling' },
        { left: 'Example tests: Matrix Reasoning (WISC), Raven\'s Progressive Matrices', right: 'Example tests: Vocabulary (WISC), Similarities (WISC), General Information (WJ)' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'card-flip',
        label: 'Matrix Reasoning Concepts',
        prompt: 'Review key concepts about matrix reasoning subtests.',
        cards: [
          {
            id: 'card1',
            front: 'What do Matrices Measure?',
            back: 'Fluid reasoning (Gf) — the ability to solve novel problems using pattern recognition and analogy, without relying on learned facts.',
          },
          {
            id: 'card2',
            front: 'Is it Verbal or Nonverbal?',
            back: 'Nonverbal. The student solves a visual pattern. No reading or speaking required.',
          },
          {
            id: 'card3',
            front: 'What is the Task Format?',
            back: 'Student sees a grid of shapes with one missing. They must select the piece that completes the pattern from multiple choices.',
          },
          {
            id: 'card4',
            front: 'When does this appear?',
            back: 'On most modern cognitive batteries: WISC-5, WAIS-IV, DAS-II, Stanford-Binet, Raven\'s Progressive Matrices.',
          },
        ],
      },
    ],
  },

  {
    id: 'MOD-D1-12',
    primarySkillId: 'DBD-05',
    title: 'Projective Tests: Supplementary, Not Standalone',
    sections: [
      { type: 'anchor', label: 'Supplementary, not standalone', text: "Projectives = supplementary qualitative texture, NOT the primary basis for any diagnosis or eligibility decision. They are frequently used in practice (common misconception: 'school psychologists rarely use them'). The exam tests knowing when to use them (alongside standardized tools) and when NOT to use them (alone, as the sole basis)." },
      { type: 'paragraph', text: 'Projective tests (Rorschach, Draw-a-Person, Sentence Completion) have a legitimate but limited role in school psychological assessment. They are best used to gather supplementary qualitative information — additional texture and hypotheses about a student\'s inner life. They should not be used as the sole basis for a diagnosis or eligibility determination. Their psychometric properties are more variable than standardized tests, but that does not make them useless — it makes them supplementary.' },
      { type: 'paragraph', text: "Worked example: A school psychologist is completing a comprehensive evaluation for emotional disturbance eligibility on a 14-year-old. She administers the BASC-3 (rating scales), conducts a clinical interview, reviews records, and — as part of her qualitative battery — includes a sentence completion task. The student's responses to incomplete sentences reveal themes of worthlessness and hopelessness that were not captured in the structured rating scales. The school psychologist uses these themes as hypotheses to probe further in the interview and to inform narrative interpretation. She does NOT write 'sentence completion indicates major depressive disorder' in the report — she notes it as qualitative context. When the eligibility team asks why she used a projective, she explains: it adds texture the rating scales can't capture, and it is used alongside — not instead of — the objective measures." },
      { type: 'comparison', leftHeader: 'Appropriate use of projectives', rightHeader: 'Inappropriate use of projectives', rows: [
        { left: 'Supplementary qualitative data alongside standardized rating scales and structured interviews', right: 'Sole basis for any diagnosis, classification, or eligibility determination' },
        { left: 'Generating hypotheses for follow-up in clinical interview', right: 'Replacing cognitive or adaptive behavior assessments in a comprehensive eval' },
        { left: "Adding narrative texture to understand a student's inner experience", right: "Claiming 'strong psychometric validity' for diagnostic conclusions based on projectives alone" },
        { left: 'Pairing with convergent evidence from multiple sources', right: "Using them 'to build rapport' as the primary justification (a common distractor answer)" },
      ] },
      {
        type: 'interactive',
        interactiveType: 'card-flip',
        label: 'Projective Test Usage',
        prompt: 'Test your understanding of when and how projective tests are used.',
        cards: [
          {
            id: 'card1',
            front: 'What is the PRIMARY role of projectives?',
            back: 'Supplementary qualitative information — additional texture about a student\'s inner experience, not standalone diagnosis.',
          },
          {
            id: 'card2',
            front: 'Can you use a projective as the ONLY basis for diagnosis?',
            back: 'No. Projectives have variable psychometric properties. They must be paired with standardized tests.',
          },
          {
            id: 'card3',
            front: 'True or False: Projectives are rarely used by school psychologists.',
            back: 'FALSE. Many practitioners use them. The accurate statement is they are supplementary, not primary.',
          },
          {
            id: 'card4',
            front: 'What are examples of projective tests?',
            back: 'Rorschach (inkblots), Draw-a-Person, Sentence Completion, Thematic Apperception Test (TAT), House-Tree-Person.',
          },
        ],
      },
      { type: 'anchor', label: 'What projectives are NOT used for (on the exam)', text: "They are not primarily for rapport building (that is a side benefit). They are not used to detect malingering. And the claim that school psychologists 'rarely use them due to poor psychometrics' is an overstatement — many practitioners do use them. The correct answer is supplementary information." },
    ],
  },

  {
    id: 'MOD-D1-13',
    primarySkillId: 'DBD-10',
    title: 'Background Information and Records Review: The R in RIOT',
    sections: [
      { type: 'anchor', label: 'The mistake practitioners make', text: 'Reading the cumulative folder feels like paperwork before the real work starts. It is the real work. A psychologist who skips the file and goes straight to cognitive testing may miss years of prior interventions, medical diagnoses, and school changes — all of which are essential context for interpreting any new score.' },
      { type: 'paragraph', text: 'Records review is the "R" in the RIOT multi-method assessment framework (Records, Interviews, Observations, Tests). It is not a preliminary formality — it is a systematic data-gathering method in its own right. Sources to review include: the cumulative folder (grades, attendance, discipline history), prior psychological and special-education evaluations, speech-language and occupational therapy reports, medical records (if released by the family), and current progress-monitoring data.' },
      { type: 'paragraph', text: 'The goal of records review is hypothesis generation. Before you administer a single test, you should be able to ask: When did this concern first appear? What interventions or supports have already been tried — and with what outcomes? Have there been any significant changes (family, school, medical) that correspond with a change in functioning? Has the student changed schools repeatedly? A student who has attended five schools in four years has a mobility hypothesis that must be tested before attributing deficits to internal processing problems.' },
      { type: 'comparison', leftHeader: 'What records review reveals', rightHeader: 'What testing alone cannot tell you', rows: [
        { left: 'Prior cognitive and academic scores — is there a change over time?', right: 'Whether current scores represent a new pattern or a stable one' },
        { left: 'Intervention history — what was tried, with what fidelity and result', right: 'Whether the student has had meaningful exposure to instruction' },
        { left: 'Medical and developmental history — diagnoses, medications, hospitalizations', right: 'Whether a health variable is a better explanation than a cognitive deficit' },
        { left: 'School mobility and attendance patterns', right: 'Whether gaps in learning are instructional, not cognitive, in origin' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'First step in a new referral',
        prompt: 'A school psychologist receives a referral for a 4th grader with declining grades and behavior concerns. What is the most defensible first step?',
        options: [
          { id: 'o1', label: 'Administer the WISC-V to establish a cognitive baseline', isCorrect: false, explanation: 'Testing without background context risks misinterpreting scores. Cognitive baselines mean more when you know what previous evaluations showed.' },
          { id: 'o2', label: 'Review cumulative records, prior evaluations, attendance, and intervention data first', isCorrect: true, explanation: 'Correct. Records review generates the hypotheses that guide the rest of the evaluation — which tests to choose and how to interpret results.' },
          { id: 'o3', label: 'Conduct a classroom observation immediately', isCorrect: false, explanation: 'Valuable, but an observation without background context provides less interpretive power than if you already knew the history.' },
          { id: 'o4', label: 'Interview the student to hear their own perspective', isCorrect: false, explanation: 'Important — but typically comes after establishing background context, not as the first step.' },
        ],
      },
      { type: 'anchor', label: 'Memory anchor', text: 'Records are not background — they are data. The file tells you what happened before you arrived: prior test scores, tried-and-failed interventions, medical events, and school changes. Skipping it does not save time; it creates blind spots.' },
    ],
  },

  {
    id: 'MOD-D1-14',
    primarySkillId: 'DBD-09',
    title: 'Ecological Assessment: The Environment Is Part of the Diagnosis',
    sections: [
      { type: 'anchor', label: 'The insight ecological assessment offers', text: 'A student who struggles in large-group whole-class instruction but performs at grade level in small-group pullout is not demonstrating a processing deficit — they are demonstrating an environment-learning mismatch. Ecological assessment locates the problem where it actually lives.' },
      { type: 'paragraph', text: 'Ecological assessment systematically examines the multiple environments in which a student functions — classroom, home, peer context, school culture — to understand how contextual variables interact with student behavior and achievement. Rather than asking only "what is wrong with this student?", ecological assessment asks "what is the relationship between this student and their environment, and where is the fit breaking down?"' },
      { type: 'paragraph', text: 'Bronfenbrenner\'s ecological systems theory provides the conceptual map: the microsystem includes the immediate classroom and family environments; the mesosystem includes the connections between them (parent-teacher relationships, home-school communication); the exosystem includes community and district factors (available resources, neighborhood safety); the macrosystem includes cultural values and policy. School psychologists conducting ecological assessments gather data across at least the microsystem and mesosystem levels.' },
      { type: 'list', label: 'What ecological data to collect', items: [
        'Classroom: instructional delivery format, class size and density, sensory environment, teacher interaction style, peer dynamics and inclusion',
        'Home: routines, sleep, supervision, family stressors, parent literacy and language, access to materials',
        'School-level: discipline policies, staff consistency, transition supports, community partnerships',
        'Cross-setting: which environments produce competence and which produce difficulty — and what differs between them',
      ] },
      { type: 'comparison', leftHeader: 'Ecological Assessment', rightHeader: 'Functional Behavioral Assessment (FBA)', rows: [
        { left: 'Examines the full range of contextual variables contributing to learning or behavioral difficulties', right: 'Identifies the specific antecedents, behavior, and consequences maintaining a targeted behavior' },
        { left: 'Answers: "What in this student\'s environments is contributing to the problem?"', right: 'Answers: "Why does this specific behavior occur — what function does it serve?"' },
        { left: 'Broader in scope; may suggest environmental restructuring or systems-level change', right: 'Narrower in focus; drives a specific behavioral support plan' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Ecological vs. FBA',
        prompt: 'A student frequently argues and shuts down during whole-class math instruction but completes work without difficulty in a small-group resource room. Which assessment approach is MOST indicated?',
        options: [
          { id: 'o1', label: 'Administer a cognitive battery to rule out a math learning disability', isCorrect: false, explanation: 'The environment-specific pattern suggests an instructional context issue, not a cognitive deficit. A cognitive battery won\'t explain the cross-setting discrepancy.' },
          { id: 'o2', label: 'Conduct an ecological assessment examining both instructional settings', isCorrect: true, explanation: 'Correct. The cross-setting discrepancy is the key signal — behavior changes with environment. Ecological assessment examines what differs between settings.' },
          { id: 'o3', label: 'Conduct an FBA to determine the function of the arguing behavior', isCorrect: false, explanation: 'FBA is valuable for understanding the specific behavior\'s function, but the broader cross-setting question calls for ecological assessment first.' },
          { id: 'o4', label: 'Refer for a psychiatric evaluation', isCorrect: false, explanation: 'Premature. The data suggests an instructional environment mismatch, not a psychiatric presentation.' },
        ],
      },
    ],
  },

  {
    id: 'MOD-D1-15',
    primarySkillId: 'PSY-01',
    title: 'Reading Score Reports: Standard Scores, Percentiles, and Error Bands',
    sections: [
      { type: 'anchor', label: 'The mistake that appears in real reports', text: 'A 25th-percentile score is not "25% correct." Writing it that way in a psychological report is a fundamental error. Percentile rank means the student performed as well as or better than 25% of same-age peers — it says nothing about how many items they answered correctly.' },
      { type: 'paragraph', text: 'Standard scores (SS) place a student on the normal distribution. The mean is 100 and the standard deviation is 15. An SS of 85 is one standard deviation below the mean (16th percentile); an SS of 115 is one SD above (84th percentile); an SS of 70 is two SDs below the mean (2nd percentile). Most cognitive and achievement batteries use this scale because it allows direct comparison across subtests and across evaluations over time.' },
      { type: 'paragraph', text: 'Every score carries measurement error, quantified as the Standard Error of Measurement (SEM). Rather than reporting a point score, best practice is to report a confidence interval: "SS 85–95 (90% confidence)." This communicates that the student\'s true score likely falls within a range. It is the primary reason eligibility decisions should never rest on a single score — the obtained score is one estimate with uncertainty built in. The norm group also matters: always note who the student is being compared to and when the norms were collected. An instrument normed in 2004 on a non-representative sample provides less valid comparison than a recently updated measure.' },
      { type: 'comparison', leftHeader: 'Score Type', rightHeader: 'What it means / When to use it', rows: [
        { left: 'Standard Score (SS) — mean 100, SD 15', right: 'How the student compares to same-age peers on the normal curve. Use for eligibility decisions and cross-test comparison.' },
        { left: 'Percentile Rank (PR)', right: 'Percentage of same-age peers the student performed as well as or better than. Not percentage of items correct. Use for communicating with families.' },
        { left: 'Age / Grade Equivalent (AE / GE)', right: 'Average age or grade for which the student\'s raw score is typical. Frequently misinterpreted — NASP recommends not relying on them as a primary index.' },
        { left: 'Confidence Interval (SEM-based)', right: 'Range within which the true score likely falls. Always report alongside SS for eligibility decisions.' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'term-matcher',
        label: 'Score type definitions',
        prompt: 'Match each score type to its correct interpretation.',
        pairs: [
          { term: 'Standard Score of 85', definition: 'One standard deviation below the mean; 16th percentile; below average range' },
          { term: '50th Percentile Rank', definition: 'Student performed as well as or better than 50% of same-age peers — average performance, not 50% of items correct' },
          { term: 'Grade Equivalent of 2.3', definition: 'The student\'s raw score equals the average for students in the 3rd month of 2nd grade — does NOT mean the student reads at a 2nd-grade level' },
          { term: 'Confidence Interval SS 88–98', definition: 'Range within which the student\'s true score falls at 90% confidence; derived from the test\'s standard error of measurement' },
        ],
      },
      { type: 'anchor', label: 'Norm group and recency matter', text: 'Always identify who the student is being compared to and when the norms were collected. A test normed 20 years ago on a non-representative sample provides less valid normative comparison than a recently updated instrument. Outdated norms can systematically over- or underestimate a student\'s standing.' },
    ],
  },

  // ── Domain 2: Consultation & Collaboration ────────────────────────────────

  {
    id: 'MOD-D2-01',
    primarySkillId: 'CON-01',
    title: 'The Nonhierarchical Collaborative Consultation Model',
    sections: [
      { type: 'anchor', label: 'The default model', text: "School psychology consultation is NONHIERARCHICAL and COLLABORATIVE by default. Both psychologist and teacher are equal experts. The psychologist brings psychological knowledge; the teacher brings student and classroom knowledge. Shared ownership = better follow-through." },
      { type: 'paragraph', text: 'When a school psychologist begins a professional consultation with a teacher, the recommended starting framework is nonhierarchical and collaborative. This means both the psychologist and the consultee (teacher) are treated as equal experts — the psychologist brings psychological knowledge; the teacher brings knowledge of the student and classroom context. This model promotes shared problem ownership, which makes intervention follow-through far more likely than a top-down expert model where the psychologist prescribes and the teacher implements. In the expert model, the teacher may comply while the psychologist is present but does not internalize ownership of the plan — so fidelity suffers as soon as the psychologist steps back.' },
      { type: 'paragraph', text: "Worked example: A 4th-grade teacher refers a student for help with behavior. In an expert/hierarchical consultation, the psychologist observes, interprets data, and prescribes a token economy — then hands over a behavior plan for the teacher to implement. In a nonhierarchical collaborative consultation, the psychologist and teacher work together from the start: the teacher describes the context, both review the data together, they jointly brainstorm hypotheses about the function of behavior, and they co-design an intervention that fits the classroom's existing routines. When the teacher helped design the plan, she is far more likely to implement it with fidelity — because it is partly hers. The collaborative model produces better outcomes not because the plan is cleverer, but because the person implementing it believes in it." },
      { type: 'comparison', leftHeader: 'Nonhierarchical Collaborative Model', rightHeader: 'Expert / Hierarchical Model', rows: [
        { left: 'Psychologist and teacher are equal partners with complementary expertise', right: 'Psychologist is the authority; teacher is the implementer' },
        { left: 'Shared problem definition and shared solution design', right: 'Psychologist defines the problem and prescribes the solution' },
        { left: 'Higher fidelity: the teacher owns the plan', right: 'Lower fidelity when psychologist is absent — teacher did not help design it' },
        { left: 'Builds teacher capacity for future cases', right: 'Creates dependency on the psychologist for each new case' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Consultation Model Selection',
        prompt: 'A school psychologist wants to improve intervention follow-through. Which model should guide the initial consultation?',
        options: [
          { id: 'collab', label: 'Nonhierarchical Collaborative Model', explanation: 'Treats both professionals as equal experts. Promotes shared problem ownership and follow-through.', isCorrect: true },
          { id: 'expert', label: 'Expert/Hierarchical Model', explanation: 'Psychologist directs; teacher implements. Reduces shared ownership and follow-through.' },
          { id: 'directive', label: 'Directive Instruction Model', explanation: 'Not a consultation model; this describes a teaching approach.' },
        ],
      },
    ],
  },

  {
    id: 'MOD-D2-02',
    primarySkillId: 'CON-01',
    title: 'Consultee-Centered Consultation: Building the Teacher, Not Solving the Problem',
    sections: [
      { type: 'anchor', label: 'The capacity-building model', text: "Consultee-centered consultation = build the TEACHER'S skills, not just fix this student. Goal: teacher handles similar cases independently in the future, reducing dependence on the psychologist. Cue word: 'independence,' 'capacity,' 'reduce future dependence.'" },
      { type: 'paragraph', text: "In a consultee-centered model, the goal is not just to fix one student's problem — it is to develop the consultee's (usually the teacher's) own skills and capacities so they can address similar situations independently in the future. This is different from a student-centered model (focused on the individual child) or a systems-level model (focused on the organization). When the question mentions building a teacher's skills or reducing dependence on the psychologist, consultee-centered is the answer." },
      { type: 'paragraph', text: "Worked example: Mr. Torres has referred a student with anxiety-related school refusal. In a student-centered consultation, the school psychologist would assess the student, design an intervention, and track outcomes — the teacher's role is to implement the plan, not to develop new skills. In a consultee-centered consultation, the psychologist spends time teaching Mr. Torres: what school refusal anxiety looks like, how graduated exposure works, how to respond calmly to avoidance behaviors, and how to communicate with the family. After 3 sessions, Mr. Torres can recognize anxiety-driven avoidance in future students and apply the framework without calling the psychologist. One case became a professional development experience. The outcome: reduced future dependence and a more capable teacher." },
      { type: 'comparison', leftHeader: 'Consultee-Centered', rightHeader: 'Student-Centered', rows: [
        { left: "Primary beneficiary: the teacher (consultee) — builds their skills and conceptual framework", right: "Primary beneficiary: the specific student — the psychologist addresses the student's needs directly" },
        { left: 'Goal: teacher can handle similar cases independently; lasting capacity gain', right: 'Goal: solve this student\'s immediate problem; does not necessarily build teacher capacity' },
        { left: 'Cue: "reduce dependence," "build teacher capacity," "handle future cases independently"', right: 'Cue: "assess the student," "develop an intervention plan," "individual student outcomes"' },
        { left: 'Psychologist teaches frameworks, not just prescriptions', right: 'Psychologist is the expert; teacher implements the prescriptions' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Consultation Goal Selection',
        prompt: 'A teacher has one student struggling. Which approach reduces long-term dependence on the school psychologist?',
        options: [
          { id: 'consultee', label: 'Consultee-Centered: Build the teacher\'s problem-solving skills', explanation: 'Teacher gains capacity to handle similar cases independently; reduces future dependence on psychologist.', isCorrect: true },
          { id: 'student', label: 'Student-Centered: Focus on fixing this student\'s problem', explanation: 'Solves one case but does not build teacher capacity for future situations.' },
          { id: 'systems', label: 'Systems-Centered: Restructure school policies', explanation: 'Appropriate for organizational change, but not the most direct way to build individual teacher capacity.' },
        ],
      },
    ],
  },

  {
    id: 'MOD-D2-03',
    primarySkillId: 'CON-01',
    title: 'Professional Learning Communities (PLCs): The Four Driving Questions',
    sections: [
      { type: 'anchor', label: 'The four questions', text: 'PLCs are driven by four questions: (1) What do we want each student to learn? (2) How will we know when each student has learned it? (3) How will we respond when a student experiences difficulty? (4) How will we extend learning for students who have already mastered it? Data collection METHODS are NOT one of the questions — that is a common distractor.' },
      { type: 'paragraph', text: 'PLCs are collaborative professional development structures in which staff meet regularly to examine data and improve student outcomes. They are driven by four specific questions: (1) What do we want each student to learn? — clarifying the shared learning goals and standards. (2) How will we know when each student has learned it? — establishing common assessments and evidence of learning. (3) How will we respond when a student experiences difficulty in learning? — creating systematic support structures. (4) How will we extend and enrich learning for students who have already mastered it? — the frequently forgotten fourth question. PLCs are not prescriptive about data collection methods or presentation formats — they set goals and let professionals determine how to get there.' },
      { type: 'paragraph', text: "Worked example: A 3rd-grade team at Riverside Elementary meets weekly in a PLC. They begin by reviewing their common formative assessment data from the past week's fractions unit (question 1 was answered before instruction: the team agreed that all students would understand equivalent fractions and fraction comparison). The assessment reveals that 9 of 24 students scored below 75% (question 2 answered: they know who hasn't yet learned it). The team now discusses question 3: those 9 students will attend a small-group re-teaching session on Thursday while the rest of the class does an extension activity. The fourth-grade teacher who attended this cycle mentions she can join Thursday to help. This collaborative data cycle — aligned goals, common evidence, shared response — is the PLC model in practice." },
      { type: 'comparison', leftHeader: 'PLC Driving Question', rightHeader: 'What it addresses', rows: [
        { left: 'Q1: What do we want each student to learn?', right: 'Shared learning goals; clarity about expected standards and outcomes for this unit/grade' },
        { left: 'Q2: How will we know when each student has learned it?', right: 'Common assessment; evidence of mastery; who is meeting the goal and who is not' },
        { left: 'Q3: How will we respond when a student experiences difficulty?', right: 'Systematic intervention plan; what the team does — not just the individual teacher' },
        { left: 'Q4: How will we extend learning for students who already mastered it?', right: 'Enrichment/extension — the often-overlooked fourth question; the worked example applies it to the rest of the class' },
        { left: 'NOT a PLC question: How will we collect and present our data?', right: 'A data management decision, not a collaborative learning question — a common exam distractor' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'drag-to-order',
        label: 'PLC Driving Questions Sequence',
        prompt: 'Arrange the four PLC driving questions in the correct order of focus.',
        items: [
          'Question 1: What do we want each student to learn? (Define learning goals)',
          'Question 2: How will we know when each student has learned it? (Measure success)',
          'Question 3: How will we respond when a student experiences difficulty in learning? (Intervene)',
          'Question 4: How will we extend learning for students who already mastered it? (Enrich)',
        ],
      },
    ],
  },

  {
    id: 'MOD-D2-04',
    primarySkillId: 'FAM-03',
    title: 'Systemic Drug Prevention: Community Coalition Over Classroom Talks',
    sections: [
      { type: 'anchor', label: 'Community problem → community coalition', text: "When the problem is systemic (multiple families, multiple students, community-wide substance use), the answer is the broadest possible intervention level: a coalition that includes school staff, parents, AND community partners. Single-classroom programs and individual counseling are too narrow. The answer that 'contains' all the others is almost always the right answer on this question type." },
      { type: 'paragraph', text: 'When a school psychologist faces a community-wide substance abuse problem affecting multiple families and students, the most effective intervention is not a single classroom program or a teacher training — it is a broad-spectrum coalition that brings together parents, school staff, and community partners. This aligns with systems-level thinking: the most powerful and durable interventions address problems at multiple levels simultaneously. A school psychologist who works in isolation misses the leverage that community support provides.' },
      { type: 'paragraph', text: "Worked example: A middle school principal reports that 12 students have had substance-related incidents this semester and several parents have reached out about drug use in the community. The school psychologist is asked to recommend a response. Four options are presented: (a) deliver a drug-awareness assembly to all 6th graders, (b) train teachers to identify warning signs in students, (c) refer affected students to individual counseling, or (d) convene a community coalition with the school, local health agency, parent representatives, and community youth organizations. Option (d) is correct. Options (a), (b), and (c) are all contained within option (d) — the coalition can do all of those things. On the exam, when one option is the logical superset of the others, that option is the answer. The keyword signal: community-wide, systemic, multiple families." },
      { type: 'comparison', leftHeader: 'Systems-Level Intervention', rightHeader: 'Individual/Classroom-Level Intervention', rows: [
        { left: 'Addresses root causes across multiple social systems (family, school, community)', right: 'Addresses one student or one classroom at a time' },
        { left: 'Community coalition: parents + school + community partners act together', right: 'Teacher training or classroom program without community involvement' },
        { left: 'Most effective for systemic, community-wide problems', right: 'Appropriate for isolated individual concerns; insufficient for widespread problems' },
        { left: 'Reflects NASP domain: Systems-Level Services, Prevention, and Mental Health', right: 'Reflects a more traditional, reactive counselor-in-office model' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Intervention Level for Community Problem',
        prompt: 'A district has a systemic substance abuse problem affecting multiple students and families. Which intervention is most effective?',
        options: [
          { id: 'coalition', label: 'Community coalition with school, parents, and community partners', explanation: 'Broadest approach; addresses multiple system levels simultaneously for maximum impact and durability.', isCorrect: true },
          { id: 'classroom', label: 'Single classroom prevention program', explanation: 'Too narrow for a systemic problem; misses families and community leverage.' },
          { id: 'teacher-training', label: 'Teacher training on drug awareness', explanation: 'Valuable but insufficient; does not engage families or community partners.' },
          { id: 'student-only', label: 'Individual counseling for affected students', explanation: 'Reactive and incomplete; does not address systemic causes.' },
        ],
      },
      { type: 'anchor', label: 'Test-taking logic', text: "When answer choices are nested (one option includes everything the others offer), the broader, more comprehensive answer is almost always correct. Look for the answer that 'contains' the other options." },
    ],
  },

  // ── Domain 3: Academic Interventions & Instructional Support ──────────────

  {
    id: 'MOD-D3-01',
    primarySkillId: 'ACA-04',
    title: 'Evidence-Based Teaching: Explicit and Systematic Instruction',
    sections: [
      { type: 'anchor', label: 'The two components', text: "Explicit = skills taught DIRECTLY and clearly (nothing discovered by accident). Systematic = follows a deliberate sequence from simpler to more complex. Together = the gold-standard for foundational reading and math. 'Drill and practice' alone is NOT explicit-and-systematic." },
      { type: 'paragraph', text: "Explicit and systematic instruction is the gold standard for teaching foundational academic skills, particularly reading and math. Explicit means skills are taught directly and clearly — nothing is left to be discovered by the student. The teacher models, uses guided practice, provides immediate feedback, and confirms understanding before moving on. Systematic means the instruction follows a deliberate sequence, building from simpler to more complex skills — easier phonemes before harder ones, single-digit addition before multi-digit. 'Drill and practice' has a place, but it is not a complete instructional approach. 'Implicit and direct' is not a valid educational term. 'Analysis and synthesis' describes thinking skills, not an instructional delivery method." },
      { type: 'paragraph', text: "Worked example: A 1st-grade teacher is introducing phonics. Under an explicit-and-systematic approach: she explicitly teaches that the letter 'b' makes the /b/ sound, models it, has students repeat it chorally, then provides guided practice with decodable words containing 'b' before asking students to practice independently. She does not ask students to 'notice' or 'discover' letter patterns in authentic text — that is an implicit approach that fails many beginning readers. The sequence is deliberate: consonants → short vowels → CVC words → blends → digraphs — always building on prior mastered skills. When a student is still struggling after this explicit, systematic instruction, that gap in response is meaningful data for an MTSS referral." },
      { type: 'comparison', leftHeader: 'Explicit and Systematic', rightHeader: 'Implicit / Discovery-Based', rows: [
        { left: 'Teacher directly models the target skill; nothing left to discover', right: 'Students infer rules through exposure to authentic text and patterns' },
        { left: 'Deliberate scope and sequence: simpler skills taught before complex ones', right: 'Skills introduced as encountered in context; no predetermined sequence' },
        { left: 'Strong evidence base, especially for at-risk readers and dyslexia', right: 'Less effective for foundational skills without explicit decoding instruction' },
        { left: 'Immediate corrective feedback; guided practice before independent practice', right: 'Fewer structured error-correction routines; relies on self-discovery' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Evidence-Based Instruction Identifier',
        prompt: 'Which describes explicit and systematic instruction for teaching reading?',
        options: [
          { id: 'explicit', label: 'Direct, step-by-step teaching with clear skill sequence (simple → complex)', explanation: 'Explicit = taught directly and clearly. Systematic = follows a deliberate sequence.', isCorrect: true },
          { id: 'implicit', label: 'Students discover skills through exploration and reading', explanation: 'This is implicit, not explicit. Not supported for foundational skills.' },
          { id: 'drill', label: 'Repeated practice without direct instruction', explanation: 'Drill alone is not sufficient without explicit instruction.' },
          { id: 'analysis', label: 'Analysis and synthesis of complex texts', explanation: 'Describes higher-order thinking, not foundational instruction method.' },
        ],
      },
    ],
  },

  {
    id: 'MOD-D3-02',
    primarySkillId: 'ACA-07',
    title: 'Reading Programs: Phonological Processing Comes First',
    sections: [
      { type: 'anchor', label: 'The foundation', text: 'Phonological processing is the bedrock of reading. Programs that build phonological awareness + phonics outperform whole-language or meaning-first approaches, especially for students at risk for dyslexia.' },
      { type: 'paragraph', text: 'For beginning readers, the most research-supported foundation is phonological processing — the ability to hear, identify, and manipulate the sound structure of language. Phonemic awareness (awareness of individual sounds/phonemes) is the most critical early reading skill. Programs that emphasize phonological processes outperform whole-language or meaning-based approaches in early reading development, particularly for students at risk for dyslexia. The National Reading Panel (2000) identified five essential components of effective reading instruction: phonological awareness, phonics, fluency, vocabulary, and comprehension. Phonological awareness and phonics come first because reading is, at its core, a code-cracking system — students must learn that letters represent sounds before comprehension can develop.' },
      { type: 'paragraph', text: "Worked example: A school is reviewing its Tier 1 reading curriculum after third-grade reading scores remain consistently below benchmark. The school psychologist consults the What Works Clearinghouse and the reading literature and finds that the current program is a balanced-literacy approach that emphasizes meaning-making and whole-text reading from the start. The evidence suggests this is insufficient for students who have not yet mastered phonological awareness. The psychologist recommends adding structured phonics instruction with explicit phoneme-grapheme mapping for all K-2 students, and intensive phonological awareness training as a Tier 2 support for students already at risk. For the student suspected of dyslexia specifically, a structured literacy program (e.g., Orton-Gillingham based) is recommended over a meaning-first approach." },
      { type: 'comparison', leftHeader: 'Phonological/Structured Literacy Approach', rightHeader: 'Whole-Language / Balanced Literacy', rows: [
        { left: 'Explicitly teaches phoneme-grapheme correspondence (letter-sound mapping)', right: 'Relies on exposure to text and context clues for decoding' },
        { left: 'Systematic and sequential; builds from sounds → letters → words → text', right: 'Meaning-first; uses real books and context from the start' },
        { left: 'Strong evidence base for at-risk and dyslexic readers (What Works Clearinghouse)', right: 'Less effective for students who lack phonological foundations' },
        { left: 'NASP and IDA endorse structured literacy for struggling readers', right: 'Criticized by reading researchers for insufficient phonics focus' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'drag-to-order',
        label: 'Reading Skill Hierarchy',
        prompt: 'Arrange the reading skills in the correct order from foundational to advanced.',
        items: [
          'Phonological Awareness: Hear and identify sounds in language (foundational)',
          'Phonics: Connect sounds to letters and letter patterns',
          'Fluency: Read with accuracy and speed',
          'Comprehension: Understand and derive meaning from text (advanced)',
        ],
      },
    ],
  },

  {
    id: 'MOD-D3-03',
    primarySkillId: 'SWP-02',
    title: 'Grade Retention: NASP Does Not Endorse It',
    sections: [
      { type: 'anchor', label: 'NASP position', text: "NASP does NOT endorse grade retention. Research shows it does not produce lasting academic gains and increases dropout risk. Always advocate for evidence-based interventions FIRST and document their effectiveness before any retention decision is considered." },
      { type: 'paragraph', text: "The National Association of School Psychologists does not endorse grade retention as an effective intervention. Research consistently shows that retention does not produce lasting academic gains and carries significant social-emotional costs for students — reduced self-esteem, increased dropout risk, and peer relationship strain. Any initial gains from retention (a child being bigger or more mature than classmates) typically disappear by 3rd grade. When a parent asks whether to hold a child back, the psychologist's role is to advocate for evidence-based interventions first and to document whether those interventions are working before any retention decision is considered." },
      { type: 'paragraph', text: "Worked example: A parent of a struggling 1st grader requests a meeting to discuss holding her daughter back. The school psychologist explains NASP's position: retention is not supported by research as a lasting academic fix, and the social-emotional costs (being a year older than peers, being perceived as 'held back') can be significant. Instead, the psychologist recommends an intensive reading intervention (with weekly progress monitoring), a review of the universal screening data, and a referral to evaluate for a possible learning disability if the intervention does not produce growth within 8 weeks. If, after documented evidence-based intervention with fidelity, the student is still not making progress and a team decision is made to retain, the decision should be informed by that data — not a default assumption that 'she just needs more time.'" },
      { type: 'comparison', leftHeader: 'NASP-Endorsed Approach', rightHeader: 'What NASP Does NOT Endorse', rows: [
        { left: 'Evidence-based intervention with progress monitoring before any retention decision', right: 'Retention as a primary or early response to academic struggles' },
        { left: 'Evaluation for learning disability or other factors that may explain the difficulty', right: 'Assuming a student will "catch up" by repeating a grade' },
        { left: 'Documenting intervention effectiveness and team review of data', right: 'Retention as a consequence for low test scores or missing benchmarks' },
        { left: 'Social-emotional support and early intensive support at Tier 2', right: 'Retention as a substitute for identifying and addressing underlying learning needs' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'card-flip',
        label: 'NASP Position on Grade Retention',
        prompt: 'Review NASP\'s research-based position on retention and its effects.',
        cards: [
          {
            id: 'card1',
            front: 'Does NASP endorse grade retention?',
            back: 'No. NASP does not endorse retention as an effective intervention.',
          },
          {
            id: 'card2',
            front: 'Does retention improve academic outcomes?',
            back: 'No. Research shows retention does not produce lasting academic gains.',
          },
          {
            id: 'card3',
            front: 'What social-emotional costs does retention carry?',
            back: 'Significant costs: reduced self-esteem, increased dropout risk, peer relationship strain.',
          },
          {
            id: 'card4',
            front: 'What should a psychologist advocate before retention?',
            back: 'Evidence-based interventions first, with documented effectiveness, before any retention decision.',
          },
        ],
      },
    ],
  },

  {
    id: 'MOD-D3-04',
    primarySkillId: 'ACA-02',
    title: "Accommodations vs. Modifications — Giving Students a Voice",
    sections: [
      { type: 'anchor', label: 'Accommodation = same goal, different access; Modification = different goal', text: "Accommodation changes HOW a student accesses or demonstrates learning — NOT what they are expected to learn. Modification changes WHAT the student is expected to learn (reduces content or lowers expectations). On the exam: if the standard is preserved, it's an accommodation. If the standard is reduced or replaced, it's a modification." },
      { type: 'paragraph', text: 'When a student with a disability (such as a visual impairment) is given a challenging assignment, best practice is to involve the student in identifying appropriate accommodations. Students who have input into their own learning experience stronger ownership and better outcomes. Excusing the student entirely removes an important learning opportunity. Assigning an entirely different task treats the student as incapable. Helping without explicit accommodation discussion bypasses the student\'s right to participate in their own education plan.' },
      { type: 'paragraph', text: "Worked example: A 5th grader with dyslexia, Amara, is preparing for a chapter test on ecosystems. Her teacher considers four options: (1) read the test aloud to Amara — same questions, same standard, different presentation format; (2) give Amara a 10-question version of the 25-question test — reduced scope, modified; (3) let Amara use her notes during the test — extended access, accommodation; (4) ask Amara to draw a diagram instead of answering written questions on different material — different task, modification. Options 1 and 3 are accommodations: Amara is held to the same ecosystem content standard. Options 2 and 4 are modifications: the standard itself is reduced or replaced. The legal distinction matters: accommodations on standardized state tests are regulated separately from modifications, and modifications can affect grade-level standards alignment on IEPs." },
      {
        type: 'interactive',
        interactiveType: 'scenario-sorter',
        label: 'Accommodation vs. Modification Classifier',
        prompt: 'Sort each example as an accommodation or a modification.',
        scenarios: [
          { id: 's1', text: 'A student with dyslexia receives the same test questions but in large print', category: 'ACCOMMODATION' },
          { id: 's2', text: 'A student is given a 5-question version of a 10-question test', category: 'MODIFICATION' },
          { id: 's3', text: 'A student using a wheelchair takes a test in an accessible room instead of upstairs', category: 'ACCOMMODATION' },
          { id: 's4', text: 'A student must write a 1-page summary instead of a 5-page essay on the same topic', category: 'MODIFICATION' },
          { id: 's5', text: 'A student listens to a math problem read aloud instead of reading it', category: 'ACCOMMODATION' },
          { id: 's6', text: 'A student learns different material (simpler fractions instead of complex algebra)', category: 'MODIFICATION' },
        ],
        categories: ['ACCOMMODATION (same goal, different format)', 'MODIFICATION (different goal or reduced scope)'],
      },
      { type: 'anchor', label: 'Key principle', text: 'Accommodations change HOW a student accesses or demonstrates learning — not WHAT they are expected to learn. A student with a visual impairment may need a different presentation format, but can still meet the same learning objective.' },
      { type: 'comparison', leftHeader: "Accommodation", rightHeader: "Modification", rows: [
          { left: "Changes HOW a student accesses or demonstrates learning", right: "Changes WHAT a student is expected to learn" },
          { left: "Grade-level standard is preserved and fully intact", right: "Standard is reduced, simplified, or replaced" },
          { left: "Examples: extended time, large print, read-aloud, separate setting", right: "Examples: fewer items, simpler content, alternate task or material" },
          { left: "Generally permitted on standardized state tests without altering validity", right: "Often changes the construct measured; flagged or non-standard on state tests" },
        ] },
    ],
  },

  {
    id: 'MOD-D3-05',
    primarySkillId: 'ACA-06',
    title: 'Intrinsic Motivation: Why Choice Beats Candy',
    sections: [
      { type: 'anchor', label: 'The overjustification effect', text: "Tangible rewards (candy, stickers) undermine intrinsic motivation through the overjustification effect — the student's focus shifts from the activity to the reward. When the reward disappears, motivation collapses. Choice and autonomy are the evidence-based alternatives." },
      { type: 'paragraph', text: "Research on motivation shows that tangible rewards (stickers, candy, prizes) can actually undermine intrinsic motivation by shifting a student's focus from the activity itself to the external reward. When the reward disappears, motivation often collapses. This is called the overjustification effect: the external reward retroactively 'explains' the student's behavior in terms of the reward rather than genuine interest, reducing the degree to which they attribute their engagement to the activity itself. Cognitive approaches — particularly giving students choice — are more effective for building lasting intrinsic motivation. Choice gives students a sense of autonomy and control, which is one of the three core components of Self-Determination Theory (autonomy, competence, relatedness). When students feel autonomous, competent, and connected, intrinsic motivation is sustained without external props." },
      { type: 'paragraph', text: "Worked example: Two classrooms use different approaches for a reading assignment. Classroom A: students complete the assigned reading and receive a sticker for each chapter finished. After a month, when the sticker chart is removed, reading rates drop below baseline — the sticker was the reason they were reading, not interest in the book. Classroom B: students choose from a menu of three books at their reading level, select their own corner of the room to read in, and set a personal reading goal each week. After a month, reading continues at the same rate when the structure is reduced — because the autonomy and competence experience were the motivation. When an exam question asks what approach best builds lasting academic engagement, the answer involves choice, student voice, or goal-setting — not external rewards." },
      { type: 'comparison', leftHeader: 'Builds Intrinsic Motivation', rightHeader: 'Can Undermine Intrinsic Motivation', rows: [
        { left: 'Choice among learning tasks or formats', right: 'Tangible rewards (candy, prizes, stickers) for completing tasks' },
        { left: 'Autonomy support: student input into goals and approaches', right: 'Token economies used as the primary or permanent system' },
        { left: 'Mastery-oriented feedback: "You worked hard and improved your strategy"', right: 'Controlling praise: "You did that to get the reward"' },
        { left: 'Self-regulation strategies: goal-setting, monitoring, reflection', right: 'Performance-contingent rewards that redirect attention from task to outcome' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'scenario-sorter',
        label: 'Motivation Strategy Classifier',
        prompt: 'Sort each strategy by whether it builds or undermines intrinsic motivation.',
        scenarios: [
          { id: 's1', text: 'Offering a student choice of three learning activities', category: 'BUILDS' },
          { id: 's2', text: 'Praising effort and strategy: "You worked hard and tried different approaches"', category: 'BUILDS' },
          { id: 's3', text: 'Rewarding correct answers with candy or stickers', category: 'UNDERMINES' },
          { id: 's4', text: 'Allowing student input into learning goals and objectives', category: 'BUILDS' },
          { id: 's5', text: 'Using token economies as a primary behavior system', category: 'UNDERMINES' },
          { id: 's6', text: 'Teaching self-regulation and metacognitive strategies', category: 'BUILDS' },
        ],
        categories: ['BUILDS Intrinsic Motivation', 'UNDERMINES Intrinsic Motivation'],
      },
    ],
  },

  {
    id: 'MOD-D3-06',
    primarySkillId: 'ACA-03',
    title: 'Chunking: The Memory Strategy for Long Lists',
    sections: [
      { type: 'anchor', label: 'Chunking = the long-list strategy', text: "Chunking groups information into meaningful clusters, reducing working memory burden. A phone number (555-867-5309) is not 10 digits — it is 3 chunks. When a student needs to memorize a long sequence, chunking is the evidence-based answer." },
      { type: 'paragraph', text: 'Chunking is a well-researched memory strategy in which information is grouped into meaningful clusters to reduce the burden on working memory. The classic example is a phone number: rather than remembering ten individual digits, we remember three chunks (area code, prefix, number). When students need to memorize a long sequence of information, chunking is the most evidence-supported strategy because it aligns with how working memory actually operates — in units, not in endless individual pieces. Working memory can hold roughly 4±1 chunks at once; it cannot hold 10 isolated digits. Grouping transforms the memory problem from "hold 10 things" into "hold 3 things."' },
      { type: 'paragraph', text: "Worked example: A high school student needs to memorize the steps of the FBA process for an exam: (1) Define the behavior, (2) Collect baseline data, (3) Identify antecedents, (4) Identify consequences, (5) Hypothesize the function, (6) Design the intervention, (7) Evaluate. Memorizing seven isolated steps is hard. Chunked into three phases — ASSESS (steps 1–3: define, baseline, antecedents), ANALYZE (steps 4–5: consequences, function hypothesis), ACT (steps 6–7: design, evaluate) — the memory burden drops from 7 items to 3 chunks, and the structure of the process becomes easier to recall on demand. This is chunking applied to academic content." },
      { type: 'comparison', leftHeader: 'Memory Strategy', rightHeader: 'Best Use', rows: [
        { left: 'Chunking: group items into meaningful clusters', right: 'Long sequences, numbered steps, lists that can be organized into categories' },
        { left: 'Mnemonic device: acronym, rhyme, or word-image link', right: 'Fixed-order lists where initial letters or sounds can carry the structure (e.g., PEMDAS)' },
        { left: 'Rehearsal: repeat to strengthen encoding', right: 'Simple facts and definitions; less effective for complex multi-step content' },
        { left: 'Elaboration: connect new to known', right: 'Conceptual learning where the student has prior knowledge to link to' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'term-matcher',
        label: 'Memory Strategies',
        prompt: 'Match each memory strategy with its definition and best use.',
        pairs: [
          {
            term: 'Chunking',
            definition: 'Grouping information into meaningful clusters to reduce working memory burden (e.g., phone number in three chunks)',
          },
          {
            term: 'Mnemonic Devices',
            definition: 'Memory aids like acronyms or rhymes to encode information (e.g., PEMDAS for order of operations)',
          },
          {
            term: 'Rehearsal',
            definition: 'Repetition of information to strengthen encoding and retention',
          },
          {
            term: 'Elaboration',
            definition: 'Connecting new information to existing knowledge and creating meaningful relationships',
          },
        ],
      },
    ],
  },

  // ── Domain 4: Mental & Behavioral Health Services ─────────────────────────

  {
    id: 'MOD-D4-01',
    primarySkillId: 'MBH-03',
    title: 'CBT: The Most Supported School-Based Counseling Approach',
    sections: [
      { type: 'anchor', label: 'CBT = gold standard', text: 'CBT is the most evidence-based school counseling approach for anxiety, depression, OCD, and phobias. It targets the thought-feeling-behavior connection. Short-term, skills-focused, teaches independence. Not psychodynamic. Not purely behavioral.' },
      { type: 'paragraph', text: "Cognitive Behavioral Therapy is the most extensively researched and widely adopted psychotherapy approach in school psychology. It is grounded in the principle that thoughts, feelings, and behaviors are interconnected — changing maladaptive thought patterns leads to changes in both emotional states and behavior. CBT is short-term, goal-oriented, and skills-focused. It emphasizes active practice, homework, and building coping strategies the student can use independently after treatment ends. Unlike psychodynamic therapy (which focuses on unconscious motivations and past conflicts) or pure behavioral therapy (which focuses exclusively on observable behavior and consequences), CBT targets the cognitive layer: how a student interprets situations, what automatic thoughts arise, and how those thoughts drive emotional and behavioral responses." },
      { type: 'paragraph', text: "Worked example: A 9th grader named Sofia has generalized anxiety that is interfering with academic performance — she ruminates about failing before every test and avoids class presentations. A CBT approach would include: identifying Sofia's automatic thoughts ('I'm going to fail this test and everyone will think I'm stupid'), examining the evidence for and against those thoughts (cognitive restructuring), practicing graduated exposure to the feared situation (presenting in front of progressively larger groups), and building a personal coping toolkit (deep breathing, positive self-talk, preparation routines). By session 8, Sofia has the skills to manage her anxiety independently. The same approach would not work as well with a purely psychodynamic model, which would explore the developmental roots of anxiety but not directly teach coping skills Sofia can use before Thursday's test." },
      { type: 'comparison', leftHeader: 'CBT Is Best For', rightHeader: 'What CBT Is Not', rows: [
        { left: 'Anxiety, depression, phobias, OCD, social skill deficits', right: 'Not psychodynamic — does not focus on unconscious drives or childhood conflicts' },
        { left: 'Short-term, structured, skills-focused interventions', right: 'Not purely behavioral — thoughts and interpretations are the direct target' },
        { left: 'Internalizing disorders with cognitive components', right: 'Not person-centered — CBT is directive and structured, not non-directive' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Counseling Approach for School Anxiety',
        prompt: 'A student has anxiety about public speaking. Which counseling approach is most evidence-based?',
        options: [
          { id: 'cbt', label: 'Cognitive Behavioral Therapy', explanation: 'CBT targets thoughts, feelings, and behaviors. It teaches coping strategies the student can use independently.', isCorrect: true },
          { id: 'psycho', label: 'Psychodynamic approach', explanation: 'Focuses on unconscious drives; longer-term. Less evidence-base for school-based work.' },
          { id: 'humanist', label: 'Person-centered/humanistic', explanation: 'Emphasizes unconditional positive regard; not structured for skills-building.' },
        ],
      },
    ],
  },

  {
    id: 'MOD-D4-02',
    primarySkillId: 'MBH-03',
    title: 'Negative Reinforcement vs. Punishment: The Perennial Confusion',
    sections: [
      { type: 'anchor', label: 'Sign tells you what changes; RE vs. PUNISHMENT tells you direction', text: "Reinforcement = behavior goes UP (positive adds something good; negative removes something bad — both increase). Punishment = behavior goes DOWN. The trick: 'negative' doesn't mean bad. Negative reinforcement is relief — removing something aversive — and it increases the behavior." },
      { type: 'paragraph', text: 'These two terms are among the most commonly confused in all of school psychology. The key is this: reinforcement — whether positive or negative — always INCREASES a behavior. Punishment always DECREASES a behavior. Negative reinforcement removes an aversive stimulus to increase a desired behavior. Example: a car\'s seatbelt alarm stops when you buckle up. The alarm (aversive stimulus) is removed, which increases seatbelt-buckling behavior. That is negative reinforcement.' },
      { type: 'paragraph', text: "Worked example: Three different teachers use three different approaches. Teacher A stops nagging Jaylen every morning once Jaylen consistently turns in homework — the nagging (aversive) disappears, and homework completion goes up. This is negative reinforcement: something unpleasant was removed, behavior increased. Teacher B takes away Jaylen's free reading time when he talks out of turn — a preferred activity is removed, behavior decreases. This is punishment (specifically, response cost). Teacher C adds 10 minutes of after-school detention when Jaylen is tardy — an unpleasant stimulus is added, tardiness decreases. This is also punishment (positive punishment). On the exam: if the behavior goes UP and something aversive was removed → negative reinforcement. If the behavior goes DOWN by anything → punishment." },
      { type: 'comparison', leftHeader: 'Negative Reinforcement', rightHeader: 'Punishment (positive or negative)', rows: [
        { left: 'Removes an aversive stimulus AFTER the desired behavior', right: 'Adds an aversive (positive punishment) OR removes a desired stimulus (negative punishment) after unwanted behavior' },
        { left: 'Behavior INCREASES — the relief is reinforcing', right: 'Behavior DECREASES — the consequence is aversive or loss-inducing' },
        { left: 'Example: nagging stops when homework is done → more homework completion', right: 'Example: recess removed for talking out of turn → less talking out of turn' },
        { left: '"Negative" = something taken away; "reinforcement" = behavior goes up', right: '"Punishment" always = behavior goes down regardless of positive/negative label' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'scenario-sorter',
        label: 'Reinforcement vs. Punishment Classifier',
        prompt: 'Sort each scenario as negative reinforcement or punishment.',
        scenarios: [
          { id: 's1', text: 'A nagging reminder stops when homework is completed → increases homework completion', category: 'NEGATIVE REINFORCEMENT' },
          { id: 's2', text: 'Recess is removed to decrease talking out of turn', category: 'PUNISHMENT' },
          { id: 's3', text: 'A teacher stops reminding a student when assignments are turned in on time → improves timeliness', category: 'NEGATIVE REINFORCEMENT' },
          { id: 's4', text: 'A student loses screen time for not completing chores → decreases behavior', category: 'PUNISHMENT' },
          { id: 's5', text: 'Seatbelt alarm stops (relief) when buckled → increases buckling', category: 'NEGATIVE REINFORCEMENT' },
          { id: 's6', text: 'Detention is assigned for being tardy → decreases tardiness', category: 'PUNISHMENT' },
        ],
        categories: ['NEGATIVE REINFORCEMENT (removes aversive → increases behavior)', 'PUNISHMENT (adds/removes → decreases behavior)'],
      },
      { type: 'anchor', label: 'Memory anchor', text: 'Negative reinforcement = relief. If removing something makes a behavior go UP, that is negative reinforcement. If anything makes a behavior go DOWN, that is punishment.' },
    ],
  },

  {
    id: 'MOD-D4-03',
    primarySkillId: 'MBH-03',
    title: 'Applied Behavior Analysis (ABA): Structure and Task Analysis',
    sections: [
      { type: 'anchor', label: 'The scenario that identifies ABA', text: 'Dozens of structured, brief trials with a clear prompt and immediate reinforcement — that is ABA/DTT. Not social stories, not CBT. The phrase "task analysis" almost always signals ABA on the exam.' },
      { type: 'paragraph', text: 'Applied Behavior Analysis is the systematic application of behavioral principles to teach new skills and reduce problematic behaviors, particularly for students with autism spectrum disorder. ABA uses task analysis (breaking complex behaviors into small, sequential steps), discrete trial instruction (repeated, structured learning trials), and systematic reinforcement. Prompting hierarchies guide the student from maximum support (hand-over-hand) to no support (independent), and fading procedures systematically reduce those prompts over time to build independence.' },
      { type: 'paragraph', text: 'Worked example: Miguel, an 8-year-old with ASD, is learning to wash his hands independently. The school psychologist uses task analysis to break hand washing into 12 sequential steps (turn on water, wet hands, apply soap…). Each step is taught via discrete trial instruction — the instructor presents the step, Miguel responds, receives immediate specific praise or a token if correct, and the trial ends. Data are taken on each step. Over six weeks, prompts are systematically faded. This entire procedure — task analysis, DTT, prompting, fading, data collection — is the defining signature of ABA.' },
      { type: 'comparison', leftHeader: 'ABA (Behavioral)', rightHeader: 'CBT (Cognitive-Behavioral)', rows: [
        { left: 'Focuses on observable behavior; internal thoughts are not the target', right: 'Targets the connection between thoughts, feelings, and behavior' },
        { left: 'Uses discrete trials, task analysis, prompting hierarchies, and reinforcement schedules', right: 'Uses thought records, cognitive restructuring, behavioral activation, and exposure' },
        { left: 'Ideal for: teaching new skills (toileting, communication, daily living), reducing stereotypy, ASD', right: 'Ideal for: anxiety, depression, OCD, internalizing disorders in verbal students' },
        { left: 'Progress measured by frequency/rate data on observable target behaviors', right: 'Progress measured by self-report, behavioral experiments, and symptom scales' },
      ] },
      { type: 'anchor', label: 'Key terms for ABA questions', text: 'Task analysis • Discrete trial training (DTT) • Reinforcement schedules • Prompting hierarchies • Fading • Generalization • Stimulus control' },
      {
        type: 'interactive',
        interactiveType: "term-matcher",
        label: "ABA Terminology Match",
        prompt: "Match each ABA term to its definition.",
        pairs: [
          { term: "Task analysis", definition: "Breaking a complex skill into small, sequential, teachable steps" },
          { term: "Discrete trial training (DTT)", definition: "A structured trial with a clear prompt, a student response, and immediate consequence" },
          { term: "Prompting hierarchy", definition: "An ordered set of supports ranging from full assistance (e.g., hand-over-hand) to independence" },
          { term: "Fading", definition: "Systematically reducing prompts over time to build independent responding" },
          { term: "Generalization", definition: "Applying a learned skill across new settings, people, and materials" },
          { term: "Stimulus control", definition: "A behavior reliably occurring in the presence of a specific antecedent cue" },
        ],
      },
    ],
  },

  {
    id: 'MOD-D4-04',
    primarySkillId: 'MBH-03',
    title: 'Reinforcement Fading: Teaching Independence',
    sections: [
      { type: 'anchor', label: 'The fading imperative', text: 'A behavior plan without a fading plan creates permanent dependency on external support. Goal: establish the behavior with prompts/reinforcement → confirm stability → systematically withdraw support → transfer to natural reinforcers.' },
      { type: 'paragraph', text: 'A hallmark of effective behavioral intervention is a planned exit strategy. After a new behavior is established using prompts and reinforcers, those supports must be systematically removed (faded) so the student can perform the behavior independently without external scaffolding. The correct sequence is: teach with prompts and reinforcers → confirm the behavior is stable → gradually fade prompts and reinforcers → confirm independent performance. Skipping the fading step creates dependency on the support system. Removing reinforcement too quickly triggers extinction — the behavior collapses because the payoff disappeared before natural reinforcers (peer approval, intrinsic satisfaction, task completion) had time to take over.' },
      { type: 'paragraph', text: "Worked example: A 2nd grader, Jaylen, is learning to raise his hand instead of blurting out. The school psychologist designs an ABA-based program: every time Jaylen raises his hand, he immediately receives a token (continuous reinforcement). After two weeks, he is raising his hand reliably. The team now thins the schedule — Jaylen earns a token for every third hand-raise (intermittent reinforcement). Over the next two weeks, tokens become less frequent and are eventually replaced with specific verbal praise. By week six, Jaylen raises his hand consistently with no token system — natural reinforcement (teacher attention, being called on) maintains the behavior. The fading plan was essential: if tokens were removed abruptly after week 2, the behavior would likely have extinguished." },
      { type: 'comparison', leftHeader: 'Fading Stage', rightHeader: 'Purpose', rows: [
        { left: 'Continuous reinforcement (CRF): reward every correct response', right: 'Build the new behavior quickly — highest rate of reinforcement while learning' },
        { left: 'Intermittent reinforcement: reward some responses (fixed ratio, variable ratio)', right: 'Make the behavior more resistant to extinction — unpredictable rewards maintain behavior longer' },
        { left: 'Thin to natural reinforcers: praise, attention, task completion', right: 'Transfer maintenance to the natural environment — behavior persists without artificial supports' },
        { left: 'Prompt fading (physical → gestural → verbal → independent)', right: 'Remove instructional scaffolding as performance stabilizes; avoid prompt dependency' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'drag-to-order',
        label: 'Order the fading steps',
        prompt: 'Put the reinforcement-fading sequence in the correct order.',
        items: [
          'Teach the new behavior using prompts and continuous reinforcement',
          'Confirm the behavior is stable and consistent',
          'Gradually thin the reinforcement schedule (continuous → intermittent)',
          'Fade prompts and external supports',
          'Confirm independent performance maintained by natural reinforcers',
        ],
      },
    ],
  },

  {
    id: 'MOD-D4-05',
    primarySkillId: 'MBH-04',
    title: 'Bullying: An Abuse of Power, Not Just Aggression',
    sections: [
      { type: 'anchor', label: 'Three required elements — all must be present', text: "Bullying = REPETITION + INTENTIONALITY + POWER IMBALANCE. A single incident is NOT bullying (it may be aggression, harassment, or conflict). Equal-power fights are NOT bullying. Mutual banter is NOT bullying. All three elements must co-occur. On the exam: if the scenario is one-time or equal-power, the answer is not bullying." },
      { type: 'paragraph', text: 'Bullying has a specific conceptual definition in the research literature that differentiates it from general aggression or conflict. The defining features are: repetition (not a one-time incident), intentionality, and — critically — an imbalance of power between the aggressor and the target. Bullying is not the same as fighting, bantering, or general conflict. It is aggression characterized by a consistent abuse of power. This framing has implications for intervention: addressing bullying requires addressing the power dynamic, not just the behavior.' },
      { type: 'paragraph', text: "Worked example: Devon is an 8th grader who has been excluded from a friend group over the past three weeks by a more socially dominant peer, Kayla, who controls the group's seating at lunch and social media interactions. Kayla is intentionally keeping Devon out, and the pattern has persisted across multiple days and settings. This meets all three criteria: repetition (weeks of behavior), intentionality (deliberate exclusion), and power imbalance (Kayla controls the social network Devon depends on). Compare this to a one-day argument between Devon and another student of equal social standing — that is a conflict, not bullying. The distinction matters for intervention: bullying requires addressing Kayla's use of social power, not just mediating a dispute. NASP endorses restorative practices over zero-tolerance policies because zero-tolerance creates disparate impact on minority and special education students." },
      { type: 'comparison', leftHeader: 'Bullying', rightHeader: 'Not bullying — distinguish on exam', rows: [
        { left: 'Repeated over time (not a one-time incident)', right: 'Single incident, even if aggressive or harmful' },
        { left: 'Intentional — aggressor deliberately targets the victim', right: 'Accidental or situational conflict between peers' },
        { left: 'Power imbalance — aggressor holds social, physical, or status power over target', right: 'Mutual conflict between peers of equal power (fighting, arguing)' },
        { left: 'Requires intervention targeting the power dynamic', right: 'Mutual conflict resolved through peer mediation or conflict resolution' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'scenario-sorter',
        label: 'Bullying vs. Other Aggression',
        prompt: 'Identify whether each scenario constitutes bullying or is a different form of conflict.',
        scenarios: [
          { id: 's1', text: 'Two students have equal strength, get into one fight over a disagreement', category: 'NOT BULLYING' },
          { id: 's2', text: 'Older student repeatedly excludes younger student from group, threatens them', category: 'BULLYING' },
          { id: 's3', text: 'Friends banter and joke back-and-forth', category: 'NOT BULLYING' },
          { id: 's4', text: 'Physically larger student pushes smaller student for lunch money repeatedly', category: 'BULLYING' },
          { id: 's5', text: 'Two classmates argue once about a test', category: 'NOT BULLYING' },
          { id: 's6', text: 'One student spreads rumors repeatedly about another; excludes from social groups', category: 'BULLYING' },
        ],
        categories: ['BULLYING (power imbalance, repetition, intentionality)', 'NOT BULLYING (one-time, equal power, mutual conflict)'],
      },
      { type: 'anchor', label: "NASP's preferred approach", text: 'Restorative practices and skill-building are endorsed over zero-tolerance policies. Zero tolerance is not effective and creates disparate impact on minority and special education students.' },
    ],
  },

  {
    id: 'MOD-D4-06',
    primarySkillId: 'MBH-05',
    title: "Broca's Area, the Amygdala, and Brain-Behavior Basics",
    sections: [
      { type: 'anchor', label: 'The most-tested brain fact', text: "The amygdala = fear, threat detection, emotional activation. The prefrontal cortex = planning and impulse control. These two are in tension: when the amygdala is activated (perceived threat), it can temporarily suppress prefrontal functioning — this is the 'amygdala hijack' concept." },
      { type: 'paragraph', text: 'The amygdala is the brain structure most strongly associated with emotional processing, particularly fear, threat detection, and the fight-or-flight response. It is part of the limbic system, which governs emotional and memory functions. When a student perceives social threat (public failure, peer rejection), the amygdala activates and can trigger physiological stress responses — increased heart rate, cortisol release, narrowed attention — that interfere with learning and self-regulation.' },
      { type: 'paragraph', text: "Broca's area is in the left frontal lobe and governs expressive speech production (speaking words). Wernicke's area, in the temporal lobe, governs language comprehension (understanding words). A student with damage to Broca's area might understand speech but struggle to produce it (expressive aphasia). The prefrontal cortex handles executive functions — planning, impulse control, decision-making. The hippocampus consolidates explicit memories." },
      { type: 'paragraph', text: "Worked example: A 9th grader freezes and cannot respond during oral presentations, even though she performs well on written tests. The school psychologist explains to the teacher: when the student is called on publicly, her amygdala activates a threat response. The activation interferes with the prefrontal cortex's ability to retrieve and organize language. This is not defiance or laziness — it is a biological fear response. The intervention includes gradual exposure, coping strategies to regulate the amygdala response, and modified presentation formats while she builds confidence." },
      { type: 'comparison', leftHeader: 'Brain Structure', rightHeader: 'Primary Function / School Relevance', rows: [
        { left: 'Amygdala (limbic system)', right: 'Fear, threat detection, emotional activation; mediates fight/flight/freeze responses to perceived danger' },
        { left: 'Prefrontal cortex (frontal lobe)', right: 'Executive functions: planning, inhibitory control, working memory, decision-making; last to mature (early 20s)' },
        { left: "Broca's area (left frontal lobe)", right: 'Expressive speech production; damage → expressive aphasia (understands but cannot produce fluent speech)' },
        { left: "Wernicke's area (temporal lobe)", right: 'Language comprehension; damage → receptive aphasia (fluent but meaningless speech)' },
        { left: 'Hippocampus (limbic system)', right: 'Consolidation of declarative (explicit) memory; highly sensitive to stress hormones' },
        { left: 'Parietal lobe', right: 'Sensory integration, spatial awareness, math processing' },
      ] },
      {
        type: 'interactive',
        interactiveType: "term-matcher",
        label: "Brain Structure to Function Match",
        prompt: "Match each brain structure to its primary function.",
        pairs: [
          { term: "Amygdala", definition: "Fear and threat detection; drives the fight, flight, or freeze response" },
          { term: "Prefrontal cortex", definition: "Executive functions: planning, impulse control, and decision-making" },
          { term: "Broca's area", definition: "Expressive speech production; damage causes expressive aphasia" },
          { term: "Wernicke's area", definition: "Language comprehension; damage causes receptive aphasia" },
          { term: "Hippocampus", definition: "Consolidation of explicit (declarative) long-term memory" },
        ],
      },
    ],
  },

  {
    id: 'MOD-D4-07',
    primarySkillId: 'SAF-03',
    title: 'Suicide Assessment: Never Leave the Student Alone',
    sections: [
      { type: 'anchor', label: 'The non-negotiable rule', text: "A student who has expressed suicidal ideation must NEVER be left alone — not to call parents, not to get paperwork, not to notify the principal. Supervision is physical and continuous. Everything else is secondary." },
      { type: 'paragraph', text: 'When a school psychologist is conducting a suicide risk assessment, the most critical safety practice is continuous supervision — the student must never be left unsupervised at any point during the process. This is the non-negotiable floor of safe practice. Supervision means maintaining line-of-sight contact; even stepping out of the room briefly while someone else "covers" violates safe practice if the coverage is not adequately trained and explicitly in place.' },
      { type: 'paragraph', text: "Worked example: A 10th grader tells her school counselor, 'I've been thinking about ending my life.' The counselor immediately calls for the school psychologist and stays with the student. When the psychologist arrives, she does not leave to retrieve the assessment tool — she asks the counselor to get it. She does not step out to call the parent — she uses an in-room phone. Throughout the assessment, the student is never without a trained adult present. After completing the assessment and determining the student needs a higher level of care, the psychologist coordinates with administration for parent notification and emergency services while another staff member maintains supervision." },
      { type: 'comparison', leftHeader: 'Safe Practice', rightHeader: 'Common Error (exam trap)', rows: [
        { left: 'Stay continuously with the student from the moment they disclose until safety is established', right: 'Leaving the student briefly to call parents, retrieve paperwork, or notify administration' },
        { left: 'Conduct or coordinate the formal risk assessment while supervision is maintained', right: 'Skipping formal assessment and relying only on gut feeling or a brief conversation' },
        { left: 'Notify parents AFTER the immediate safety situation is stabilized', right: 'Calling parents first, before securing supervision, because "they have a right to know immediately"' },
        { left: 'Coordinate with a trained crisis team; follow the school\'s protocol', right: 'Handling the situation alone without notifying administration or the crisis team' },
      ] },
      { type: 'anchor', label: 'Protocol sequence', text: '1. Stay with the student. 2. Notify administration. 3. Conduct or coordinate the suicide assessment. 4. Notify parents. The order matters — safety first, notifications next.' },
      {
        type: 'interactive',
        interactiveType: "drag-to-order",
        label: "Suicide-risk response sequence",
        prompt: "A student has just disclosed suicidal ideation. Arrange the school psychologist's actions in the correct order, safety first.",
        items: [
          "Stay with the student and maintain continuous, line-of-sight supervision",
          "Notify administration and activate the school crisis team",
          "Conduct or coordinate the formal suicide risk assessment while supervision continues",
          "Notify the parents/guardians once immediate safety is stabilized",
          "Coordinate higher level of care or emergency services as the risk level indicates",
        ],
      },
    ],
  },

  {
    id: 'MOD-D4-08',
    primarySkillId: 'SAF-03',
    title: 'Confidentiality Limits: When to Breach and When Not To',
    sections: [
      { type: 'anchor', label: 'The four breach conditions', text: 'Breach confidentiality ONLY for: (1) imminent danger to self, (2) specific credible threat to an identifiable other (duty to warn), (3) abuse or neglect disclosure, (4) court order. Sexual orientation, interpersonal conflict, embarrassing disclosures — NOT breach situations.' },
      { type: 'paragraph', text: 'Confidentiality in counseling has specific, defined exceptions. A psychologist must breach confidentiality when there is a risk of harm to the student or others. The exceptions include: suicidal ideation or self-harm with intent; threats of violence toward a specific, identifiable person (duty to warn); disclosure of abuse (mandated reporting); and a court order. Confidentiality is NOT breached because a student reveals their sexual orientation, discusses interpersonal conflicts with no violence threat, or shares information that is uncomfortable but not dangerous. Always explain confidentiality limits at the very first meeting — not after rapport is established, not when a concerning topic arises.' },
      { type: 'paragraph', text: "Worked example: A 10th grader tells the school psychologist three things in a session: (1) 'I've been cutting myself to relieve stress — small cuts, no intention to die.' (2) 'I think I might be gay and I don't know how to tell my parents.' (3) 'I'm so angry at James that I want to punch him in the face.' Analysis: Disclosure 1 requires clinical assessment of intent and lethality — if the cutting is a coping behavior with no suicidal intent, it may not trigger a mandatory breach, but the psychologist documents a safety plan. Disclosure 2 — sexual orientation — is private information; breach here would be an ethical violation. Disclosure 3 is frustration-language, not a specific, credible threat to an identifiable person; no breach indicated, but the psychologist explores the conflict. Now change disclosure 3 to: 'I know where James lives and I'm going to hurt him tonight.' That crosses into specific, credible, and imminent — now duty-to-warn applies." },
      { type: 'comparison', leftHeader: 'Situation', rightHeader: 'Action', rows: [
        { left: 'Student expresses suicidal ideation with a plan and intent', right: 'Breach — imminent danger to self; conduct safety assessment; involve parents/guardians and administrator' },
        { left: 'Student says "I feel like killing myself" in frustration with no intent', right: 'Assess carefully; document; no automatic breach — clinical judgment required' },
        { left: 'Student threatens a specific identifiable person with a credible plan', right: 'Breach — duty to warn; notify the target, parents, and administration; document' },
        { left: 'Student discloses sexual orientation, substance use, or family conflict (no violence)', right: 'Maintain confidentiality; address clinically; no breach' },
        { left: 'Student discloses abuse or neglect by a caregiver', right: 'Mandated report — breach confidentiality and report to CPS/law enforcement immediately' },
      ] },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "Breach or maintain confidentiality?",
        prompt: "Sort each disclosure by whether it requires the school psychologist to breach confidentiality.",
        scenarios: [
          { id: "s1", text: "A student names a specific peer, describes a credible plan, and says he will hurt that peer tonight.", category: "Breach required" },
          { id: "s2", text: "A student discloses that a parent has been physically abusing them at home.", category: "Breach required" },
          { id: "s3", text: "A student states a clear plan and intent to end their own life.", category: "Breach required" },
          { id: "s4", text: "A student shares that they think they may be gay and are nervous about telling their family.", category: "Maintain confidentiality" },
          { id: "s5", text: "A student vents that they are furious with a classmate, with no plan, target specifics, or intent to act.", category: "Maintain confidentiality" },
          { id: "s6", text: "A student admits to occasional underage drinking on weekends, with no danger to self or others.", category: "Maintain confidentiality" },
        ],
        categories: ["Breach required", "Maintain confidentiality"],
      },
    ],
  },

  {
    id: 'MOD-D4-09',
    primarySkillId: 'DEV-01',
    title: "Erikson's Stages: School-Age Reference Card",
    sections: [
      { type: 'anchor', label: 'School-psych age band → stage match', text: "Elementary age (6–12) = Industry vs. Inferiority — competence and productivity. Preschool (3–5) = Initiative vs. Guilt — asserting self, taking on tasks. Adolescence (13–18) = Identity vs. Role Confusion — who am I? Infancy (0–18 mo) = Trust vs. Mistrust — is the world safe? These four are the exam-tested stages." },
      { type: 'paragraph', text: "Erikson's psychosocial theory is a consistent source of exam questions. Know the school-age stages by their age ranges and core challenges:" },
      { type: 'list', items: ['Industry vs. Inferiority (6–12 years, elementary school): Children learn to be competent and productive. Success builds industry; failure builds feelings of inferiority.', 'Initiative vs. Guilt (3–5 years, preschool): Children take on new tasks and assert themselves. Excessive criticism creates guilt.', 'Identity vs. Role Confusion (13–18 years, high school): Adolescents explore who they are and where they fit in the world.', 'Trust vs. Mistrust (0–18 months): Infants learn whether the world is safe and reliable.'] },
      { type: 'paragraph', text: "Worked example: A school psychologist consults with a 4th-grade teacher (students ages 9–10) about a student who has become withdrawn and refuses to participate in class activities since failing a prominent class project. According to Erikson's framework, the student is in the Industry vs. Inferiority stage. Failure experiences — especially public ones — at this stage threaten the child's developing sense of competence. The psychologist explains: the child is not being defiant; the withdrawal is a response to an inferiority experience. Intervention focuses on rebuilding competence through structured success experiences, mastery-oriented feedback, and a classroom environment that separates effort from ability in teacher praise. Contrast this with a high school junior exploring different career paths and social identities — that student is in the Identity vs. Role Confusion stage, and identity-affirming exploration is developmentally appropriate, not avoidance." },
      { type: 'comparison', leftHeader: 'Stage (Age Range)', rightHeader: 'Core Challenge + School Implication', rows: [
        { left: 'Trust vs. Mistrust (0–18 months)', right: "Infant learns whether the world is safe — foundational for later attachment and self-regulation; informs early intervention's family focus" },
        { left: 'Initiative vs. Guilt (3–5 years)', right: 'Child asserts self and takes on tasks; excessive criticism → guilt and hesitancy; supports play-based, exploration-rich preschool environments' },
        { left: 'Industry vs. Inferiority (6–12 years)', right: 'Child develops competence and productivity; school performance is the primary arena; failure without support → lasting inferiority feelings' },
        { left: 'Identity vs. Role Confusion (13–18 years)', right: 'Adolescent explores social roles and personal identity; schools support healthy exploration through clubs, electives, mentorship, and autonomy-supportive environments' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'term-matcher',
        label: 'Erikson Developmental Stages',
        prompt: 'Match each Erikson stage with its age range and core psychosocial challenge.',
        pairs: [
          {
            term: 'Trust vs. Mistrust',
            definition: '0–18 months (infancy): Learn if world is safe and caregivers are reliable',
          },
          {
            term: 'Initiative vs. Guilt',
            definition: '3–5 years (preschool): Assert yourself and take on tasks without excessive criticism',
          },
          {
            term: 'Industry vs. Inferiority',
            definition: '6–12 years (elementary): Develop competence and productivity; avoid feelings of inadequacy',
          },
          {
            term: 'Identity vs. Role Confusion',
            definition: '13–18 years (adolescence): Explore identity and social role; determine where you fit in the world',
          },
        ],
      },
      { type: 'anchor', label: 'Exam pattern', text: 'A 9-year-old (second grade) is in the Industry vs. Inferiority stage. A high schooler exploring career identity is in Identity vs. Role Confusion. These are the two most frequently tested.' },
    ],
  },

  {
    id: 'MOD-D4-10',
    primarySkillId: 'ACA-09',
    title: 'Health Conditions, Trauma, and Mental Health: When Biology Meets Learning',
    sections: [
      { type: 'anchor', label: 'The clinical reframe', text: 'A student who cannot concentrate in class is not necessarily choosing not to learn. Unmanaged diabetes, pediatric epilepsy, chronic anxiety, and complex trauma all interfere with the same cognitive systems — attention, working memory, processing speed, and executive function — that drive academic learning. The label differs; the educational impact does not.' },
      { type: 'paragraph', text: 'Health conditions most commonly affecting educational performance include: ADHD (impaired attention and impulse control); seizure disorders (post-ictal confusion and medication side effects on cognition); asthma (absences and fatigue from oxygen fluctuations); diabetes (glucose instability impairs concentration and memory); and chronic pain or fatigue conditions. Students do not need to qualify for special education to receive support. A health condition that substantially limits a major life activity — including learning or concentrating — qualifies a student for a Section 504 accommodation plan, which can address attendance flexibility, medication access, reduced workloads, and extended time.' },
      { type: 'paragraph', text: 'Mental health conditions impose their own cognitive costs. Depression slows processing speed, impairs memory encoding, and creates motivational deficits that look like laziness. Anxiety overloads working memory with worry, leaving fewer cognitive resources for academic tasks — which is why an anxious student may understand material at home but freeze on tests. Post-traumatic stress disorder (PTSD) keeps the brain\'s threat-detection system hyperactivated: the amygdala prioritizes scanning for danger over the prefrontal cortex\'s capacity for planning, memory consolidation, and learning. Trauma-related behavior that looks like defiance or inattention is often a dysregulated stress response — not a willful choice, and not amenable to punishment-only approaches.' },
      {
        type: 'interactive',
        interactiveType: 'card-flip',
        label: 'Health and mental health — educational impact',
        prompt: 'Flip each card to see how the condition affects learning and what the school psychologist should consider.',
        cards: [
          { id: 'c1', front: 'Type 1 Diabetes (uncontrolled)', back: 'Glucose instability impairs attention, memory, and processing speed. The student may need scheduled snack access, flexible attendance for medical appointments, and a 504 plan for blood-sugar monitoring protocols.' },
          { id: 'c2', front: 'Generalized Anxiety Disorder', back: 'Working memory is overloaded with worry; performance declines under evaluative conditions. May look like disengagement or avoidance. Accommodations: extended time, low-stakes check-ins, reduced evaluative pressure.' },
          { id: 'c3', front: 'Complex (Developmental) Trauma', back: 'Chronic stress impairs prefrontal cortex function — planning, regulation, and new learning are all compromised. Trauma-informed practices (predictability, relational safety, co-regulation) are the evidence-based response, not punishment.' },
          { id: 'c4', front: 'Pediatric Epilepsy with Medication', back: 'Antiepileptic medications can cause cognitive dulling, fatigue, or mood changes; post-ictal states cause temporary confusion. Consider extended time, rest provisions, and frequent academic progress checks.' },
        ],
      },
      { type: 'anchor', label: 'School psychologist role', text: 'The job is not to diagnose the medical or psychiatric condition — that belongs to medical providers. The job is to assess the educational impact: how does this student\'s health or mental health condition currently affect cognitive, behavioral, and academic functioning? That functional analysis drives 504 planning, IEP services, and evidence-based intervention design.' },
      { type: 'comparison', leftHeader: "Deficit Lens (willful-behavior framing)", rightHeader: "Clinical Reframe (health-impact framing)", rows: [
          { left: "Assumes the student is choosing not to learn or behave", right: "Recognizes a health, mental-health, or trauma condition is disrupting attention, working memory, processing speed, or executive function" },
          { left: "Responds with punishment, lost privileges, or escalating discipline", right: "Responds with functional assessment, accommodations, and evidence-based, trauma-informed supports" },
          { left: "Treats inconsistent performance as proof of low effort or motivation", right: "Treats inconsistent performance as a predictable symptom (e.g., anxiety freezing, glucose swings, post-ictal confusion)" },
          { left: "Routes the student only toward behavioral consequences", right: "Routes the student toward a Section 504 plan or IEP based on documented educational impact" },
        ] },
    ],
  },

  {
    id: 'MOD-D4-11',
    primarySkillId: 'MBH-02',
    title: 'Counseling in Schools: Individual, Group, and Measuring What Changes',
    sections: [
      { type: 'anchor', label: 'The accountability question', text: 'Running a counseling group for six weeks is not the same as providing evidence-based counseling. If you cannot demonstrate that students improved — using pre/post data, behavioral observations, or teacher ratings — you cannot distinguish "therapy worked" from "the student would have improved anyway." Outcome measurement is not optional; it is what makes counseling a professional service.' },
      { type: 'paragraph', text: 'Individual counseling is the most intensive and tailored format: one psychologist with one student, allowing full customization of approach, pacing, and content. It is appropriate for presentations requiring confidentiality (LGBTQ+ identity exploration, suicidal ideation, abuse disclosures), complex or severe psychopathology, acute crisis response, or cases where the student\'s specific needs differ substantially from any available group format. The tradeoff is time: one student per hour limits the psychologist\'s reach across a caseload.' },
      { type: 'paragraph', text: 'Group counseling is more efficient — typically four to eight students with a shared presenting concern — and offers therapeutic factors that individual work cannot replicate: universality ("I\'m not the only one going through this"), altruism (helping others deepens one\'s own understanding), peer modeling (observing effective coping from a peer is often more powerful than hearing it from an adult), and cohesion (the relational safety of the group becomes therapeutic in itself). Well-indicated group formats include grief groups, anxiety-management skills groups, social skills training, coping skills, and trauma-focused groups for students with a shared experience.' },
      { type: 'comparison', leftHeader: 'Individual Counseling', rightHeader: 'Group Counseling (4–8 students)', rows: [
        { left: 'One student, fully customized approach', right: 'Shared presenting concern; structured around common themes' },
        { left: 'Best when: confidentiality critical, acute crisis, complex presentation', right: 'Best when: shared experience, peer support valuable, efficient reach needed' },
        { left: 'Mechanism: psychologist-student alliance, personalized intervention', right: 'Mechanisms: universality, altruism, peer modeling, group cohesion' },
        { left: 'Outcome: pre/post scales, behavioral tracking — individually measured', right: 'Outcome: individual and group-level measures; fidelity to group protocol also checked' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Format selection',
        prompt: 'Six students who all witnessed the same school shooting are displaying anxiety, sleep disturbance, and academic decline. What counseling format is MOST appropriate as the primary school-based intervention?',
        options: [
          { id: 'o1', label: 'Individual CBT with each of the six students', isCorrect: false, explanation: 'Resource-intensive and misses key group therapeutic factors — particularly universality, which is especially powerful for shared-trauma presentations.' },
          { id: 'o2', label: 'Trauma-informed group counseling using an evidence-based group protocol', isCorrect: true, explanation: 'Correct. Shared trauma is one of the clearest indications for group: universality reduces isolation; evidence-based group trauma protocols exist (e.g., Skills for Psychological Recovery, group TF-CBT).' },
          { id: 'o3', label: 'Refer all six to community mental health', isCorrect: false, explanation: 'May be appropriate as a supplement for severe cases, but is not the most appropriate primary school-based response when group counseling is well-indicated.' },
          { id: 'o4', label: 'Psychoeducation-only classroom presentation for all affected students', isCorrect: false, explanation: 'Psychoeducation is a useful Tier 1 supplement, but insufficient as the primary treatment for clinical-level trauma presentations.' },
        ],
      },
    ],
  },

  // ── Domain 5: School-Wide Practices to Promote Learning ──────────────────

  {
    id: 'MOD-D5-01',
    primarySkillId: 'SAF-01',
    title: 'PBIS: The NASP-Endorsed System-Wide Practice',
    sections: [
      { type: 'anchor', label: 'NASP endorsement — and what it excludes', text: "PBIS = NASP-endorsed. Zero tolerance, ability tracking, and retention = NOT endorsed. When a question asks which school-wide practice aligns with NASP's position, PBIS is the answer." },
      { type: 'paragraph', text: 'Positive Behavioral Interventions and Supports is the system-wide framework endorsed by NASP for promoting positive student behavior across an entire school. PBIS is proactive, data-driven, and tiered — it matches the intensity of support to the level of student need. The three tiers mirror the MTSS model: Tier 1 (universal, all students), Tier 2 (targeted, ~15% of students), Tier 3 (intensive, ~5%). Interventions at every tier are selected using data, implemented with fidelity, and monitored for effectiveness.' },
      { type: 'paragraph', text: "Worked example: Jefferson Elementary is implementing Tier 1 PBIS. The school psychologist leads the staff in identifying three positively stated school-wide expectations (Be Safe, Be Responsible, Be Kind). Staff are trained to notice and immediately acknowledge when students meet these expectations using specific verbal praise and a token system. Office discipline referrals (ODRs) are reviewed monthly by the PBIS team; when ODRs spike in the cafeteria, the team adds explicit teaching of cafeteria expectations and increases supervision in that setting. This is PBIS in action: positive, proactive, data-driven, and systemic." },
      { type: 'comparison', leftHeader: 'PBIS (NASP-Endorsed)', rightHeader: 'Zero-Tolerance / Punitive Approaches', rows: [
        { left: 'Proactively teaches behavioral expectations to ALL students', right: 'Reacts to misbehavior after it occurs; no universal skill-building' },
        { left: 'Uses data (ODRs, suspension rates) to identify patterns and adjust the system', right: 'Relies on administrator judgment; inconsistent application across student groups' },
        { left: 'Tiered response matches support intensity to need; students are not excluded', right: 'Automatic consequences regardless of function, severity, or student circumstances' },
        { left: 'Shown to reduce discipline disparities and improve school climate', right: 'Associated with increased discipline disparities for minority and disabled students' },
      ] },
      { type: 'anchor', label: 'PBIS core features (exam targets)', text: 'Clear, positively stated expectations • Consistent staff acknowledgment of expected behavior • Data used to make decisions • Tiered support system. Note: parent volunteering is a benefit but is NOT a core PBIS feature on the exam.' },
      { type: 'paragraph', text: "Exam trap: PBIS is frequently confused with a single reward program or a one-time assembly, but the tested distinction is that PBIS is a systemic, multi-tiered framework, not an isolated incentive. A common distractor presents a school that hands out prizes for good behavior yet never teaches expectations, never tracks data, and never adjusts based on patterns; that is not PBIS because it omits the proactive instruction and data-based decision-making at its core. Another trap pairs PBIS with exclusionary responses such as automatic suspensions; PBIS explicitly avoids removing students and instead increases support intensity by tier. Remember the tier proportions that often anchor items: Tier 1 serves all students universally, Tier 2 targets roughly 15 percent needing additional support, and Tier 3 provides intensive, individualized intervention for about 5 percent. When a stem describes proactive, data-driven, tiered, inclusive support, select PBIS." },
      {
        type: 'interactive',
        interactiveType: "term-matcher",
        label: "PBIS structure and vocabulary",
        prompt: "Match each PBIS term to its correct description.",
        pairs: [
          { term: "Tier 1 (Universal)", definition: "School-wide expectations taught and acknowledged for all students" },
          { term: "Tier 2 (Targeted)", definition: "Additional support for the roughly 15 percent of students not responding to universal supports" },
          { term: "Tier 3 (Intensive)", definition: "Individualized, intensive intervention for the approximately 5 percent with the greatest need" },
          { term: "Office Discipline Referrals (ODRs)", definition: "A primary data source the PBIS team reviews to spot patterns and adjust supports" },
          { term: "Positively stated expectations", definition: "Clear behavioral rules framed as what to do (e.g., Be Safe), explicitly taught rather than assumed" },
          { term: "Implementation fidelity", definition: "The degree to which the framework is carried out as designed, monitored to ensure effects are real" },
        ],
      },
    ],
  },

  {
    id: 'MOD-D5-02',
    primarySkillId: 'SWP-04',
    title: 'RTI at the Systems Level: Not for Retention Decisions',
    sections: [
      { type: 'paragraph', text: 'Response to Intervention is a problem-solving framework used to identify learning difficulties, target intervention strategies, monitor progress, and evaluate intervention effectiveness. It is not a tool for making grade retention decisions.' },
      { type: 'paragraph', text: 'NASP does not endorse grade retention, and RTI is not designed to inform retention. RTI data inform whether interventions are working, whether a student needs more intensive support, and whether a formal special education evaluation may be warranted.' },
      { type: 'comparison', leftHeader: 'What RTI data ARE for', rightHeader: 'What RTI data are NOT for', rows: [{ left: 'Judging whether a specific intervention is working (progress monitoring)', right: 'Making grade-retention or social-promotion decisions' }, { left: 'Deciding whether to intensify support or move a student between tiers', right: 'Serving as the sole basis for special-education eligibility' }, { left: 'Contributing data to a comprehensive evaluation for SLD identification', right: 'Replacing a comprehensive, multi-source evaluation' }, { left: 'Allocating resources and guiding instructional decisions', right: 'Labeling or sorting students' }] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Apply the rule',
        prompt: 'A 2nd grader is still below benchmark after two well-implemented rounds of Tier 2 intervention, with flat progress-monitoring data. What is the appropriate RTI-informed next step?',
        options: [
          { id: 'o1', label: 'Recommend the student repeat 2nd grade', isCorrect: false, explanation: 'NASP opposes grade retention and RTI is not designed to inform retention. Weak progress signals a need for more intensive support, not repetition.' },
          { id: 'o2', label: 'Intensify support (e.g., move to Tier 3) and consider a comprehensive special-education evaluation', isCorrect: true, explanation: 'Correct. Flat data after fidelity-checked intervention is exactly the signal to increase intensity and consider a formal evaluation.' },
          { id: 'o3', label: 'Use the RTI progress data alone to determine SLD eligibility', isCorrect: false, explanation: 'RTI data are one input. Eligibility requires a comprehensive, multi-source evaluation — never RTI data alone.' },
          { id: 'o4', label: 'Wait a full school year before changing anything', isCorrect: false, explanation: 'RTI is a problem-solving cycle; flat data calls for a timely change, not a year of waiting.' },
        ],
      },
      { type: 'anchor', label: 'Memory anchor', text: 'RTI answers "Is the intervention working?" — never "Should this student repeat the grade?" NASP opposes grade retention, and RTI data are one input to a comprehensive evaluation, never the sole criterion.' },
      { type: 'paragraph', text: "The exam trap here is fidelity of implementation. RTI data only mean something if the intervention was delivered as designed — correct dosage, duration, group size, and trained staff. Before concluding that a student is a 'non-responder,' the team must verify the intervention was implemented with fidelity; otherwise flat progress-monitoring data reflect a broken delivery system, not a student deficit. This matters legally too: IDEA requires that an SLD evaluation rule out lack of appropriate instruction as the cause of underperformance. So when a Tier 2 intervention shows no growth, the first question is not 'Should we retain or evaluate?' but 'Was this intervention actually delivered correctly and consistently?' Only fidelity-verified, flat data justify intensifying support or proceeding to a comprehensive evaluation." },
    ],
  },

  {
    id: 'MOD-D5-03',
    primarySkillId: 'SAF-01',
    title: 'CASEL and Social-Emotional Learning',
    sections: [
      { type: 'anchor', label: 'The most-tested CASEL distinction', text: 'Self-management (regulating impulses and behavior) is frequently confused with self-awareness (recognizing emotions). Self-awareness is internal recognition; self-management is what you DO with that awareness. Regulation = self-management.' },
      { type: 'paragraph', text: 'The Collaborative for Academic, Social, and Emotional Learning (CASEL) framework defines five core competencies for SEL. These are testable content:' },
      { type: 'list', items: ['Self-awareness — recognizing your own emotions and their impact on others', 'Self-management — regulating emotions, impulses, and behavior; goal-setting; resilience', 'Social awareness — understanding others\' perspectives and showing empathy across diverse backgrounds', 'Relationship skills — communicating clearly, listening actively, cooperating, resolving conflict constructively', 'Responsible decision-making — making ethical, constructive choices about personal and social behavior'] },
      { type: 'paragraph', text: "Worked example: Marcus, a 4th grader, frequently blurts out answers and disrupts class despite wanting to do well. His teacher refers him to the school psychologist. The psychologist observes that Marcus recognizes when he is excited (self-awareness) but cannot control his impulse to speak without being called on (self-management deficit). The intervention targets self-management: Marcus learns a self-monitoring checklist, earns tokens for raising his hand, and practices a pause-and-count strategy before responding. Within three weeks, blurting decreases by 70%." },
      { type: 'comparison', leftHeader: 'CASEL Competency', rightHeader: 'What it looks like in practice', rows: [
        { left: 'Self-awareness', right: 'Student says "I feel angry when other kids take my materials"' },
        { left: 'Self-management', right: 'Student uses a calming strategy before reacting; completes tasks despite frustration' },
        { left: 'Social awareness', right: 'Student considers why a classmate from a different background might see the situation differently' },
        { left: 'Relationship skills', right: 'Student negotiates a conflict using "I" statements and active listening' },
        { left: 'Responsible decision-making', right: 'Student weighs consequences before acting; considers how choices affect peers' },
      ] },
      { type: 'anchor', label: 'Exam target', text: 'Self-management is the CASEL competency most closely linked to self-regulation — a frequent exam target. When a question asks about regulating one\'s behavior or controlling impulses within the CASEL framework, self-management is the answer.' },
      { type: 'paragraph', text: "A second high-yield distinction is social awareness versus relationship skills. Social awareness is internal and perceptual — taking another person's perspective, showing empathy, recognizing social and cultural norms. Relationship skills are behavioral and interpersonal — what a student actually does with others: communicating, listening, cooperating, negotiating, and repairing conflict. A student can understand a peer's viewpoint (social awareness) yet still fail to communicate or compromise effectively (a relationship-skills deficit). On the exam, watch the verb: 'understands,' 'recognizes,' or 'considers another's perspective' points to social awareness, while 'communicates,' 'cooperates,' 'resolves conflict,' or 'works on a team' points to relationship skills. Mapping the behavior to the verb prevents the most common CASEL mismatch errors." },
      {
        type: 'interactive',
        interactiveType: "term-matcher",
        label: "Match the competency",
        prompt: "Match each CASEL core competency to its defining description.",
        pairs: [
          { term: "Self-awareness", definition: "Recognizing your own emotions and how they affect your behavior" },
          { term: "Self-management", definition: "Regulating impulses and behavior, setting goals, and showing resilience" },
          { term: "Social awareness", definition: "Taking others' perspectives and showing empathy across diverse backgrounds" },
          { term: "Relationship skills", definition: "Communicating, cooperating, and resolving conflict constructively with others" },
          { term: "Responsible decision-making", definition: "Making ethical, constructive choices about personal and social behavior" },
        ],
      },
    ],
  },

  {
    id: 'MOD-D5-04',
    primarySkillId: 'DIV-03',
    title: 'Disproportionality: Group Membership and Unequal Outcomes',
    sections: [
      { type: 'anchor', label: 'Precise definition', text: "Disproportionality = group differences in educational outcomes or risk levels based on group membership. It is NOT about individual bias, SES alone, or 'racial privilege' (a different concept). Know the definition as written." },
      { type: 'paragraph', text: 'Disproportionality refers to group differences in specific educational outcomes or in individuals\' risk for those outcomes based on group membership (race, ethnicity, socioeconomic status, language background, etc.). This is not about individual unfairness — it is about systemic patterns that affect entire groups at higher or lower rates than their proportion of the population. The most common example in school psychology is disproportionate representation of minority students in special education, discipline, and gifted programs. NASP considers addressing disproportionality a core social justice obligation.' },
      { type: 'paragraph', text: "Worked example: A district's student population is 20% Black students. If Black students represent 38% of all students placed in restrictive special-education settings, that is overrepresentation — disproportionality. If Black students represent only 7% of the district's gifted program despite being 20% of the student population, that is underrepresentation — also disproportionality. Neither pattern requires any single teacher or administrator to be intentionally racist. The pattern is systemic: it shows up in the data regardless of any individual's conscious intent. The school psychologist's role is to identify these patterns through data, surface them to the team, and advocate for systemic change." },
      { type: 'comparison', leftHeader: 'Disproportionality', rightHeader: 'Related but distinct concepts', rows: [
        { left: 'Group differences in outcomes or risk based on group membership (e.g., race, ethnicity)', right: 'Systemic racism: the structural policies and norms producing those inequitable outcomes' },
        { left: 'Measured as a ratio: group % in a category vs. group % in the population', right: 'Implicit bias: unconscious attitudes affecting individual decisions' },
        { left: 'Applies to special ed placement, discipline, gifted identification', right: 'Socioeconomic status: correlated with disproportionality but not the same concept' },
        { left: 'A NASP social justice obligation to identify, name, and address', right: "Individual discrimination: a single person's prejudiced act; disproportionality is aggregate and systemic" },
      ] },
      { type: 'paragraph', text: "A common exam trap is conflating disproportionality with its causes. Disproportionality is a descriptive, measurable pattern in outcome data — a ratio of a group's share of a category against its share of the population. It is the symptom, not the mechanism. The mechanisms behind it can include systemic racism, implicit bias in referral and discipline decisions, inequitable access to resources, and culturally narrow assessment practices. So a question stem describing 'group differences in special-education placement rates by race' is naming disproportionality, even if the answer choices tempt you toward 'implicit bias' or 'systemic racism.' Those are explanations for why the pattern exists; disproportionality is the pattern itself. Match the descriptive data pattern to disproportionality, and reserve the cause labels for items that ask why the pattern occurs." },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "Disproportionality or a distinct concept?",
        prompt: "Sort each item as a description of disproportionality (a measured group pattern) or a related-but-distinct concept.",
        scenarios: [
          { id: "s1", text: "Black students are 20% of enrollment but 38% of restrictive special-education placements.", category: "Disproportionality" },
          { id: "s2", text: "English learners are 15% of students but only 4% of the gifted program.", category: "Disproportionality" },
          { id: "s3", text: "A teacher's unconscious attitudes lead her to refer one student for discipline more readily.", category: "Related but distinct concept" },
          { id: "s4", text: "Structural policies and norms that produce inequitable outcomes across a system.", category: "Related but distinct concept" },
          { id: "s5", text: "Latino students are suspended at twice their share of the student population.", category: "Disproportionality" },
        ],
        categories: ["Disproportionality", "Related but distinct concept"],
      },
    ],
  },

  {
    id: 'MOD-D5-05',
    primarySkillId: 'SWP-03',
    title: 'Selecting and Monitoring Evidence-Based Schoolwide Practices',
    sections: [
      { type: 'anchor', label: 'The distinction the exam tests', text: 'An evidence-based practice implemented without fidelity is not evidence-based practice. Two different skills are required: selecting a practice with research support, then monitoring that it is being implemented correctly and producing results. Many schools do the first; fewer do the second.' },
      { type: 'paragraph', text: 'A practice qualifies as evidence-based when peer-reviewed research — ideally randomized controlled trials replicated across settings and populations — demonstrates that it produces better outcomes than comparison conditions. Key registries: What Works Clearinghouse (WWC) for academic programs and instructional practices; SAMHSA\'s Evidence-Based Practices Resource Center (which replaced the former NREPP registry in 2018) for mental health and substance use programs; CASEL\'s program guide for social-emotional learning. The right starting question is not "Is this popular?" but "Does rigorous research support this practice for students like ours, with this presenting concern, in a school context?"' },
      { type: 'paragraph', text: 'Using data to SELECT a practice means matching the school\'s assessed need to a registry-supported EBP. Start with data identifying the problem (e.g., suspension data showing disparate rates, or universal screening indicating 30% of students below reading benchmarks), then consult the registry and select the program with the strongest fit for your context and population. Using data to MONITOR a practice means collecting implementation fidelity data (are staff following the protocol?) and outcome data (are student indicators improving?). A program with a strong research base can fail in a specific school if implemented inconsistently — fidelity data catches that early, before it is too late to course-correct.' },
      { type: 'comparison', leftHeader: 'Selecting an EBP', rightHeader: 'Monitoring an EBP', rows: [
        { left: 'Question: "Does rigorous evidence support this for our context?"', right: 'Question: "Are we implementing it correctly, and is it working here?"' },
        { left: 'Data used: needs assessment, registry review, population and setting match', right: 'Data used: fidelity checklists, direct observation, student outcome measures' },
        { left: 'Timing: before adoption', right: 'Timing: ongoing throughout implementation' },
        { left: 'Psychologist\'s role: research consultant, team facilitator, registry guide', right: 'Psychologist\'s role: fidelity monitor, outcome interpreter, data presenter to team' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Applying EBP selection at the systems level',
        prompt: 'A principal asks the school psychologist to recommend a schoolwide anti-bullying program. What should the psychologist do FIRST?',
        options: [
          { id: 'o1', label: 'Recommend the program most widely used in the district', isCorrect: false, explanation: 'Popularity is not evidence. The most-used program may lack rigorous research support, or may not fit this school\'s specific population and bullying patterns.' },
          { id: 'o2', label: 'Assess the school\'s specific bullying patterns and population, then consult the WWC and match the evidence to the school\'s context', isCorrect: true, explanation: 'Correct. Needs assessment first, registry consultation second — this is evidence-based selection at the systems level.' },
          { id: 'o3', label: 'Design a custom school-specific program from scratch', isCorrect: false, explanation: 'Resource-intensive and bypasses the existing evidence base. Established EBPs have a track record; custom programs do not.' },
          { id: 'o4', label: 'Survey teachers about what has worked in their classrooms', isCorrect: false, explanation: 'Teacher input is valuable but is not a substitute for systematic evidence review. Informal impressions cannot establish a practice as evidence-based.' },
        ],
      },
      { type: 'anchor', label: 'When an EBP "doesn\'t work"', text: 'Before concluding that an evidence-based program failed, ask: was it implemented as designed? Fidelity data often reveal that the program was modified, abbreviated, or inconsistently delivered — which explains the failure better than a flaw in the underlying research.' },
    ],
  },

  // ── Domain 6: Preventive & Responsive Services ────────────────────────────

  {
    id: 'MOD-D6-01',
    primarySkillId: 'SAF-04',
    title: 'Crisis Prevention: The Primary Emphasis',
    sections: [
      { type: 'anchor', label: 'The exam framing', text: "When asked what a school should prioritize in its crisis plan, the answer is prevention — not intervention or postvention. 'Prevention is primary' is the phrase to know." },
      { type: 'paragraph', text: "In crisis planning, prevention is the primary focus. The best approach to a crisis is preventing it from happening in the first place — through proactive identification of risk, regular practice of crisis protocols, building protective factors school-wide, and training staff. Intervention describes what happens during an acute crisis; postvention describes what happens in the aftermath (e.g., after a student suicide). All three are necessary, but the emphasis in evidence-based crisis frameworks (PREPaRE, CSTAG) is explicitly on the prevention tier." },
      { type: 'paragraph', text: "Worked example: Eastfield Middle School has not experienced a crisis this year. The principal asks the school psychologist to lead the annual crisis team update. The psychologist schedules staff training on the Standard Response Protocol, reviews threat assessment data from the prior year, updates the list of students with known risk factors, and conducts a full-school practice drill. All of these activities happen before any crisis — they are prevention. If a student were to threaten harm next week, responding to that threat would be intervention." },
      { type: 'comparison', leftHeader: 'Prevention (before crisis)', rightHeader: 'Intervention / Postvention (during/after)', rows: [
        { left: 'Staff training on crisis protocols and threat assessment', right: 'Deploying crisis team; stabilizing the environment during an incident' },
        { left: 'Universal screening for mental health risk; building protective factors school-wide', right: 'Psychological first aid; triage; parent notification during an event' },
        { left: 'Establishing a threat assessment team and clear referral pathways', right: 'Postvention support (counseling, safe messaging) after a suicide or tragedy' },
        { left: 'Practicing drills; identifying high-risk students proactively', right: 'Reunification procedures; coordinating with law enforcement during lockdown' },
      ] },
      { type: 'anchor', label: 'Standard Response Protocol (SRP)', text: "The SRP provides schools with common language for crisis situations. The SRP components are: Hold, Secure, Lockdown, Evacuate, Shelter. Note: 'Escape' is NOT an SRP term. This is a specific exam target." },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "Prevention or response?",
        prompt: "Sort each crisis-team activity by when it occurs in the crisis-management cycle.",
        scenarios: [
          { id: "s1", text: "Training all staff on crisis protocols and threat assessment before the school year.", category: "Prevention (before a crisis)" },
          { id: "s2", text: "Universal mental-health screening to identify high-risk students proactively.", category: "Prevention (before a crisis)" },
          { id: "s3", text: "Running a full-school practice drill of the Standard Response Protocol.", category: "Prevention (before a crisis)" },
          { id: "s4", text: "Deploying the crisis team and providing psychological first aid during an active incident.", category: "Intervention or postvention (during or after)" },
          { id: "s5", text: "Offering counseling and safe-messaging support to students after a peer's suicide.", category: "Intervention or postvention (during or after)" },
        ],
        categories: ["Prevention (before a crisis)", "Intervention or postvention (during or after)"],
      },
    ],
  },

  {
    id: 'MOD-D6-02',
    primarySkillId: 'SAF-04',
    title: 'Suicide Contagion: The First Priority After a Student Death',
    sections: [
      { type: 'anchor', label: 'First priority = contagion prevention', text: 'After a student suicide, the FIRST action is briefing key staff on contagion risk and identifying vulnerable students — not making a school-wide announcement. A school-wide assembly is contraindicated.' },
      { type: 'paragraph', text: 'When a student dies by suicide, the immediate priority for school staff is planning to prevent contagion effects — the risk that other vulnerable students may be influenced toward suicidal behavior by exposure to news of the death. Before making announcements or providing direct support to classmates, key staff must be briefed to identify at-risk students. A school-wide assembly about the suicide is strongly contraindicated: it glamorizes the event, increases exposure for sensitive students, and can inadvertently increase contagion risk. Instead, targeted support spaces and individual counseling are provided to students who are identified as potentially at-risk.' },
      { type: 'paragraph', text: "Worked example: On a Monday morning, the school learns that a 10th-grade student died by suicide over the weekend. The principal's first instinct is to call an all-school assembly to announce the news and offer support. The school psychologist advises against this. Instead: the crisis team convenes before the school day begins; they identify students who were close to the deceased, students with known mental health risk factors, and students who are visibly distressed; they designate a quiet counseling room with trained staff; they prepare a brief factual statement to be read by homeroom teachers (not over the intercom); and they contact the student's family. The school does not share the method of suicide, does not hold a large memorial assembly, and does not post about the student on the school's social media. These safe-messaging practices reduce contagion risk." },
      { type: 'comparison', leftHeader: 'Safe Messaging (Do)', rightHeader: 'Contraindicated Practices (Do NOT)', rows: [
        { left: 'Brief key staff first; identify at-risk students before the school day', right: 'Hold a school-wide assembly that exposes all students simultaneously' },
        { left: 'Provide a quiet, staffed counseling space for identified students', right: 'Announce details over the intercom to the full school population' },
        { left: 'Release a factual, neutral statement through teachers (no method details)', right: 'Share method, location, or details that could enable imitation' },
        { left: 'Contact the student\'s family; coordinate with mental health providers', right: 'Create social media posts or memorials that glamorize or romanticize the death' },
      ] },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "Safe response or contraindicated?",
        prompt: "After a student dies by suicide, sort each action into safe messaging or a contraindicated practice that raises contagion risk.",
        scenarios: [
          { id: "s1", text: "Brief the crisis team and key staff before the school day to identify at-risk students", category: "Safe Messaging" },
          { id: "s2", text: "Hold a school-wide assembly to announce the death and offer support to everyone at once", category: "Contraindicated" },
          { id: "s3", text: "Provide a quiet, staffed counseling room for students who are identified as vulnerable", category: "Safe Messaging" },
          { id: "s4", text: "Read a brief, factual statement through homeroom teachers without naming the method", category: "Safe Messaging" },
          { id: "s5", text: "Announce the details, including how the student died, over the school intercom", category: "Contraindicated" },
          { id: "s6", text: "Post a memorial tribute about the student on the school's social media accounts", category: "Contraindicated" },
        ],
        categories: ["Safe Messaging", "Contraindicated"],
      },
    ],
  },

  {
    id: 'MOD-D6-03',
    primarySkillId: 'SAF-03',
    title: 'Threat Assessment: Duty to Warn',
    sections: [
      { type: 'paragraph', text: 'When a student makes a specific, credible threat of violence against an identifiable person or group, the school psychologist has a legal and ethical duty to warn — to notify the administration AND the parents of the students who have been threatened. This duty overrides general confidentiality.' },
      { type: 'paragraph', text: 'A vague complaint about a classmate is different from a specific threat naming a person, a place, and an intent. The duty to warn applies to specific, credible threats. The first step is always to notify administration and the potential victims\' parents.' },
      { type: 'paragraph', text: 'This duty traces to Tarasoff v. Regents of the University of California (1976), which established a duty to protect identifiable potential victims when a client poses a serious danger. In schools, threat assessment is a structured, multidisciplinary process — not zero-tolerance profiling. Its goal is to distinguish a transient outburst from a substantive, credible threat and to act proportionately.' },
      { type: 'comparison', leftHeader: 'Transient / low-concern threat', rightHeader: 'Substantive / credible threat', rows: [{ left: 'Vague expression of anger or frustration ("I could scream")', right: 'Specific, identifiable target named' }, { left: 'No identifiable target, plan, or means', right: 'A plan, a time/place, and access to means' }, { left: 'Easily resolved; intent is to vent, not to harm', right: 'Stated or implied intent to carry it out' }, { left: 'Response: address the underlying issue; monitor', right: 'Response: duty to warn — notify administration and the potential victim(s)/their parents; create a safety plan' }] },
      {
        type: 'interactive',
        interactiveType: 'scenario-sorter',
        label: 'Warn or monitor?',
        prompt: 'Sort each statement by whether it triggers the duty to warn.',
        scenarios: [
          { id: 's1', text: '"I\'m going to bring my dad\'s gun and shoot Mr. Lopez tomorrow."', category: 'WARN' },
          { id: 's2', text: '"I hate this school, everyone here is the worst."', category: 'MONITOR' },
          { id: 's3', text: 'A student writes a detailed note naming a classmate and a time to "make them pay."', category: 'WARN' },
          { id: 's4', text: '"This homework is killing me, I could just scream."', category: 'MONITOR' },
          { id: 's5', text: 'A student tells a peer a specific plan to harm an identified teacher and has access to the means.', category: 'WARN' },
          { id: 's6', text: 'A student vents that a former friend is "so annoying lately."', category: 'MONITOR' },
        ],
        categories: ['WARN (duty to warn triggered)', 'MONITOR (no specific, credible threat)'],
      },
      { type: 'anchor', label: 'Memory anchor (Tarasoff)', text: 'When a threat is specific, credible, and targeted, the duty to warn overrides confidentiality. Notify administration and the potential victim — and their parents if the victim is a minor — and never leave a credible threat unmanaged.' },
    ],
  },

  {
    id: 'MOD-D6-04',
    primarySkillId: 'SAF-01',
    title: 'Bullying Intervention: Restorative Practices Over Zero Tolerance',
    sections: [
      { type: 'anchor', label: 'The NASP position on zero tolerance', text: "NASP explicitly does NOT endorse zero-tolerance policies for bullying. On the exam, if an answer choice mentions 'automatic suspension,' 'no exceptions,' or 'strict punitive consequences regardless of context' — eliminate it." },
      { type: 'paragraph', text: "Zero-tolerance policies for bullying — automatic suspension, expulsion, or severe punishment regardless of context — are not endorsed by NASP and are not effective in reducing bullying. They create disparate impact on minority students and students with disabilities, remove students from the school environment where skill-building can occur, and do not address the underlying dynamics that allow bullying to persist." },
      { type: 'paragraph', text: "Worked example: Three boys in 6th grade have been repeatedly excluding and verbally taunting a fourth student for three weeks. The principal suggests suspending the three for a week with no discussion. The school psychologist recommends a restorative approach instead: a facilitated conference where the boys hear directly from the affected student about the impact of their behavior, then make specific amends (an apology letter, restitution of a damaged item). The school psychologist also conducts a bystander education session with the class, since 8 students watched without intervening, and works with the counselor to build the targeted student's social competencies. Suspension may still occur, but it is not the entire response." },
      { type: 'comparison', leftHeader: 'Zero-Tolerance Approach', rightHeader: 'Restorative / Systemic Approach', rows: [
        { left: 'Automatic suspension or expulsion; same consequence regardless of context or history', right: 'Facilitated restorative conference; holds students accountable while building skills' },
        { left: 'Focuses only on punishing the aggressor', right: 'Addresses aggressor, target, bystanders, and school climate simultaneously' },
        { left: 'Does not address the reason bullying occurred or the skills needed to prevent recurrence', right: 'Teaches empathy, perspective-taking, and conflict resolution to all parties' },
        { left: 'Disproportionately impacts minority students and students with disabilities', right: 'Equitable response; considers context and individual circumstances' },
      ] },
      { type: 'anchor', label: 'What effective anti-bullying programs include (and exclude)', text: 'Include: widespread supervision, bystander behavior programs, restorative practices, social skills building. Do NOT include: zero-tolerance policies, strict punitive-only consequences. This is a specific exam target.' },
      { type: 'paragraph', text: "Worked example: A high school adopts an automatic three-day suspension for any student involved in a bullying incident, applied identically regardless of circumstances. Within a semester, suspension data show Black students and students with IEPs are removed at two to three times the rate of peers, yet self-reported bullying has not declined. A consulting school psychologist reframes the goal from punishment to prevention. She recommends layered supports drawn from evidence-based programs: increased adult supervision in unstructured settings such as hallways, the cafeteria, and buses; bystander-empowerment lessons that teach the silent majority to intervene or report; restorative conferences that hold aggressors accountable while repairing harm; and explicit social-emotional skill instruction. The exam trap is treating the harshest consequence as the safest answer. Effective anti-bullying practice is systemic and skill-building, not zero-tolerance, because removal alone leaves the climate and the underlying dynamics unchanged." },
      {
        type: 'interactive',
        interactiveType: "click-selector",
        label: "Best first response to bullying",
        prompt: "A pattern of relational bullying is confirmed in a 6th-grade class. Which response best reflects the NASP-endorsed approach?",
        options: [
          { id: "o1", label: "Automatically suspend each aggressor for a week with no further discussion", explanation: "Incorrect. Zero-tolerance, punishment-only responses are not endorsed by NASP and do not reduce bullying." },
          { id: "o2", label: "Use a facilitated restorative conference plus bystander education and skill-building, with consequences applied in context", explanation: "Correct. This systemic, restorative approach holds aggressors accountable while addressing targets, bystanders, and climate.", isCorrect: true },
          { id: "o3", label: "Move the targeted student to a different class to end the contact", explanation: "Incorrect. This penalizes the victim and leaves the aggressors' behavior and the class climate unaddressed." },
          { id: "o4", label: "Wait to see whether the behavior stops on its own before intervening", explanation: "Incorrect. Confirmed bullying requires an active, structured response; passive monitoring allows harm to continue." },
        ],
      },
    ],
  },

  // ── Domain 7: Family-School Collaboration Services ────────────────────────

  {
    id: 'MOD-D7-01',
    primarySkillId: 'FAM-02',
    title: 'Starting Family Collaboration: Understand Values First',
    sections: [
      { type: 'anchor', label: 'The first-step trap', text: "Exam questions may offer 'schedule a meeting' or 'send home information' as the first step to collaboration. Both are wrong. Understanding the family's values and perceptions comes first — logistics and programs follow trust." },
      { type: 'paragraph', text: "When a school psychologist sets out to build collaborative relationships with families from diverse cultural backgrounds, the most important starting point is not logistics (schedules, contact methods) — it is understanding the family's values and their perceptions of the school-family relationship. Many families, particularly from minority and immigrant communities, have historical reasons to distrust institutions. A family may feel that school professionals are judges, not partners. Meeting logistics are irrelevant if the family does not feel respected, heard, or valued." },
      { type: 'paragraph', text: "Worked example: A school psychologist is beginning a new initiative to increase family engagement for Spanish-speaking families. The first thing she does is NOT print flyers or set up a schedule — it is to meet informally with several parents, listen to their experiences with the school, and ask what they most want for their children. She learns that many families feel unwelcome because meetings are entirely in English and held during working hours. Armed with this understanding, she redesigns the program with a bilingual community liaison, evening meeting options, and an agenda that centers family input rather than school announcements." },
      { type: 'comparison', leftHeader: 'Logistics-First Approach (Less Effective)', rightHeader: 'Values-First Approach (Research-Supported)', rows: [
        { left: 'Schedule meetings → wait to see who shows up → wonder why attendance is low', right: 'Ask families what meeting formats, times, and languages work for them before scheduling anything' },
        { left: 'Inform families about school programs; treat them as recipients of information', right: 'Ask families what they want for their child; treat them as partners in defining goals' },
        { left: 'Attribute low engagement to lack of family interest or motivation', right: 'Investigate structural and cultural barriers (language, work schedules, prior negative experiences)' },
        { left: 'Use standard school forms and procedures uniformly regardless of family background', right: 'Adapt communication style, cultural framing, and meeting format to each family\'s context' },
      ] },
      { type: 'anchor', label: 'The core trio for family-school collaboration', text: 'Sensitivity • Trust • Respect. These three qualities are the research-identified foundation of effective home-school collaboration across all cultural contexts.' },
      { type: 'paragraph', text: "Worked example: A school psychologist notices that families from a recently arrived refugee community almost never attend conferences, and a colleague concludes the parents 'don't care about education.' Applying a values-first lens, the psychologist instead investigates structural and cultural barriers. Through a trusted community liaison, she learns that written notices arrive in a language families cannot read, that the formal conference format feels intimidating and one-directional, and that prior school contact has only ever come when a child was in trouble — so a call from school signals shame, not partnership. She shifts the entry point from logistics to relationship: home-language outreach, an informal listening session that centers what parents hope for their children, and a first contact that is positive rather than problem-driven. The exam principle is that low engagement should be read as a barrier to investigate, not a deficit in family motivation. Sensitivity, trust, and respect precede scheduling." },
      {
        type: 'interactive',
        interactiveType: "click-selector",
        label: "The right first step",
        prompt: "A school psychologist is launching an initiative to build collaborative relationships with culturally diverse families. What is the most appropriate first step?",
        options: [
          { id: "o1", label: "Send home a detailed flyer describing the school's programs and meeting calendar", explanation: "Incorrect. Distributing information treats families as recipients and skips building the trust collaboration depends on." },
          { id: "o2", label: "Schedule a series of evening meetings and track which families attend", explanation: "Incorrect. Logistics-first planning is premature; format and timing should follow what you learn from families." },
          { id: "o3", label: "Listen to families about their values, prior experiences, and what they want for their children", explanation: "Correct. Understanding family values and perceptions builds the trust and respect that effective collaboration requires.", isCorrect: true },
          { id: "o4", label: "Adopt a standard engagement protocol used successfully at another school", explanation: "Incorrect. Uniform procedures ignore each community's context; approaches must be adapted to the families being served." },
        ],
      },
    ],
  },

  {
    id: 'MOD-D7-02',
    primarySkillId: 'FAM-02',
    title: 'Mandated Reporting: Your Personal Duty Cannot Be Delegated',
    sections: [
      { type: 'anchor', label: 'The non-delegable duty', text: 'Mandated reporting is PERSONAL. Telling the principal or school social worker does NOT discharge your legal obligation. You must personally ensure a report reaches police or CPS. Reasonable suspicion is enough — you do not investigate.' },
      { type: 'paragraph', text: 'As a school psychologist, you are a mandated reporter. When you have reasonable suspicion of child abuse or neglect, you have a personal, non-delegable legal duty to report to police or child protective services (social services). Telling the principal or the school social worker is not sufficient to discharge your legal obligation. You do not need proof — reasonable suspicion is enough. You do not need to investigate — that is the job of child protective services. You report; investigators investigate.' },
      { type: 'paragraph', text: "Worked example: During a counseling session, an 8-year-old student shows the school psychologist unexplained bruising on her arm and says her stepfather hit her with a belt. The psychologist immediately notifies the principal — who says she will handle it. Is the psychologist's legal duty fulfilled? No. The psychologist must personally call CPS and/or the police to report the suspected abuse. If the principal follows through and reports, the duty may be satisfied — but the psychologist cannot assume that without confirming. Best practice: the psychologist makes the report directly, informs the principal that a report was made, and documents the date, time, agency name, and report number. Many practitioners err by stopping at the principal's office and trusting the chain of command. The law does not share that trust: the duty is yours personally." },
      { type: 'comparison', leftHeader: 'Mandated Reporting', rightHeader: 'What it is NOT', rows: [
        { left: 'A personal, non-delegable legal duty', right: 'A duty that transfers to your supervisor or principal when you tell them' },
        { left: 'Triggered by reasonable suspicion — no proof required', right: 'Dependent on certainty, investigation, or confirmation from multiple sources' },
        { left: 'Report goes to police or CPS directly', right: 'Satisfied by telling a colleague, social worker, or administrator' },
        { left: 'The psychologist documents the report: date, agency, report number', right: 'Optional or informal — documentation matters both legally and professionally' },
      ] },
      { type: 'paragraph', text: "Worked example: A 6th grader tells the school psychologist, 'Don't tell anyone, but my dad locks me out of the house at night and I sleep on the porch.' The psychologist feels uncertain — the child has no visible injuries, and she wonders whether to gather more facts first. The mandated-reporting standard resolves the uncertainty: the trigger is reasonable suspicion, not proof, and the duty is to report, not to investigate. She does not interview the father, search for corroboration, or wait for a second incident, because fact-finding is the role of child protective services. She also does not satisfy the duty by emailing the counselor to 'loop them in.' Instead she personally contacts CPS, makes the report, and records the date, time, agency, and report number. The exam trap is choosing an answer that delays the report to gather evidence — collecting proof first is exactly what a mandated reporter must not do." },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "Does this discharge the duty?",
        prompt: "A school psychologist has reasonable suspicion of abuse. Sort each action by whether it satisfies the personal mandated-reporting duty.",
        scenarios: [
          { id: "s1", text: "Personally call CPS or police and make the report directly", category: "Satisfies the duty" },
          { id: "s2", text: "Tell the principal and assume she will handle the report", category: "Does NOT satisfy the duty" },
          { id: "s3", text: "Document the date, agency, and report number after reporting", category: "Satisfies the duty" },
          { id: "s4", text: "Ask the school social worker to file the report on your behalf and consider it done", category: "Does NOT satisfy the duty" },
          { id: "s5", text: "Wait to interview the family and gather proof before contacting CPS", category: "Does NOT satisfy the duty" },
        ],
        categories: ["Satisfies the duty", "Does NOT satisfy the duty"],
      },
    ],
  },

  // ── Domain 8: Diversity in Development & Learning ────────────────────────

  {
    id: 'MOD-D8-01',
    primarySkillId: 'PSY-04',
    title: 'Testing ELL and Diverse Students: Caution and Cultural Humility',
    sections: [
      { type: 'anchor', label: 'Core assessment principles', text: "Use both formal AND informal measures. Never make high-stakes decisions from a single test. For ELL students: supplement with nonverbal tests, use interpreters fluent in both languages, consider language history and developmental context." },
      { type: 'paragraph', text: 'When assessing students from diverse cultural backgrounds, standardized tests may underrepresent their true abilities due to cultural loading in test content, language demands, and norming samples that may not reflect the student\'s background. The correct approach is not to refuse to use standardized tests entirely — it is to interpret results cautiously and to supplement formal measures with informal, culturally responsive data. Use both formal and informal measures, use assessments normed on appropriate populations when available, and never make high-stakes decisions based on a single test score.' },
      { type: 'paragraph', text: "Worked example: A school psychologist is asked to evaluate Mei-Lin, a 9-year-old who immigrated from China two years ago and is now in 3rd grade. Teachers report she struggles academically. The psychologist cannot simply administer the standard WISC in English and interpret the scores at face value: Mei-Lin's English proficiency may confound the results, making cognitive scores an artifact of language acquisition rather than true cognitive ability. The evaluation plan should include: a nonverbal cognitive measure (e.g., UNIT) to assess intellectual functioning with minimal language demands; an English language proficiency assessment to understand where she is in second-language acquisition; a teacher interview gathering functional observations in both academic and social settings; and a parent interview (with an interpreter who is fluent in Mandarin, not just a bilingual aide) to gather developmental, school, and home-language history. The resulting report interprets test scores in the context of language acquisition and cultural background, and avoids conclusions about intellectual disability based solely on performance on a language-loaded English-language instrument." },
      { type: 'comparison', leftHeader: 'Appropriate practice', rightHeader: 'Inappropriate practice', rows: [
        { left: 'Multiple data sources: formal + informal + teacher + parent', right: 'Single standardized test score used as the primary basis for placement or diagnosis' },
        { left: 'Nonverbal cognitive measures as supplements for ELL students', right: 'Standard verbal WISC administered and interpreted without accounting for language proficiency' },
        { left: 'Interpreter fluent in the student\'s home language and English', right: 'Bilingual classroom aide used as an informal interpreter during testing' },
        { left: 'Scores interpreted in the context of language development and cultural background', right: 'Scores compared to norms without considering that the student may not resemble the norming sample' },
      ] },
      { type: 'paragraph', text: "Exam trap: the wrong answer choice is almost always the extreme position — either administering a standard English-language IQ test as if language were irrelevant, OR refusing to use any standardized testing at all because the student is an English language learner. Both extremes are incorrect. Federal law (IDEA) requires that assessments be administered in the student's native language or other mode of communication most likely to yield accurate information, and that no single measure be used to determine eligibility. The defensible position is selective, supplemented, and cautiously interpreted assessment. Watch also for the distractor that uses a bilingual classroom aide or a family member as the interpreter — IDEA and best practice require a trained interpreter fluent in both languages, because untrained interpreters introduce error, paraphrase clinical items, and create confidentiality and consent problems that can invalidate the entire evaluation." },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "Sort the practice",
        prompt: "For an English language learner referred for evaluation, sort each practice as culturally responsive or a problematic practice.",
        scenarios: [
          { id: "s1", text: "Adding a nonverbal cognitive measure (e.g., UNIT) to reduce language demands on the cognitive estimate", category: "Culturally responsive practice" },
          { id: "s2", text: "Gathering teacher observations and parent developmental history through a trained interpreter", category: "Culturally responsive practice" },
          { id: "s3", text: "Assessing English language proficiency to interpret cognitive scores in context", category: "Culturally responsive practice" },
          { id: "s4", text: "Administering the standard English WISC and interpreting Full Scale IQ at face value", category: "Problematic practice" },
          { id: "s5", text: "Using a single standardized score as the primary basis for a special-education placement", category: "Problematic practice" },
          { id: "s6", text: "Asking a bilingual classroom aide to informally interpret during testing", category: "Problematic practice" },
        ],
        categories: ["Culturally responsive practice", "Problematic practice"],
      },
    ],
  },

  {
    id: 'MOD-D8-02',
    primarySkillId: 'DBD-03',
    title: 'The Universal Nonverbal Intelligence Test (UNIT) for Special Populations',
    sections: [
      { type: 'anchor', label: 'The instrument of choice', text: "For deaf, hard-of-hearing, or non-English-speaking students: UNIT (or Leiter) is the appropriate primary cognitive tool. The WISC administered 'with an interpreter' still confounds language ability with intelligence — using it as the primary measure risks an invalid and discriminatory evaluation." },
      { type: 'paragraph', text: 'When assessing a student who is deaf, hard of hearing, or a non-English speaker, standard verbal cognitive batteries are inappropriate as primary tools because they conflate language ability with intelligence. The Universal Nonverbal Intelligence Test (UNIT) was designed specifically for these populations. The UNIT uses entirely nonverbal administration — no oral language is required for either instructions or responses — and is normed on diverse populations including students with hearing impairments and language differences. When combined with other measures, it provides the most valid cognitive assessment for students who cannot be fairly assessed with verbal-heavy batteries.' },
      { type: 'paragraph', text: "Worked example: Kenji is a 7-year-old who was born deaf and uses American Sign Language as his primary language. He has been referred for a cognitive evaluation because his academic progress in a school-for-the-deaf setting has been significantly below his grade-level cohort. The school psychologist selects the UNIT as the primary cognitive measure — it requires no spoken language for instructions or responses, and its norms include children with hearing impairments. Using the WISC as the primary measure, even with a sign interpreter, would confound two things: Kenji's cognitive processing ability and his specific ASL vocabulary and linguistic conventions, which differ from spoken English. The UNIT separates those factors out. Additional measures include teacher rating scales, portfolio samples, and observations — all interpreted in the context of Kenji's language background and educational history." },
      { type: 'comparison', leftHeader: 'Appropriate primary tools for deaf / ELL students', rightHeader: 'Less appropriate as the primary cognitive tool', rows: [
        { left: 'Universal Nonverbal Intelligence Test (UNIT)', right: 'WISC with an interpreter (language still confounds results)' },
        { left: 'Leiter International Performance Scale (nonverbal, cross-cultural)', right: 'Stanford-Binet (highly verbally loaded)' },
        { left: 'Nonverbal Index of the DAS-II or RIAS-2', right: 'Standard WISC Full Scale IQ as the sole data point' },
        { left: 'Combined with informal, teacher, and parent data in a comprehensive evaluation', right: 'Any single test score without contextual interpretation' },
      ] },
      { type: 'paragraph', text: "Mechanism: why does a verbal IQ test confound language with intelligence for a deaf or non-English-speaking student? Verbal subtests assume the student receives the instructions and produces responses in the test's language; any limitation in that language lowers the score even when reasoning ability is intact. The score then reflects a mixture of two constructs — reasoning and language — and you cannot separate them after the fact. Nonverbal instruments like the UNIT break this confound by delivering instructions through gestures, demonstration, and pantomime and by requiring pointing or manipulative responses rather than speech. Exam trap: an answer that says 'administer the WISC with an interpreter' sounds accommodating but is wrong as a primary measure, because an interpreter cannot remove the verbal loading built into the subtests themselves — it only translates it." },
      {
        type: 'interactive',
        interactiveType: "click-selector",
        label: "Choose the primary tool",
        prompt: "A 7-year-old who is deaf and uses ASL is referred for a cognitive evaluation. Which is the most appropriate PRIMARY cognitive measure?",
        options: [
          { id: "o1", label: "Universal Nonverbal Intelligence Test (UNIT)", explanation: "Correct. The UNIT requires no spoken language for instructions or responses and is normed to include students with hearing impairments, separating reasoning from language.", isCorrect: true },
          { id: "o2", label: "Standard WISC administered with a sign-language interpreter", explanation: "An interpreter cannot remove the verbal loading built into the subtests; the score still confounds ASL/English language with reasoning ability." },
          { id: "o3", label: "Stanford-Binet Full Scale", explanation: "Highly verbally loaded; inappropriate as the primary measure for a student who cannot be fairly assessed with language-heavy batteries." },
          { id: "o4", label: "No cognitive testing — rely only on the teacher's impression", explanation: "A valid nonverbal cognitive estimate is both possible and required; refusing to assess is the opposite extreme error." },
        ],
      },
    ],
  },

  {
    id: 'MOD-D8-03',
    primarySkillId: 'PSY-04',
    title: 'Systemic Racism and Disproportionality: Know the Vocabulary',
    sections: [
      { type: 'anchor', label: 'Exam vocabulary map', text: "School-based injustice or structural inequity → systemic racism. Unequal group outcomes in special ed or discipline → disproportionality. Unconscious attitudes affecting behavior → implicit bias. Deliberate prejudice → explicit bias. Precise definitions are tested." },
      { type: 'paragraph', text: 'NASP and the broader school psychology field use specific terminology to discuss equity and justice. These terms appear on the exam with their precise meanings: Systemic racism — structural and institutional policies, practices, and norms that produce racially inequitable outcomes, regardless of individual intent. Disproportionality — group differences in educational outcomes or risk levels based on group membership; the most studied form is the overrepresentation of Black and Indigenous students in special education and school discipline. Implicit bias — unconscious attitudes or stereotypes that affect decisions and behaviors without conscious awareness. Explicit bias — conscious and deliberate prejudice. These terms are not interchangeable: a system can produce racially inequitable outcomes (systemic racism) without any individual holding conscious prejudice (explicit bias).' },
      { type: 'paragraph', text: "Worked example: A school psychologist reviews suspension data and finds that Black male students are suspended at 3 times the rate of white students for the same category of offense — even though individual teachers report trying to be fair to all students. This pattern reflects systemic racism (a structural outcome) and disproportionality (group differences in disciplinary outcomes based on race). It is not primarily a story of explicit bias — there is no evidence the teachers are consciously trying to discriminate. It may involve implicit bias — unconscious associations that subtly affect how behavior is perceived and labeled. The school psychologist's role is to name these patterns accurately using the right vocabulary, present the data to the team, and recommend systemic interventions (restorative practices, staff training on implicit bias, examination of school-wide policies)." },
      { type: 'comparison', leftHeader: 'Term', rightHeader: 'Precise definition and exam cue', rows: [
        { left: 'Systemic racism', right: 'Structural policies and norms that produce racial inequity — regardless of individual intent; cue: "injustice," "structural," "institutional"' },
        { left: 'Disproportionality', right: 'Group differences in outcomes or risk based on group membership; cue: unequal special-ed, discipline, or gifted rates across racial/ethnic groups' },
        { left: 'Implicit bias', right: 'Unconscious attitudes affecting behavior without awareness; cue: "unintentional," "automatic," "without knowing"' },
        { left: 'Explicit bias', right: 'Conscious, deliberate prejudice; cue: intentional discrimination, overt statements of prejudice' },
      ] },
      { type: 'paragraph', text: "High-yield distinction: disproportionality is the observable pattern (the unequal rates), while systemic racism and bias are competing explanations for why the pattern exists. The exam rewards keeping these separate. A second precise pair to know is disproportionality versus disproportionate representation — both describe unequal group outcomes; you will also see 'overrepresentation' (a group appears in a category more than its share of the population, e.g., Black students in emotional-disturbance eligibility) and 'underrepresentation' (a group appears less than its share, e.g., in gifted programs). Another trap is mistaking a disparate outcome for proof of explicit, intentional bias. Because systemic racism produces inequitable results without requiring any individual to hold conscious prejudice, the correct answer to 'no one here is intentionally discriminating, yet outcomes are unequal' is systemic racism plus possible implicit bias — not explicit bias." },
      {
        type: 'interactive',
        interactiveType: "term-matcher",
        label: "Match the term",
        prompt: "Match each equity term to its precise definition.",
        pairs: [
          { term: "Systemic racism", definition: "Structural policies, practices, and norms that produce racially inequitable outcomes regardless of individual intent" },
          { term: "Disproportionality", definition: "Group differences in educational outcomes or risk (e.g., special-education or discipline rates) based on group membership" },
          { term: "Implicit bias", definition: "Unconscious attitudes or stereotypes that affect decisions and behavior without conscious awareness" },
          { term: "Explicit bias", definition: "Conscious, deliberate prejudice expressed through intentional discrimination" },
          { term: "Overrepresentation", definition: "A group appearing in a category more than its share of the overall population" },
        ],
      },
    ],
  },

  {
    id: 'MOD-D8-04',
    primarySkillId: 'DIV-05',
    title: 'Intellectual Disability Evaluation: WISC + Vineland Required',
    sections: [
      { type: 'anchor', label: 'The two-domain requirement', text: 'ID diagnosis requires significant deficits in BOTH intellectual functioning (e.g., WISC) AND adaptive behavior (e.g., Vineland). Low IQ alone is not sufficient. Adaptive deficits alone are not sufficient. Both must be present.' },
      { type: 'paragraph', text: 'To identify an intellectual disability, school psychologists must gather two types of formal data: a cognitive assessment (measuring intellectual functioning) AND an adaptive behavior assessment (measuring practical, real-world functioning). Both domains must show significant deficits. The most common assessment pairing is the WISC (cognitive) and the Vineland Adaptive Behavior Scales (adaptive functioning). The threshold for intellectual disability is typically a standard score about 2 standard deviations below the mean on both instruments — approximately SS 70 or below on cognitive measures (interpreted with a confidence band and clinical judgment, not as a rigid cutoff), with corresponding adaptive deficits.' },
      { type: 'paragraph', text: "Worked example: A school psychologist evaluates a 9-year-old referred for possible intellectual disability. The WISC Full Scale IQ is 65 (more than 2 SD below the mean of 100). The Vineland-3 Adaptive Behavior Composite is 85 — within normal limits. This student does NOT meet the criteria for intellectual disability: cognitive functioning is significantly impaired, but adaptive behavior is not. The psychologist considers other explanations: learning disability, specific cognitive profile, or language or environmental factors. Now reverse the picture: if the Vineland composite is 62 and the WISC is 105, that is also not ID. Adaptive deficits with intact cognitive ability point toward autism, trauma, or another diagnosis entirely." },
      { type: 'comparison', leftHeader: 'Score pattern', rightHeader: 'Interpretation', rows: [
        { left: 'WISC FSIQ ≤ 69 AND Vineland ≤ 69 (both ≥ 2 SD below mean)', right: 'Meets criteria for ID — both required domains show significant deficits' },
        { left: 'WISC FSIQ ≤ 69, Vineland within normal limits', right: 'Does NOT meet ID criteria — explore LD, cognitive processing disorder, or environmental factors' },
        { left: 'WISC FSIQ within normal limits, Vineland ≤ 69', right: 'Does NOT meet ID criteria — consider autism, trauma, or other adaptive impairment etiology' },
        { left: 'Both scores borderline (70–75 range)', right: 'Clinical judgment required — look at confidence intervals, all composites, and real-world functioning' },
      ] },
      { type: 'paragraph', text: "A third required element is often tested alongside the two-domain rule: onset during the developmental period (before age 18). All three must be present for intellectual disability — significant deficits in intellectual functioning, significant deficits in adaptive behavior, and onset during childhood. This is why an adult who acquires cognitive and adaptive impairment from a traumatic brain injury at age 30 is not classified as having an intellectual disability. Exam trap: do not treat the IQ cutoff as a hard line. A Full Scale IQ is reported with a confidence interval and standard error of measurement, so a score of 72 with adaptive deficits and clear developmental onset can still support ID through clinical judgment, while a rigid 'IQ must be 70 or below' answer choice is usually the distractor. Adaptive behavior should also be measured across conceptual, social, and practical domains, not a single global impression." },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "Meets ID criteria?",
        prompt: "Using the two-domain rule (significant deficits in BOTH intellectual functioning AND adaptive behavior), sort each score pattern.",
        scenarios: [
          { id: "s1", text: "WISC FSIQ 66 and Vineland Adaptive Behavior Composite 64, with developmental onset", category: "Meets ID criteria" },
          { id: "s2", text: "WISC FSIQ 68 and Vineland composite 67, deficits present since early childhood", category: "Meets ID criteria" },
          { id: "s3", text: "WISC FSIQ 65 but Vineland composite 85 (within normal limits)", category: "Does NOT meet ID criteria" },
          { id: "s4", text: "WISC FSIQ 105 but Vineland composite 62", category: "Does NOT meet ID criteria" },
          { id: "s5", text: "WISC FSIQ 90 and Vineland composite 92, both within normal limits", category: "Does NOT meet ID criteria" },
        ],
        categories: ["Meets ID criteria", "Does NOT meet ID criteria"],
      },
    ],
  },

  {
    id: 'MOD-D8-05',
    primarySkillId: 'DIV-01',
    title: 'Designing Interventions That Fit the Student\'s Culture and Community',
    sections: [
      { type: 'anchor', label: 'The mistake that looks like evidence-based practice', text: 'An EBP validated primarily on White, middle-class, English-speaking populations is not automatically evidence-based for a student from a different cultural community. Selecting a program without considering cultural fit, then attributing lack of progress to the student, is a common and consequential error.' },
      { type: 'paragraph', text: 'Cultural factors in intervention design involve more than translating materials. Effective cultural adaptation means intentionally modifying the delivery, framing, metaphors, examples, and relational style of an intervention to fit the student\'s cultural world — while preserving the core mechanisms that make the EBP work. In CBT, for example, the mechanism (identifying and restructuring unhelpful cognitions) stays intact; what changes is how it is introduced, which cultural scenarios are used as examples, and how the family\'s role is integrated. Stripping out the core mechanism to seem more culturally comfortable undermines the evidence base; ignoring cultural fit undermines engagement and generalization. The goal is cultural adaptation, not cultural abandonment.' },
      { type: 'paragraph', text: 'Community liaisons are a distinct and often underused resource. A community liaison is a trusted bridge between the school system and a specific cultural community — a person who holds the community\'s trust and understands both the school\'s systems and the community\'s values, norms, help-seeking patterns, and history with institutions. A liaison is not a translator. A translator converts language; a liaison converts meaning — explaining why a family may be skeptical of mental health labels, what forms of support are culturally acceptable or stigmatizing, who the appropriate decision-maker is in the family or community structure, and how the school can build credibility. Liaisons are especially valuable when systemic mistrust between a community and public institutions runs deep.' },
      { type: 'comparison', leftHeader: 'Culture-Blind Approach', rightHeader: 'Culturally Responsive Approach', rows: [
        { left: '"We treat all students the same" — ignores structural and cultural differences in access and fit', right: 'Assesses cultural fit; adapts delivery while preserving evidence-based mechanisms' },
        { left: 'Family treated as recipient of decisions; consent as a procedural checkbox', right: 'Family engaged as a design partner; values and community strengths actively incorporated' },
        { left: 'Lack of engagement attributed to the student or family', right: 'Lack of engagement investigated as a potential fit, trust, or relevance problem' },
        { left: 'Community liaison absent or used only for language translation', right: 'Community liaison consulted as a bridge: meaning, stigma, cultural decision-making, trust-building' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Culturally responsive next step',
        prompt: 'A school psychologist is 6 sessions into a CBT-based anxiety intervention with a Latinx adolescent. The student is not engaging and the family seems hesitant to continue. What is the MOST culturally responsive next step?',
        options: [
          { id: 'o1', label: 'Continue the protocol as designed — EBPs should not be modified', isCorrect: false, explanation: 'Cultural adaptation of delivery and framing is not the same as abandoning the evidence base. Rigid protocol adherence that ignores cultural fit is not evidence-based practice; it is mechanical compliance.' },
          { id: 'o2', label: 'Discontinue counseling and refer to community mental health', isCorrect: false, explanation: 'May eventually be appropriate, but premature without first exploring the fit problem. Referrals without addressing barriers to engagement often result in non-completion.' },
          { id: 'o3', label: 'Meet with the family to understand their concerns, explore cultural meanings of anxiety and help-seeking, and adapt the CBT delivery and framing while preserving its core mechanisms', isCorrect: true, explanation: 'Correct. Culturally responsive practice means understanding the family\'s frame, adapting what is adaptable, and engaging them as partners — not abandoning an evidence-based approach.' },
          { id: 'o4', label: 'Switch to play therapy, which is more universally applicable across cultures', isCorrect: false, explanation: 'No evidence that play therapy is more culturally universal than adapted CBT. For anxiety in adolescents, CBT has a stronger evidence base. The solution is cultural adaptation, not modality switching.' },
        ],
      },
    ],
  },

  // ── Domain 9: Research & Program Evaluation ───────────────────────────────

  {
    id: 'MOD-D9-01',
    primarySkillId: 'RES-03',
    title: 'Research Design Vocabulary: Experimental and Control Groups',
    sections: [
      { type: 'anchor', label: 'The most commonly confused terms', text: "Experimental group = gets the treatment. Control group = does not. Independent variable = what the researcher changes. Dependent variable = what is measured. The independent variable is NOT called the 'experimental variable.'" },
      { type: 'paragraph', text: 'Research design questions are a consistent source of confusion because the same words mean different things in everyday speech and in research terminology. Here are the precise definitions: Experimental group — the group that receives the experimental treatment or condition being studied; they ARE exposed to the independent variable. Control group — the group that does NOT receive the experimental treatment; they provide a comparison baseline. Independent variable — the variable the researcher manipulates (the treatment, intervention, or condition). Dependent variable — the outcome that is measured, the effect of the independent variable.' },
      { type: 'paragraph', text: "Worked example: A researcher wants to test whether a phonemic awareness intervention improves reading scores. She randomly assigns 30 first graders to two groups: 15 receive the phonemic awareness program 3 times per week for 8 weeks; 15 receive their regular reading instruction only. After 8 weeks, all students take a standardized reading assessment. In this study: the experimental group is the 15 students who received the phonemic awareness program; the control group is the 15 students who received only regular instruction; the independent variable is the phonemic awareness program (what the researcher changed); the dependent variable is the reading assessment score (what was measured). If asked on the exam, 'What is the independent variable in this study?' — the correct answer is the intervention, not 'the experimental group' (that's the group, not the variable)." },
      { type: 'comparison', leftHeader: 'Term', rightHeader: 'Precise meaning', rows: [
        { left: 'Experimental group', right: 'Receives the treatment; exposed to the independent variable' },
        { left: 'Control group', right: 'No treatment; provides the baseline comparison' },
        { left: 'Independent variable (IV)', right: 'What the researcher manipulates — the intervention, treatment, or condition' },
        { left: 'Dependent variable (DV)', right: "What the researcher measures — the outcome; 'depends on' the IV" },
      ] },
      { type: 'paragraph', text: "Worked example: A school psychologist tests whether a daily check-in/check-out (CICO) mentoring system reduces office discipline referrals. Forty middle schoolers with frequent referrals are randomly assigned: 20 receive CICO for ten weeks, 20 continue with standard schoolwide expectations only. Referral counts are tallied before and after. Here the independent variable is the CICO program (the condition the researcher manipulates), the dependent variable is the number of referrals (the measured outcome), the experimental group is the 20 students receiving CICO, and the control group is the 20 receiving only standard expectations. A frequent exam trap: a stem asks for the dependent variable and offers 'the control group' as a choice. The control group is a group of participants, not a variable, so it can never be the answer to an IV or DV question. Another trap pairs 'experimental variable' as a distractor for the IV. That phrase is not standard terminology. Anchor on the verbs: the researcher MANIPULATES the IV and MEASURES the DV; the DV literally 'depends on' the IV." },
      {
        type: 'interactive',
        interactiveType: "term-matcher",
        label: "Match the research term to its precise meaning",
        prompt: "Drag each research design term to the definition that matches it exactly.",
        pairs: [
          { term: "Experimental group", definition: "The participants who receive the treatment and are exposed to the independent variable" },
          { term: "Control group", definition: "The participants who receive no treatment and serve as the baseline comparison" },
          { term: "Independent variable", definition: "The condition the researcher manipulates — the intervention or treatment" },
          { term: "Dependent variable", definition: "The outcome the researcher measures; it depends on the independent variable" },
          { term: "Random assignment", definition: "Placing participants into groups by chance so the groups are equivalent at the start" },
        ],
      },
    ],
  },

  {
    id: 'MOD-D9-02',
    primarySkillId: 'RES-03',
    title: 'Correlations: Negative Can Be Stronger Than Positive',
    sections: [
      { type: 'anchor', label: 'The core rule', text: 'Correlation strength = absolute value. A correlation of -0.82 is stronger than +0.45 because |-0.82| > |+0.45|. The sign tells you direction; the number tells you strength.' },
      { type: 'paragraph', text: 'A correlation coefficient ranges from -1.00 to +1.00. The strength of a correlation is determined by its absolute value — how far from zero it is — not by its sign. A correlation of -0.98 indicates a nearly perfect relationship between two variables (as one increases, the other decreases almost perfectly). This is a stronger correlation than +0.60, even though 0.60 is a positive number. Negative does not mean weak. In fact, -0.98 is one of the strongest possible correlations.' },
      { type: 'paragraph', text: "Worked example: A researcher studies elementary students and finds r = -0.82 between average nightly sleep and next-day discipline referrals — the more students sleep, the fewer referrals. A separate study finds r = +0.35 between attendance rate and end-of-year GPA. On an exam question asking 'which finding reflects a stronger relationship,' the answer is the sleep/referral finding. |-0.82| = 0.82; |+0.35| = 0.35. The negative correlation is the stronger one by a wide margin. When a test-taker crosses out the negative sign because 'negative means less,' they get the question wrong." },
      { type: 'comparison', leftHeader: 'Strength (absolute value)', rightHeader: 'Direction (sign)', rows: [
        { left: 'Strong: |r| ≥ 0.70', right: 'Positive (+): both variables increase together' },
        { left: 'Moderate: |r| = 0.40–0.69', right: 'Negative (−): as one increases, the other decreases' },
        { left: 'Weak: |r| < 0.40', right: "Neither sign is 'better' — direction is just information about the relationship" },
        { left: 'Perfect: |r| = 1.00; Zero: r = 0.00 (no linear relationship)', right: 'Sign is independent of strength — a -0.95 and a +0.95 are equally strong' },
      ] },
      { type: 'paragraph', text: "A second high-yield trap dresses the same rule up as a scatterplot or a real-world claim. Suppose a study reports r = -0.91 between minutes of daily reading practice and the number of decoding errors, while another reports r = +0.50 between a motivation survey and quiz scores. The -0.91 finding describes the tighter, more predictable relationship: as practice goes up, errors fall in a nearly straight line. The +0.50 finding is far looser. Two more guardrails for the exam. First, correlation never proves causation, no matter how large |r| is — a strong negative correlation between absences and grades does not prove absences cause low grades. Second, do not confuse r with r-squared or with statistical significance; a coefficient of -0.85 explains far more shared variance than +0.40 regardless of sample size. When a stem asks which relationship is strongest, strip every sign, compare the bare magnitudes, and pick the value closest to 1.00." },
      {
        type: 'interactive',
        interactiveType: "click-selector",
        label: "Which correlation reflects the strongest relationship?",
        prompt: "Strength is the absolute value. Select the coefficient that indicates the strongest relationship between two variables.",
        options: [
          { id: "o1", label: "r = -0.88", explanation: "Correct. |-0.88| = 0.88, the closest to 1.00 of all the choices, so this is the strongest relationship. The negative sign only signals direction.", isCorrect: true },
          { id: "o2", label: "r = +0.62", explanation: "Incorrect. |+0.62| = 0.62 is moderate and weaker than 0.88." },
          { id: "o3", label: "r = +0.40", explanation: "Incorrect. |+0.40| = 0.40 is a relatively weak relationship." },
          { id: "o4", label: "r = -0.15", explanation: "Incorrect. |-0.15| = 0.15 is very close to zero, indicating almost no linear relationship." },
        ],
      },
    ],
  },

  {
    id: 'MOD-D9-03',
    primarySkillId: 'PSY-02',
    title: 'Validity vs. Reliability: A Critical Distinction',
    sections: [
      { type: 'anchor', label: 'The asymmetric relationship', text: "Reliability = consistency. Validity = accuracy. A test CAN be reliable without being valid (consistently wrong). A test CANNOT be valid without being reliable. Reliable is necessary but NOT sufficient for valid." },
      { type: 'paragraph', text: 'Reliability is about consistency — does the test give the same results when repeated under the same conditions? It is measured over time (test-retest) or within the test itself (internal consistency). Validity is about accuracy — does the test actually measure what it claims to measure? One way to establish validity is to correlate a new test with an established gold-standard test that measures the same construct — this is convergent validity. A test can be reliable without being valid: a broken thermometer that consistently reads 2 degrees too high is reliable (same wrong answer every time) but not valid (not accurately measuring temperature). A test cannot be valid without being reliable — you cannot accurately measure something if your instrument gives different results each time.' },
      { type: 'paragraph', text: "Worked example: A researcher develops a new measure of math anxiety called the MAQ. To establish reliability, she administers it to 100 students, waits two weeks, and administers it again — the test-retest correlation is r = 0.88 (high reliability). To establish convergent validity, she correlates MAQ scores with a well-validated existing measure of math anxiety — the correlation is r = 0.82, suggesting the MAQ is measuring the same construct. Now the exam question: 'A researcher gives a new anxiety scale to students and compares the results to a well-established anxiety measure. What does this demonstrate?' The answer is VALIDITY (specifically convergent validity) — not reliability. Reliability is established by comparing the same instrument to itself over time, not by comparing two different instruments." },
      { type: 'comparison', leftHeader: 'Reliability', rightHeader: 'Validity', rows: [
        { left: 'Consistency — same results under same conditions', right: 'Accuracy — measures what it claims to measure' },
        { left: 'Types: test-retest, internal consistency (alpha), inter-rater', right: 'Types: content, construct, criterion (concurrent + predictive), convergent, discriminant' },
        { left: 'Established by: correlating same test with itself across time or raters', right: 'Established by: correlating with other validated measures, expert review, factor analysis' },
        { left: 'Can be high even when validity is low (consistently wrong)', right: 'Cannot be high if reliability is low (random noise prevents accuracy)' },
      ] },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "Reliability or validity?",
        prompt: "Sort each study activity by what it is establishing: reliability (consistency) or validity (accuracy / measures the right construct).",
        scenarios: [
          { id: "s1", text: "A new scale is given twice, two weeks apart, and the two sets of scores correlate at r = 0.90.", category: "Reliability" },
          { id: "s2", text: "Cronbach's alpha for the scale's items is calculated and found to be 0.88.", category: "Reliability" },
          { id: "s3", text: "Two independent raters score the same observations and their ratings agree closely.", category: "Reliability" },
          { id: "s4", text: "Scores on a new math-anxiety scale are correlated with a well-established math-anxiety measure.", category: "Validity" },
          { id: "s5", text: "A panel of content experts reviews whether the items cover the full domain the test claims to assess.", category: "Validity" },
          { id: "s6", text: "Test scores are used to predict performance on a future outcome the test is supposed to forecast.", category: "Validity" },
        ],
        categories: ["Reliability", "Validity"],
      },
    ],
  },

  {
    id: 'MOD-D9-04',
    primarySkillId: 'DBD-01',
    title: 'RTI Data Analysis: Three Levels',
    sections: [
      { type: 'anchor', label: 'What the exam tests', text: "Questions ask you to identify which property of RTI data (level, trend, variability) is being described, or to interpret a data pattern. 'Quantity' or 'number of data points' is a distractor — it is not one of the three analysis properties." },
      { type: 'paragraph', text: 'When analyzing RTI progress monitoring data, school psychologists examine three properties of the data set:' },
      { type: 'list', items: ['Level: The actual performance score — where is the student performing relative to the goal (aim line)?', 'Trend: The direction and rate of change across time — is the student\'s performance improving, declining, or flat?', 'Variability: The consistency of performance — are scores erratic (high and low) or stable?'] },
      { type: 'paragraph', text: "Worked example: Amara is in a Tier 2 reading intervention. Her oral reading fluency (ORF) scores over six weeks are: 48, 46, 52, 44, 50, 47 wpm. Her goal is 65 wpm by the end of the quarter (aim line). Analysis: Level — she is performing at about 48 wpm, well below the 65-wpm aim line. Trend — her scores are essentially flat; there is no meaningful upward slope. Variability — her scores fluctuate week to week (44–52 range), suggesting inconsistent performance. A flat trend below the aim line with moderate variability means the intervention is not working; the team should review intensity, delivery fidelity, and fit." },
      { type: 'comparison', leftHeader: 'Data Pattern', rightHeader: 'Decision Implication', rows: [
        { left: 'Level BELOW aim line + flat trend', right: 'Intervention is not working → increase intensity or change approach' },
        { left: 'Level BELOW aim line + improving trend', right: 'Progress is happening but student may not reach goal in time → monitor, consider acceleration' },
        { left: 'Level AT or ABOVE aim line + stable positive trend', right: 'Student is responding → maintain current intervention' },
        { left: 'High variability (erratic week-to-week scores)', right: 'Check implementation fidelity, attendance, external factors before changing the intervention' },
      ] },
      { type: 'anchor', label: 'Baseline stability rule', text: "Baseline data should have at least three data points with no dramatic spikes or drops before it is considered stable enough to use. An unstable baseline produces a misleading aim line." },
      { type: 'paragraph', text: "Worked example: Diego is in a Tier 2 math computation intervention; his weekly digits-correct scores are 20, 22, 27, 31, 36, 40, climbing steadily toward a 45 aim line. Contrast the three properties with Amara's flat case. Diego's LEVEL is still below the aim line in early weeks, but his TREND is a clear positive slope, and his VARIABILITY is low — each point rises predictably with little scatter. The decision implication differs sharply from a flat profile: a below-aim but steeply improving, low-variability trend says the intervention is working and should be maintained, not intensified. A common exam trap presents 'the number of data points collected' or 'the quantity of sessions' as a fourth property — it is not. Quantity is a precondition for trustworthy analysis (you need enough points to judge trend), but the three analyzable properties remain level, trend, and variability. Another trap asks you to change an intervention after one or two low points; the variability rule says rule out poor fidelity, absences, and outside events before altering a plan." },
      {
        type: 'interactive',
        interactiveType: "term-matcher",
        label: "Match the RTI data property to what it describes",
        prompt: "Connect each progress-monitoring data property to the question it answers.",
        pairs: [
          { term: "Level", definition: "Where the student is performing relative to the goal or aim line" },
          { term: "Trend", definition: "The direction and rate of change across time — improving, flat, or declining" },
          { term: "Variability", definition: "How consistent or erratic the scores are from one point to the next" },
          { term: "Aim line", definition: "The line from baseline to the goal that shows the expected rate of progress" },
          { term: "Stable baseline", definition: "At least three data points with no dramatic spikes or drops before intervention" },
        ],
      },
    ],
  },

  {
    id: 'MOD-D9-05',
    primarySkillId: 'RES-02',
    title: 'Implementation Science: Dissemination Comes First',
    sections: [
      { type: 'anchor', label: 'Stage sequence + ESSA anchor', text: "Implementation stages: Dissemination → Adoption → Initial Implementation → Full Implementation. 'Goodness of fit' belongs to Dissemination. ESSA evidence tiers evaluate PROGRAMS (Tier 1 = RCT). MTSS tiers organize STUDENTS." },
      { type: 'paragraph', text: "When a school is deciding whether to adopt a new program or practice, the first stage of implementation is Dissemination — exploring the fit between the program and the school's context, capacity, and needs. This is when questions like 'Does this fit our culture?' and 'Do our staff have the skills to implement this?' are asked. The stages of implementation, in order, are: Dissemination → Adoption → Initial Implementation → Full Implementation. The 'goodness of fit' concept belongs to the Dissemination stage. A school that skips Dissemination — jumping straight to purchasing a program and training staff — risks poor implementation fidelity because no one assessed whether the school had the infrastructure, values alignment, or staff capacity to deliver it correctly." },
      { type: 'paragraph', text: "Worked example: A middle school principal reads about a promising social-emotional learning (SEL) curriculum and wants to implement it next semester. The school psychologist explains that the team should begin with Dissemination: reviewing the program's evidence base, assessing whether it fits the school's population and presenting needs (which a universal screening would reveal), evaluating whether teachers have the training and scheduling support to implement it with fidelity, and deciding whether the school's values and leadership support the approach. Only after this fit analysis does it make sense to Adopt the program. Once adopted, Initial Implementation begins — small-scale pilots, coaching, early data collection. Full Implementation follows after fidelity and outcomes are confirmed. Jumping from 'this looks good' to school-wide training skips the stages that predict long-term success." },
      { type: 'comparison', leftHeader: 'Implementation Stage', rightHeader: 'Key question answered', rows: [
        { left: 'Dissemination: exploring the program', right: '"Is this a good fit for our school? Do we have the capacity to implement it?"' },
        { left: 'Adoption: committing to the program', right: '"We will implement this — what resources, training, and infrastructure do we need?"' },
        { left: 'Initial Implementation: small-scale rollout', right: '"Are we implementing it with fidelity? What early data do we see?"' },
        { left: 'Full Implementation: school-wide, sustained delivery', right: '"Is it producing expected outcomes consistently at scale?"' },
      ] },
      {
        type: 'interactive',
        interactiveType: "drag-to-order",
        label: "Order the implementation stages",
        prompt: "Place the four stages of implementation in the correct sequence, from the first exploratory stage to sustained school-wide delivery.",
        items: [
          "Dissemination: explore goodness of fit, context, capacity, and needs",
          "Adoption: commit to the program and secure resources, training, and infrastructure",
          "Initial Implementation: small-scale rollout with coaching, fidelity checks, and early data",
          "Full Implementation: sustained, school-wide delivery after fidelity and outcomes are confirmed",
        ],
      },
    ],
  },

  // ── Domain 10: Legal, Ethical & Professional Practice ────────────────────

  {
    id: 'MOD-D10-01',
    primarySkillId: 'LEG-02',
    title: 'IDEA and Child Find: The Identification Mandate',
    sections: [
      { type: 'anchor', label: 'Child Find is proactive', text: "IDEA's Child Find mandate requires districts to ACTIVELY SEEK OUT children with potential disabilities — not just wait for referrals. IDEA governs special education (FAPE + LRE + IEP). Section 504 governs accommodations (broader definition, no special ed required, complaints to OCR)." },
      { type: 'paragraph', text: "The Individuals with Disabilities Education Act (IDEA) is the federal law that governs special education in the United States. Among its core provisions is Child Find — a mandate requiring all school districts to actively seek out and identify children with potential disabilities, even before a referral is made. IDEA also establishes the eligibility categories for special education (13 categories including SLD, OHI, autism, EBD, ID, and others), guarantees a free and appropriate public education (FAPE) to all eligible students, and requires placement in the least restrictive environment (LRE). FAPE was originally interpreted as 'some educational benefit' (Rowley, 1982), then raised to 'meaningful, appropriate progress' (Endrew F., 2017)." },
      { type: 'paragraph', text: "Worked example: A school psychologist notices that a 7-year-old in a general-education classroom shows significant language delays and limited literacy progress after two months of Tier 2 intervention. No one has referred this child. Under IDEA's Child Find mandate, the district is obligated to initiate an evaluation — the obligation is not contingent on a parent request or a formal teacher referral. The psychologist brings the case to the student support team. A second scenario: the same student does not qualify for IDEA services (does not meet eligibility criteria under any of the 13 categories) but has ADHD that substantially limits the ability to concentrate and learn. That student may still qualify for a Section 504 accommodation plan, which requires a lower threshold (any physical or mental impairment that substantially limits a major life activity) and does not require special education eligibility." },
      { type: 'comparison', leftHeader: 'IDEA', rightHeader: 'Section 504', rows: [
        { left: 'Governs special education — specially designed instruction', right: 'Governs access and accommodations — not special education' },
        { left: 'Mandates Child Find: district must proactively identify potential disabilities', right: 'No separate Child Find mandate; triggered by student need or parent request' },
        { left: 'Requires FAPE, LRE, and an IEP for eligible students', right: 'Requires accommodations plan (504 plan); no IEP required' },
        { left: '13 specific eligibility categories; stricter threshold', right: 'Broader disability definition; minor conditions may qualify (ADAAA 2008)' },
      ] },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "IDEA or Section 504?",
        prompt: "Sort each situation by the law that primarily governs it. IDEA covers special education (FAPE, LRE, IEP, Child Find, 13 categories); Section 504 covers accommodations for a broader range of impairments without requiring special education.",
        scenarios: [
          { id: "s1", text: "The district must proactively seek out and identify a child with a potential disability even though no one has referred them.", category: "IDEA" },
          { id: "s2", text: "A student qualifies under one of 13 eligibility categories and needs specially designed instruction and an IEP.", category: "IDEA" },
          { id: "s3", text: "A student with ADHD does not meet special education eligibility but needs extended time and seating accommodations to access the curriculum.", category: "Section 504" },
          { id: "s4", text: "A student with a documented physical or mental impairment that substantially limits a major life activity needs an accommodations plan, not special education.", category: "Section 504" },
          { id: "s5", text: "The team must ensure placement in the least restrictive environment for a student receiving specially designed instruction.", category: "IDEA" },
        ],
        categories: ["IDEA", "Section 504"],
      },
    ],
  },

  {
    id: 'MOD-D10-02',
    primarySkillId: 'LEG-02',
    title: 'The Stay-Put Rule: Triggered by Due Process',
    sections: [
      { type: 'anchor', label: 'The trigger', text: 'Stay-put activates the moment due process is FILED — not when it is resolved, not after a suspension, not after a manifestation determination. Filing = freeze placement.' },
      { type: 'paragraph', text: "The 'stay-put' rule (also called educational placement protection) prevents a school from unilaterally changing a special education student's placement once a due process proceeding has been initiated. The student must remain in their current educational placement until the legal process is resolved. This rule is triggered by the initiation of due process — not by its completion, not by a suspension, and not by a manifestation determination. The moment due process begins, the student stays put." },
      { type: 'paragraph', text: "Worked example: Marcus is a 7th grader with autism and an IEP placing him in a resource room for three periods per day. His parents disagree with the district's proposal to move him to a self-contained classroom. The parents file for due process on a Monday. On Tuesday, the district cannot implement the placement change — stay-put is now in effect. Marcus remains in the resource room placement until either (a) the parents agree to a change, or (b) the due process hearing officer or a court orders otherwise. The district may be frustrated; the rule still applies. This principle was affirmed in Honig v. Doe (1988), which extended it explicitly to disciplinary exclusions." },
      { type: 'comparison', leftHeader: 'Stay-Put Rule', rightHeader: 'Manifestation Determination', rows: [
        { left: 'Triggered by: filing for due process', right: 'Triggered by: a proposed disciplinary removal exceeding 10 school days' },
        { left: 'Purpose: freezes the current educational placement while legal dispute is pending', right: 'Purpose: determines whether the conduct was caused by or related to the disability' },
        { left: "Result: student remains in 'current educational placement' until dispute resolves", right: 'Result: if yes → return to IEP setting; if no → discipline as non-disabled peer (with FAPE continuing)' },
        { left: 'Key case: Honig v. Doe (1988)', right: 'Legal basis: IDEA 2004, Section 615(k)' },
      ] },
      {
        type: 'interactive',
        interactiveType: "click-selector",
        label: "When does stay-put take effect?",
        prompt: "A parent disputes the district's proposed change to a student's special education placement. At what moment does the stay-put rule freeze the student's current placement?",
        options: [
          { id: "o1", label: "The moment the parents file for due process", explanation: "Correct. Stay-put activates upon initiation (filing) of due process, freezing the current educational placement until the dispute resolves.", isCorrect: true },
          { id: "o2", label: "Only after the due process hearing is resolved", explanation: "Incorrect. Stay-put is triggered by filing, not by resolution; the student stays put while the proceeding is pending." },
          { id: "o3", label: "After a suspension exceeds 10 school days", explanation: "Incorrect. That threshold triggers a manifestation determination, not stay-put." },
          { id: "o4", label: "Once a manifestation determination is completed", explanation: "Incorrect. A manifestation determination is a separate disciplinary process; it does not trigger stay-put." },
        ],
      },
    ],
  },

  {
    id: 'MOD-D10-03',
    primarySkillId: 'ETH-01',
    title: 'Ethical Violations: Address at the Lowest Level First',
    sections: [
      { type: 'anchor', label: 'The escalation principle', text: "For minor-to-moderate violations, NASP recommends addressing the situation informally with the colleague first. You do NOT immediately report to a licensing board or administrator. Severe violations (abuse, criminal conduct) skip informal resolution and escalate directly." },
      { type: 'paragraph', text: "When a school psychologist becomes aware of an ethical violation by a colleague, the recommended first step in low-to-moderate severity cases is to address the situation informally and directly with the person — not to immediately escalate to administrators or licensing boards. This approach respects the colleague's dignity, allows for correction without formal consequences, and aligns with professional ethical codes. The assumption is that many violations are errors of judgment or ignorance, not malice, and a collegial conversation can resolve them." },
      { type: 'paragraph', text: "Worked example: A colleague shares a student's test scores with that student's teacher — but the teacher is not part of the assessment team and has no educational need for the specific data. This is a minor FERPA/ethics concern. The first step is not to file a complaint with the school board. The school psychologist speaks privately with the colleague: 'I wanted to mention — sharing specific test scores with a teacher who isn't on the IEP team is technically a FERPA issue. Would you like to review our data-sharing protocol together?' If the colleague dismisses the concern or repeats the behavior, escalation to the supervisor or ethics board becomes appropriate." },
      { type: 'comparison', leftHeader: 'Violation Severity', rightHeader: 'Recommended Response', rows: [
        { left: 'Minor — error of judgment, ignorance of procedure, no direct harm to a student', right: 'Informal, direct conversation with the colleague; collegial and educational tone' },
        { left: 'Moderate — repeated minor violation, pattern of disregard for ethics; indirect harm', right: 'Consult with a trusted colleague or supervisor; if unresolved, formal complaint to internal leadership' },
        { left: 'Severe — direct harm to a student, abuse, criminal conduct, exploitation', right: 'Bypass informal step entirely; report directly to administration, licensing board, and/or law enforcement as appropriate' },
        { left: 'Unsure of severity', right: 'Consult NASP Ethical Principles, a colleague, or an ethics consultant; document your reasoning' },
      ] },
      { type: 'anchor', label: 'NASP Ethical Principles alignment', text: "NASP's Principles for Professional Ethics emphasize collegial responsibility and professional development. Informal resolution is the first step in most ethics complaints, not the last resort." },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "Match the violation to the right response",
        prompt: "Sort each situation by the recommended first response under NASP's escalation principle: address minor issues informally first, escalate moderate or unresolved issues, and report severe violations directly.",
        scenarios: [
          { id: "s1", text: "A colleague shares specific test scores with a teacher who has no educational need for them — a one-time, apparently unintentional FERPA lapse.", category: "Informal conversation first" },
          { id: "s2", text: "A colleague uses an outdated scoring procedure, seemingly out of ignorance, with no direct harm to a student.", category: "Informal conversation first" },
          { id: "s3", text: "You learn a colleague is engaged in suspected abuse or exploitation of a student.", category: "Direct escalation/report" },
          { id: "s4", text: "A colleague's billing practice appears to involve criminal fraud.", category: "Direct escalation/report" },
          { id: "s5", text: "A colleague repeats a minor confidentiality violation after you already raised it collegially and they dismissed the concern.", category: "Direct escalation/report" },
        ],
        categories: ["Informal conversation first", "Direct escalation/report"],
      },
    ],
  },

  {
    id: 'MOD-D10-04',
    primarySkillId: 'LEG-01',
    title: "Test Protocols and Parent Access: Copyright Is Protected",
    sections: [
      { type: 'anchor', label: 'The scenario that trips people up', text: "A parent has every right under FERPA to review their child's records — but 'review' does not mean 'copy.' Test protocols are copyright-protected materials. Showing ≠ copying." },
      { type: 'paragraph', text: "Parents have a legal right to review their child's educational records, including evaluation reports. However, test protocols — the actual testing materials (stimulus books, record forms, scoring booklets) — are copyright-protected, and allowing parents to copy them violates copyright law and test security agreements. The FERPA right to 'inspect and review' does not create a right to photocopy. The school psychologist must explain results fully in accessible language using the written report, not the protocol." },
      { type: 'paragraph', text: "Worked example: A parent calls and says she wants to take her child's WISC-V protocol home to review at her convenience. The school psychologist schedules a records review meeting and explains all results in the written report during the meeting. The parent may look at the record form across the table but cannot take a copy. When the parent's attorney sends a letter demanding the protocol, the psychologist consults the district's legal counsel — same rule applies (show during meeting, do not copy), pending any attorney-client negotiation. If a court subpoena arrives, the psychologist complies." },
      { type: 'comparison', leftHeader: 'Situation', rightHeader: 'Correct Response', rows: [
        { left: 'Parent requests to review evaluation results', right: 'Schedule a review meeting; explain the written report; provide a copy of the written report' },
        { left: 'Parent requests to take the test protocol home or receive a copy', right: 'Decline the copy; allow examination during the meeting; explain why copying is prohibited' },
        { left: "Attorney letter requesting test protocol", right: 'Consult district legal counsel; same review-only principle applies pending legal determination' },
        { left: 'Court subpoena for test protocol', right: 'Comply with the subpoena; notify the test publisher if possible; follow legal counsel guidance' },
      ] },
      { type: 'anchor', label: 'The legal hierarchy', text: "Parent request: show, explain, do not copy. Lawyer's demand: same — show and explain, do not copy yet, contact school's attorney. Court subpoena: comply. This escalating response protects both the psychologist and test publishers." },
      { type: 'paragraph', text: "Worked example: A psychologist completes a special-education re-evaluation and the parent, dissatisfied, requests the raw WISC-V record form to share with a private psychologist. The correct move is not refusal of all access but careful scoping. The psychologist offers the full written report (which the parent is entitled to copy) and offers to release results directly to the private evaluator, who as a qualified professional may receive protocol-level data under the publisher's user agreement. Exam trap: students confuse FERPA's broad records-access right with an unlimited copying right. FERPA requires the school to let a parent inspect and review records and to provide copies only when failure to do so would effectively deny access. Because the school offers an in-person review and a full narrative report, copying the secure protocol is not required, and copyright plus test-security obligations control. Releasing to a qualified professional, not to the lay parent, resolves the tension." },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "Show or comply?",
        prompt: "Sort each request by the correct school-psychologist response regarding a copyrighted test protocol.",
        scenarios: [
          { id: "s1", text: "Parent asks to take the WISC-V record form home to review at her convenience.", category: "Show and explain, do not copy" },
          { id: "s2", text: "Parent asks to see the results of the evaluation explained.", category: "Show and explain, do not copy" },
          { id: "s3", text: "An attorney's letter demands a photocopy of the test protocol.", category: "Show and explain, do not copy" },
          { id: "s4", text: "A valid court subpoena orders production of the test protocol.", category: "Comply / release" },
          { id: "s5", text: "Parent requests a copy of the written evaluation report.", category: "Comply / release" },
        ],
        categories: ["Show and explain, do not copy", "Comply / release"],
      },
    ],
  },

  {
    id: 'MOD-D10-05',
    primarySkillId: 'LEG-01',
    title: 'Parental Consent for Regular Education Students',
    sections: [
      { type: 'anchor', label: 'The consent rule', text: 'Regular-ed student (no IEP): written parental consent BEFORE any assessment or ongoing counseling. Crisis exception is narrow — brief stabilization only, not ongoing services. Confidentiality limits: disclose at the FIRST meeting.' },
      { type: 'paragraph', text: "When a school psychologist is asked to provide counseling or assessment services to a regular education student (one not currently identified for special education), written parental consent must be obtained before beginning. This is best practice and protects both the student's rights and the psychologist's professional standing. The exception is a genuine crisis situation — when a student's immediate safety is at risk, a brief stabilizing intervention may be provided without prior consent. This exception is narrow and does not extend to ongoing counseling." },
      { type: 'paragraph', text: "Worked example: A 7th-grade teacher refers a student, Priya, to the school psychologist because she has been crying in class and seems withdrawn. Priya has no IEP or 504 plan. The school psychologist meets with Priya briefly to assess immediate safety — this is an initial check, not ongoing counseling, and no consent issue arises yet. The psychologist determines Priya is not in crisis; she is struggling with parental divorce and wants to talk to someone regularly. Before scheduling weekly counseling sessions, the psychologist sends home a parental consent form explaining the nature of the services, their purpose, and the limits of confidentiality. Only after receiving signed consent does the counseling series begin. At the first actual counseling session, the psychologist explains what is and is not confidential — again, to Priya directly." },
      { type: 'comparison', leftHeader: 'Service type', rightHeader: 'Consent requirement', rows: [
        { left: 'Ongoing counseling for a regular-ed student', right: 'Written parental consent required before services begin' },
        { left: 'Brief crisis stabilization (immediate safety risk)', right: 'Crisis exception applies — brief stabilization can precede consent; consent obtained as soon as practicable' },
        { left: 'Assessment of a regular-ed student', right: 'Written parental consent required before the evaluation begins' },
        { left: 'Services for a student with an IEP (special ed)', right: 'Governed by IDEA consent procedures; different framework than regular-ed consent' },
      ] },
      { type: 'paragraph', text: "Worked example: A high-school counselor asks the school psychologist to run a brief screening and start weekly check-ins for Marcus, a general-education student with declining grades and no IEP. The psychologist may meet Marcus once to assess immediate safety, but cannot begin any ongoing assessment or counseling without written parental consent describing the service, its purpose, and confidentiality limits. Exam trap: the crisis exception is for imminent safety only and is time-limited; it never converts into a standing course of counseling. A second trap concerns confidentiality timing — limits to confidentiality (such as duty to warn or mandated reporting of abuse) must be explained to the student at the outset, at the first session, not after a disclosure occurs. Disclosing limits late undermines informed assent and can taint the therapeutic relationship. Note this is distinct from IDEA consent, which governs students already in or referred to special education." },
      {
        type: 'interactive',
        interactiveType: "scenario-sorter",
        label: "Consent required first?",
        prompt: "For a regular-education student, sort each action by whether written parental consent must be obtained before proceeding.",
        scenarios: [
          { id: "s1", text: "Beginning a series of weekly counseling sessions.", category: "Consent required before starting" },
          { id: "s2", text: "Conducting a formal assessment of the student.", category: "Consent required before starting" },
          { id: "s3", text: "Starting an ongoing social-skills counseling group.", category: "Consent required before starting" },
          { id: "s4", text: "A brief stabilizing intervention for a student in immediate safety crisis.", category: "Permitted before consent" },
          { id: "s5", text: "An initial check to determine whether the student is in immediate danger.", category: "Permitted before consent" },
        ],
        categories: ["Consent required before starting", "Permitted before consent"],
      },
    ],
  },

  {
    id: 'MOD-D10-06',
    primarySkillId: 'LEG-02',
    title: "LRE and 'Reasonable Educational Progress'",
    sections: [
      { type: 'anchor', label: 'The legal standard', text: "LRE = educate with non-disabled peers to the MAXIMUM EXTENT APPROPRIATE. The FAPE standard = REASONABLE progress (Endrew F., 2017), not maximum achievement. A C average = reasonable progress. The school is not obligated to maximize potential." },
      { type: 'paragraph', text: "The least restrictive environment (LRE) principle requires that students with disabilities be educated alongside their non-disabled peers to the maximum extent appropriate. A student should only be placed in a more restrictive setting if the nature or severity of the disability is such that education in general education classes — even with supplementary aids and services — cannot be achieved satisfactorily. Critically, 'reasonable educational progress' — not perfect or maximum performance — is the legal standard. A student making Cs is making reasonable academic progress. The school does not have an obligation to ensure the student achieves their maximum potential, only to provide an appropriate education." },
      { type: 'paragraph', text: "Worked example: A parent argues at an IEP meeting that the district must move their child with autism to a private therapeutic school because the child is capable of performing at a higher level with more intensive instruction. The district's position: the child is currently making meaningful progress in a resource-room setting (improving on IEP goals, passing grade-level coursework with modifications). Under Endrew F. (2017), the IEP must be 'reasonably calculated to enable a child to make progress appropriate in light of the child's circumstances' — not maximum progress. Unless the child is regressing or making no progress, the district's program can satisfy FAPE without providing the most intensive or most expensive option available. LRE also weighs in: the more restrictive private placement is appropriate only if the public setting cannot provide a satisfactory education with supplementary aids and services." },
      { type: 'comparison', leftHeader: 'LRE Principle', rightHeader: 'FAPE Standard (post-Endrew F.)', rows: [
        { left: 'Students with disabilities must be educated with non-disabled peers to the maximum extent appropriate', right: 'IEP must be reasonably calculated to enable progress appropriate to the child\'s circumstances' },
        { left: 'More restrictive settings permitted only when general education (with aids/services) is not satisfactory', right: "Standard is meaningful, not maximum — 'de minimis' progress is insufficient (Endrew F. raised the bar from Rowley)" },
        { left: 'Placement decision is a team judgment; presumption favors inclusion', right: 'Progress must be real and documented; IEP goals and services must reflect the student\'s actual needs' },
        { left: 'Key case: Oberti v. Clementon (1993) — strong LRE presumption', right: 'Key cases: Rowley (1982) original standard → Endrew F. (2017) raised standard' },
      ] },
      {
        type: 'interactive',
        interactiveType: "click-selector",
        label: "What standard governs the IEP?",
        prompt: "A parent argues the district must maximize their child's potential by funding a private placement. The child is passing modified grade-level coursework and meeting IEP goals in a resource room. Which statement correctly states the legal standard?",
        options: [
          { id: "o1", label: "The IEP must be reasonably calculated to enable progress appropriate in light of the child's circumstances.", explanation: "Correct. This is the Endrew F. (2017) standard for FAPE — meaningful, appropriately ambitious progress, not maximum potential.", isCorrect: true },
          { id: "o2", label: "The district must provide the program that maximizes the child's potential.", explanation: "Incorrect. FAPE does not require maximizing potential; it requires appropriate progress in light of the child's circumstances." },
          { id: "o3", label: "Any progress, even merely more than de minimis, automatically satisfies FAPE.", explanation: "Incorrect. Endrew F. rejected a merely-more-than-de-minimis bar; progress must be appropriately ambitious for the child." },
          { id: "o4", label: "LRE requires the most intensive available placement whenever a parent requests it.", explanation: "Incorrect. LRE presumes inclusion; a more restrictive placement is justified only when general education with aids and services is not satisfactory." },
        ],
      },
    ],
  },

  {
    id: 'MOD-D10-07',
    primarySkillId: 'ETH-03',
    title: "NCSP Credential and NASP's Role",
    sections: [
      { type: 'anchor', label: 'NASP and NCSP fast facts', text: "NASP = primary professional organization AND NCSP accreditor. NCSP = portable national credential (granted by NASP). State license = required to practice in that state. NASP recommends no more than 2 interns per supervisor. These are exam-tested facts." },
      { type: 'paragraph', text: "The National Association of School Psychologists (NASP) is the primary professional organization for school psychologists in the United States. NASP is also the primary accreditation body for the Nationally Certified School Psychologist (NCSP) credential. NASP sets professional standards, publishes ethical guidelines (Principles for Professional Ethics), advocates for the field, and provides professional development. The NCSP is a portable national credential recognized across states that do not have reciprocity agreements for state licensure. Key distinction: the NCSP is granted by NASP (a professional organization); the state license or credential is granted by the state department of education or a licensing board. A practitioner may hold both, and holding the NCSP without a state credential does not authorize practice in a specific state." },
      { type: 'paragraph', text: "Worked example: A school psychologist who earned the NCSP in Virginia accepts a position in Colorado, which does not have a reciprocity agreement with Virginia. The NCSP demonstrates a nationally recognized standard of preparation — but the psychologist still needs to apply for a Colorado state credential before practicing. The NCSP is not a substitute for the state license; it is a portable signal of competence that can support the application for state licensure and may allow practice under supervision while the application is processed. A second scenario: an exam question asks who grants the NCSP. The answer is NASP — not the state board, not the U.S. Department of Education." },
      { type: 'list', label: 'What NASP provides', items: ['The Principles for Professional Ethics — the field\'s ethical code', 'The NASP Practice Model — the framework of professional practice domains', 'Standards for Graduate Preparation of School Psychologists', 'The NCSP credential — a portable national certification', 'Advocacy, research, and continuing professional development'] },
      { type: 'comparison', leftHeader: 'NCSP (national credential)', rightHeader: 'State credential / license', rows: [
        { left: 'Granted by NASP (the professional organization)', right: 'Granted by the state department of education or licensing board' },
        { left: 'Portable — recognized across many states; useful where there is no state reciprocity', right: 'Required to actually practice within that specific state' },
        { left: 'Demonstrates nationally consistent preparation standard', right: 'Requirements vary from state to state' },
        { left: 'Does not substitute for state licensure', right: 'State license supersedes NCSP for authorization to practice' },
      ] },
      {
        type: 'interactive',
        interactiveType: "term-matcher",
        label: "NASP and NCSP terms",
        prompt: "Match each credential, document, or body to its correct description.",
        pairs: [
          { term: "NASP", definition: "The primary professional organization for school psychologists; it grants the NCSP and publishes the Principles for Professional Ethics." },
          { term: "NCSP", definition: "A portable national credential granted by NASP; signals a nationally consistent preparation standard but does not authorize practice in a given state." },
          { term: "State credential / license", definition: "Granted by the state department of education or licensing board; required to actually practice within that specific state." },
          { term: "Principles for Professional Ethics", definition: "NASP's ethical code that guides the professional conduct of school psychologists." },
          { term: "NASP Practice Model", definition: "NASP's framework describing the domains of comprehensive school-psychological practice." },
        ],
      },
    ],
  },

  {
    id: 'MOD-D10-08',
    primarySkillId: 'LEG-04',
    title: 'Major Legal Cases — Quick Reference',
    sections: [
      { type: 'paragraph', text: 'Several landmark legal cases are specific exam targets. They are far easier to remember when you group them by the question each one answers, rather than memorizing a flat list. Four themes cover almost everything the exam asks: (1) assessment bias and fair testing, (2) the FAPE standard, (3) placement and discipline, and (4) English Language Learners.' },
      { type: 'anchor', label: 'Group the cases by theme', text: 'Assessment bias → Larry P., Diana. FAPE standard → Rowley, Endrew F. Placement & discipline → Honig, Oberti. ELL access → Lau. Foundational right to education → PARC, Mills. If you know the theme, the holding usually follows.' },
      { type: 'list', label: 'The high-yield cases', items: ['Larry P. v. Riles (1979): IQ tests were ruled racially biased against Black students; restricted use of IQ tests for special-education placement in California.', 'Diana v. State Board of Education (1970): Students must be assessed in their native/primary language; challenged biased placement of Spanish-speaking students.', 'Rowley — Board of Education v. Rowley (1982): Defined FAPE as providing "some educational benefit" — the original low ("de minimis") progress standard.', 'Endrew F. v. Douglas County (2017): Raised the FAPE standard — an IEP must be reasonably calculated to enable progress appropriate in light of the child\'s circumstances (meaningful, not minimal).', 'Honig v. Doe (1988): Affirmed the "stay-put" rule; schools cannot unilaterally exclude students with disabilities (the 10-day discipline limit).', 'Oberti v. Clementon School Board (1993): Strong presumption in favor of inclusion in regular classes (the LRE principle).', 'Lau v. Nichols (1974): Schools must provide meaningful, equal educational access to ELL students.', 'PARC v. Commonwealth of Pennsylvania (1972): Established the right to a free public education for children with disabilities — a foundation for IDEA.', 'Mills v. Board of Education (1972): Extended that right regardless of the district\'s claimed cost or resources.'] },
      { type: 'comparison', leftHeader: 'FAPE standard — Rowley (1982)', rightHeader: 'FAPE standard — Endrew F. (2017)', rows: [{ left: '"Some educational benefit" is enough', right: 'Progress must be "appropriate in light of the child\'s circumstances"' }, { left: 'Often summarized as the de minimis / minimal-progress bar', right: 'A markedly more demanding, meaningful-progress bar' }, { left: 'The original standard', right: 'Raised and clarified the standard — supersedes the de minimis reading' }] },
      {
        type: 'interactive',
        interactiveType: 'term-matcher',
        label: 'Match the case to its holding',
        prompt: 'Pair each landmark case with the rule it established.',
        pairs: [
          { term: 'Larry P. v. Riles', definition: 'IQ tests ruled racially biased; restricted for special-ed placement of Black students' },
          { term: 'Diana v. State Board of Education', definition: 'Students must be assessed in their native/primary language' },
          { term: 'Rowley', definition: 'FAPE = "some educational benefit" (the original low standard)' },
          { term: 'Endrew F.', definition: 'FAPE = progress appropriate to the child\'s circumstances (raised the bar)' },
          { term: 'Honig v. Doe', definition: 'Stay-put rule; no unilateral exclusion (10-day discipline limit)' },
          { term: 'Oberti v. Clementon', definition: 'Strong presumption for inclusion in regular classes (LRE)' },
          { term: 'Lau v. Nichols', definition: 'Schools must provide meaningful educational access to ELL students' },
          { term: 'PARC v. Pennsylvania', definition: 'Right to free public education for children with disabilities' },
        ],
      },
      { type: 'anchor', label: 'The trap', text: 'The classic distractor is offering Rowley\'s "some benefit" language as the current FAPE standard. Since 2017, Endrew F. controls: the standard is meaningful progress appropriate to the child\'s circumstances, not minimal benefit.' },
      { type: 'paragraph', text: "Worked example: A vignette describes a Spanish-speaking student placed in a special-education program after scoring low on an English-language IQ test, and asks which case the placement violates. Work the theme grid. First sort the issue: this is an assessment-and-placement-fairness problem, not a FAPE-adequacy or discipline problem. Within the bias/fair-testing theme, two cases live there: Larry P. v. Riles and Diana v. State Board of Education. Larry P. concerns IQ tests ruled racially biased against Black students; Diana concerns assessing students in their native or primary language. Because the student is Spanish-speaking and was tested in English, the controlling case is Diana. Naming the theme first narrowed nine cases to two, and the student's specific facts selected between them. That is the entire retrieval strategy the exam rewards." },
    ],
  },

  {
    id: 'MOD-D10-09',
    primarySkillId: 'ETH-02',
    title: 'Malpractice, Negligence, and Supervisory Liability',
    sections: [
      { type: 'anchor', label: 'What negligence actually requires', text: 'Not every bad outcome is malpractice. A school psychologist who does everything correctly and still cannot prevent a student crisis has not committed negligence. Four specific elements must all be present for a liability claim — missing even one breaks the case.' },
      { type: 'paragraph', text: 'Malpractice is professional negligence: a failure to meet the standard of care that a reasonably competent school psychologist in the same specialty would have provided under similar circumstances. The standard is not perfection — it is what a competent peer would do. Four elements must all be present: (1) Duty — the practitioner owed the client a professional duty of care, established by the professional relationship; (2) Breach — they failed to meet the standard of care; (3) Causation — the breach directly caused the harm (not merely that harm occurred while they were involved); (4) Damages — the client suffered actual harm as a result. If any element is absent, the legal claim fails.' },
      { type: 'paragraph', text: 'Supervisory liability is a specific application. A licensed psychologist who supervises an intern, practicum student, or unlicensed practitioner assumes professional responsibility for that supervisee\'s work. Supervisory liability can arise two ways: the supervisor assigned a task outside the supervisee\'s competency, or the supervisor failed to provide adequate oversight of a task within scope. Signing off on reports without reviewing them, delegating independent assessment to a trainee without checks, or failing to ensure a supervisee fulfilled mandatory reporting obligations are common routes to supervisory liability claims.' },
      {
        type: 'interactive',
        interactiveType: 'scenario-sorter',
        label: 'Liability or standard of care?',
        prompt: 'Sort each scenario into the correct category.',
        scenarios: [
          { id: 's1', text: 'A school psychologist decides not to report suspected physical abuse, reasoning that the marks "probably have an innocent explanation"', category: 'POTENTIAL LIABILITY' },
          { id: 's2', text: 'A psychologist provides cognitive testing but refers to a specialist for domains outside her training, documenting the referral in the file', category: 'WITHIN STANDARD' },
          { id: 's3', text: 'A supervisor signs a trainee\'s comprehensive evaluation report without reading it', category: 'POTENTIAL LIABILITY' },
          { id: 's4', text: 'A psychologist uses a test normed 12 years ago, notes the limitation in the report, and supplements with a current instrument', category: 'WITHIN STANDARD' },
          { id: 's5', text: 'A school psychologist provides neuropsychological assessment with no specific training in that domain and without supervision', category: 'POTENTIAL LIABILITY' },
        ],
        categories: ['POTENTIAL LIABILITY', 'WITHIN STANDARD'],
      },
      { type: 'anchor', label: 'Negligence by omission', text: 'Liability arises from failing to act as readily as from acting wrongly. Common omissions: failing to report suspected abuse, failing to conduct a required suicide risk assessment, failing to document a consultation or referral, failing to provide adequate supervision. When uncertain whether an action is required, the defensible move is to act and document.' },
      { type: 'comparison', leftHeader: "General malpractice / negligence", rightHeader: "Supervisory liability", rows: [
          { left: "Liability rests on the practitioner's own conduct toward the client", right: "Liability rests on responsibility for a supervisee's conduct toward the client" },
          { left: "Duty arises from the direct professional relationship with the client", right: "Duty arises from accepting supervisory responsibility for the supervisee's work" },
          { left: "Breach = the practitioner personally fell below the standard of care", right: "Breach = assigning a task outside the supervisee's competency or failing to provide adequate oversight" },
          { left: "All four elements (duty, breach, causation, damages) must be present", right: "Same four elements apply, but the breach is in the supervision, not direct service" },
        ] },
    ],
  },

  {
    id: 'MOD-D10-10',
    primarySkillId: 'LEG-03',
    title: 'Section 504 and ADA: Broader Protection, Lower Bar Than IDEA',
    sections: [
      { type: 'anchor', label: 'The threshold that trips people up', text: '504 has a lower eligibility bar than IDEA — intentionally. A student does not need to be failing academically to qualify for a 504 plan. A health condition that substantially limits any major life activity — including concentrating, walking, or attending school — triggers 504 protection, whether or not special education is needed.' },
      { type: 'paragraph', text: 'Section 504 of the Rehabilitation Act (1973) prohibits discrimination against people with disabilities by programs receiving federal funding — including all public schools. The Americans with Disabilities Act (1990) extends similar protections into the broader public sphere; ADA Title II applies specifically to public schools. Together they protect students who have a physical or mental impairment that substantially limits one or more major life activities. Major life activities include learning, reading, concentrating, thinking, communicating, walking, standing, seeing, and hearing.' },
      { type: 'paragraph', text: 'This eligibility threshold is lower than IDEA\'s. IDEA requires the disability to adversely affect educational performance in a way that necessitates specialized instruction. 504 requires only that a disability substantially limits a major life activity — a student can perform on grade level academically and still qualify. Common 504-qualifying conditions: ADHD with significant functional impairment even at average grades; asthma limiting attendance and physical activity; diabetes requiring medical management during school; depression or anxiety substantially impairing concentration. The 504 plan is a general education accommodation document — not a special education placement — and specifies reasonable accommodations: extended time, preferential seating, medication access, attendance flexibility.' },
      { type: 'comparison', leftHeader: 'IDEA / IEP', rightHeader: 'Section 504 Plan', rows: [
        { left: 'Eligibility: disability adversely affects educational performance AND requires special education', right: 'Eligibility: disability substantially limits any major life activity (academic failure not required)' },
        { left: 'Document: Individualized Education Program (IEP)', right: 'Document: 504 Accommodation Plan (general education document)' },
        { left: 'Process: multidisciplinary team, formal evaluation, annual reviews, IDEA due process rights', right: 'Process: 504 meeting with staff and parents; flexible documentation; no mandated formal evaluation' },
        { left: 'Services: specialized instruction and related services (OT, speech, counseling)', right: 'Services: reasonable accommodations in general education (extended time, medical access, seating adjustments)' },
      ] },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: '504 vs. IEP: which framework applies?',
        prompt: 'A 7th grader with well-controlled asthma performs on grade level but frequently misses school during flare seasons and cannot participate in PE. Her parents request accommodations. What is the MOST appropriate next step?',
        options: [
          { id: 'o1', label: 'Evaluate for IDEA eligibility under Other Health Impairment (OHI)', isCorrect: false, explanation: 'OHI is a valid path, but requires a full special education evaluation and IEP — a more intensive process when the student does not need specialized instruction. 504 is the more direct and proportionate fit.' },
          { id: 'o2', label: 'Develop a 504 plan addressing attendance allowances, PE modifications, and medication / nurse access', isCorrect: true, explanation: 'Correct. Asthma substantially limits the major life activities of attending school and physical activity. The student does not need special education, but does need accommodations — 504 is designed for exactly this.' },
          { id: 'o3', label: 'Take no action because the student is performing on grade level', isCorrect: false, explanation: 'Grade-level academic performance does not disqualify a student from 504 protection. The disability need only substantially limit any major life activity — not specifically academic performance.' },
          { id: 'o4', label: 'Refer to the school counselor for support with managing absences', isCorrect: false, explanation: 'Counseling may be a useful supplement, but does not address the structural accommodation need created by the health condition.' },
        ],
      },
    ],
  },

];

// ─── Pack 4: attach derived ETS objective ids ─────────────────────────────────
// Each module's `etsTopicIds` comes from moduleEtsTopicMap.json (derived from the verified
// questionObjectiveMap + primaryModuleId routing; regenerate with derive-module-ets-topics.mjs).
// Provisional + SME-confirmable; descriptive only — never read by scoring (objectiveBoundaryGuard).
{
  const derived = (moduleEtsTopicMap as { modules: Record<string, { etsTopicIds: string[] }> }).modules;
  for (const m of LEARNING_MODULES) {
    const ids = derived[m.id]?.etsTopicIds;
    if (ids?.length) m.etsTopicIds = ids;
  }
}

// ─── Module Lookup Map ─────────────────────────────────────────────────────────

export const MODULE_LOOKUP: Record<string, LearningModule> = Object.fromEntries(
  LEARNING_MODULES.map(m => [m.id, m])
);

// ─── Skill → Module ID Mapping ────────────────────────────────────────────────
//
// Maps each app skill ID (from progressTaxonomy.ts) to an ordered list of
// module IDs. The first module listed is the PRIMARY lesson for that skill.
// Additional modules are supplemental context shown in the help drawer.
//
// When updating skills or adding new modules, update this mapping.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Curated overrides for module → primarySkillId (the canonical owner).
 *
 * Default derivation (see scripts/migrations or modulePrimarySkill test): a module owned as
 * the index-0 (primary) module of exactly one skill goes to that skill; otherwise the
 * referencing skill with the greatest question volume wins (lexical tie-break). These five
 * modules are exceptions where the topically-correct owner is clearer than raw volume.
 * Every override here is still one of the module's SKILL_MODULE_MAP referencing skills.
 */
export const MODULE_PRIMARY_OVERRIDES: Record<string, { skillId: string; rationale: string }> = {
  'MOD-D1-01': { skillId: 'LEG-01', rationale: 'FERPA / records confidentiality is the core topic (over DBD-10 records review)' },
  'MOD-D1-06': { skillId: 'PSY-03', rationale: 'problem-solving framework / MTSS in assessment is the core topic (over SWP-04)' },
  'MOD-D8-01': { skillId: 'PSY-04', rationale: 'assessment of culturally & linguistically diverse students is the core topic' },
  'MOD-D10-01': { skillId: 'LEG-02', rationale: 'IDEA / special-education law is the core topic (over DIV-05/LEG-03)' },
  'MOD-D10-03': { skillId: 'ETH-01', rationale: 'NASP ethics & ethical problem-solving is the core topic (over ETH-02)' },
};

export const SKILL_MODULE_MAP: Record<string, string[]> = {
  // ── Professional Practices (App Domain 1) ──────────────────────────────────
  'CON-01': ['MOD-D2-01', 'MOD-D2-02', 'MOD-D2-03', 'MOD-D2-04'],
  'DBD-01': ['MOD-D9-04', 'MOD-D1-02', 'MOD-D1-09'],
  'DBD-03': ['MOD-D1-07', 'MOD-D1-11', 'MOD-D8-02'],
  'DBD-05': ['MOD-D1-10', 'MOD-D1-11', 'MOD-D1-12'],
  'DBD-06': ['MOD-D1-04', 'MOD-D1-05', 'MOD-D4-06'],
  'DBD-07': ['MOD-D1-03', 'MOD-D4-02', 'MOD-D4-03'],
  'DBD-08': ['MOD-D1-02', 'MOD-D1-09', 'MOD-D9-04'],
  'DBD-09': ['MOD-D1-14', 'MOD-D8-01', 'MOD-D7-01'],
  'DBD-10': ['MOD-D1-13', 'MOD-D1-01', 'MOD-D10-04', 'MOD-D10-05'],
  'PSY-01': ['MOD-D1-15', 'MOD-D1-07', 'MOD-D1-08', 'MOD-D9-02'],
  'PSY-02': ['MOD-D1-08', 'MOD-D9-03'],
  'PSY-03': ['MOD-D1-06', 'MOD-D5-02', 'MOD-D9-04'],
  'PSY-04': ['MOD-D8-01', 'MOD-D8-02', 'MOD-D8-03'],

  // ── Student-Level Services (App Domain 2) ──────────────────────────────────
  'ACA-02': ['MOD-D3-04', 'MOD-D10-06'],
  'ACA-03': ['MOD-D3-06', 'MOD-D1-10'],
  'ACA-04': ['MOD-D3-01', 'MOD-D3-02'],
  'ACA-06': ['MOD-D3-05', 'MOD-D4-02'],
  'ACA-07': ['MOD-D3-02', 'MOD-D8-01'],
  'ACA-08': ['MOD-D1-10', 'MOD-D4-06'],
  'ACA-09': ['MOD-D4-10', 'MOD-D4-06', 'MOD-D8-04'],
  'DEV-01': ['MOD-D4-09'],
  'MBH-02': ['MOD-D4-11', 'MOD-D4-01', 'MOD-D4-07', 'MOD-D4-08'],
  'MBH-03': ['MOD-D4-01', 'MOD-D4-02', 'MOD-D4-03', 'MOD-D4-04'],
  'MBH-04': ['MOD-D4-05', 'MOD-D4-06', 'MOD-D4-09'],
  'MBH-05': ['MOD-D4-06'],

  // ── Systems-Level Services (App Domain 3) ──────────────────────────────────
  'FAM-02': ['MOD-D7-01', 'MOD-D7-02'],
  'FAM-03': ['MOD-D2-04', 'MOD-D7-01'],
  'SAF-01': ['MOD-D5-01', 'MOD-D4-05', 'MOD-D6-04', 'MOD-D5-03'],
  'SAF-03': ['MOD-D6-03', 'MOD-D4-07', 'MOD-D4-08'],
  'SAF-04': ['MOD-D6-01', 'MOD-D6-02', 'MOD-D6-03'],
  'SWP-02': ['MOD-D3-03', 'MOD-D5-02'],
  'SWP-03': ['MOD-D5-05', 'MOD-D5-01', 'MOD-D5-03', 'MOD-D9-05'],
  'SWP-04': ['MOD-D1-06', 'MOD-D5-02', 'MOD-D5-04'],

  // ── Foundations of School Psychology (App Domain 4) ───────────────────────
  'DIV-01': ['MOD-D8-05', 'MOD-D8-01', 'MOD-D8-03', 'MOD-D7-01'],
  'DIV-03': ['MOD-D5-04', 'MOD-D8-03'],
  'DIV-05': ['MOD-D8-04', 'MOD-D10-01', 'MOD-D10-06'],
  'ETH-01': ['MOD-D10-03', 'MOD-D10-07'],
  'ETH-02': ['MOD-D10-09', 'MOD-D10-03', 'MOD-D10-07'],
  'ETH-03': ['MOD-D10-07'],
  'LEG-01': ['MOD-D1-01', 'MOD-D10-04', 'MOD-D10-05'],
  'LEG-02': ['MOD-D10-01', 'MOD-D10-02', 'MOD-D10-06'],
  'LEG-03': ['MOD-D10-10', 'MOD-D10-01', 'MOD-D10-06'],
  'LEG-04': ['MOD-D10-08', 'MOD-D10-02'],
  'RES-02': ['MOD-D9-05'],
  'RES-03': ['MOD-D9-01', 'MOD-D9-02', 'MOD-D9-03'],
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Returns the primary module for a given skill ID, or null if unmapped.
 * The primary module is the first entry in SKILL_MODULE_MAP[skillId].
 */
export function getPrimaryModuleForSkill(skillId: string): LearningModule | null {
  const ids = SKILL_MODULE_MAP[skillId];
  if (!ids || ids.length === 0) return null;
  return MODULE_LOOKUP[ids[0]] ?? null;
}

/**
 * Returns all modules mapped to a given skill ID.
 */
export function getAllModulesForSkill(skillId: string): LearningModule[] {
  const ids = SKILL_MODULE_MAP[skillId] ?? [];
  return ids.map(id => MODULE_LOOKUP[id]).filter(Boolean) as LearningModule[];
}

/**
 * Returns the module IDs mapped to a skill (for display in the Learning Path).
 */
export function getModuleIdsForSkill(skillId: string): string[] {
  return SKILL_MODULE_MAP[skillId] ?? [];
}

/**
 * Reverse lookup: given a module ID, returns the first skill that maps to it.
 * Useful for opening the SkillHelpDrawer from a module reference when no
 * practiceSkillId is available (e.g., domain practice mode).
 */
export function getSkillForModule(moduleId: string): string | null {
  for (const [skillId, moduleIds] of Object.entries(SKILL_MODULE_MAP)) {
    if (moduleIds.includes(moduleId)) return skillId;
  }
  return null;
}
