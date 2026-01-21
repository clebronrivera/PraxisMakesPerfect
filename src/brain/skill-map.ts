// Skill Map Schema - Maps NASP domains to testable skills
// Structure: Domain → Skill Clusters → Individual Skills

export type SkillId = string; // e.g., "DBDM-S01"
export type DomainId = number; // 1-10

export interface Skill {
  skillId: SkillId;
  name: string;
  description: string;
  decisionRule: string; // Plain language explanation of what makes an answer correct
  commonWrongRules: string[]; // At least 3 misconceptions that lead to wrong answers
  requiredEvidence: string; // What context must be present to test this skill
  boundaryConditions: string; // When this skill applies vs doesn't apply
  dokRange: [number, number]; // [min, max] depth of knowledge levels (1-4)
  questionIds: string[]; // Array of question IDs from bank that test this skill
}

export interface SkillCluster {
  clusterId: string; // e.g., "DBDM-A"
  name: string;
  description: string;
  skills: Skill[];
}

export interface Domain {
  domainId: DomainId;
  name: string;
  shortName: string;
  clusters: SkillCluster[];
}

export type SkillMap = Record<DomainId, Domain>;

// Domain 1: Data-Based Decision Making Skills
const domain1Skills: Domain = {
  domainId: 1,
  name: "Data-Based Decision Making & Accountability",
  shortName: "DBDM",
  clusters: [
    {
      clusterId: "DBDM-A",
      name: "Psychometric Foundations",
      description: "Understanding reliability, validity, and score interpretation",
      skills: [
        {
          skillId: "DBDM-S01",
          name: "Reliability Type Selection",
          description: "Matching the appropriate reliability type to the measurement context",
          decisionRule: "Match reliability type to measurement context. Single-subject/behavioral observation requires interobserver agreement. Consistent scores over time requires test-retest. Internal scale consistency requires Cronbach's alpha. Multiple raters requires interrater reliability.",
          commonWrongRules: [
            "Assuming all reliability types work for all measurement contexts",
            "Confusing test-retest with internal consistency",
            "Selecting interrater reliability for single-subject designs instead of interobserver agreement",
            "Using Cronbach's alpha for behavioral observations"
          ],
          requiredEvidence: "Question must specify a measurement context (single-subject design, behavioral observation, standardized test, rating scale, repeated administrations)",
          boundaryConditions: "Applies when question asks which reliability metric is appropriate for a specific context. Does not apply to validity questions or general reliability definitions.",
          dokRange: [2, 3],
          questionIds: ["SP5403_Q001"] // Will be expanded after mapping
        },
        {
          skillId: "DBDM-S02",
          name: "Validity Type Recognition",
          description: "Matching validity evidence to how validity is established",
          decisionRule: "Match validity type to how it's established. Content validity = expert review of item coverage. Criterion validity = correlation with external measure. Construct validity = factor analysis/theoretical relationships. Face validity = appears to measure what it claims (not sufficient alone).",
          commonWrongRules: [
            "Confusing content validity with face validity",
            "Thinking construct validity is established through correlation alone",
            "Believing face validity is sufficient evidence",
            "Mixing up concurrent vs predictive criterion validity"
          ],
          requiredEvidence: "Question must describe how validity is being established or ask which type of validity is demonstrated",
          boundaryConditions: "Applies to validity questions. Does not apply to reliability questions or general assessment selection.",
          dokRange: [2, 3],
          questionIds: []
        },
        {
          skillId: "DBDM-S03",
          name: "Score Interpretation",
          description: "Interpreting confidence intervals, reliability coefficients, SEM, and standard scores",
          decisionRule: "Confidence intervals show range where true score likely falls. Reliability coefficients (.90+ excellent, .80+ good) indicate consistency. SEM quantifies measurement error. Standard scores (mean=100, SD=15) show relative standing. Higher reliability = smaller SEM.",
          commonWrongRules: [
            "Confusing confidence interval with percentage correct",
            "Thinking high reliability guarantees validity",
            "Misinterpreting SEM as standard deviation",
            "Believing standard scores show absolute performance"
          ],
          requiredEvidence: "Question must present a score, statistic, or ask about interpretation of psychometric data",
          boundaryConditions: "Applies to score interpretation questions. Does not apply to assessment selection or intervention questions.",
          dokRange: [2, 3],
          questionIds: []
        },
        {
          skillId: "DBDM-S04",
          name: "Sensitivity/Specificity Distinction",
          description: "Distinguishing between true positive rate (sensitivity) and true negative rate (specificity)",
          decisionRule: "Sensitivity = true positive rate (correctly identifying those WITH condition). Specificity = true negative rate (correctly identifying those WITHOUT condition). High sensitivity = few false negatives. High specificity = few false positives.",
          commonWrongRules: [
            "Confusing sensitivity with specificity",
            "Thinking they measure the same thing",
            "Believing high sensitivity means low false positives",
            "Not understanding that screening tools prioritize sensitivity"
          ],
          requiredEvidence: "Question must mention screening, identification, or ask about true positive/negative rates",
          boundaryConditions: "Applies to screening and identification questions. Does not apply to general assessment questions without screening context.",
          dokRange: [2, 3],
          questionIds: []
        }
      ]
    },
    {
      clusterId: "DBDM-B",
      name: "Assessment Selection",
      description: "Choosing appropriate assessments based on purpose and context",
      skills: [
        {
          skillId: "DBDM-S05",
          name: "Assessment-Purpose Matching",
          description: "Selecting the assessment that best matches the stated purpose",
          decisionRule: "Match assessment type to purpose. Screening = brief, group-administered, identifies risk. Diagnosis = comprehensive, individual, determines eligibility. Progress monitoring = frequent, curriculum-aligned, tracks growth. Program evaluation = standardized, group-level, evaluates effectiveness.",
          commonWrongRules: [
            "Using diagnostic assessments for screening",
            "Selecting screening tools for comprehensive evaluation",
            "Choosing norm-referenced tests for progress monitoring",
            "Using progress monitoring tools for program evaluation"
          ],
          requiredEvidence: "Question must specify a purpose (screening, diagnosis, progress monitoring, evaluation) and ask which assessment is most appropriate",
          boundaryConditions: "Applies when question asks which assessment to use for a specific purpose. Does not apply to general assessment knowledge questions.",
          dokRange: [2, 3],
          questionIds: []
        },
        {
          skillId: "DBDM-S06",
          name: "Norm vs Criterion Reference Distinction",
          description: "Distinguishing between norm-referenced and criterion-referenced assessments",
          decisionRule: "Norm-referenced = compares to peer group (percentiles, standard scores). Criterion-referenced = compares to mastery standard (pass/fail, percentage correct). Use norm-referenced for relative standing. Use criterion-referenced for skill mastery.",
          commonWrongRules: [
            "Confusing norm-referenced with criterion-referenced",
            "Thinking all standardized tests are norm-referenced",
            "Believing criterion-referenced tests can't be standardized",
            "Not understanding when each type is appropriate"
          ],
          requiredEvidence: "Question must ask about norm vs criterion reference or describe assessment characteristics",
          boundaryConditions: "Applies to assessment type questions. Does not apply to intervention or consultation questions.",
          dokRange: [2, 3],
          questionIds: []
        },
        {
          skillId: "DBDM-S07",
          name: "Assessment Type Recognition",
          description: "Recognizing formative, summative, and single-subject assessment types",
          decisionRule: "Formative = ongoing, guides instruction, low stakes. Summative = end of period, evaluates learning, high stakes. Single-subject = repeated measures, tracks individual change, used for intervention evaluation.",
          commonWrongRules: [
            "Confusing formative with summative",
            "Thinking single-subject is the same as formative",
            "Believing all progress monitoring is summative",
            "Not recognizing when assessment is diagnostic vs formative"
          ],
          requiredEvidence: "Question must describe assessment characteristics or ask about assessment type",
          boundaryConditions: "Applies to assessment classification questions. Does not apply to intervention selection questions.",
          dokRange: [1, 2],
          questionIds: []
        },
        {
          skillId: "NEW-1-PerformanceAssessment",
          name: "Performance-Based Assessment Recognition",
          description: "Identify assessments that require students to demonstrate skills through authentic tasks (essays, portfolios) rather than selection-based responses.",
          decisionRule: "Correct answer identifies a task requiring active demonstration of a skill (e.g., essay) vs. passive selection.",
          commonWrongRules: [
            "Confusing performance-based with multiple-choice assessments",
            "Thinking all written assessments are performance-based",
            "Believing portfolios are not performance-based",
            "Not recognizing that performance-based requires active demonstration"
          ],
          requiredEvidence: "Question must ask about assessment types that require active demonstration vs. selection",
          boundaryConditions: "Applies to assessment type questions distinguishing performance-based from selection-based. Does not apply to general assessment questions.",
          dokRange: [2, 3],
          questionIds: []
        },
        {
          skillId: "NEW-1-DynamicAssessment",
          name: "Dynamic Assessment Application",
          description: "Understand the purpose of dynamic assessment (test-teach-retest) to measure learning potential and responsiveness.",
          decisionRule: "Correct answer links the assessment type to measuring 'learning potential' or 'responsiveness' rather than static achievement.",
          commonWrongRules: [
            "Confusing dynamic assessment with static assessment",
            "Thinking dynamic assessment measures current achievement only",
            "Believing all assessments measure learning potential",
            "Not understanding the test-teach-retest structure"
          ],
          requiredEvidence: "Question must ask about dynamic assessment purpose or characteristics",
          boundaryConditions: "Applies to questions about dynamic assessment. Does not apply to general assessment questions.",
          dokRange: [2, 3],
          questionIds: []
        },
        {
          skillId: "NEW-1-IQvsAchievement",
          name: "Intelligence vs. Achievement Distinction",
          description: "Distinguish between what intelligence tests measure (cognitive ability/potential) and what achievement tests measure (learned knowledge/skills).",
          decisionRule: "Correct answer differentiates 'reasoning/problem-solving' (IQ) from 'learned knowledge' (Achievement).",
          commonWrongRules: [
            "Confusing intelligence with achievement",
            "Thinking IQ tests measure what has been learned",
            "Believing achievement tests measure potential",
            "Not understanding the construct difference"
          ],
          requiredEvidence: "Question must ask about the distinction between intelligence and achievement testing",
          boundaryConditions: "Applies to questions distinguishing IQ from achievement tests. Does not apply to general assessment questions.",
          dokRange: [2, 3],
          questionIds: []
        }
      ]
    },
    {
      clusterId: "DBDM-C",
      name: "Data-Driven Practice",
      description: "Using data systematically to make decisions",
      skills: [
        {
          skillId: "DBDM-S08",
          name: "Progress Monitoring Protocol",
          description: "Understanding characteristics of valid progress monitoring",
          decisionRule: "Valid progress monitoring requires: frequent measurement (weekly/biweekly), curriculum-aligned measures, sensitive to small changes, brief administration, standardized procedures, graphed data for visual analysis, decision rules for when to change intervention.",
          commonWrongRules: [
            "Thinking progress monitoring should be monthly or quarterly",
            "Believing any assessment can be used for progress monitoring",
            "Not understanding that progress monitoring must be curriculum-aligned",
            "Confusing progress monitoring with screening"
          ],
          requiredEvidence: "Question must ask about progress monitoring characteristics or protocol",
          boundaryConditions: "Applies to progress monitoring questions. Does not apply to screening or diagnostic assessment questions.",
          dokRange: [2, 3],
          questionIds: []
        },
        {
          skillId: "DBDM-S09",
          name: "Universal Screening Purpose",
          description: "Understanding that screening identifies risk, not diagnosis",
          decisionRule: "Universal screening identifies students at risk. Screening is NOT diagnostic. Screening is brief, group-administered, and identifies who needs further assessment. Positive screen = needs comprehensive evaluation, not immediate intervention.",
          commonWrongRules: [
            "Believing screening diagnoses problems",
            "Thinking screening results determine eligibility",
            "Confusing screening with progress monitoring",
            "Not understanding that screening identifies risk, not disability"
          ],
          requiredEvidence: "Question must mention screening or ask about screening purpose",
          boundaryConditions: "Applies to screening questions. Does not apply to diagnostic or evaluation questions.",
          dokRange: [2, 3],
          questionIds: []
        },
        {
          skillId: "DBDM-S10",
          name: "Data-First Decision Making",
          description: "Reviewing data before recommending action",
          decisionRule: "ALWAYS review/analyze existing data before taking action. First step is almost always data collection, review, or analysis. Never skip to intervention without assessment. Never make recommendations without examining available information.",
          commonWrongRules: [
            "Jumping to intervention without reviewing data",
            "Contacting parents before assessing the situation",
            "Implementing solutions before understanding the problem",
            "Making recommendations without examining available data"
          ],
          requiredEvidence: "Question must present a scenario and ask what to do first, or ask about decision-making sequence",
          boundaryConditions: "Applies to 'first step' or 'should first' questions. Does not apply when data has already been reviewed.",
          dokRange: [3, 4],
          questionIds: []
        }
      ]
    }
  ]
};

// Initialize structure for all 10 NASP domains
export const SKILL_MAP: SkillMap = {
  1: domain1Skills,
  2: {
    domainId: 2,
    name: "Consultation & Collaboration",
    shortName: "C&C",
    clusters: [
      {
        clusterId: "CC-A",
        name: "Consultation Models & Types",
        description: "Understanding different consultation approaches and models",
        skills: [
          {
            skillId: "CC-S01",
            name: "Consultation Type Recognition",
            description: "Identify different types of consultation (behavioral, organizational, multicultural, conjoint)",
            decisionRule: "Behavioral consultation focuses on individual student behavior. Organizational consultation addresses school-wide systems. Multicultural consultation involves cultural brokers. Conjoint consultation includes both home and school.",
            commonWrongRules: [
              "Confusing behavioral with organizational consultation",
              "Thinking all consultation is the same",
              "Not recognizing multicultural consultation requires cultural brokers",
              "Believing conjoint consultation is only for behavior"
            ],
            requiredEvidence: "Question must describe a consultation scenario and ask to identify the type",
            boundaryConditions: "Applies to consultation type identification. Does not apply to consultation process steps.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-2-ConsultationProcess",
            name: "Consultation Process Knowledge",
            description: "Identify and sequence the stages of the consultation process (Entry/Contracting, Problem ID, Analysis, Intervention, Evaluation).",
            decisionRule: "Correct answer identifies the standard stage or sequence in formal consultation models.",
            commonWrongRules: [
              "Skipping entry/contracting stage",
              "Confusing problem identification with intervention",
              "Not understanding the sequence of consultation stages",
              "Believing consultation starts with intervention"
            ],
            requiredEvidence: "Question must ask about consultation stages or sequence",
            boundaryConditions: "Applies to consultation process questions. Does not apply to consultation type questions.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      },
      {
        clusterId: "CC-B",
        name: "Collaborative Problem-Solving",
        description: "Applying problem-solving models in consultation",
        skills: [
          {
            skillId: "NEW-2-ProblemSolvingSteps",
            name: "Problem-Solving Model Application",
            description: "Apply the data-based problem-solving steps (Define, Analyze, Implement, Evaluate) to consultation scenarios.",
            decisionRule: "Correct answer prioritizes defining the problem or collecting baseline data before offering solutions.",
            commonWrongRules: [
              "Jumping to intervention before defining the problem",
              "Skipping data collection step",
              "Not understanding that problem definition comes first",
              "Believing consultation starts with solutions"
            ],
            requiredEvidence: "Question must present a consultation scenario and ask about first steps or sequence",
            boundaryConditions: "Applies to 'first step' or problem-solving sequence questions. Does not apply when problem is already defined.",
            dokRange: [3, 4],
            questionIds: []
          },
          {
            skillId: "CC-S03",
            name: "Collaborative Role & Approach",
            description: "Understand the school psychologist's role as facilitator and collaborator, not expert or decision-maker",
            decisionRule: "Correct answer emphasizes collaboration, facilitation, and shared decision-making rather than expert advice or unilateral action.",
            commonWrongRules: [
              "Taking over instruction instead of supporting teachers",
              "Making unilateral decisions in teams",
              "Using expert model instead of collaborative approach",
              "Not recognizing the facilitator role"
            ],
            requiredEvidence: "Question must ask about the psychologist's role or approach in consultation/collaboration",
            boundaryConditions: "Applies to role and approach questions. Does not apply to consultation type questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-2-CommunicationStrategies",
            name: "Communication & Resistance Management",
            description: "Select appropriate communication strategies to build rapport, manage resistance, or facilitate consensus.",
            decisionRule: "Correct answer focuses on active listening, empathy, or collaboration rather than directive/expert stances.",
            commonWrongRules: [
              "Using directive approaches with resistant teachers",
              "Not acknowledging teacher perspectives",
              "Believing expert advice overcomes resistance",
              "Skipping rapport-building steps"
            ],
            requiredEvidence: "Question must present a scenario involving resistance or communication challenges",
            boundaryConditions: "Applies to communication and resistance management questions. Does not apply to general consultation questions.",
            dokRange: [3, 4],
            questionIds: []
          }
        ]
      }
    ]
  },
  3: {
    domainId: 3,
    name: "Academic Interventions & Instructional Support",
    shortName: "Academic",
    clusters: [
      {
        clusterId: "ACAD-A",
        name: "Multi-Tiered Systems",
        description: "Understanding RTI/MTSS tier structure and intensity",
        skills: [
          {
            skillId: "ACAD-S01",
            name: "Tier Selection & Intensity",
            description: "Match intervention intensity to student need level (Tier 1, 2, or 3)",
            decisionRule: "Tier 1 = all students, universal. Tier 2 = small group, targeted, below benchmark. Tier 3 = intensive, individual, significantly below benchmark.",
            commonWrongRules: [
              "Placing slightly below benchmark students in Tier 3",
              "Using Tier 2 for all struggling students",
              "Not matching intensity to need level",
              "Confusing Tier 2 with Tier 3 intensity"
            ],
            requiredEvidence: "Question must describe student performance level and ask for appropriate tier",
            boundaryConditions: "Applies to tier selection questions. Does not apply to specific intervention selection.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      },
      {
        clusterId: "ACAD-B",
        name: "Reading Interventions",
        description: "Evidence-based reading intervention strategies",
        skills: [
          {
            skillId: "ACAD-S02",
            name: "Reading Intervention Selection",
            description: "Select evidence-based reading interventions for specific skill deficits",
            decisionRule: "Phonemic awareness = sound manipulation. Phonics = letter-sound relationships. Fluency = repeated readings, timed practice. Comprehension = reciprocal teaching, question generation, summarization.",
            commonWrongRules: [
              "Using phonics interventions for comprehension deficits",
              "Applying fluency strategies to decoding problems",
              "Not matching intervention to specific skill deficit",
              "Confusing reading components"
            ],
            requiredEvidence: "Question must describe a reading skill deficit and ask for appropriate intervention",
            boundaryConditions: "Applies to reading intervention selection. Does not apply to math or writing interventions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "ACAD-S03",
            name: "Error Pattern Analysis",
            description: "Analyze student errors to identify specific skill deficits before planning instruction",
            decisionRule: "Correct answer identifies the specific error pattern (e.g., vowel confusion, addition errors) that indicates the skill deficit.",
            commonWrongRules: [
              "Not analyzing error patterns before intervention",
              "Assuming all errors indicate the same deficit",
              "Jumping to intervention without error analysis",
              "Not recognizing specific error patterns"
            ],
            requiredEvidence: "Question must present student errors and ask to identify the skill deficit",
            boundaryConditions: "Applies to error analysis questions. Does not apply when errors are not presented.",
            dokRange: [3, 4],
            questionIds: []
          },
          {
            skillId: "ACAD-S04",
            name: "Fluency Building Strategies",
            description: "Select strategies to improve reading or math fluency (speed + accuracy)",
            decisionRule: "Reading fluency = repeated readings, timed practice, partner reading. Math fluency = timed drills, cover-copy-compare, fact practice.",
            commonWrongRules: [
              "Using comprehension strategies for fluency",
              "Focusing on accuracy when speed is the issue",
              "Not recognizing fluency vs. accuracy distinction",
              "Applying reasoning strategies to fluency building"
            ],
            requiredEvidence: "Question must describe a fluency deficit (slow but accurate) and ask for intervention",
            boundaryConditions: "Applies to fluency building questions. Does not apply to accuracy or comprehension questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "ACAD-S05",
            name: "Instructional Level Determination",
            description: "Identify the appropriate instructional level based on accuracy rates (independent, instructional, frustration)",
            decisionRule: "Independent = 95-100% accuracy. Instructional = 93-97% accuracy (or 70-85% for comprehension). Frustration = below 93% (or below 70% for comprehension).",
            commonWrongRules: [
              "Confusing instructional with independent level",
              "Using frustration level for instruction",
              "Not knowing accuracy thresholds",
              "Applying same thresholds to all text types"
            ],
            requiredEvidence: "Question must present accuracy data and ask to identify instructional level",
            boundaryConditions: "Applies to instructional level questions. Does not apply to general reading questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-3-InstructionalHierarchy",
            name: "Instructional Hierarchy Application",
            description: "Match instructional strategies to the student's stage of learning (Acquisition, Proficiency/Fluency, Generalization, Adaptation).",
            decisionRule: "Correct answer matches: Acquisition → Modeling/Accuracy; Proficiency → Speed/Drill; Generalization → New settings.",
            commonWrongRules: [
              "Using fluency strategies during acquisition",
              "Applying generalization before proficiency",
              "Not matching strategy to learning stage",
              "Confusing acquisition with proficiency"
            ],
            requiredEvidence: "Question must describe student's learning stage and ask for appropriate strategy",
            boundaryConditions: "Applies to instructional hierarchy questions. Does not apply to general intervention selection.",
            dokRange: [3, 4],
            questionIds: []
          },
          {
            skillId: "NEW-3-MetacognitiveStrategies",
            name: "Metacognitive & Study Skills",
            description: "Identify strategies that teach students 'learning to learn' (self-regulation, organization, mnemonic devices).",
            decisionRule: "Correct answer focuses on the student's internal management of learning (thinking about thinking) rather than content mastery.",
            commonWrongRules: [
              "Confusing metacognition with content instruction",
              "Not recognizing self-regulation strategies",
              "Believing organization is not metacognitive",
              "Not understanding 'learning to learn' concept"
            ],
            requiredEvidence: "Question must ask about strategies for self-regulation, organization, or learning strategies",
            boundaryConditions: "Applies to metacognitive strategy questions. Does not apply to content-specific instruction.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      }
    ]
  },
  4: {
    domainId: 4,
    name: "Mental & Behavioral Health Services",
    shortName: "MBH",
    clusters: [
      {
        clusterId: "MBH-A",
        name: "Functional Behavior Assessment",
        description: "Understanding FBA principles and ABC model",
        skills: [
          {
            skillId: "MBH-S01",
            name: "ABC Model Understanding",
            description: "Understand Antecedent-Behavior-Consequence model in FBA",
            decisionRule: "Antecedent = what happens before behavior. Behavior = observable action. Consequence = what happens after behavior (reinforcement/punishment).",
            commonWrongRules: [
              "Confusing antecedent with consequence",
              "Not recognizing that consequences maintain behavior",
              "Thinking behavior occurs in isolation",
              "Not understanding the ABC sequence"
            ],
            requiredEvidence: "Question must ask about ABC model components or sequence",
            boundaryConditions: "Applies to FBA/ABC questions. Does not apply to intervention selection questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "MBH-S02",
            name: "Behavior Function Identification",
            description: "Identify the function of behavior (attention, escape/avoidance, tangible, sensory)",
            decisionRule: "Attention = behavior gets attention from others. Escape/Avoidance = behavior removes aversive task/situation. Tangible = behavior gets preferred item. Sensory = behavior provides internal stimulation.",
            commonWrongRules: [
              "Confusing escape with attention-seeking",
              "Not recognizing avoidance functions",
              "Assuming all behavior is attention-seeking",
              "Not analyzing what maintains the behavior"
            ],
            requiredEvidence: "Question must describe behavior and consequences, asking to identify function",
            boundaryConditions: "Applies to function identification questions. Does not apply to intervention questions without function context.",
            dokRange: [3, 4],
            questionIds: []
          },
          {
            skillId: "MBH-S03",
            name: "Replacement Behavior Selection",
            description: "Select replacement behaviors that serve the same function as problem behavior",
            decisionRule: "Replacement behavior must serve the SAME function as problem behavior. It should be easier, more efficient, and socially acceptable.",
            commonWrongRules: [
              "Selecting replacement behavior with different function",
              "Not matching function of replacement to problem behavior",
              "Choosing replacement that is harder than problem behavior",
              "Not considering function when selecting replacement"
            ],
            requiredEvidence: "Question must describe problem behavior function and ask for replacement behavior",
            boundaryConditions: "Applies to replacement behavior selection. Does not apply when function is not identified.",
            dokRange: [3, 4],
            questionIds: []
          }
        ]
      },
      {
        clusterId: "MBH-B",
        name: "Crisis & Safety",
        description: "Suicide risk assessment and crisis response",
        skills: [
          {
            skillId: "MBH-S04",
            name: "Suicide Risk Assessment",
            description: "Assess suicide risk by evaluating plan, intent, and means",
            decisionRule: "Immediate priority = assess plan, intent, and means. High risk = specific plan + intent + means. Always assess immediately, never delay.",
            commonWrongRules: [
              "Delaying assessment of suicide risk",
              "Not assessing all three components (plan, intent, means)",
              "Assuming low risk without assessment",
              "Not taking immediate action when risk is present"
            ],
            requiredEvidence: "Question must present suicide risk scenario and ask for priority action",
            boundaryConditions: "Applies to suicide risk questions. Does not apply to general mental health questions.",
            dokRange: [3, 4],
            questionIds: []
          }
        ]
      },
      {
        clusterId: "MBH-C",
        name: "Therapeutic Interventions",
        description: "Evidence-based therapy approaches",
        skills: [
          {
            skillId: "MBH-S05",
            name: "Therapy Model Recognition",
            description: "Identify therapy models (CBT, SFBT, etc.) and their key components",
            decisionRule: "CBT = identify and challenge cognitive distortions. SFBT = miracle question, solution-focused. DBT = mindfulness, emotion regulation.",
            commonWrongRules: [
              "Confusing CBT with other therapy models",
              "Not recognizing SFBT miracle question",
              "Believing all therapy is the same",
              "Not understanding model-specific techniques"
            ],
            requiredEvidence: "Question must describe therapy technique or ask to identify model",
            boundaryConditions: "Applies to therapy model questions. Does not apply to general counseling questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "MBH-S06",
            name: "Social Skills Training",
            description: "Select methods for teaching social skills (modeling, rehearsal, feedback)",
            decisionRule: "Most effective = modeling + rehearsal + feedback. Role-play allows practice. Direct instruction teaches skills.",
            commonWrongRules: [
              "Using only instruction without practice",
              "Not including modeling in social skills training",
              "Believing social skills develop naturally",
              "Skipping rehearsal/practice component"
            ],
            requiredEvidence: "Question must ask about social skills teaching methods",
            boundaryConditions: "Applies to social skills training questions. Does not apply to general behavior questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-4-Psychopathology",
            name: "Child & Adolescent Psychopathology",
            description: "Identify diagnostic criteria and developmental presentations of common childhood disorders (ADHD, Depression, Anxiety, ASD, ODD).",
            decisionRule: "Correct answer requires knowledge of DSM-5 criteria or developmental variations (e.g., irritability in child depression).",
            commonWrongRules: [
              "Applying adult criteria to children",
              "Not recognizing developmental variations",
              "Confusing disorder symptoms",
              "Not understanding DSM-5 criteria"
            ],
            requiredEvidence: "Question must ask about diagnostic criteria or developmental presentation",
            boundaryConditions: "Applies to psychopathology questions. Does not apply to general behavior questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-4-GroupCounseling",
            name: "Group Counseling Dynamics",
            description: "Understand group formation, member selection (screening), and group stages (forming, storming, norming, performing).",
            decisionRule: "Correct answer identifies appropriate candidates for groups or recognizes group process stages.",
            commonWrongRules: [
              "Including aggressive students in groups",
              "Not screening group members",
              "Not understanding group stages",
              "Believing all students benefit from groups"
            ],
            requiredEvidence: "Question must ask about group member selection or group stages",
            boundaryConditions: "Applies to group counseling questions. Does not apply to individual counseling.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      }
    ]
  },
  5: {
    domainId: 5,
    name: "School-Wide Practices to Promote Learning",
    shortName: "School-Wide",
    clusters: [
      {
        clusterId: "SWP-A",
        name: "Multi-Tiered Systems",
        description: "RTI/MTSS structure and tier implementation",
        skills: [
          {
            skillId: "SWP-S01",
            name: "RTI/MTSS Framework",
            description: "Understand RTI as multi-tiered system providing increasingly intensive interventions",
            decisionRule: "RTI = multi-tiered system. Tier 1 = universal, all students. Tier 2 = targeted, small group. Tier 3 = intensive, individual.",
            commonWrongRules: [
              "Confusing RTI with special education",
              "Not understanding tier structure",
              "Believing RTI is only for special education",
              "Not recognizing RTI as prevention framework"
            ],
            requiredEvidence: "Question must ask about RTI/MTSS definition or structure",
            boundaryConditions: "Applies to RTI/MTSS framework questions. Does not apply to specific intervention questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "SWP-S04",
            name: "Implementation Fidelity",
            description: "Recognize signs of successful Tier 1 implementation (consistent teaching, data collection)",
            decisionRule: "Successful implementation = consistent teaching of expectations, regular data collection, clear decision rules, staff buy-in.",
            commonWrongRules: [
              "Believing implementation is successful without data",
              "Not recognizing need for consistency",
              "Thinking any implementation is sufficient",
              "Not understanding fidelity indicators"
            ],
            requiredEvidence: "Question must ask about implementation success indicators",
            boundaryConditions: "Applies to implementation fidelity questions. Does not apply to intervention selection.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      },
      {
        clusterId: "SWP-B",
        name: "Positive Behavior Support",
        description: "PBIS principles and practices",
        skills: [
          {
            skillId: "SWP-S02",
            name: "PBIS Principles",
            description: "Understand PBIS focuses on teaching and reinforcing positive behaviors, not punishment",
            decisionRule: "PBIS = proactive, teaches expectations, reinforces desired behaviors, changes environment. Not punishment-focused.",
            commonWrongRules: [
              "Believing PBIS is about punishment",
              "Not understanding proactive approach",
              "Thinking PBIS doesn't work",
              "Not recognizing teaching component"
            ],
            requiredEvidence: "Question must ask about PBIS principles or approach",
            boundaryConditions: "Applies to PBIS principle questions. Does not apply to specific intervention questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "SWP-S03",
            name: "Tier 1 Universal Practices",
            description: "Identify Tier 1 (universal) interventions that teach expectations to all students",
            decisionRule: "Tier 1 = school-wide, all students, teaches expectations, acknowledges desired behaviors. Not individual counseling.",
            commonWrongRules: [
              "Confusing Tier 1 with Tier 2",
              "Selecting individual interventions for Tier 1",
              "Not recognizing universal vs. targeted",
              "Believing Tier 1 is for struggling students only"
            ],
            requiredEvidence: "Question must ask to identify Tier 1 intervention or practice",
            boundaryConditions: "Applies to Tier 1 identification questions. Does not apply to Tier 2/3 questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-5-SchoolClimate",
            name: "School Climate Components",
            description: "Identify the core domains of school climate (Engagement, Safety, Environment) and the factors that contribute to them.",
            decisionRule: "Correct answer identifies 'Engagement, Safety, Environment' or specific physical/social/emotional factors.",
            commonWrongRules: [
              "Not recognizing three main components",
              "Confusing climate with culture",
              "Not understanding engagement component",
              "Believing climate is only about safety"
            ],
            requiredEvidence: "Question must ask about school climate components or factors",
            boundaryConditions: "Applies to school climate questions. Does not apply to specific intervention questions.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      }
    ]
  },
  6: {
    domainId: 6,
    name: "Preventive & Responsive Services",
    shortName: "Prevention",
    clusters: [
      {
        clusterId: "PC-A",
        name: "Crisis Response",
        description: "Crisis intervention and threat assessment",
        skills: [
          {
            skillId: "PC-S01",
            name: "Threat Assessment",
            description: "Distinguish between transient threats (expressive) and substantive threats (instrumental)",
            decisionRule: "Transient threat = emotional expression, no plan, low risk. Substantive threat = specific plan, means, intent, high risk.",
            commonWrongRules: [
              "Treating all threats the same",
              "Not distinguishing threat types",
              "Overreacting to transient threats",
              "Underreacting to substantive threats"
            ],
            requiredEvidence: "Question must present a threat scenario and ask to classify or respond",
            boundaryConditions: "Applies to threat assessment questions. Does not apply to general safety questions.",
            dokRange: [3, 4],
            questionIds: []
          },
          {
            skillId: "PC-S02",
            name: "Crisis Response Role",
            description: "Understand school psychologist's role during crisis (support, triage, not long-term therapy)",
            decisionRule: "Crisis role = immediate support, psychological first aid, triage, connect to resources. Not long-term therapy or individual counseling during crisis.",
            commonWrongRules: [
              "Providing long-term therapy during crisis",
              "Not providing immediate support",
              "Taking over instead of supporting",
              "Not understanding crisis vs. ongoing support"
            ],
            requiredEvidence: "Question must ask about psychologist's role during crisis",
            boundaryConditions: "Applies to crisis response role questions. Does not apply to post-crisis questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "PC-S03",
            name: "Psychological First Aid",
            description: "Identify core elements of Psychological First Aid (safety, calm, connectedness, self-efficacy, hope)",
            decisionRule: "PFA elements = establish safety, promote calm, foster connectedness, enhance self-efficacy, instill hope.",
            commonWrongRules: [
              "Not establishing safety first",
              "Skipping calm/connectedness",
              "Providing therapy instead of first aid",
              "Not understanding PFA principles"
            ],
            requiredEvidence: "Question must ask about PFA elements or principles",
            boundaryConditions: "Applies to PFA questions. Does not apply to long-term intervention questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "PC-S04",
            name: "Crisis Preparedness",
            description: "Understand best practices for crisis drills (regular, developmentally appropriate)",
            decisionRule: "Crisis drills = practiced regularly, developmentally appropriate, not traumatizing, prepare without causing fear.",
            commonWrongRules: [
              "Not practicing crisis drills",
              "Making drills too scary",
              "Not adapting to developmental level",
              "Believing drills are unnecessary"
            ],
            requiredEvidence: "Question must ask about crisis drill practices",
            boundaryConditions: "Applies to crisis preparedness questions. Does not apply to crisis response questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "PC-S05",
            name: "Postvention Services",
            description: "Understand postvention goals following suicide (prevent contagion/clusters)",
            decisionRule: "Postvention primary goal = prevent contagion/cluster suicides. Provide support, avoid glorification, monitor at-risk students.",
            commonWrongRules: [
              "Not preventing contagion",
              "Glorifying the death",
              "Not monitoring at-risk students",
              "Believing postvention is only about grief"
            ],
            requiredEvidence: "Question must ask about postvention goals or practices",
            boundaryConditions: "Applies to postvention questions. Does not apply to general grief counseling.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-6-BullyingPrevention",
            name: "Bullying & Harassment Prevention",
            description: "Identify evidence-based strategies for bullying prevention (climate improvement, bystander training) and recognize ineffective ones (zero tolerance, peer mediation for bullying).",
            decisionRule: "Correct answer prioritizes systemic prevention or bystander intervention; incorrect answers often involve peer mediation (contraindicated) or zero tolerance.",
            commonWrongRules: [
              "Using zero tolerance for bullying",
              "Using peer mediation for bullying",
              "Not focusing on prevention",
              "Not recognizing effective strategies"
            ],
            requiredEvidence: "Question must ask about bullying prevention strategies",
            boundaryConditions: "Applies to bullying prevention questions. Does not apply to individual behavior questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-6-TraumaInformed",
            name: "Trauma-Informed Care",
            description: "Recognize the impact of adverse childhood experiences (ACEs) on learning and behavior, and identify trauma-informed support strategies.",
            decisionRule: "Correct answer links behavior/symptoms to trauma history or selects interventions that prioritize safety and relationship over punishment.",
            commonWrongRules: [
              "Punishing trauma-related behavior",
              "Not recognizing trauma symptoms",
              "Not prioritizing safety",
              "Believing trauma doesn't affect learning"
            ],
            requiredEvidence: "Question must ask about trauma impact or trauma-informed strategies",
            boundaryConditions: "Applies to trauma-informed questions. Does not apply to general behavior questions.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      }
    ]
  },
  7: {
    domainId: 7,
    name: "Family-School Collaboration Services",
    shortName: "Family",
    clusters: [
      {
        clusterId: "FSC-A",
        name: "Partnership Foundations",
        description: "Core principles of family-school partnerships",
        skills: [
          {
            skillId: "FSC-S01",
            name: "Partnership Goals",
            description: "Understand primary goal of family-school partnerships (shared responsibility for student success)",
            decisionRule: "Partnership goal = shared responsibility, collaboration, mutual respect, student success focus. Not one-way communication.",
            commonWrongRules: [
              "Believing partnership is one-way",
              "Not recognizing shared responsibility",
              "Thinking school knows best",
              "Not understanding collaboration"
            ],
            requiredEvidence: "Question must ask about partnership goals or principles",
            boundaryConditions: "Applies to partnership goal questions. Does not apply to specific communication strategies.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "FSC-S03",
            name: "Communication Strategies",
            description: "Select effective strategies for communicating with families (welcoming environment, jargon-free language)",
            decisionRule: "Effective communication = welcoming environment, two-way communication, jargon-free language, focus on strengths and needs, cultural sensitivity.",
            commonWrongRules: [
              "Using jargon with families",
              "One-way communication only",
              "Not creating welcoming environment",
              "Focusing only on deficits"
            ],
            requiredEvidence: "Question must ask about communication strategies or practices",
            boundaryConditions: "Applies to communication strategy questions. Does not apply to partnership goal questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "FSC-S04",
            name: "Cultural Competence",
            description: "Respect cultural differences in family structure and decision-making (e.g., collectivist cultures, extended family)",
            decisionRule: "Cultural competence = respect extended family roles, collectivist decision-making, cultural values, avoid assumptions.",
            commonWrongRules: [
              "Ignoring cultural differences",
              "Not respecting extended family",
              "Assuming Western family structure",
              "Not recognizing collectivist cultures"
            ],
            requiredEvidence: "Question must present cultural context and ask about appropriate approach",
            boundaryConditions: "Applies to cultural competence questions. Does not apply to general communication questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-7-BarriersToEngagement",
            name: "Barriers to Engagement",
            description: "Identify systemic, practical, and cultural barriers to family involvement (e.g., transportation, language, work schedules) and strategies to overcome them.",
            decisionRule: "Correct answer recognizes that 'lack of involvement' is usually due to logistical/systemic barriers, not lack of care.",
            commonWrongRules: [
              "Assuming lack of care causes low involvement",
              "Not recognizing logistical barriers",
              "Not addressing language barriers",
              "Believing families don't care"
            ],
            requiredEvidence: "Question must ask about barriers to family involvement or strategies to overcome them",
            boundaryConditions: "Applies to barrier identification questions. Does not apply to general partnership questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-7-FamilySystems",
            name: "Family Systems Theory",
            description: "Apply concepts from systems theory (circular causality, homeostasis, boundaries) to understand family dynamics.",
            decisionRule: "Correct answer focuses on the interdependence of family members or the function of behavior within the family unit.",
            commonWrongRules: [
              "Viewing family members in isolation",
              "Not understanding circular causality",
              "Believing only the child needs intervention",
              "Not recognizing family system dynamics"
            ],
            requiredEvidence: "Question must ask about family dynamics or systems theory concepts",
            boundaryConditions: "Applies to family systems questions. Does not apply to individual student questions.",
            dokRange: [3, 4],
            questionIds: []
          }
        ]
      }
    ]
  },
  8: {
    domainId: 8,
    name: "Diversity in Development & Learning",
    shortName: "Diversity",
    clusters: [
      {
        clusterId: "DIV-A",
        name: "Cultural Competence",
        description: "Understanding cultural differences and bias",
        skills: [
          {
            skillId: "DIV-S01",
            name: "Implicit Bias Recognition",
            description: "Recognize when assumptions are based on cultural bias rather than actual behavior",
            decisionRule: "Correct answer identifies when behavior is misinterpreted due to cultural bias (e.g., eye contact, communication style).",
            commonWrongRules: [
              "Assuming behavior is defiance when cultural",
              "Not recognizing cultural differences",
              "Applying own cultural norms universally",
              "Not questioning assumptions"
            ],
            requiredEvidence: "Question must present a scenario involving potential cultural bias",
            boundaryConditions: "Applies to bias recognition questions. Does not apply to general assessment questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "DIV-S05",
            name: "Cultural Broker Role",
            description: "Understand the role of cultural brokers as liaisons between school and family",
            decisionRule: "Cultural broker = community liaison, bridges cultural gap, facilitates communication, understands both cultures.",
            commonWrongRules: [
              "Not recognizing cultural broker role",
              "Believing interpreter is cultural broker",
              "Not understanding bridge function",
              "Confusing with other roles"
            ],
            requiredEvidence: "Question must ask about cultural broker definition or role",
            boundaryConditions: "Applies to cultural broker questions. Does not apply to general communication questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-8-Acculturation",
            name: "Acculturation Dynamics",
            description: "Understand the process of acculturation (assimilation, integration, separation, marginalization) and its impact on student adjustment.",
            decisionRule: "Correct answer identifies the specific mode of adaptation (e.g., Integration = high original + high new culture).",
            commonWrongRules: [
              "Confusing acculturation modes",
              "Not understanding integration vs. assimilation",
              "Believing all adaptation is the same",
              "Not recognizing impact on adjustment"
            ],
            requiredEvidence: "Question must ask about acculturation process or modes",
            boundaryConditions: "Applies to acculturation questions. Does not apply to general cultural questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-8-SocialJustice",
            name: "Social Justice & Advocacy",
            description: "Identify the psychologist's role in challenging systemic inequities and advocating for fair practices for marginalized populations.",
            decisionRule: "Correct answer prioritizes active advocacy or systemic change over passive acceptance of discriminatory practices.",
            commonWrongRules: [
              "Accepting discriminatory practices",
              "Not advocating for equity",
              "Believing advocacy is not psychologist's role",
              "Not recognizing systemic barriers"
            ],
            requiredEvidence: "Question must ask about psychologist's role regarding systemic inequities",
            boundaryConditions: "Applies to social justice questions. Does not apply to individual student questions.",
            dokRange: [3, 4],
            questionIds: []
          }
        ]
      },
      {
        clusterId: "DIV-B",
        name: "Assessment Considerations",
        description: "Fair assessment practices for diverse populations",
        skills: [
          {
            skillId: "DIV-S02",
            name: "Nonverbal Assessment Selection",
            description: "Select appropriate assessments to reduce linguistic bias (nonverbal tests for ELL students)",
            decisionRule: "For ELL students or limited English proficiency = use nonverbal assessments, reduce linguistic demands, consider cultural factors.",
            commonWrongRules: [
              "Using verbal tests with ELL students",
              "Not considering language proficiency",
              "Assuming translation is sufficient",
              "Not recognizing linguistic bias"
            ],
            requiredEvidence: "Question must present ELL/limited English scenario and ask for assessment selection",
            boundaryConditions: "Applies to assessment selection for ELL students. Does not apply to general assessment questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "DIV-S03",
            name: "Language Dominance Assessment",
            description: "Determine language dominance/proficiency before assessing ELL students",
            decisionRule: "Before assessing ELL student = determine language dominance, proficiency in both languages, primary language, English proficiency level.",
            commonWrongRules: [
              "Not assessing language proficiency first",
              "Assuming English proficiency",
              "Not considering both languages",
              "Skipping language assessment"
            ],
            requiredEvidence: "Question must ask about first step or consideration before assessing ELL student",
            boundaryConditions: "Applies to ELL assessment preparation questions. Does not apply when language is not a factor.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-8-LanguageAcquisition",
            name: "Second Language Acquisition",
            description: "Distinguish between social (BICS) and academic (CALP) language proficiency and know the typical timelines (2-3 yrs vs 5-7 yrs).",
            decisionRule: "Correct answer differentiates 'playground English' from the language needed for cognitive academic tasks.",
            commonWrongRules: [
              "Confusing BICS with CALP",
              "Not understanding timeline differences",
              "Believing social language equals academic readiness",
              "Not recognizing academic language demands"
            ],
            requiredEvidence: "Question must ask about BICS vs. CALP or language acquisition timelines",
            boundaryConditions: "Applies to language acquisition questions. Does not apply to general ELL questions.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      },
      {
        clusterId: "DIV-C",
        name: "Disproportionality",
        description: "Understanding and addressing disproportionality in special education",
        skills: [
          {
            skillId: "DIV-S04",
            name: "Disproportionality Interpretation",
            description: "Interpret risk ratios to identify overrepresentation in special education",
            decisionRule: "Risk ratio > 1.0 = overrepresentation. Risk ratio 2.5 = group is 2.5x more likely to be identified. Higher ratio = greater disproportionality.",
            commonWrongRules: [
              "Not understanding risk ratio meaning",
              "Confusing overrepresentation with underrepresentation",
              "Not recognizing significant disproportionality",
              "Believing ratios don't matter"
            ],
            requiredEvidence: "Question must present risk ratio data and ask for interpretation",
            boundaryConditions: "Applies to disproportionality interpretation questions. Does not apply to general special education questions.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      },
      {
        clusterId: "DIV-D",
        name: "Interpreter Use",
        description: "Best practices for working with interpreters",
        skills: [
          {
            skillId: "DIV-S07",
            name: "Interpreter Best Practices",
            description: "Follow best practices when using interpreters (speak directly to parent, not interpreter)",
            decisionRule: "Best practice = speak directly to parent/family member, use qualified interpreter, maintain eye contact with parent, allow time for interpretation.",
            commonWrongRules: [
              "Speaking to interpreter instead of parent",
              "Not using qualified interpreters",
              "Rushing interpretation",
              "Not maintaining direct communication"
            ],
            requiredEvidence: "Question must ask about interpreter use practices",
            boundaryConditions: "Applies to interpreter use questions. Does not apply to general communication questions.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      }
    ]
  },
  9: {
    domainId: 9,
    name: "Research & Program Evaluation",
    shortName: "Research",
    clusters: [
      {
        clusterId: "RES-A",
        name: "Research Design",
        description: "Understanding experimental and single-subject designs",
        skills: [
          {
            skillId: "RES-S01",
            name: "Single-Subject Design Recognition",
            description: "Identify single-subject designs (A-B-A-B reversal, multiple baseline, etc.)",
            decisionRule: "A-B-A-B = baseline, intervention, return to baseline, intervention again. Multiple baseline = baseline across settings/behaviors, staggered intervention.",
            commonWrongRules: [
              "Confusing single-subject with group designs",
              "Not recognizing reversal design",
              "Believing single-subject isn't valid",
              "Not understanding design structure"
            ],
            requiredEvidence: "Question must present a design scenario and ask to identify the design",
            boundaryConditions: "Applies to single-subject design questions. Does not apply to group design questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-9-Variables",
            name: "Variable Identification",
            description: "Distinguish between Independent Variables (manipulated) and Dependent Variables (measured outcome) in research scenarios.",
            decisionRule: "Correct answer identifies the 'cause' (IV) or the 'effect' (DV) correctly.",
            commonWrongRules: [
              "Confusing IV with DV",
              "Not recognizing manipulated vs. measured",
              "Believing variables are interchangeable",
              "Not understanding cause-effect relationship"
            ],
            requiredEvidence: "Question must present research scenario and ask to identify IV or DV",
            boundaryConditions: "Applies to variable identification questions. Does not apply to general research questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-9-ValidityThreats",
            name: "Research Validity Threats",
            description: "Identify threats to internal validity (history, maturation, attrition) and external validity (generalizability).",
            decisionRule: "Correct answer links a specific confounding factor (e.g., dropping out) to the correct validity threat (e.g., attrition).",
            commonWrongRules: [
              "Confusing internal with external validity threats",
              "Not recognizing attrition as threat",
              "Believing all threats are the same",
              "Not understanding validity concepts"
            ],
            requiredEvidence: "Question must present a research scenario and ask to identify validity threat",
            boundaryConditions: "Applies to validity threat questions. Does not apply to general research questions.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      },
      {
        clusterId: "RES-B",
        name: "Statistical Analysis",
        description: "Understanding statistical tests and interpretation",
        skills: [
          {
            skillId: "RES-S03",
            name: "Effect Size Interpretation",
            description: "Interpret effect sizes (Cohen's d) to determine practical significance",
            decisionRule: "Cohen's d: small = 0.2, medium = 0.5, large = 0.8+. Effect size shows practical significance, not just statistical significance.",
            commonWrongRules: [
              "Confusing statistical with practical significance",
              "Not understanding effect size meaning",
              "Believing p-value is enough",
              "Not recognizing large vs. small effects"
            ],
            requiredEvidence: "Question must present effect size and ask for interpretation",
            boundaryConditions: "Applies to effect size interpretation questions. Does not apply to general statistics questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "RES-S05",
            name: "Type I & Type II Errors",
            description: "Understand Type I error (rejecting null when true) and Type II error (failing to reject when false)",
            decisionRule: "Type I error = false positive, reject null when it's true. Type II error = false negative, fail to reject when null is false.",
            commonWrongRules: [
              "Confusing Type I with Type II",
              "Not understanding error types",
              "Believing errors are the same",
              "Not recognizing error implications"
            ],
            requiredEvidence: "Question must ask about error type definition or identification",
            boundaryConditions: "Applies to error type questions. Does not apply to general hypothesis testing questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "RES-S06",
            name: "Correlation Interpretation",
            description: "Interpret correlation coefficients (strength and direction)",
            decisionRule: "Correlation: -1 to +1. Closer to ±1 = stronger. Positive = variables increase together. Negative = variables move opposite. 0 = no relationship.",
            commonWrongRules: [
              "Confusing correlation with causation",
              "Not understanding direction",
              "Believing correlation shows cause",
              "Not recognizing strength"
            ],
            requiredEvidence: "Question must present correlation coefficient and ask for interpretation",
            boundaryConditions: "Applies to correlation interpretation questions. Does not apply to general statistics questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-9-StatisticalTests",
            name: "Statistical Test Selection",
            description: "Select the appropriate statistical test (t-test, ANOVA, Chi-square, correlation) based on the research question and data type.",
            decisionRule: "Correct answer matches 2 groups → t-test, 3+ groups → ANOVA, categorical data → Chi-square.",
            commonWrongRules: [
              "Using wrong test for data type",
              "Confusing t-test with ANOVA",
              "Not matching test to research question",
              "Believing all tests are the same"
            ],
            requiredEvidence: "Question must present research scenario and ask for appropriate test",
            boundaryConditions: "Applies to test selection questions. Does not apply to general statistics questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-9-DescriptiveStats",
            name: "Descriptive Statistics",
            description: "Understand and interpret measures of central tendency (mean, median, mode) and dispersion (range, variance, standard deviation).",
            decisionRule: "Correct answer identifies the measure that best summarizes the data set's center or spread.",
            commonWrongRules: [
              "Confusing mean with median",
              "Not understanding standard deviation",
              "Believing all measures are the same",
              "Not recognizing when to use each measure"
            ],
            requiredEvidence: "Question must ask about descriptive statistics or measures of central tendency/dispersion",
            boundaryConditions: "Applies to descriptive statistics questions. Does not apply to inferential statistics questions.",
            dokRange: [1, 2],
            questionIds: []
          }
        ]
      }
    ]
  },
  10: {
    domainId: 10,
    name: "Legal, Ethical & Professional Practice",
    shortName: "Legal/Ethics",
    clusters: [
      {
        clusterId: "LEG-A",
        name: "Education Law",
        description: "IDEA, Section 504, and landmark cases",
        skills: [
          {
            skillId: "LEG-S01",
            name: "Landmark Cases",
            description: "Identify key legal cases and their implications (Tarasoff, Larry P., Rowley)",
            decisionRule: "Tarasoff = duty to warn/protect when specific threat. Larry P. = banned IQ tests for African American placement in CA. Rowley = 'some educational benefit' standard for FAPE.",
            commonWrongRules: [
              "Confusing case names and rulings",
              "Not understanding case implications",
              "Believing all cases are the same",
              "Not recognizing case significance"
            ],
            requiredEvidence: "Question must ask about specific case or its ruling",
            boundaryConditions: "Applies to landmark case questions. Does not apply to general legal questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "LEG-S02",
            name: "FAPE Requirements",
            description: "Understand Free Appropriate Public Education (FAPE) requirements under IDEA",
            decisionRule: "FAPE = special education and related services provided at public expense, meet state standards, provided in conformity with IEP.",
            commonWrongRules: [
              "Not understanding FAPE requirements",
              "Believing FAPE means optimal education",
              "Not recognizing public expense requirement",
              "Confusing FAPE with LRE"
            ],
            requiredEvidence: "Question must ask about FAPE definition or requirements",
            boundaryConditions: "Applies to FAPE questions. Does not apply to general IDEA questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-10-EducationLaw",
            name: "Section 504 vs. IDEA",
            description: "Distinguish between the mandates of Section 504 (Civil Rights/Access) and IDEA (Educational Benefit/Specialized Instruction).",
            decisionRule: "Correct answer differentiates between 'access' (504) and 'specialized instruction' (IDEA).",
            commonWrongRules: [
              "Confusing 504 with IDEA",
              "Not understanding access vs. benefit",
              "Believing they are the same",
              "Not recognizing different purposes"
            ],
            requiredEvidence: "Question must ask about difference between 504 and IDEA",
            boundaryConditions: "Applies to 504 vs. IDEA distinction questions. Does not apply to general legal questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "LEG-S05",
            name: "Manifestation Determination",
            description: "Understand purpose of Manifestation Determination Review (decide if conduct caused by disability)",
            decisionRule: "MDR purpose = determine if conduct was caused by disability. If yes, cannot change placement. If no, can apply same discipline as non-disabled students.",
            commonWrongRules: [
              "Not understanding MDR purpose",
              "Believing MDR is about punishment",
              "Not recognizing disability connection",
              "Confusing MDR with other processes"
            ],
            requiredEvidence: "Question must ask about MDR purpose or process",
            boundaryConditions: "Applies to MDR questions. Does not apply to general discipline questions.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      },
      {
        clusterId: "LEG-B",
        name: "Ethics & Confidentiality",
        description: "Ethical principles and confidentiality requirements",
        skills: [
          {
            skillId: "LEG-S03",
            name: "Confidentiality Breach",
            description: "Know when to breach confidentiality (imminent danger to self or others)",
            decisionRule: "Breach confidentiality when: imminent danger to self or others, child abuse, court order. Not for general concerns.",
            commonWrongRules: [
              "Breaching confidentiality inappropriately",
              "Not breaching when required",
              "Believing confidentiality is absolute",
              "Not recognizing imminent danger"
            ],
            requiredEvidence: "Question must present scenario and ask when to breach confidentiality",
            boundaryConditions: "Applies to confidentiality breach questions. Does not apply to general ethical questions.",
            dokRange: [3, 4],
            questionIds: []
          },
          {
            skillId: "LEG-S04",
            name: "Mandated Reporting",
            description: "Understand legal duty to report child abuse (report to CPS, not investigate)",
            decisionRule: "Legal duty = report suspected abuse to CPS immediately. Do NOT investigate. Report based on reasonable suspicion, not proof.",
            commonWrongRules: [
              "Investigating instead of reporting",
              "Delaying report",
              "Believing proof is required",
              "Not understanding immediate duty"
            ],
            requiredEvidence: "Question must present abuse scenario and ask about legal duty",
            boundaryConditions: "Applies to mandated reporting questions. Does not apply to general confidentiality questions.",
            dokRange: [3, 4],
            questionIds: []
          },
          {
            skillId: "LEG-S06",
            name: "Ethical Dilemmas",
            description: "Apply ethical principles to resolve dilemmas (e.g., gifts, conflicts of interest)",
            decisionRule: "Ethical resolution = consider cultural context, avoid conflicts of interest, prioritize student welfare, consult when uncertain.",
            commonWrongRules: [
              "Not considering cultural context",
              "Accepting inappropriate gifts",
              "Not recognizing conflicts",
              "Not consulting when uncertain"
            ],
            requiredEvidence: "Question must present ethical dilemma and ask for resolution",
            boundaryConditions: "Applies to ethical dilemma questions. Does not apply to clear-cut legal questions.",
            dokRange: [3, 4],
            questionIds: []
          },
          {
            skillId: "NEW-10-RecordKeeping",
            name: "FERPA & Record Access",
            description: "Apply FERPA regulations regarding parent access to records, amendment of records, and rights of non-custodial parents.",
            decisionRule: "Correct answer upholds parent rights to access unless specific legal revocation exists.",
            commonWrongRules: [
              "Denying access without legal basis",
              "Not understanding non-custodial parent rights",
              "Believing access can be denied arbitrarily",
              "Not recognizing FERPA requirements"
            ],
            requiredEvidence: "Question must ask about FERPA or record access rights",
            boundaryConditions: "Applies to FERPA questions. Does not apply to general confidentiality questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-10-TestSecurity",
            name: "Test Security & Copyright",
            description: "Balance parent rights to inspect records with the duty to maintain test security and copyright laws.",
            decisionRule: "Correct answer allows viewing/explanation but prohibits copying or releasing raw protocols to unqualified persons.",
            commonWrongRules: [
              "Releasing protocols to unqualified persons",
              "Not allowing any access",
              "Believing parents can copy protocols",
              "Not balancing rights with security"
            ],
            requiredEvidence: "Question must ask about test protocol access or security",
            boundaryConditions: "Applies to test security questions. Does not apply to general record access questions.",
            dokRange: [2, 3],
            questionIds: []
          },
          {
            skillId: "NEW-10-Supervision",
            name: "Supervision Standards",
            description: "Know NASP standards for professional supervision (internship requirements, hours, qualification of supervisor).",
            decisionRule: "Correct answer matches specific NASP standards (e.g., 2 hours face-to-face).",
            commonWrongRules: [
              "Not knowing supervision requirements",
              "Believing any supervision is sufficient",
              "Not recognizing NASP standards",
              "Confusing internship with practicum"
            ],
            requiredEvidence: "Question must ask about supervision standards or requirements",
            boundaryConditions: "Applies to supervision standard questions. Does not apply to general professional practice questions.",
            dokRange: [2, 3],
            questionIds: []
          }
        ]
      }
    ]
  }
};

// Helper function to get a skill by ID
export function getSkillById(skillId: SkillId): Skill | null {
  for (const domain of Object.values(SKILL_MAP)) {
    for (const cluster of domain.clusters) {
      const skill = cluster.skills.find(s => s.skillId === skillId);
      if (skill) return skill;
    }
  }
  return null;
}

// Helper function to get all skills for a domain
export function getSkillsForDomain(domainId: DomainId): Skill[] {
  const domain = SKILL_MAP[domainId];
  if (!domain) return [];
  
  return domain.clusters.flatMap(cluster => cluster.skills);
}
