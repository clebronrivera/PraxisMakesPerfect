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
      { type: 'comparison', leftHeader: 'Who CAN access records (FERPA)', rightHeader: 'Who CANNOT — even if qualified', rows: [{ left: 'School officials with legitimate educational interest; the student\'s parents/guardians; the student (at age 18)', right: 'A neighbor who happens to be a reading specialist; anyone without a formal need-to-know in the student\'s case' }] },
      {
        type: 'interactive',
        interactiveType: 'scenario-sorter',
        label: 'FERPA Access Control',
        prompt: 'Sort each access request into the correct category.',
        scenarios: [
          { id: 's1', text: 'School counselor requests the student\'s IEP to coordinate services', category: 'ALLOWED' },
          { id: 's2', text: 'Parent asks to see their child\'s test protocols and answer sheets', category: 'ALLOWED' },
          { id: 's3', text: 'A teaching assistant without assigned responsibilities shares test results with an unrelated teacher', category: 'VIOLATION' },
          { id: 's4', text: 'School psychologist shares comprehensive eval results with parents at an IEP meeting', category: 'ALLOWED' },
          { id: 's5', text: 'Community counselor not employed by the school calls to request student behavior data', category: 'VIOLATION' },
          { id: 's6', text: 'Student at age 18 requests their own educational records', category: 'ALLOWED' },
        ],
        categories: ['ALLOWED (FERPA permits)', 'VIOLATION (FERPA prohibits)'],
      },
      { type: 'anchor', label: 'Memory anchor', text: 'FERPA = Family Educational Records Protected Always. If there is no formal authorization, the answer is almost always FERPA.' },
    ],
  },

  {
    id: 'MOD-D1-02',
    primarySkillId: 'DBD-08',
    title: 'RTI Data: Universal Screening vs. Progress Monitoring',
    sections: [
      { type: 'paragraph', text: 'Response to Intervention (RTI) runs on two specific data engines. Get these terms exactly right — the exam uses both and will offer plausible-sounding alternatives.' },
      { type: 'comparison', leftHeader: 'Universal Screening', rightHeader: 'Progress Monitoring', rows: [{ left: 'A brief, low-cost assessment given to all students at the same time. Purpose: identify who may be at risk before problems become serious.', right: 'Frequent, repeated assessments on a specific skill for students already receiving intervention. Purpose: track whether the intervention is working.' }] },
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
      { type: 'anchor', label: 'The trap', text: 'Answer choices like "Universal Monitoring" or "Progress Screening" sound real but are not valid RTI terms. If you see either of those, eliminate them immediately.' },
    ],
  },

  {
    id: 'MOD-D1-03',
    primarySkillId: 'DBD-07',
    title: 'Functional Behavioral Assessment (FBA): Required First Step',
    sections: [
      { type: 'paragraph', text: 'Before writing any formal behavior support plan, a school psychologist must conduct a Functional Behavioral Assessment. This is not optional — it is the legally expected and best-practice foundation for any individualized behavior plan.' },
      { type: 'paragraph', text: 'An FBA identifies the ABCs of behavior: Antecedent (what triggers the behavior), Behavior (the specific observable action), and Consequence (what follows and may be maintaining it). Without understanding function, any intervention is a guess.' },
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
      { type: 'anchor', label: 'Why the other answers fail', text: '"Social-emotional assessment" describes a different domain. "Executive function assessment" is a cognitive measure. "School psychology behavior evaluation" is not a standard term. Only FBA directly answers the question of behavioral function.' },
    ],
  },

  {
    id: 'MOD-D1-04',
    primarySkillId: 'DBD-06',
    title: 'Starting Broad: Why the BASC Comes First',
    sections: [
      { type: 'paragraph', text: 'When a student presents with multiple concerns — withdrawal, sadness, AND anxiety — the correct starting tool is a broad-spectrum behavioral and emotional assessment. The Behavior Assessment System for Children (BASC) is the gold-standard choice because it captures a wide range of internalizing and externalizing concerns across multiple raters.' },
      { type: 'paragraph', text: 'Narrow-band tools like the Beck Depression Inventory or the CDI-2 are valuable supplements, but they only measure one thing. Starting narrow risks missing the larger picture. The BASC opens the case; targeted tools deepen it.' },
      {
        type: 'interactive',
        interactiveType: 'click-selector',
        label: 'Assessment Tool Selector',
        prompt: 'For each scenario, which assessment tool should you start with?',
        options: [
          { id: 'basc-multi', label: 'BASC-3 (Broad-spectrum)', explanation: 'Best for: Multiple symptoms (anxiety + depression + withdrawal). Captures wide range across multiple raters.', isCorrect: true },
          { id: 'cdi-narrow', label: 'CDI-2 (Narrow - Depression)', explanation: 'Useful for: Following up on a specific symptom after broad screening, but misses the full picture.' },
          { id: 'beck-narrow', label: 'Beck Inventory (Narrow - Anxiety)', explanation: 'Useful for: Deep dive on one symptom, but starts too narrow when multiple concerns exist.' },
        ],
      },
      { type: 'anchor', label: 'Clinical logic', text: 'Multiple symptoms = broad tool first. Single symptom = narrow tool may be appropriate. If a question lists anxiety AND depression AND withdrawal together, the answer is almost always the BASC.' },
    ],
  },

  {
    id: 'MOD-D1-05',
    primarySkillId: 'DBD-06',
    title: 'Vineland Discrepancies: Rater Perception Differences',
    sections: [
      { type: 'paragraph', text: 'When a parent and teacher complete the same adaptive behavior scale (e.g., Vineland) and the scores differ significantly, the most defensible interpretation is that the raters perceive the child\'s behavior differently across different environments — not that the test is broken.' },
      { type: 'paragraph', text: 'Standard error of measurement exists in every test, but SEM does not typically account for a 20+ point difference between raters. Contextual differences are real, but when scores vary dramatically even between the two parents, the most likely explanation is subjective perception differences between raters.' },
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
      { type: 'paragraph', text: 'Tier 1 of the Multi-Tiered System of Supports is universal — it applies to ALL students. It emphasizes clear expectations, explicit and direct instruction, and corrective feedback for the entire school population. The defining feature of Tier 1 is its universal, preventive nature.' },
      { type: 'paragraph', text: 'Tier 3 is intensive and individualized. When you see the word "intensive" or "specific students" in an answer choice about MTSS, that is a Tier 3 signal — it does not belong at Tier 1.' },
      { type: 'comparison', leftHeader: 'Tier 1 (Universal)', rightHeader: 'Tier 3 (Intensive)', rows: [{ left: 'Clear learning expectations • Explicit/direct instruction • Corrective feedback • Evidence-based for all students', right: 'Evidence-based interventions aligned to intensive needs of specific students • Individualized plans • Frequent progress monitoring' }] },
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
      { type: 'paragraph', text: 'On most mainstream cognitive assessments, the normative mean is 100 with a standard deviation of 15. Here is how key benchmark scores translate:' },
      { type: 'list', items: ['SS 130+ = Very Superior (2 SDs above mean)', 'SS 115–129 = Above Average / High Average', 'SS 85–115 = Average range', 'SS 70–84 = Below Average / Borderline', 'SS 69 and below = Intellectual Disability range (2+ SDs below mean)'] },
      { type: 'paragraph', text: 'A score of 61 sits firmly in the intellectual disability range. A score of 85 is at the 16th percentile — low average, but not a disability range score. These distinctions matter enormously on the exam.' },
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
      { type: 'anchor', label: 'Memory anchor', text: 'The mean is 100. Every 15 points is one standard deviation. Two SDs below = 70. That is the ID threshold. Know these numbers cold.' },
    ],
  },

  {
    id: 'MOD-D1-08',
    primarySkillId: 'PSY-02',
    title: 'Reliability and Validity: What the Numbers Mean',
    sections: [
      { type: 'paragraph', text: 'Psychometric adequacy is judged by specific coefficient benchmarks. Test-retest reliability of 0.79 is acceptable but on the lower end of convention — most experts prefer 0.80 or higher. A convergent validity coefficient of 0.58 indicates only moderate association between the new test and the established one.' },
      { type: 'paragraph', text: 'When validity is only moderate (below 0.70), practitioners should be cautious about recommending a new test solely on that basis. The correct answer frames this as a moderate relationship that is not strong enough to endorse the new test.' },
      { type: 'comparison', leftHeader: 'Reliability (consistency)', rightHeader: 'Validity (accuracy)', rows: [{ left: 'Coefficient should be ≥0.80 ideally. A coefficient of 0.79 is acceptable but marginal. Measures whether the test gives consistent scores.', right: 'Coefficient of 0.70+ preferred. A coefficient of 0.58 is moderate — the new test is correlated with the old one, but not strongly enough to confidently replace it.' }] },
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
      { type: 'paragraph', text: 'A Curriculum-Based Measurement is a brief, repeatable assessment taken directly from a student\'s own curriculum materials. It measures how a student is progressing in basic academic skills over time — reading fluency, math computation, spelling.' },
      { type: 'paragraph', text: 'CBMs supplement standardized testing; they do not replace it. They are local-norm referenced (compared to classmates or grade peers), not national norm referenced. A CBM reading probe uses a passage from the classroom\'s own reading program — not a nationally standardized passage.' },
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
      { type: 'paragraph', text: 'Working memory is the cognitive ability to hold and manipulate information in an active mental workspace while simultaneously completing a task. It is distinct from short-term memory (passive holding) and long-term memory (stored information).' },
      { type: 'paragraph', text: 'On cognitive assessments like the WISC or WJ, working memory tasks might ask a student to hear a string of numbers, then repeat them backward — holding the information while mentally reorganizing it. This is the classic working memory demand.' },
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
      { type: 'anchor', label: 'Common confusion', text: 'Processing speed measures how fast a student completes simple tasks. Working memory measures how much information a student can hold while doing something with it. These are separate cognitive factors that are often both impaired in students with ADHD or learning disabilities.' },
    ],
  },

  {
    id: 'MOD-D1-11',
    primarySkillId: 'DBD-03',
    title: 'Matrices Subtests = Nonverbal / Fluid Reasoning',
    sections: [
      { type: 'paragraph', text: 'Matrix Reasoning subtests (found on the WISC, DAS, and other cognitive batteries) require the student to identify a missing piece of a visual pattern — rows and columns of shapes, designs, or objects with a piece removed. The student must reason by induction and analogy to solve the pattern.' },
      { type: 'paragraph', text: 'This is considered a measure of fluid reasoning (Gf) — the ability to solve novel problems without relying on previously learned facts. It is primarily a nonverbal task, though some verbal mediation may occur internally.' },
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
      { type: 'anchor', label: 'Memory anchor', text: "Matrices = patterns = nonverbal/fluid reasoning. If you see the word 'novel problem-solving,' think right hemisphere of the brain, fluid reasoning, and nonverbal." },
    ],
  },

  {
    id: 'MOD-D1-12',
    primarySkillId: 'DBD-05',
    title: 'Projective Tests: Supplementary, Not Standalone',
    sections: [
      { type: 'paragraph', text: 'Projective tests (Rorschach, Draw-a-Person, Sentence Completion) have a legitimate but limited role in school psychological assessment. They are best used to gather supplementary qualitative information — additional texture and hypotheses about a student\'s inner life.' },
      { type: 'paragraph', text: 'They should not be used as the sole basis for a diagnosis or eligibility determination. Their psychometric properties are more variable than standardized tests, but that does not make them useless — it makes them supplementary.' },
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
      { type: 'paragraph', text: 'When a school psychologist begins a professional consultation with a teacher, the recommended starting framework is nonhierarchical and collaborative. This means both the psychologist and the consultee (teacher) are treated as equal experts — the psychologist brings psychological knowledge; the teacher brings knowledge of the student and classroom context.' },
      { type: 'paragraph', text: 'This model promotes shared problem ownership, which makes intervention follow-through far more likely than a top-down expert model.' },
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
      { type: 'anchor', label: 'The exam cue word', text: "When you see 'collaboration' or 'collaborative' in an answer choice about consultation, that is almost always the correct direction. The nonhierarchical collaborative model is the go-to starting framework." },
    ],
  },

  {
    id: 'MOD-D2-02',
    primarySkillId: 'CON-01',
    title: 'Consultee-Centered Consultation: Building the Teacher, Not Solving the Problem',
    sections: [
      { type: 'paragraph', text: "In a consultee-centered model, the goal is not just to fix one student's problem — it is to develop the consultee's (usually the teacher's) own skills and capacities so they can address similar situations independently in the future." },
      { type: 'paragraph', text: 'This is different from a student-centered model (focused on the individual child) or a systems-level model (focused on the organization). When the question mentions building a teacher\'s skills or reducing dependence on the psychologist, consultee-centered is the answer.' },
      { type: 'comparison', leftHeader: 'Consultee-Centered', rightHeader: 'Student-Centered', rows: [{ left: "Goal: build the teacher's capacity. Psychologist teaches skills and frameworks so the teacher can handle future cases independently.", right: "Goal: solve this specific student's problem. The psychologist focuses directly on assessment and intervention for the individual." }] },
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
    title: 'Professional Learning Communities (PLCs): The Three Driving Questions',
    sections: [
      { type: 'paragraph', text: 'PLCs are collaborative professional development structures in which staff meet regularly to examine data and improve student outcomes. They are driven by three specific questions:' },
      { type: 'list', items: ['What do we want each student to learn?', 'How will we know when each student has learned it?', 'How will we respond when a student experiences difficulty in learning?'] },
      { type: 'paragraph', text: 'PLCs are not prescriptive about data collection methods or presentation formats — they set goals and let professionals determine how to get there. A question about how data will be collected and presented is not one of the three driving questions.' },
      {
        type: 'interactive',
        interactiveType: 'drag-to-order',
        label: 'PLC Driving Questions Sequence',
        prompt: 'Arrange the three PLC driving questions in the correct order of focus.',
        items: [
          'Question 1: What do we want each student to learn? (Define learning goals)',
          'Question 2: How will we know when each student has learned it? (Measure success)',
          'Question 3: How will we respond when a student experiences difficulty in learning? (Intervene)',
        ],
      },
      { type: 'anchor', label: 'Memory anchor', text: 'The three PLC questions focus on WHAT students learn, HOW we know they learned it, and WHAT we do when they struggle. Anything about data mechanics or presentation format is outside these three.' },
    ],
  },

  {
    id: 'MOD-D2-04',
    primarySkillId: 'FAM-03',
    title: 'Systemic Drug Prevention: Community Coalition Over Classroom Talks',
    sections: [
      { type: 'paragraph', text: 'When a school psychologist faces a community-wide substance abuse problem affecting multiple families and students, the most effective intervention is not a single classroom program or a teacher training — it is a broad-spectrum coalition that brings together parents, school staff, and community partners.' },
      { type: 'paragraph', text: 'This aligns with systems-level thinking: the most powerful and durable interventions address problems at multiple levels simultaneously. A school psychologist who works in isolation misses the leverage that community support provides.' },
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
      { type: 'paragraph', text: 'Explicit and systematic instruction is the gold standard for teaching foundational academic skills, particularly reading and math. Explicit means skills are taught directly and clearly — nothing is left to be discovered by the student. Systematic means the instruction follows a deliberate sequence, building from simpler to more complex skills.' },
      { type: 'paragraph', text: "'Drill and practice' has a place, but it is not a complete instructional approach. 'Implicit and direct' is not a valid educational term. 'Analysis and synthesis' describes thinking skills, not an instructional delivery method." },
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
      { type: 'anchor', label: 'Key terms to recognize', text: 'Direct instruction, explicit instruction, systematic instruction — these terms are interchangeable in this context and always represent the correct answer when asked about evidence-based teaching.' },
    ],
  },

  {
    id: 'MOD-D3-02',
    primarySkillId: 'ACA-07',
    title: 'Reading Programs: Phonological Processing Comes First',
    sections: [
      { type: 'paragraph', text: 'For beginning readers, the most research-supported foundation is phonological processing — the ability to hear, identify, and manipulate the sound structure of language. Phonemic awareness (awareness of individual sounds/phonemes) is the most critical early reading skill.' },
      { type: 'paragraph', text: 'Programs that emphasize phonological processes outperform whole-language or meaning-based approaches in early reading development, particularly for students at risk for dyslexia.' },
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
      { type: 'anchor', label: 'Dyslexia connection', text: 'The hallmark of dyslexia is a phonological processing deficit. Reading programs that target phonological awareness and phoneme-grapheme correspondence are the evidence-based first choice for struggling readers.' },
    ],
  },

  {
    id: 'MOD-D3-03',
    primarySkillId: 'SWP-02',
    title: 'Grade Retention: NASP Does Not Endorse It',
    sections: [
      { type: 'paragraph', text: 'The National Association of School Psychologists does not endorse grade retention as an effective intervention. Research consistently shows that retention does not produce lasting academic gains and carries significant social-emotional costs for students.' },
      { type: 'paragraph', text: "When a parent asks whether to hold a child back, the psychologist's role is to advocate for evidence-based interventions first and to document whether those interventions are working before any retention decision is considered." },
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
      { type: 'anchor', label: 'Exam rule of thumb', text: "Any answer choice that endorses retention as a primary or recommended strategy is almost certainly wrong. NASP's position is to try interventions first and document their effectiveness." },
    ],
  },

  {
    id: 'MOD-D3-04',
    primarySkillId: 'ACA-02',
    title: "Accommodations vs. Modifications — Giving Students a Voice",
    sections: [
      { type: 'paragraph', text: 'When a student with a disability (such as a visual impairment) is given a challenging assignment, best practice is to involve the student in identifying appropriate accommodations. Students who have input into their own learning experience stronger ownership and better outcomes.' },
      { type: 'paragraph', text: "Excusing the student entirely removes an important learning opportunity. Assigning an entirely different task treats the student as incapable. Helping without explicit accommodation discussion bypasses the student's right to participate in their own education plan." },
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
    ],
  },

  {
    id: 'MOD-D3-05',
    primarySkillId: 'ACA-06',
    title: 'Intrinsic Motivation: Why Choice Beats Candy',
    sections: [
      { type: 'paragraph', text: 'Research on motivation shows that tangible rewards (stickers, candy, prizes) can actually undermine intrinsic motivation by shifting a student\'s focus from the activity itself to the external reward. When the reward disappears, motivation often collapses.' },
      { type: 'paragraph', text: 'Cognitive approaches — particularly giving students choice — are more effective for building lasting intrinsic motivation. Choice gives students a sense of autonomy and control, which is one of the three core components of self-determination theory (autonomy, competence, relatedness).' },
      { type: 'comparison', leftHeader: 'Builds Intrinsic Motivation', rightHeader: 'Can Undermine Intrinsic Motivation', rows: [{ left: 'Choice • Autonomy • Mastery-oriented feedback • Self-regulation strategies', right: 'Tangible rewards • Token economies (when overused) • Praise that is controlling rather than informational' }] },
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
      { type: 'paragraph', text: 'Chunking is a well-researched memory strategy in which information is grouped into meaningful clusters to reduce the burden on working memory. The classic example is a phone number: rather than remembering ten individual digits, we remember three chunks (area code, prefix, number).' },
      { type: 'paragraph', text: 'When students need to memorize a long sequence of information, chunking is the most evidence-supported strategy because it aligns with how working memory actually operates — in units, not in endless individual pieces.' },
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
      { type: 'anchor', label: 'Memory anchor', text: 'Think of a phone number: 555-867-5309. Not ten digits — three chunks. That is chunking. The exam will ask about memory strategies and this is the answer for long series of information.' },
    ],
  },

  // ── Domain 4: Mental & Behavioral Health Services ─────────────────────────

  {
    id: 'MOD-D4-01',
    primarySkillId: 'MBH-03',
    title: 'CBT: The Most Supported School-Based Counseling Approach',
    sections: [
      { type: 'paragraph', text: 'Cognitive Behavioral Therapy is the most extensively researched and widely adopted psychotherapy approach in school psychology. It is grounded in the principle that thoughts, feelings, and behaviors are interconnected — changing maladaptive thought patterns leads to changes in both emotional states and behavior.' },
      { type: 'paragraph', text: 'CBT is short-term, goal-oriented, and skills-focused. It emphasizes active practice, homework, and building coping strategies the student can use independently after treatment ends.' },
      { type: 'comparison', leftHeader: 'CBT Is Best For', rightHeader: 'What CBT Is Not', rows: [{ left: 'Anxiety • Depression • Social skill deficits • Phobias • Assertiveness training • Selective mutism (with behavioral components)', right: 'It is not psychodynamic (unconscious drives). It is not purely behavioral (consequences only). It is not person-centered (unconditional positive regard).' }] },
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
      { type: 'paragraph', text: 'These two terms are among the most commonly confused in all of school psychology. The key is this: reinforcement — whether positive or negative — always INCREASES a behavior. Punishment always DECREASES a behavior.' },
      { type: 'paragraph', text: 'Negative reinforcement removes an aversive stimulus to increase a desired behavior. Example: a car\'s seatbelt alarm stops when you buckle up. The alarm (aversive stimulus) is removed, which increases seatbelt-buckling behavior. That is negative reinforcement.' },
      { type: 'comparison', leftHeader: 'Negative Reinforcement', rightHeader: 'Punishment', rows: [{ left: 'Removes something unpleasant → INCREASES a behavior. Example: a nagging reminder stops when the child completes homework — increases homework completion.', right: 'Adds something unpleasant (or removes something pleasant) → DECREASES a behavior. Example: removing recess privileges to decrease talking out of turn.' }] },
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
    ],
  },

  {
    id: 'MOD-D4-04',
    primarySkillId: 'MBH-03',
    title: 'Reinforcement Fading: Teaching Independence',
    sections: [
      { type: 'paragraph', text: 'A hallmark of effective behavioral intervention is a planned exit strategy. After a new behavior is established using prompts and reinforcers, those supports must be systematically removed (faded) so the student can perform the behavior independently without external scaffolding.' },
      { type: 'paragraph', text: 'The correct sequence is: teach with prompts and reinforcers → confirm the behavior is stable → gradually fade prompts and reinforcers → confirm independent performance. Skipping the fading step creates dependency on the support system.' },
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
      { type: 'anchor', label: 'Memory anchor', text: 'Fade gradually, never abruptly. Removing reinforcement too quickly triggers extinction and regression. Move from continuous to intermittent reinforcement as the behavior stabilizes, then transfer to naturally occurring reinforcers.' },
    ],
  },

  {
    id: 'MOD-D4-05',
    primarySkillId: 'MBH-04',
    title: 'Bullying: An Abuse of Power, Not Just Aggression',
    sections: [
      { type: 'paragraph', text: 'Bullying has a specific conceptual definition in the research literature that differentiates it from general aggression or conflict. The defining features are: repetition (not a one-time incident), intentionality, and — critically — an imbalance of power between the aggressor and the target.' },
      { type: 'paragraph', text: 'Bullying is not the same as fighting, bantering, or general conflict. It is aggression characterized by a consistent abuse of power. This framing has implications for intervention: addressing bullying requires addressing the power dynamic, not just the behavior.' },
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
    ],
  },

  {
    id: 'MOD-D4-08',
    primarySkillId: 'SAF-03',
    title: 'Confidentiality Limits: When to Breach and When Not To',
    sections: [
      { type: 'paragraph', text: 'Confidentiality in counseling has specific, defined exceptions. A psychologist must breach confidentiality when there is a risk of harm to the student or others. The exceptions include:' },
      { type: 'list', items: ['Suicidal ideation or self-harm with intent', 'Threats of violence toward a specific, identifiable person (duty to warn)', 'Disclosure of abuse (mandated reporting)', 'A court order'] },
      { type: 'paragraph', text: "Confidentiality is NOT breached because a student reveals their sexual orientation, discusses interpersonal conflicts with no violence threat, or shares information that is uncomfortable but not dangerous. Always explain confidentiality limits at the very first meeting." },
      { type: 'anchor', label: 'Exam rule', text: 'Disclosing that a student is gay is NOT a breach situation. Thoughts of minor self-harm (scratching) may require clinical judgment. A specific threat of physical violence against another student IS a breach situation.' },
    ],
  },

  {
    id: 'MOD-D4-09',
    primarySkillId: 'DEV-01',
    title: "Erikson's Stages: School-Age Reference Card",
    sections: [
      { type: 'paragraph', text: "Erikson's psychosocial theory is a consistent source of exam questions. Know the school-age stages by their age ranges and core challenges:" },
      { type: 'list', items: ['Industry vs. Inferiority (6–12 years, elementary school): Children learn to be competent and productive. Success builds industry; failure builds feelings of inferiority.', 'Initiative vs. Guilt (3–5 years, preschool): Children take on new tasks and assert themselves. Excessive criticism creates guilt.', 'Identity vs. Role Confusion (13–18 years, high school): Adolescents explore who they are and where they fit in the world.', 'Trust vs. Mistrust (0–18 months): Infants learn whether the world is safe and reliable.'] },
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
      { type: 'paragraph', text: 'Positive Behavioral Interventions and Supports is the system-wide framework endorsed by NASP for promoting positive student behavior across an entire school. PBIS is proactive, data-driven, and tiered — it matches the intensity of support to the level of student need.' },
      { type: 'paragraph', text: 'PBIS is explicitly endorsed by NASP. Tracking (grouping students by ability), zero tolerance (automatic severe punishment), and retention are not endorsed. When the question asks which school-wide practice NASP supports, PBIS is the answer.' },
      { type: 'anchor', label: 'PBIS core features (exam targets)', text: 'Clear, positively stated expectations • Consistent staff acknowledgment of expected behavior • Data used to make decisions • Tiered support system. Note: parent volunteering is a benefit but is NOT a core PBIS feature on the exam.' },
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
    ],
  },

  {
    id: 'MOD-D5-04',
    primarySkillId: 'DIV-03',
    title: 'Disproportionality: Group Membership and Unequal Outcomes',
    sections: [
      { type: 'paragraph', text: 'Disproportionality refers to group differences in specific educational outcomes or in individuals\' risk for those outcomes based on group membership (race, ethnicity, socioeconomic status, language background, etc.). This is not about individual unfairness — it is about systemic patterns that affect entire groups at higher or lower rates than their proportion of the population.' },
      { type: 'paragraph', text: 'The most common example in school psychology is disproportionate representation of minority students in special education, discipline, and gifted programs. NASP considers addressing disproportionality a core social justice obligation.' },
      { type: 'anchor', label: 'Key distinction', text: "Disproportionality is not the same as 'racial privilege' (a sociological concept) or simply 'socioeconomic status.' It specifically refers to differential group outcomes or risk levels based on group membership. Know the definition precisely." },
    ],
  },

  {
    id: 'MOD-D5-05',
    primarySkillId: 'SWP-03',
    title: 'Selecting and Monitoring Evidence-Based Schoolwide Practices',
    sections: [
      { type: 'anchor', label: 'The distinction the exam tests', text: 'An evidence-based practice implemented without fidelity is not evidence-based practice. Two different skills are required: selecting a practice with research support, then monitoring that it is being implemented correctly and producing results. Many schools do the first; fewer do the second.' },
      { type: 'paragraph', text: 'A practice qualifies as evidence-based when peer-reviewed research — ideally randomized controlled trials replicated across settings and populations — demonstrates that it produces better outcomes than comparison conditions. Key registries: What Works Clearinghouse (WWC) for academic programs and instructional practices; SAMHSA\'s National Registry of Evidence-based Programs and Practices (NREPP) for mental health and substance use programs; CASEL\'s program guide for social-emotional learning. The right starting question is not "Is this popular?" but "Does rigorous research support this practice for students like ours, with this presenting concern, in a school context?"' },
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
    ],
  },

  {
    id: 'MOD-D6-02',
    primarySkillId: 'SAF-04',
    title: 'Suicide Contagion: The First Priority After a Student Death',
    sections: [
      { type: 'paragraph', text: 'When a student dies by suicide, the immediate priority for school staff is planning to prevent contagion effects — the risk that other vulnerable students may be influenced toward suicidal behavior by exposure to news of the death. Before making announcements or providing direct support to classmates, key staff must be briefed to identify at-risk students.' },
      { type: 'paragraph', text: 'A school-wide assembly about the suicide is strongly contraindicated. It glamorizes the event, increases exposure for sensitive students, and can inadvertently increase contagion risk. Instead, targeted support spaces and individual counseling are provided.' },
      { type: 'comparison', leftHeader: 'Do', rightHeader: 'Do NOT', rows: [{ left: 'Discuss contagion risk with key staff first • Identify at-risk students • Provide in-school counseling spaces • Give verifiable facts without sensationalizing', right: 'Hold a school-wide assembly • Announce details over the intercom • Share extensive details about the method • Memorialize in ways that glamorize' }] },
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
    ],
  },

  {
    id: 'MOD-D7-02',
    primarySkillId: 'FAM-02',
    title: 'Mandated Reporting: Your Personal Duty Cannot Be Delegated',
    sections: [
      { type: 'paragraph', text: 'As a school psychologist, you are a mandated reporter. When you have reasonable suspicion of child abuse or neglect, you have a personal, non-delegable legal duty to report to police or child protective services (social services). Telling the principal or the school social worker is not sufficient to discharge your legal obligation.' },
      { type: 'paragraph', text: 'You do not need proof — reasonable suspicion is enough. You do not need to investigate — that is the job of child protective services. You report; investigators investigate.' },
      { type: 'anchor', label: 'Common misconception', text: 'Many new practitioners believe that reporting to their principal or school social worker fulfills the mandated reporter obligation. It does not. You must personally ensure a report is made to the appropriate legal authority (police or CPS), even if a colleague is also reporting.' },
    ],
  },

  // ── Domain 8: Diversity in Development & Learning ────────────────────────

  {
    id: 'MOD-D8-01',
    primarySkillId: 'PSY-04',
    title: 'Testing ELL and Diverse Students: Caution and Cultural Humility',
    sections: [
      { type: 'paragraph', text: 'When assessing students from diverse cultural backgrounds, standardized tests may underrepresent their true abilities due to cultural loading in test content, language demands, and norming samples that may not reflect the student\'s background.' },
      { type: 'paragraph', text: "The correct approach is not to refuse to use standardized tests entirely — it is to interpret results cautiously and to supplement formal measures with informal, culturally responsive data. Use both formal and informal measures, use assessments normed on appropriate populations when available, and never make high-stakes decisions based on a single test score." },
      { type: 'anchor', label: 'For English Language Learners specifically', text: "Use informal measures alongside appropriately normed standardized assessments. Interpreters should be proficient in both languages. Consider the student's developmental history, teacher data, and parent interviews. Use nonverbal tests as supplements when language is a confounding factor." },
    ],
  },

  {
    id: 'MOD-D8-02',
    primarySkillId: 'DBD-03',
    title: 'The Universal Nonverbal Intelligence Test (UNIT) for Special Populations',
    sections: [
      { type: 'paragraph', text: 'When assessing a student who is deaf, hard of hearing, or a non-English speaker, standard verbal cognitive batteries are inappropriate as primary tools because they conflate language ability with intelligence. The Universal Nonverbal Intelligence Test (UNIT) was designed specifically for these populations.' },
      { type: 'paragraph', text: 'The UNIT uses entirely nonverbal administration (no oral language required for instructions or responses) and is normed on diverse populations. When combined with other measures, it provides the most valid cognitive assessment for students who cannot be fairly assessed with verbal-heavy batteries.' },
      { type: 'comparison', leftHeader: 'Best for deaf / ELL students', rightHeader: 'Less appropriate as primary tools', rows: [{ left: 'Universal Nonverbal Intelligence Test (UNIT) • Nonverbal scales of the DAS • Leiter International Performance Scale', right: 'WISC with an interpreter (language still confounds) • Stanford-Binet (verbally loaded) • Standard WISC full scale' }] },
    ],
  },

  {
    id: 'MOD-D8-03',
    primarySkillId: 'PSY-04',
    title: 'Systemic Racism and Disproportionality: Know the Vocabulary',
    sections: [
      { type: 'paragraph', text: 'NASP and the broader school psychology field use specific terminology to discuss equity and justice. These terms appear on the exam with their precise meanings:' },
      { type: 'list', items: ['Systemic racism: Structural and institutional policies, practices, and norms that produce racially inequitable outcomes, regardless of individual intent.', 'Disproportionality: Group differences in educational outcomes or risk levels based on group membership. The most studied form is the overrepresentation of Black and Indigenous students in special education and school discipline.', 'Implicit bias: Unconscious attitudes or stereotypes that affect decisions and behaviors without conscious awareness.', 'Explicit bias: Conscious and deliberate prejudice.'] },
      { type: 'anchor', label: 'Exam targeting', text: "When a question uses the word 'injustice' in the context of school-based disparities, systemic racism is the most aligned term. When a question describes unequal group outcomes in special education or discipline, disproportionality is the target answer." },
    ],
  },

  {
    id: 'MOD-D8-04',
    primarySkillId: 'DIV-05',
    title: 'Intellectual Disability Evaluation: WISC + Vineland Required',
    sections: [
      { type: 'paragraph', text: 'To identify an intellectual disability, school psychologists must gather two types of formal data: a cognitive assessment (measuring intellectual functioning) AND an adaptive behavior assessment (measuring practical, real-world functioning). Both domains must show significant deficits.' },
      { type: 'paragraph', text: 'The most common assessment pairing is the WISC (cognitive) and the Vineland Adaptive Behavior Scales (adaptive functioning). The threshold for intellectual disability is typically a standard score at least 2 standard deviations below the mean on both instruments — approximately SS 69 or below on cognitive measures, with corresponding adaptive deficits.' },
      { type: 'anchor', label: 'Legal and best-practice note', text: 'An ID determination requires deficits in BOTH cognitive functioning AND adaptive behavior. A low IQ score alone is insufficient. An adaptive behavior deficit alone is insufficient. Both must be present.' },
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
      { type: 'paragraph', text: 'Research design questions are a consistent source of confusion. Here are the precise definitions:' },
      { type: 'list', items: ['Experimental group: The group that receives the experimental treatment or condition being studied. They ARE exposed to the independent variable.', 'Control group: The group that does NOT receive the experimental treatment. They provide a comparison baseline.', "Independent variable: The variable the researcher manipulates (the treatment, intervention, or condition). It is NOT called the 'experimental variable.'", 'Dependent variable: The outcome that is measured — the effect of the independent variable.'] },
      { type: 'anchor', label: 'Common confusion', text: "'Experimental group' and 'independent variable' are the terms that most often trip up test-takers. The experimental group is the one that gets the treatment. The independent variable is what the researcher changes. These are different things." },
    ],
  },

  {
    id: 'MOD-D9-02',
    primarySkillId: 'RES-03',
    title: 'Correlations: Negative Can Be Stronger Than Positive',
    sections: [
      { type: 'paragraph', text: 'A correlation coefficient ranges from -1.00 to +1.00. The strength of a correlation is determined by its absolute value — how far from zero it is — not by its sign. A correlation of -0.98 indicates a nearly perfect relationship between two variables (as one increases, the other decreases almost perfectly).' },
      { type: 'paragraph', text: 'This is a stronger correlation than +0.60, even though 0.60 is a positive number. Negative does not mean weak. In fact, -0.98 is one of the strongest possible correlations.' },
      { type: 'comparison', leftHeader: 'Interpreting Correlations', rightHeader: 'Sign Meaning', rows: [{ left: 'Strong: |r| ≥ 0.70 • Moderate: 0.40–0.69 • Weak: < 0.40', right: "Positive: both variables move in the same direction. Negative: variables move in opposite directions. Neither is inherently 'better.'" }] },
    ],
  },

  {
    id: 'MOD-D9-03',
    primarySkillId: 'PSY-02',
    title: 'Validity vs. Reliability: A Critical Distinction',
    sections: [
      { type: 'paragraph', text: 'Reliability is about consistency — does the test give the same results when repeated under the same conditions? It is measured over time (test-retest) or within the test itself (internal consistency).' },
      { type: 'paragraph', text: 'Validity is about accuracy — does the test actually measure what it claims to measure? One way to establish validity is to correlate a new test with an established gold-standard test that measures the same construct. This is convergent validity.' },
      { type: 'paragraph', text: 'A test can be reliable without being valid (a broken scale that consistently reads 10 pounds too heavy is reliable but not valid). A test cannot be valid without being reliable.' },
      { type: 'anchor', label: 'Exam question pattern', text: 'When a question gives you a correlation between a new test and an old test, it is asking about VALIDITY (specifically convergent validity), not reliability. Reliability is established within the test itself or over repeated administrations.' },
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
    ],
  },

  {
    id: 'MOD-D9-05',
    primarySkillId: 'RES-02',
    title: 'Implementation Science: Dissemination Comes First',
    sections: [
      { type: 'paragraph', text: "When a school is deciding whether to adopt a new program or practice, the first stage of implementation is Dissemination — exploring the fit between the program and the school's context, capacity, and needs. This is when questions like 'Does this fit our culture?' and 'Do our staff have the skills to implement this?' are asked." },
      { type: 'paragraph', text: 'The stages of implementation, in order, are: Dissemination → Adoption → Initial Implementation → Full Implementation. The "goodness of fit" concept belongs to the Dissemination stage.' },
      { type: 'anchor', label: 'ESSA Evidence Tiers (bonus content)', text: 'ESSA defines four evidence tiers: Tier 1 (Strong — RCT), Tier 2 (Moderate — quasi-experimental), Tier 3 (Promising — correlational), Tier 4 (Rationale only). The What Works Clearinghouse (WWC) is where to verify evidence ratings. MEMORY ANCHOR: ESSA tiers evaluate PROGRAMS; MTSS tiers organize STUDENTS.' },
    ],
  },

  // ── Domain 10: Legal, Ethical & Professional Practice ────────────────────

  {
    id: 'MOD-D10-01',
    primarySkillId: 'LEG-02',
    title: 'IDEA and Child Find: The Identification Mandate',
    sections: [
      { type: 'paragraph', text: "The Individuals with Disabilities Education Act (IDEA) is the federal law that governs special education in the United States. Among its core provisions is Child Find — a mandate requiring all school districts to actively seek out and identify children with potential disabilities, even before a referral is made." },
      { type: 'paragraph', text: 'IDEA also establishes the eligibility categories for special education, guarantees a free and appropriate public education (FAPE) to all eligible students, and requires placement in the least restrictive environment (LRE).' },
      { type: 'comparison', leftHeader: 'IDEA', rightHeader: 'Section 504', rows: [{ left: 'Governs special education • Mandates Child Find (active identification) • Requires FAPE and LRE • Establishes 13 eligibility categories • Includes IEP requirements', right: 'Part of the Rehabilitation Act and ADA • Governs accommodations for disability • Parental complaints go to the Office for Civil Rights (OCR) • Does not require special education eligibility' }] },
      { type: 'anchor', label: 'Section 504 and ADA supplement', text: '504 = civil rights law (access). IEP = special education law (specially designed instruction). A student can qualify for a 504 Plan without qualifying for special education. The ADAAA (2008) expanded the definition of disability — minor conditions may now qualify for 504 but NOT IDEA.' },
    ],
  },

  {
    id: 'MOD-D10-02',
    primarySkillId: 'LEG-02',
    title: 'The Stay-Put Rule: Triggered by Due Process',
    sections: [
      { type: 'paragraph', text: "The 'stay-put' rule (also called the educational placement protection) prevents a school from unilaterally changing a special education student's placement once a due process proceeding has been initiated. The student must remain in their current educational placement until the legal process is resolved." },
      { type: 'paragraph', text: 'This rule is triggered by the initiation of due process — not by its completion, not by a suspension, and not by a manifestation determination. The moment due process begins, the student stays put.' },
      { type: 'anchor', label: 'Honig v. Doe (1988)', text: 'This landmark Supreme Court case affirmed the stay-put rule and clarified that schools cannot unilaterally exclude special education students from school during disciplinary proceedings. It prevented a school district from excluding a student with a disability during ongoing disputes.' },
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
    ],
  },

  {
    id: 'MOD-D10-05',
    primarySkillId: 'LEG-01',
    title: 'Parental Consent for Regular Education Students',
    sections: [
      { type: 'paragraph', text: "When a school psychologist is asked to provide counseling or assessment services to a regular education student (one not currently identified for special education), written parental consent must be obtained before beginning. This is best practice and protects both the student's rights and the psychologist's professional standing." },
      { type: 'paragraph', text: "The exception is a genuine crisis situation — when a student's immediate safety is at risk, a brief stabilizing intervention may be provided without prior consent. This exception is narrow and does not extend to ongoing counseling." },
      { type: 'anchor', label: 'Confidentiality disclosure timing', text: 'The limitations of confidentiality must be explained to the student at the very first meeting — not after rapport is established, not near the end of sessions, and not only when providing informed consent to parents. First meeting, every time.' },
    ],
  },

  {
    id: 'MOD-D10-06',
    primarySkillId: 'LEG-02',
    title: "LRE and 'Reasonable Educational Progress'",
    sections: [
      { type: 'paragraph', text: "The least restrictive environment (LRE) principle requires that students with disabilities be educated alongside their non-disabled peers to the maximum extent appropriate. A student should only be placed in a more restrictive setting if the nature or severity of the disability is such that education in general education classes — even with supplementary aids and services — cannot be achieved satisfactorily." },
      { type: 'paragraph', text: "Critically, 'reasonable educational progress' — not perfect or maximum performance — is the legal standard. A student making Cs is making reasonable academic progress. The school does not have an obligation to ensure the student achieves their maximum potential, only to provide an appropriate education." },
      { type: 'anchor', label: 'Case law anchor: Endrew F. v. Douglas County (2017)', text: "The Supreme Court ruled that an IEP must be reasonably calculated to enable a child to make progress appropriate in light of the child's circumstances — raising the bar slightly above the prior 'de minimis' standard from Rowley, but not requiring maximum achievement." },
    ],
  },

  {
    id: 'MOD-D10-07',
    primarySkillId: 'ETH-03',
    title: "NCSP Credential and NASP's Role",
    sections: [
      { type: 'paragraph', text: 'The National Association of School Psychologists (NASP) is the primary professional organization for school psychologists in the United States. NASP is also the primary accreditation body for the Nationally Certified School Psychologist (NCSP) credential.' },
      { type: 'paragraph', text: 'NASP sets professional standards, publishes ethical guidelines (Principles for Professional Ethics), advocates for the field, and provides professional development. The NCSP is a portable national credential recognized across states that do not have reciprocity agreements for state licensure.' },
      { type: 'list', label: 'What NASP provides', items: ['The Principles for Professional Ethics — the field\'s ethical code', 'The NASP Practice Model — the framework of professional practice domains', 'Standards for Graduate Preparation of School Psychologists', 'The NCSP credential — a portable national certification', 'Advocacy, research, and continuing professional development'] },
      { type: 'comparison', leftHeader: 'NCSP (national credential)', rightHeader: 'State credential / license', rows: [{ left: 'Granted by NASP', right: 'Granted by the state department of education or licensing board' }, { left: 'Portable — recognized across many states, useful where there is no reciprocity', right: 'Required to actually practice within that specific state' }, { left: 'Signals a nationally consistent standard of preparation', right: 'Requirements vary state to state' }] },
      { type: 'anchor', label: 'Supervision ratio', text: 'NASP recommends that a qualified school psychologist supervise no more than two interns at one time. This is a specific, testable detail.' },
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
