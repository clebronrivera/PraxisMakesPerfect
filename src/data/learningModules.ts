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
  /** Full rich sections rendered inside the lesson viewer. */
  sections: ModuleSection[];
}

// ─── 58 Modules ───────────────────────────────────────────────────────────────

export const LEARNING_MODULES: LearningModule[] = [

  // ── Domain 1: Data-Based Decision Making & Accountability ─────────────────

  {
    id: 'MOD-D1-01',
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
          { id: 's4', text: 'Frequent progress monitoring (2-3x/week) for a specific student on a targeted intervention', category: 'TIER_3' },
          { id: 's5', text: 'Universal corrective feedback system applied consistently across the school', category: 'TIER_1' },
          { id: 's6', text: 'Specialized intervention plan developed for a student identified as at-risk', category: 'TIER_3' },
        ],
        categories: ['TIER_1 (Universal)', 'TIER_3 (Intensive)'],
      },
    ],
  },

  {
    id: 'MOD-D1-07',
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

  // ── Domain 2: Consultation & Collaboration ────────────────────────────────

  {
    id: 'MOD-D2-01',
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
          { id: 's1', text: 'A nagging reminder stops when homework is completed → increases homework completion', category: 'NEG_REINF' },
          { id: 's2', text: 'Recess is removed to decrease talking out of turn', category: 'PUNISHMENT' },
          { id: 's3', text: 'A teacher stops reminding a student when assignments are turned in on time → improves timeliness', category: 'NEG_REINF' },
          { id: 's4', text: 'A student loses screen time for not completing chores → decreases behavior', category: 'PUNISHMENT' },
          { id: 's5', text: 'Seatbelt alarm stops (relief) when buckled → increases buckling', category: 'NEG_REINF' },
          { id: 's6', text: 'Detention is assigned for being tardy → decreases tardiness', category: 'PUNISHMENT' },
        ],
        categories: ['NEGATIVE REINFORCEMENT (removes aversive → increases behavior)', 'PUNISHMENT (adds/removes → decreases behavior)'],
      },
      { type: 'anchor', label: 'Memory anchor', text: 'Negative reinforcement = relief. If removing something makes a behavior go UP, that is negative reinforcement. If anything makes a behavior go DOWN, that is punishment.' },
    ],
  },

  {
    id: 'MOD-D4-03',
    title: 'Applied Behavior Analysis (ABA): Structure and Task Analysis',
    sections: [
      { type: 'paragraph', text: 'Applied Behavior Analysis is the systematic application of behavioral principles to teach new skills and reduce problematic behaviors, particularly for students with autism spectrum disorder. ABA uses task analysis (breaking complex behaviors into small, sequential steps), discrete trial instruction (repeated, structured learning trials), and systematic reinforcement.' },
      { type: 'paragraph', text: 'When you see discrete trial instruction, highly structured environment, task analysis, and repeated trials in the same scenario — that is ABA.' },
      { type: 'anchor', label: 'Key terms for ABA questions', text: 'Task analysis • Discrete trial training (DTT) • Reinforcement schedules • Prompting hierarchies • Fading • Generalization • Stimulus control' },
    ],
  },

  {
    id: 'MOD-D4-04',
    title: 'Reinforcement Fading: Teaching Independence',
    sections: [
      { type: 'paragraph', text: 'A hallmark of effective behavioral intervention is a planned exit strategy. After a new behavior is established using prompts and reinforcers, those supports must be systematically removed (faded) so the student can perform the behavior independently without external scaffolding.' },
      { type: 'paragraph', text: 'The correct sequence is: teach with prompts and reinforcers → confirm the behavior is stable → gradually fade prompts and reinforcers → confirm independent performance. Skipping the fading step creates dependency on the support system.' },
    ],
  },

  {
    id: 'MOD-D4-05',
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
          { id: 's1', text: 'Two students have equal strength, get into one fight over a disagreement', category: 'NOT_BULLYING' },
          { id: 's2', text: 'Older student repeatedly excludes younger student from group, threatens them', category: 'BULLYING' },
          { id: 's3', text: 'Friends banter and joke back-and-forth', category: 'NOT_BULLYING' },
          { id: 's4', text: 'Physically larger student pushes smaller student for lunch money repeatedly', category: 'BULLYING' },
          { id: 's5', text: 'Two classmates argue once about a test', category: 'NOT_BULLYING' },
          { id: 's6', text: 'One student spreads rumors repeatedly about another; excludes from social groups', category: 'BULLYING' },
        ],
        categories: ['BULLYING (power imbalance, repetition, intentionality)', 'NOT BULLYING (one-time, equal power, mutual conflict)'],
      },
      { type: 'anchor', label: "NASP's preferred approach", text: 'Restorative practices and skill-building are endorsed over zero-tolerance policies. Zero tolerance is not effective and creates disparate impact on minority and special education students.' },
    ],
  },

  {
    id: 'MOD-D4-06',
    title: "Broca's Area, the Amygdala, and Brain-Behavior Basics",
    sections: [
      { type: 'paragraph', text: 'The amygdala is the brain structure most strongly associated with emotional processing, particularly fear, threat detection, and the fight-or-flight response. It is part of the limbic system, which governs emotional and memory functions.' },
      { type: 'paragraph', text: "Broca's area is in the left frontal lobe and governs speech production. The prefrontal cortex handles executive functions — planning, impulse control, decision-making. The parietal lobe processes sensory information and spatial awareness." },
      { type: 'comparison', leftHeader: 'Brain Structure', rightHeader: 'Primary Function', rows: [{ left: "Amygdala • Prefrontal cortex • Broca's area • Parietal lobe", right: 'Emotions / fear • Executive functions / impulse control • Speech production • Sensory processing / spatial awareness' }] },
    ],
  },

  {
    id: 'MOD-D4-07',
    title: 'Suicide Assessment: Never Leave the Student Alone',
    sections: [
      { type: 'paragraph', text: 'When a school psychologist is conducting a suicide risk assessment, the most critical safety practice is continuous supervision — the student must never be left unsupervised at any point during the process. This is the non-negotiable floor of safe practice.' },
      { type: 'paragraph', text: 'Notifying parents and administration are both important and must happen, but they are logistical steps that do not override the immediate physical safety requirement. If you can only do one thing, you stay with the student.' },
      { type: 'anchor', label: 'Protocol sequence', text: '1. Stay with the student. 2. Notify administration. 3. Conduct or coordinate the suicide assessment. 4. Notify parents. The order matters — safety first, notifications next.' },
    ],
  },

  {
    id: 'MOD-D4-08',
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

  // ── Domain 5: School-Wide Practices to Promote Learning ──────────────────

  {
    id: 'MOD-D5-01',
    title: 'PBIS: The NASP-Endorsed System-Wide Practice',
    sections: [
      { type: 'paragraph', text: 'Positive Behavioral Interventions and Supports is the system-wide framework endorsed by NASP for promoting positive student behavior across an entire school. PBIS is proactive, data-driven, and tiered — it matches the intensity of support to the level of student need.' },
      { type: 'paragraph', text: 'PBIS is explicitly endorsed by NASP. Tracking (grouping students by ability), zero tolerance (automatic severe punishment), and retention are not endorsed. When the question asks which school-wide practice NASP supports, PBIS is the answer.' },
      { type: 'anchor', label: 'PBIS core features (exam targets)', text: 'Clear, positively stated expectations • Consistent staff acknowledgment of expected behavior • Data used to make decisions • Tiered support system. Note: parent volunteering is a benefit but is NOT a core PBIS feature on the exam.' },
    ],
  },

  {
    id: 'MOD-D5-02',
    title: 'RTI at the Systems Level: Not for Retention Decisions',
    sections: [
      { type: 'paragraph', text: 'Response to Intervention is a problem-solving framework used to identify learning difficulties, target intervention strategies, monitor progress, and evaluate intervention effectiveness. It is not a tool for making grade retention decisions.' },
      { type: 'paragraph', text: 'NASP does not endorse grade retention, and RTI is not designed to inform retention. RTI data inform whether interventions are working, whether a student needs more intensive support, and whether a formal special education evaluation may be warranted.' },
    ],
  },

  {
    id: 'MOD-D5-03',
    title: 'CASEL and Social-Emotional Learning',
    sections: [
      { type: 'paragraph', text: 'The Collaborative for Academic, Social, and Emotional Learning (CASEL) framework defines five core competencies for SEL. These are testable content:' },
      { type: 'list', items: ['Self-awareness — recognizing your own emotions and their impact', 'Self-management — regulating emotions, impulses, and behavior (the exam frequently tests this)', 'Social awareness — understanding others\' perspectives and empathy', 'Relationship skills — communicating, cooperating, resolving conflict', 'Responsible decision-making — making ethical, constructive choices'] },
      { type: 'anchor', label: 'Exam target', text: 'Self-management is the CASEL competency most closely linked to self-regulation — a frequent exam target. When a question asks about regulating one\'s behavior or controlling impulses within the CASEL framework, self-management is the answer.' },
    ],
  },

  {
    id: 'MOD-D5-04',
    title: 'Disproportionality: Group Membership and Unequal Outcomes',
    sections: [
      { type: 'paragraph', text: 'Disproportionality refers to group differences in specific educational outcomes or in individuals\' risk for those outcomes based on group membership (race, ethnicity, socioeconomic status, language background, etc.). This is not about individual unfairness — it is about systemic patterns that affect entire groups at higher or lower rates than their proportion of the population.' },
      { type: 'paragraph', text: 'The most common example in school psychology is disproportionate representation of minority students in special education, discipline, and gifted programs. NASP considers addressing disproportionality a core social justice obligation.' },
      { type: 'anchor', label: 'Key distinction', text: "Disproportionality is not the same as 'racial privilege' (a sociological concept) or simply 'socioeconomic status.' It specifically refers to differential group outcomes or risk levels based on group membership. Know the definition precisely." },
    ],
  },

  // ── Domain 6: Preventive & Responsive Services ────────────────────────────

  {
    id: 'MOD-D6-01',
    title: 'Crisis Prevention: The Primary Emphasis',
    sections: [
      { type: 'paragraph', text: "In crisis planning, prevention is the primary focus. The best approach to a crisis is preventing it from happening in the first place — through proactive identification of risk, regular practice of crisis protocols, building protective factors school-wide, and training staff." },
      { type: 'paragraph', text: "Prevention, intervention, and postvention form a continuum, but prevention comes first. This is captured in the phrase: 'Prevention is primary.'" },
      { type: 'anchor', label: 'Standard Response Protocol (SRP)', text: "The SRP provides schools with common language for crisis situations. The SRP components are: Hold, Secure, Lockdown, Evacuate, Shelter. Note: 'Escape' is NOT an SRP term. This is a specific exam target." },
    ],
  },

  {
    id: 'MOD-D6-02',
    title: 'Suicide Contagion: The First Priority After a Student Death',
    sections: [
      { type: 'paragraph', text: 'When a student dies by suicide, the immediate priority for school staff is planning to prevent contagion effects — the risk that other vulnerable students may be influenced toward suicidal behavior by exposure to news of the death. Before making announcements or providing direct support to classmates, key staff must be briefed to identify at-risk students.' },
      { type: 'paragraph', text: 'A school-wide assembly about the suicide is strongly contraindicated. It glamorizes the event, increases exposure for sensitive students, and can inadvertently increase contagion risk. Instead, targeted support spaces and individual counseling are provided.' },
      { type: 'comparison', leftHeader: 'Do', rightHeader: 'Do NOT', rows: [{ left: 'Discuss contagion risk with key staff first • Identify at-risk students • Provide in-school counseling spaces • Give verifiable facts without sensationalizing', right: 'Hold a school-wide assembly • Announce details over the intercom • Share extensive details about the method • Memorialize in ways that glamorize' }] },
    ],
  },

  {
    id: 'MOD-D6-03',
    title: 'Threat Assessment: Duty to Warn',
    sections: [
      { type: 'paragraph', text: 'When a student makes a specific, credible threat of violence against an identifiable person or group, the school psychologist has a legal and ethical duty to warn — to notify the administration AND the parents of the students who have been threatened. This duty overrides general confidentiality.' },
      { type: 'paragraph', text: 'A vague complaint about a classmate is different from a specific threat naming a person, a place, and an intent. The duty to warn applies to specific, credible threats. The first step is always to notify administration and the potential victims\' parents.' },
    ],
  },

  {
    id: 'MOD-D6-04',
    title: 'Bullying Intervention: Restorative Practices Over Zero Tolerance',
    sections: [
      { type: 'paragraph', text: "Zero-tolerance policies for bullying — automatic suspension, expulsion, or severe punishment regardless of context — are not endorsed by NASP and are not effective in reducing bullying. They create disparate impact on minority students and students with disabilities." },
      { type: 'paragraph', text: 'Restorative practices are the preferred approach: they hold students accountable for harm, require the aggressor to make amends, rebuild relationships, and build skills to prevent recurrence. Effective programs also address bystanders and build school-wide social competency.' },
      { type: 'anchor', label: 'What effective anti-bullying programs include (and exclude)', text: 'Include: widespread supervision, bystander behavior programs, restorative practices, social skills building. Do NOT include: zero-tolerance policies, strict punitive-only consequences. This is a specific exam target.' },
    ],
  },

  // ── Domain 7: Family-School Collaboration Services ────────────────────────

  {
    id: 'MOD-D7-01',
    title: 'Starting Family Collaboration: Understand Values First',
    sections: [
      { type: 'paragraph', text: "When a school psychologist sets out to build collaborative relationships with families from diverse cultural backgrounds, the most important starting point is not logistics (schedules, contact methods) — it is understanding the family's values and their perceptions of the school-family relationship." },
      { type: 'paragraph', text: 'Many families, particularly from minority and immigrant communities, have historical reasons to distrust institutions. Effective collaboration begins by listening, learning what the family values, and meeting them where they are before introducing programs or requests.' },
      { type: 'anchor', label: 'The core trio for family-school collaboration', text: 'Sensitivity • Trust • Respect. These three qualities are the research-identified foundation of effective home-school collaboration across all cultural contexts.' },
    ],
  },

  {
    id: 'MOD-D7-02',
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
    title: 'Testing ELL and Diverse Students: Caution and Cultural Humility',
    sections: [
      { type: 'paragraph', text: 'When assessing students from diverse cultural backgrounds, standardized tests may underrepresent their true abilities due to cultural loading in test content, language demands, and norming samples that may not reflect the student\'s background.' },
      { type: 'paragraph', text: "The correct approach is not to refuse to use standardized tests entirely — it is to interpret results cautiously and to supplement formal measures with informal, culturally responsive data. Use both formal and informal measures, use assessments normed on appropriate populations when available, and never make high-stakes decisions based on a single test score." },
      { type: 'anchor', label: 'For English Language Learners specifically', text: "Use informal measures alongside appropriately normed standardized assessments. Interpreters should be proficient in both languages. Consider the student's developmental history, teacher data, and parent interviews. Use nonverbal tests as supplements when language is a confounding factor." },
    ],
  },

  {
    id: 'MOD-D8-02',
    title: 'The Universal Nonverbal Intelligence Test (UNIT) for Special Populations',
    sections: [
      { type: 'paragraph', text: 'When assessing a student who is deaf, hard of hearing, or a non-English speaker, standard verbal cognitive batteries are inappropriate as primary tools because they conflate language ability with intelligence. The Universal Nonverbal Intelligence Test (UNIT) was designed specifically for these populations.' },
      { type: 'paragraph', text: 'The UNIT uses entirely nonverbal administration (no oral language required for instructions or responses) and is normed on diverse populations. When combined with other measures, it provides the most valid cognitive assessment for students who cannot be fairly assessed with verbal-heavy batteries.' },
      { type: 'comparison', leftHeader: 'Best for deaf / ELL students', rightHeader: 'Less appropriate as primary tools', rows: [{ left: 'Universal Nonverbal Intelligence Test (UNIT) • Nonverbal scales of the DAS • Leiter International Performance Scale', right: 'WISC with an interpreter (language still confounds) • Stanford-Binet (verbally loaded) • Standard WISC full scale' }] },
    ],
  },

  {
    id: 'MOD-D8-03',
    title: 'Systemic Racism and Disproportionality: Know the Vocabulary',
    sections: [
      { type: 'paragraph', text: 'NASP and the broader school psychology field use specific terminology to discuss equity and justice. These terms appear on the exam with their precise meanings:' },
      { type: 'list', items: ['Systemic racism: Structural and institutional policies, practices, and norms that produce racially inequitable outcomes, regardless of individual intent.', 'Disproportionality: Group differences in educational outcomes or risk levels based on group membership. The most studied form is the overrepresentation of Black and Indigenous students in special education and school discipline.', 'Implicit bias: Unconscious attitudes or stereotypes that affect decisions and behaviors without conscious awareness.', 'Explicit bias: Conscious and deliberate prejudice.'] },
      { type: 'anchor', label: 'Exam targeting', text: "When a question uses the word 'injustice' in the context of school-based disparities, systemic racism is the most aligned term. When a question describes unequal group outcomes in special education or discipline, disproportionality is the target answer." },
    ],
  },

  {
    id: 'MOD-D8-04',
    title: 'Intellectual Disability Evaluation: WISC + Vineland Required',
    sections: [
      { type: 'paragraph', text: 'To identify an intellectual disability, school psychologists must gather two types of formal data: a cognitive assessment (measuring intellectual functioning) AND an adaptive behavior assessment (measuring practical, real-world functioning). Both domains must show significant deficits.' },
      { type: 'paragraph', text: 'The most common assessment pairing is the WISC (cognitive) and the Vineland Adaptive Behavior Scales (adaptive functioning). The threshold for intellectual disability is typically a standard score at least 2 standard deviations below the mean on both instruments — approximately SS 69 or below on cognitive measures, with corresponding adaptive deficits.' },
      { type: 'anchor', label: 'Legal and best-practice note', text: 'An ID determination requires deficits in BOTH cognitive functioning AND adaptive behavior. A low IQ score alone is insufficient. An adaptive behavior deficit alone is insufficient. Both must be present.' },
    ],
  },

  // ── Domain 9: Research & Program Evaluation ───────────────────────────────

  {
    id: 'MOD-D9-01',
    title: 'Research Design Vocabulary: Experimental and Control Groups',
    sections: [
      { type: 'paragraph', text: 'Research design questions are a consistent source of confusion. Here are the precise definitions:' },
      { type: 'list', items: ['Experimental group: The group that receives the experimental treatment or condition being studied. They ARE exposed to the independent variable.', 'Control group: The group that does NOT receive the experimental treatment. They provide a comparison baseline.', "Independent variable: The variable the researcher manipulates (the treatment, intervention, or condition). It is NOT called the 'experimental variable.'", 'Dependent variable: The outcome that is measured — the effect of the independent variable.'] },
      { type: 'anchor', label: 'Common confusion', text: "'Experimental group' and 'independent variable' are the terms that most often trip up test-takers. The experimental group is the one that gets the treatment. The independent variable is what the researcher changes. These are different things." },
    ],
  },

  {
    id: 'MOD-D9-02',
    title: 'Correlations: Negative Can Be Stronger Than Positive',
    sections: [
      { type: 'paragraph', text: 'A correlation coefficient ranges from -1.00 to +1.00. The strength of a correlation is determined by its absolute value — how far from zero it is — not by its sign. A correlation of -0.98 indicates a nearly perfect relationship between two variables (as one increases, the other decreases almost perfectly).' },
      { type: 'paragraph', text: 'This is a stronger correlation than +0.60, even though 0.60 is a positive number. Negative does not mean weak. In fact, -0.98 is one of the strongest possible correlations.' },
      { type: 'comparison', leftHeader: 'Interpreting Correlations', rightHeader: 'Sign Meaning', rows: [{ left: 'Strong: |r| ≥ 0.70 • Moderate: 0.40–0.69 • Weak: < 0.40', right: "Positive: both variables move in the same direction. Negative: variables move in opposite directions. Neither is inherently 'better.'" }] },
    ],
  },

  {
    id: 'MOD-D9-03',
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
    title: 'RTI Data Analysis: Three Levels',
    sections: [
      { type: 'paragraph', text: 'When analyzing RTI progress monitoring data, school psychologists examine three properties of the data set:' },
      { type: 'list', items: ['Level: The actual performance score — where is the student performing relative to the goal (aim line)?', 'Trend: The direction and rate of change across time — is the student\'s performance improving, declining, or flat?', 'Variability: The consistency of performance — are scores erratic (high and low) or stable?'] },
      { type: 'paragraph', text: "'Quantity' of data is not one of the three analysis levels. Baseline data should have at least three data points with no dramatic spikes or drops before it is considered stable enough to use." },
    ],
  },

  {
    id: 'MOD-D9-05',
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
    title: 'The Stay-Put Rule: Triggered by Due Process',
    sections: [
      { type: 'paragraph', text: "The 'stay-put' rule (also called the educational placement protection) prevents a school from unilaterally changing a special education student's placement once a due process proceeding has been initiated. The student must remain in their current educational placement until the legal process is resolved." },
      { type: 'paragraph', text: 'This rule is triggered by the initiation of due process — not by its completion, not by a suspension, and not by a manifestation determination. The moment due process begins, the student stays put.' },
      { type: 'anchor', label: 'Honig v. Doe (1988)', text: 'This landmark Supreme Court case affirmed the stay-put rule and clarified that schools cannot unilaterally exclude special education students from school during disciplinary proceedings. It prevented a school district from excluding a student with a disability during ongoing disputes.' },
    ],
  },

  {
    id: 'MOD-D10-03',
    title: 'Ethical Violations: Address at the Lowest Level First',
    sections: [
      { type: 'paragraph', text: "When a school psychologist becomes aware of an ethical violation by a colleague, the recommended first step in low-to-moderate severity cases is to address the situation informally and directly with the person — not to immediately escalate to administrators or licensing boards." },
      { type: 'paragraph', text: "This approach respects the colleague's dignity, allows for correction without formal consequences, and aligns with professional ethical codes. Escalation is appropriate only if the informal approach fails or if the violation is severe (e.g., abuse of a student, criminal conduct)." },
      { type: 'anchor', label: 'NASP Ethical Principles alignment', text: "NASP's Principles for Professional Ethics emphasize collegial responsibility and professional development. Informal resolution is the first step in most ethics complaints, not the last resort." },
    ],
  },

  {
    id: 'MOD-D10-04',
    title: "Test Protocols and Parent Access: Copyright Is Protected",
    sections: [
      { type: 'paragraph', text: "Parents have a legal right to review their child's educational records, including evaluation reports. However, test protocols — the actual testing materials — are copyright-protected, and allowing parents to copy them violates copyright law and test security agreements." },
      { type: 'paragraph', text: 'Best practice is to allow parents to examine the protocol during a review meeting, explain the results fully and in accessible language, but not allow copying. Only a court order (subpoena) can compel a psychologist to surrender a test protocol.' },
      { type: 'anchor', label: 'The legal hierarchy', text: "Parent request: show, explain, do not copy. Lawyer's demand: same — show and explain, do not copy yet, contact school's attorney. Court subpoena: comply. This escalating response protects both the psychologist and test publishers." },
    ],
  },

  {
    id: 'MOD-D10-05',
    title: 'Parental Consent for Regular Education Students',
    sections: [
      { type: 'paragraph', text: "When a school psychologist is asked to provide counseling or assessment services to a regular education student (one not currently identified for special education), written parental consent must be obtained before beginning. This is best practice and protects both the student's rights and the psychologist's professional standing." },
      { type: 'paragraph', text: "The exception is a genuine crisis situation — when a student's immediate safety is at risk, a brief stabilizing intervention may be provided without prior consent. This exception is narrow and does not extend to ongoing counseling." },
      { type: 'anchor', label: 'Confidentiality disclosure timing', text: 'The limitations of confidentiality must be explained to the student at the very first meeting — not after rapport is established, not near the end of sessions, and not only when providing informed consent to parents. First meeting, every time.' },
    ],
  },

  {
    id: 'MOD-D10-06',
    title: "LRE and 'Reasonable Educational Progress'",
    sections: [
      { type: 'paragraph', text: "The least restrictive environment (LRE) principle requires that students with disabilities be educated alongside their non-disabled peers to the maximum extent appropriate. A student should only be placed in a more restrictive setting if the nature or severity of the disability is such that education in general education classes — even with supplementary aids and services — cannot be achieved satisfactorily." },
      { type: 'paragraph', text: "Critically, 'reasonable educational progress' — not perfect or maximum performance — is the legal standard. A student making Cs is making reasonable academic progress. The school does not have an obligation to ensure the student achieves their maximum potential, only to provide an appropriate education." },
      { type: 'anchor', label: 'Case law anchor: Endrew F. v. Douglas County (2017)', text: "The Supreme Court ruled that an IEP must be reasonably calculated to enable a child to make progress appropriate in light of the child's circumstances — raising the bar slightly above the prior 'de minimis' standard from Rowley, but not requiring maximum achievement." },
    ],
  },

  {
    id: 'MOD-D10-07',
    title: "NCSP Credential and NASP's Role",
    sections: [
      { type: 'paragraph', text: 'The National Association of School Psychologists (NASP) is the primary professional organization for school psychologists in the United States. NASP is also the primary accreditation body for the Nationally Certified School Psychologist (NCSP) credential.' },
      { type: 'paragraph', text: 'NASP sets professional standards, publishes ethical guidelines (Principles for Professional Ethics), advocates for the field, and provides professional development. The NCSP is a portable national credential recognized across states that do not have reciprocity agreements for state licensure.' },
      { type: 'anchor', label: 'Supervision ratio', text: 'NASP recommends that a qualified school psychologist supervise no more than two interns at one time. This is a specific, testable detail.' },
    ],
  },

  {
    id: 'MOD-D10-08',
    title: 'Major Legal Cases — Quick Reference',
    sections: [
      { type: 'paragraph', text: 'Several landmark legal cases are specific exam targets. Here is the reference list:' },
      { type: 'list', items: ['Larry P. v. Riles (1979): California case ruling that IQ tests were racially biased against Black students; restricted use of IQ tests for special education placement in California.', 'Rowley (1982 — Board of Education v. Rowley): Defined FAPE as providing some educational benefit; established the "de minimis" progress standard (later clarified by Endrew F.).', 'Endrew F. v. Douglas County (2017): Raised the FAPE standard — IEPs must be reasonably calculated to enable meaningful progress, not just minimal progress.', 'Honig v. Doe (1988): Affirmed the stay-put rule; schools cannot unilaterally exclude students with disabilities.', 'Oberti v. Clementon School Board (1993): Affirmed the right of students with disabilities to be included in regular education classes (LRE principle).', 'Lau v. Nichols (1974): Established that schools must provide equal educational opportunities to ELL students.'] },
    ],
  },

];

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

export const SKILL_MODULE_MAP: Record<string, string[]> = {
  // ── Professional Practices (App Domain 1) ──────────────────────────────────
  'CON-01': ['MOD-D2-01', 'MOD-D2-02', 'MOD-D2-03', 'MOD-D2-04'],
  'DBD-01': ['MOD-D9-04', 'MOD-D1-02', 'MOD-D1-09'],
  'DBD-03': ['MOD-D1-07', 'MOD-D1-11', 'MOD-D8-02'],
  'DBD-05': ['MOD-D1-10', 'MOD-D1-11', 'MOD-D1-12'],
  'DBD-06': ['MOD-D1-04', 'MOD-D1-05', 'MOD-D4-06'],
  'DBD-07': ['MOD-D1-03', 'MOD-D4-02', 'MOD-D4-03'],
  'DBD-08': ['MOD-D1-02', 'MOD-D1-09', 'MOD-D9-04'],
  'DBD-09': ['MOD-D8-01', 'MOD-D7-01'],
  'DBD-10': ['MOD-D1-01', 'MOD-D10-04', 'MOD-D10-05'],
  'PSY-01': ['MOD-D1-07', 'MOD-D1-08', 'MOD-D9-02'],
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
  'ACA-09': ['MOD-D4-06', 'MOD-D8-04'],
  'DEV-01': ['MOD-D4-09'],
  'MBH-02': ['MOD-D4-01', 'MOD-D4-07', 'MOD-D4-08'],
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
  'SWP-03': ['MOD-D5-01', 'MOD-D5-03', 'MOD-D9-05'],
  'SWP-04': ['MOD-D1-06', 'MOD-D5-02', 'MOD-D5-04'],

  // ── Foundations of School Psychology (App Domain 4) ───────────────────────
  'DIV-01': ['MOD-D8-01', 'MOD-D8-03', 'MOD-D7-01'],
  'DIV-03': ['MOD-D5-04', 'MOD-D8-03'],
  'DIV-05': ['MOD-D8-04', 'MOD-D10-01', 'MOD-D10-06'],
  'ETH-01': ['MOD-D10-03', 'MOD-D10-07'],
  'ETH-02': ['MOD-D10-03', 'MOD-D10-07'],
  'ETH-03': ['MOD-D10-07'],
  'LEG-01': ['MOD-D1-01', 'MOD-D10-04', 'MOD-D10-05'],
  'LEG-02': ['MOD-D10-01', 'MOD-D10-02', 'MOD-D10-06'],
  'LEG-03': ['MOD-D10-01', 'MOD-D10-06'],
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
