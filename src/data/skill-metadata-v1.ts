/**
 * Skill Metadata v1
 *
 * Core content layer for evidence-based study guide generation.
 * Provides grounded vocabulary, misconceptions, case archetypes, and laws
 * for each skill — retrieved deterministically before the model is invoked.
 *
 * v1 fields (ship first, prove value, add secondary fields later):
 *   contentCluster  — cross-domain grouping for priority cluster logic
 *   vocabulary      — 3–5 key terms tied to this skill
 *   commonMisconceptions — 2–3 things students consistently get wrong
 *   caseArchetypes  — 2–3 scenario types this skill appears in
 *   lawsFrameworks  — relevant statutes, cases, or frameworks (may be empty)
 *
 * Secondary fields (add after v1 proves useful):
 *   prerequisiteSkills, commonQuestionPatterns, studyActions, masteryIndicators
 */

import type { ContentCluster } from '../types/studyPlanTypes';

export interface SkillMetadataV1 {
  skillId: string;
  contentCluster: ContentCluster;
  vocabulary: string[];
  commonMisconceptions: string[];
  caseArchetypes: string[];
  lawsFrameworks: string[];
}

export const skillMetadataV1: Record<string, SkillMetadataV1> = {

  // ─── Domain 1: Data-Based Decision Making ──────────────────────────────────

  "DBDM-S01": {
    skillId: "DBDM-S01",
    contentCluster: "psychometrics-and-assessment",
    vocabulary: ["interobserver agreement", "test-retest reliability", "Cronbach's alpha", "interrater reliability", "consistency"],
    commonMisconceptions: [
      "All reliability types are interchangeable across measurement contexts",
      "Test-retest reliability measures internal consistency rather than stability over time",
      "Cronbach's alpha is appropriate for behavioral observation data"
    ],
    caseArchetypes: [
      "Behavioral observation study requiring a specific reliability type",
      "Rating scale or survey study needing internal consistency evidence",
      "Two raters scoring the same student independently"
    ],
    lawsFrameworks: [],
  },

  "DBDM-S02": {
    skillId: "DBDM-S02",
    contentCluster: "psychometrics-and-assessment",
    vocabulary: ["content validity", "criterion validity", "construct validity", "face validity", "concurrent validity", "predictive validity"],
    commonMisconceptions: [
      "Face validity is sufficient evidence that a test measures what it claims",
      "Criterion validity and construct validity are established the same way"
    ],
    caseArchetypes: [
      "Expert panel reviewing test items for coverage of a domain",
      "New test correlated with a gold-standard external measure"
    ],
    lawsFrameworks: [],
  },

  "DBDM-S03": {
    skillId: "DBDM-S03",
    contentCluster: "psychometrics-and-assessment",
    vocabulary: ["confidence interval", "standard error of measurement (SEM)", "standard score", "percentile rank", "z-score", "reliability coefficient"],
    commonMisconceptions: [
      "A percentile rank of 50 means the student got 50% of items correct",
      "Higher reliability always means smaller SEM in all cases",
      "A standard score of 85 puts a student at the 15th percentile"
    ],
    caseArchetypes: [
      "Interpreting an IQ score with confidence interval for an eligibility decision",
      "Using SEM to explain score range variation to a parent"
    ],
    lawsFrameworks: [],
  },

  "DBDM-S04": {
    skillId: "DBDM-S04",
    contentCluster: "psychometrics-and-assessment",
    vocabulary: ["sensitivity", "specificity", "true positive", "false positive", "false negative", "base rate"],
    commonMisconceptions: [
      "High sensitivity means few false positives (it actually means few false negatives)",
      "Sensitivity and specificity can both be maximized without any trade-off"
    ],
    caseArchetypes: [
      "Selecting a screening tool when false negatives are especially costly",
      "Evaluating a screening measure where false positives create unnecessary referrals"
    ],
    lawsFrameworks: [],
  },

  "DBDM-S05": {
    skillId: "DBDM-S05",
    contentCluster: "data-based-decision-making",
    vocabulary: ["universal screening", "diagnostic assessment", "progress monitoring", "program evaluation", "formative assessment", "summative assessment"],
    commonMisconceptions: [
      "Screening can diagnose a specific disability",
      "Progress monitoring and diagnostic assessment serve the same purpose"
    ],
    caseArchetypes: [
      "School selecting an instrument to identify at-risk readers in fall",
      "Team choosing measures to track student response to a Tier 2 reading intervention"
    ],
    lawsFrameworks: [],
  },

  "DBDM-S06": {
    skillId: "DBDM-S06",
    contentCluster: "psychometrics-and-assessment",
    vocabulary: ["norm-referenced test", "criterion-referenced test", "percentile rank", "mastery threshold", "standard score", "benchmark"],
    commonMisconceptions: [
      "Norm-referenced tests show whether a student has mastered a skill",
      "Criterion-referenced tests compare students to age or grade peers"
    ],
    caseArchetypes: [
      "Determining if a student qualifies for special education using comparative data",
      "Checking whether a student has met a reading fluency benchmark"
    ],
    lawsFrameworks: [],
  },

  "DBDM-S07": {
    skillId: "DBDM-S07",
    contentCluster: "data-based-decision-making",
    vocabulary: ["formative assessment", "summative assessment", "single-subject design", "repeated measures", "ongoing monitoring"],
    commonMisconceptions: [
      "Formative and summative assessments can be used interchangeably",
      "Single-subject designs are only valid in research, not practice"
    ],
    caseArchetypes: [
      "Teacher using exit tickets to adjust next-day instruction",
      "Evaluating intervention effectiveness for one student using repeated data points"
    ],
    lawsFrameworks: [],
  },

  "NEW-1-PerformanceAssessment": {
    skillId: "NEW-1-PerformanceAssessment",
    contentCluster: "psychometrics-and-assessment",
    vocabulary: ["performance-based assessment", "authentic assessment", "portfolio", "rubric", "constructed response"],
    commonMisconceptions: [
      "Performance assessments are less rigorous than selected-response tests",
      "Any student product automatically counts as a performance assessment"
    ],
    caseArchetypes: [
      "Student asked to demonstrate problem-solving rather than select an answer",
      "Portfolio review included as part of a comprehensive evaluation"
    ],
    lawsFrameworks: [],
  },

  "NEW-1-DynamicAssessment": {
    skillId: "NEW-1-DynamicAssessment",
    contentCluster: "psychometrics-and-assessment",
    vocabulary: ["dynamic assessment", "zone of proximal development", "test-teach-retest", "learning potential", "mediated learning experience"],
    commonMisconceptions: [
      "Dynamic assessment measures current achievement rather than learning potential",
      "Dynamic assessment replaces standardized testing for all purposes"
    ],
    caseArchetypes: [
      "Assessing an ELL student's learning potential beyond static test scores",
      "Determining responsiveness to instruction before a special education referral"
    ],
    lawsFrameworks: [],
  },

  "NEW-1-IQvsAchievement": {
    skillId: "NEW-1-IQvsAchievement",
    contentCluster: "psychometrics-and-assessment",
    vocabulary: ["intelligence test", "achievement test", "cognitive ability", "fluid reasoning", "crystallized intelligence", "academic achievement"],
    commonMisconceptions: [
      "IQ and achievement tests measure the same underlying construct",
      "Achievement tests predict future potential rather than measuring what has been learned"
    ],
    caseArchetypes: [
      "Selecting instruments for a comprehensive evaluation and distinguishing purposes",
      "Explaining to a parent what the WISC measures versus the WIAT"
    ],
    lawsFrameworks: [],
  },

  "DBDM-S08": {
    skillId: "DBDM-S08",
    contentCluster: "data-based-decision-making",
    vocabulary: ["curriculum-based measurement (CBM)", "aim line", "trend line", "benchmark", "decision rule", "probe"],
    commonMisconceptions: [
      "Any assessment administered repeatedly can serve as valid progress monitoring",
      "Progress monitoring data should be reviewed monthly rather than weekly"
    ],
    caseArchetypes: [
      "Teacher implementing weekly oral reading fluency probes for a Tier 2 student",
      "Problem-solving team using graphed CBM data to decide whether to change an intervention"
    ],
    lawsFrameworks: ["IDEA (data-based decision making for special education)"],
  },

  "DBDM-S09": {
    skillId: "DBDM-S09",
    contentCluster: "data-based-decision-making",
    vocabulary: ["universal screening", "at-risk", "risk identification", "benchmark", "false positive", "referral"],
    commonMisconceptions: [
      "A positive screen result means the student has a disability",
      "Screening provides sufficient data to make a special education placement decision"
    ],
    caseArchetypes: [
      "School administering a fall reading screener to all students",
      "Team determining appropriate next steps after a student fails the screener"
    ],
    lawsFrameworks: ["IDEA (tiered intervention framework)", "Every Student Succeeds Act (ESSA)"],
  },

  "DBDM-S10": {
    skillId: "DBDM-S10",
    contentCluster: "data-based-decision-making",
    vocabulary: ["baseline data", "data review", "hypothesis", "data-based recommendation", "problem-solving sequence"],
    commonMisconceptions: [
      "Recommendations can be made from teacher reports alone without reviewing existing data",
      "Reviewing data is only necessary before major placement decisions"
    ],
    caseArchetypes: [
      "School psychologist asked to recommend an intervention before any data is shared",
      "Team member pushing to skip data review and start an intervention immediately"
    ],
    lawsFrameworks: [],
  },

  "NEW-1-BackgroundInformation": {
    skillId: "NEW-1-BackgroundInformation",
    contentCluster: "data-based-decision-making",
    vocabulary: ["developmental history", "educational records", "medical records", "records review", "informed consent for records"],
    commonMisconceptions: [
      "Background information is optional when cognitive test data is available",
      "Medical records can be requested without parental authorization"
    ],
    caseArchetypes: [
      "Comprehensive evaluation planning that includes a review of records",
      "Identifying relevant health history before interpreting test score patterns"
    ],
    lawsFrameworks: ["FERPA (educational records access)", "HIPAA (medical records privacy)"],
  },

  "NEW-1-ProblemSolvingFramework": {
    skillId: "NEW-1-ProblemSolvingFramework",
    contentCluster: "data-based-decision-making",
    vocabulary: ["MTSS", "RTI", "tiered support", "problem-solving model", "data-based decision", "fidelity"],
    commonMisconceptions: [
      "The problem-solving framework applies only to academic concerns",
      "MTSS and RTI are unrelated frameworks with different purposes"
    ],
    caseArchetypes: [
      "Applying the problem-solving model to a student with both academic and behavioral concerns",
      "Using MTSS data to inform special education eligibility determination"
    ],
    lawsFrameworks: ["IDEA (RTI provisions for learning disability identification)", "ESSA (MTSS support)"],
  },

  "NEW-1-LowIncidenceExceptionalities": {
    skillId: "NEW-1-LowIncidenceExceptionalities",
    contentCluster: "data-based-decision-making",
    vocabulary: ["low-incidence disability", "chronic health impairment", "sensory impairment", "adapted assessment", "specialist consultation"],
    commonMisconceptions: [
      "Standard assessment procedures are appropriate for all students regardless of disability",
      "Low-incidence disabilities are primarily academic learning disabilities"
    ],
    caseArchetypes: [
      "Evaluating a student with cerebral palsy using adapted assessment procedures",
      "Consulting with specialists for a student with significant vision impairment"
    ],
    lawsFrameworks: ["IDEA (nondiscriminatory evaluation requirements)", "Section 504 (access accommodations)"],
  },

  // ─── Domain 2: Consultation & Collaboration ────────────────────────────────

  "CC-S01": {
    skillId: "CC-S01",
    contentCluster: "consultation-and-collaboration",
    vocabulary: ["behavioral consultation", "organizational consultation", "multicultural consultation", "conjoint behavioral consultation", "mental health consultation"],
    commonMisconceptions: [
      "All consultation models follow the same structure regardless of target or goal",
      "Conjoint consultation involves only the home or only the school, not both simultaneously"
    ],
    caseArchetypes: [
      "Identifying the appropriate model when working with a teacher on one student's behavior",
      "Selecting conjoint consultation for a situation requiring coordinated home and school intervention"
    ],
    lawsFrameworks: [],
  },

  "NEW-2-ConsultationProcess": {
    skillId: "NEW-2-ConsultationProcess",
    contentCluster: "consultation-and-collaboration",
    vocabulary: ["problem identification", "problem analysis", "plan implementation", "plan evaluation", "contracting", "consultation stages"],
    commonMisconceptions: [
      "Consultation can skip the problem analysis stage when the problem seems obvious",
      "The initial contracting stage is optional"
    ],
    caseArchetypes: [
      "Psychologist helping a teacher define the specific problem before selecting an intervention",
      "Evaluating whether the consultation plan was implemented with fidelity"
    ],
    lawsFrameworks: [],
  },

  "NEW-2-ProblemSolvingSteps": {
    skillId: "NEW-2-ProblemSolvingSteps",
    contentCluster: "consultation-and-collaboration",
    vocabulary: ["problem definition", "baseline measurement", "data analysis", "hypothesis testing", "intervention monitoring"],
    commonMisconceptions: [
      "Defining the problem is less important than quickly starting an intervention",
      "Generating solutions should occur before data analysis is complete"
    ],
    caseArchetypes: [
      "Team member pushing for an intervention before the problem is clearly defined",
      "Reviewing baseline data to determine whether current scores differ from expected"
    ],
    lawsFrameworks: [],
  },

  "CC-S03": {
    skillId: "CC-S03",
    contentCluster: "consultation-and-collaboration",
    vocabulary: ["facilitator role", "collaborative partner", "shared decision-making", "consultee", "consultant", "non-hierarchical relationship"],
    commonMisconceptions: [
      "The consultant is the expert who prescribes solutions to the consultee",
      "Collaboration requires equal power but not shared responsibility for outcomes"
    ],
    caseArchetypes: [
      "Psychologist working alongside a teacher to develop a plan rather than prescribing one",
      "Navigating a consultee who expects expert-driven directive advice"
    ],
    lawsFrameworks: [],
  },

  "NEW-2-CommunicationStrategies": {
    skillId: "NEW-2-CommunicationStrategies",
    contentCluster: "consultation-and-collaboration",
    vocabulary: ["active listening", "reflective listening", "resistance", "rapport", "open-ended question", "empathic responding"],
    commonMisconceptions: [
      "Providing direct advice is more effective than collaborative dialogue",
      "Resistance from a consultee signals that consultation should end"
    ],
    caseArchetypes: [
      "Parent expressing frustration during a collaborative meeting",
      "Teacher dismissing recommendations during a problem-solving team meeting"
    ],
    lawsFrameworks: [],
  },

  "NEW-2-FamilyCollaboration": {
    skillId: "NEW-2-FamilyCollaboration",
    contentCluster: "family-systems",
    vocabulary: ["family-school partnership", "home-school collaboration", "culturally responsive practice", "trust-building", "parent engagement"],
    commonMisconceptions: [
      "Family involvement simply means parents attending school events",
      "Low attendance at school meetings signals lack of parental care"
    ],
    caseArchetypes: [
      "Working with a family from a non-Western background on developing an intervention plan",
      "Building trust with a family that has had negative prior experiences with schools"
    ],
    lawsFrameworks: ["IDEA (parent participation rights in educational decision-making)"],
  },

  "NEW-2-CommunityAgencies": {
    skillId: "NEW-2-CommunityAgencies",
    contentCluster: "consultation-and-collaboration",
    vocabulary: ["interagency collaboration", "community referral", "wraparound services", "service coordination", "community resource"],
    commonMisconceptions: [
      "School psychologists should handle all student needs independently within the school",
      "Referring to a community agency ends the school psychologist's responsibility"
    ],
    caseArchetypes: [
      "Student needing mental health services that exceed what the school can provide",
      "Coordinating between the school, family, and a community mental health provider"
    ],
    lawsFrameworks: ["IDEA (related services and interagency coordination)"],
  },

  // ─── Domain 3: Academic Interventions ─────────────────────────────────────

  "ACAD-S01": {
    skillId: "ACAD-S01",
    contentCluster: "academic-intervention",
    vocabulary: ["Tier 1 (universal)", "Tier 2 (targeted)", "Tier 3 (intensive)", "intervention intensity", "benchmark", "below benchmark"],
    commonMisconceptions: [
      "A student must fail Tier 1 before any Tier 2 support can be provided",
      "Placement in Tier 3 automatically means the student has a learning disability"
    ],
    caseArchetypes: [
      "Deciding intervention intensity based on fall screening data",
      "Student not responding to Tier 2 and team determining appropriate next steps"
    ],
    lawsFrameworks: ["IDEA (RTI model for LD identification)", "ESSA (MTSS provisions)"],
  },

  "ACAD-S02": {
    skillId: "ACAD-S02",
    contentCluster: "academic-intervention",
    vocabulary: ["phonemic awareness", "phonics", "decoding", "reading fluency", "reading comprehension", "reciprocal teaching", "repeated reading"],
    commonMisconceptions: [
      "Reading fluency problems always indicate the need for more phonics instruction",
      "Comprehension strategies address all types of reading comprehension difficulties equally"
    ],
    caseArchetypes: [
      "Student who can decode words but has poor reading comprehension",
      "Student struggling to blend phonemes and recognize words"
    ],
    lawsFrameworks: [],
  },

  "ACAD-S03": {
    skillId: "ACAD-S03",
    contentCluster: "academic-intervention",
    vocabulary: ["error analysis", "error pattern", "skill deficit", "diagnostic teaching", "systematic error", "work sample analysis"],
    commonMisconceptions: [
      "Any wrong answer tells us the student simply needs more general practice",
      "Error patterns are only meaningful in math, not in reading"
    ],
    caseArchetypes: [
      "Reviewing oral reading errors to identify a specific phonics gap",
      "Analyzing math work samples to identify a systematic calculation error pattern"
    ],
    lawsFrameworks: [],
  },

  "ACAD-S04": {
    skillId: "ACAD-S04",
    contentCluster: "academic-intervention",
    vocabulary: ["reading fluency", "automaticity", "rate", "accuracy", "repeated reading", "timed practice", "cover-copy-compare"],
    commonMisconceptions: [
      "Fluency instruction means simply reading faster",
      "Reading fluency is only relevant for younger elementary students"
    ],
    caseArchetypes: [
      "Student with accurate but slow reading who needs fluency-building support",
      "Math student who knows facts but relies on slow counting strategies"
    ],
    lawsFrameworks: [],
  },

  "ACAD-S05": {
    skillId: "ACAD-S05",
    contentCluster: "academic-intervention",
    vocabulary: ["independent reading level", "instructional reading level", "frustration level", "accuracy rate", "text difficulty"],
    commonMisconceptions: [
      "A student reading at 90% accuracy is at their independent level",
      "Frustration-level materials should never appear in any instructional context"
    ],
    caseArchetypes: [
      "Determining appropriate text difficulty for a struggling reader during an intervention",
      "Matching a student's current skill level to appropriate practice materials"
    ],
    lawsFrameworks: [],
  },

  "NEW-3-InstructionalHierarchy": {
    skillId: "NEW-3-InstructionalHierarchy",
    contentCluster: "academic-intervention",
    vocabulary: ["acquisition stage", "proficiency stage", "generalization stage", "adaptation stage", "modeling", "guided practice", "timed drill"],
    commonMisconceptions: [
      "All students at the same grade level need the same type of instruction",
      "Fluency drills are appropriate even before a student has acquired the skill"
    ],
    caseArchetypes: [
      "Student who reads words correctly but slowly and needs proficiency-stage support",
      "Student learning a new math concept who needs explicit modeling at acquisition stage"
    ],
    lawsFrameworks: [],
  },

  "NEW-3-MetacognitiveStrategies": {
    skillId: "NEW-3-MetacognitiveStrategies",
    contentCluster: "academic-intervention",
    vocabulary: ["metacognition", "self-regulation", "self-monitoring", "mnemonic device", "executive function", "study skills", "self-talk"],
    commonMisconceptions: [
      "Metacognitive strategies only benefit advanced learners",
      "Study skills instruction can substitute for content knowledge"
    ],
    caseArchetypes: [
      "Student who cannot monitor comprehension while reading",
      "Student who does not use self-checking strategies when solving math problems"
    ],
    lawsFrameworks: [],
  },

  "NEW-3-AccommodationsModifications": {
    skillId: "NEW-3-AccommodationsModifications",
    contentCluster: "academic-intervention",
    vocabulary: ["accommodation", "modification", "assistive technology", "specially designed instruction", "extended time", "reduced workload"],
    commonMisconceptions: [
      "Accommodations change the academic standards a student is held to",
      "Modifications and accommodations are interchangeable terms"
    ],
    caseArchetypes: [
      "IEP team deciding between extended time and reduced assignment length",
      "Student with a reading disability needing text-to-speech access"
    ],
    lawsFrameworks: ["IDEA (specially designed instruction)", "Section 504 (access accommodations)", "ADA (disability access)"],
  },

  "NEW-3-AcademicProgressFactors": {
    skillId: "NEW-3-AcademicProgressFactors",
    contentCluster: "academic-intervention",
    vocabulary: ["classroom climate", "family involvement", "socioeconomic factors", "home-school partnership", "environmental context", "protective factors"],
    commonMisconceptions: [
      "Academic performance is determined primarily by cognitive ability alone",
      "Socioeconomic factors are outside the scope of a school psychologist's concern"
    ],
    caseArchetypes: [
      "Student with a strong cognitive profile but declining academic performance",
      "School in a high-poverty area with consistently low achievement across classrooms"
    ],
    lawsFrameworks: [],
  },

  "NEW-3-BioCulturalInfluences": {
    skillId: "NEW-3-BioCulturalInfluences",
    contentCluster: "diversity-and-equity",
    vocabulary: ["biological factors", "cultural learning styles", "developmental readiness", "cultural capital", "social context", "peer influence"],
    commonMisconceptions: [
      "Cultural factors in learning only apply to ELL students",
      "Academic difficulties always indicate underlying cognitive processing deficits"
    ],
    caseArchetypes: [
      "Evaluating a student whose cultural background affects interaction style and performance",
      "Considering developmental readiness for a young child referred for learning difficulties"
    ],
    lawsFrameworks: [],
  },

  // ─── Domain 4: Mental & Behavioral Health ─────────────────────────────────

  "MBH-S01": {
    skillId: "MBH-S01",
    contentCluster: "behavior-and-mental-health",
    vocabulary: ["functional behavior assessment (FBA)", "antecedent", "behavior", "consequence (ABC)", "behavior function", "frequency", "duration", "intensity"],
    commonMisconceptions: [
      "FBA identifies what to punish rather than understanding why the behavior occurs",
      "ABC data collection requires formal assessment instruments"
    ],
    caseArchetypes: [
      "Student with disruptive classroom behavior requiring FBA before developing a behavior intervention plan",
      "Team collecting data to determine why a student leaves class repeatedly"
    ],
    lawsFrameworks: ["IDEA (FBA requirement when behavior impedes learning or others' learning)"],
  },

  "MBH-S02": {
    skillId: "MBH-S02",
    contentCluster: "behavior-and-mental-health",
    vocabulary: ["attention function", "escape/avoidance function", "tangible function", "sensory function", "positive reinforcement", "negative reinforcement"],
    commonMisconceptions: [
      "All disruptive behavior is primarily attention-seeking",
      "Escape-maintained behavior means the student is lazy or unmotivated"
    ],
    caseArchetypes: [
      "Student who acts out whenever difficult work is presented (escape function)",
      "Student who throws objects to get removed from class (escape or tangible function)"
    ],
    lawsFrameworks: [],
  },

  "MBH-S03": {
    skillId: "MBH-S03",
    contentCluster: "behavior-and-mental-health",
    vocabulary: ["replacement behavior", "functionally equivalent behavior", "behavior intervention plan (BIP)", "competing behavior pathway", "function match"],
    commonMisconceptions: [
      "Any socially appropriate behavior can replace a problem behavior regardless of its function",
      "Replacement behaviors must look completely different from the problem behavior"
    ],
    caseArchetypes: [
      "Student who hits to gain attention needing a replacement behavior (e.g., raising hand)",
      "Student who elopes to escape difficult tasks needing a functionally equivalent alternative"
    ],
    lawsFrameworks: ["IDEA (BIP requirements for students with disabilities)"],
  },

  "MBH-S04": {
    skillId: "MBH-S04",
    contentCluster: "crisis-and-safety",
    vocabulary: ["suicidal ideation", "suicide plan", "intent", "means", "lethality", "protective factors", "imminent risk"],
    commonMisconceptions: [
      "Asking about suicide will plant the idea in a student's mind",
      "Only students with a specific detailed plan are at high immediate risk"
    ],
    caseArchetypes: [
      "Student expressing vague suicidal thoughts without a specific plan",
      "Student with a specific plan, identified means, and stated intent to act"
    ],
    lawsFrameworks: [],
  },

  "MBH-S05": {
    skillId: "MBH-S05",
    contentCluster: "behavior-and-mental-health",
    vocabulary: ["cognitive behavioral therapy (CBT)", "cognitive distortion", "solution-focused brief therapy (SFBT)", "dialectical behavior therapy (DBT)", "evidence-based practice (EBP)", "mindfulness"],
    commonMisconceptions: [
      "CBT focuses primarily on changing feelings rather than the relationship between thoughts and behaviors",
      "Solution-focused therapy is equally appropriate for all presenting concerns"
    ],
    caseArchetypes: [
      "Student with anxiety and catastrophic thinking needing cognitive restructuring",
      "Student needing brief, goal-oriented support for a situational stressor"
    ],
    lawsFrameworks: [],
  },

  "MBH-S06": {
    skillId: "MBH-S06",
    contentCluster: "behavior-and-mental-health",
    vocabulary: ["positive reinforcement", "negative reinforcement", "punishment", "extinction", "shaping", "token economy", "social skills training"],
    commonMisconceptions: [
      "Punishment alone is the most effective way to reduce problem behavior",
      "Negative reinforcement is the same thing as punishment"
    ],
    caseArchetypes: [
      "Classroom teacher implementing a behavior chart to reinforce rule compliance",
      "Student needing explicit social skills training with modeling, rehearsal, and feedback"
    ],
    lawsFrameworks: [],
  },

  "NEW-4-Psychopathology": {
    skillId: "NEW-4-Psychopathology",
    contentCluster: "behavior-and-mental-health",
    vocabulary: ["ADHD", "major depressive disorder", "anxiety disorder", "autism spectrum disorder (ASD)", "oppositional defiant disorder (ODD)", "internalizing disorder", "externalizing disorder"],
    commonMisconceptions: [
      "Depression in children presents the same as in adults (sadness-dominant)",
      "ADHD is always characterized by hyperactivity in all children at all ages"
    ],
    caseArchetypes: [
      "Irritable, agitated child whose depression is overlooked because it doesn't resemble adult sadness",
      "Student with high-functioning ASD whose social challenges are misattributed to deliberate behavior problems"
    ],
    lawsFrameworks: ["DSM-5 (diagnostic criteria for childhood disorders)"],
  },

  "NEW-4-GroupCounseling": {
    skillId: "NEW-4-GroupCounseling",
    contentCluster: "behavior-and-mental-health",
    vocabulary: ["group formation", "screening for groups", "group stages", "forming", "storming", "norming", "performing", "group cohesion"],
    commonMisconceptions: [
      "Any student who needs support is automatically a good candidate for group counseling",
      "Group developmental stages are linear and never revisited"
    ],
    caseArchetypes: [
      "Identifying appropriate candidates for a social skills group",
      "Managing a group that has stalled in the storming stage"
    ],
    lawsFrameworks: [],
  },

  "NEW-4-DevelopmentalInterventions": {
    skillId: "NEW-4-DevelopmentalInterventions",
    contentCluster: "behavior-and-mental-health",
    vocabulary: ["developmental appropriateness", "concrete thinking", "abstract reasoning", "play therapy", "cognitive development", "Piaget stages"],
    commonMisconceptions: [
      "The same counseling approach is equally effective across all developmental stages",
      "Adolescents require the same level of parental involvement in counseling as young children"
    ],
    caseArchetypes: [
      "Using play-based techniques with an 8-year-old versus talk therapy with a teenager",
      "Adjusting session length and format based on a student's attention and reasoning stage"
    ],
    lawsFrameworks: [],
  },

  "NEW-4-MentalHealthImpact": {
    skillId: "NEW-4-MentalHealthImpact",
    contentCluster: "behavior-and-mental-health",
    vocabulary: ["academic impact", "school engagement", "anxiety and test performance", "depression and motivation", "attendance", "bidirectional relationship"],
    commonMisconceptions: [
      "Mental health concerns are separate from and do not affect academic functioning",
      "Students with mental health problems always show behavioral warning signs first"
    ],
    caseArchetypes: [
      "Student with undiagnosed anxiety whose grades are dropping without obvious behavioral problems",
      "Student with depression who is withdrawing from school and losing academic motivation"
    ],
    lawsFrameworks: [],
  },

  // ─── Domain 5: School-Wide Practices ──────────────────────────────────────

  "SWP-S01": {
    skillId: "SWP-S01",
    contentCluster: "school-systems",
    vocabulary: ["MTSS", "RTI", "tiered support", "universal screening", "data-based decision making", "tiered intervention"],
    commonMisconceptions: [
      "RTI is exclusively a process for identifying students with learning disabilities",
      "All three tiers must be fully implemented sequentially before eligibility can be considered"
    ],
    caseArchetypes: [
      "School establishing a three-tier reading support system for all students",
      "Team using MTSS data to inform a special education eligibility determination"
    ],
    lawsFrameworks: ["IDEA (RTI for learning disability identification)", "ESSA (MTSS provisions)"],
  },

  "SWP-S04": {
    skillId: "SWP-S04",
    contentCluster: "school-systems",
    vocabulary: ["implementation fidelity", "fidelity monitoring", "implementation drift", "coaching", "implementation checklist", "staff buy-in"],
    commonMisconceptions: [
      "Implementation fidelity means teachers cannot make any adaptations to programs",
      "Fidelity can be assumed if teachers completed initial training"
    ],
    caseArchetypes: [
      "School experiencing drift in PBIS implementation two years after launch",
      "Monitoring whether a Tier 2 intervention is being delivered as designed"
    ],
    lawsFrameworks: [],
  },

  "SWP-S02": {
    skillId: "SWP-S02",
    contentCluster: "school-systems",
    vocabulary: ["PBIS", "school-wide expectations", "positive reinforcement", "proactive discipline", "behavior teaching", "acknowledgment system"],
    commonMisconceptions: [
      "PBIS eliminates the need for any disciplinary consequences",
      "PBIS is simply a reward system for good behavior"
    ],
    caseArchetypes: [
      "School with rising office discipline referrals comparing punishment-focused vs PBIS approaches",
      "Building-level team reviewing behavior data to strengthen Tier 1 PBIS implementation"
    ],
    lawsFrameworks: ["IDEA (PBIS required consideration for students with behavior challenges)"],
  },

  "SWP-S03": {
    skillId: "SWP-S03",
    contentCluster: "school-systems",
    vocabulary: ["Tier 1", "universal intervention", "school-wide expectations", "core curriculum", "prevention", "all-students approach"],
    commonMisconceptions: [
      "Tier 1 only applies to behavior, not academic support",
      "A student not responding to Tier 1 should immediately receive individualized services"
    ],
    caseArchetypes: [
      "School implementing consistent behavioral expectations across all classrooms",
      "Reviewing Tier 1 effectiveness before intensifying supports for struggling students"
    ],
    lawsFrameworks: [],
  },

  "NEW-5-SchoolClimate": {
    skillId: "NEW-5-SchoolClimate",
    contentCluster: "school-systems",
    vocabulary: ["school climate", "engagement", "safety", "school environment", "belonging", "student-teacher relationship"],
    commonMisconceptions: [
      "School climate is only about physical safety, not emotional or relational dimensions",
      "School climate cannot be assessed using objective measures"
    ],
    caseArchetypes: [
      "School using multidimensional climate survey data across engagement, safety, and environment",
      "Identifying climate barriers affecting student attendance and academic engagement"
    ],
    lawsFrameworks: [],
  },

  "NEW-5-EducationalPolicies": {
    skillId: "NEW-5-EducationalPolicies",
    contentCluster: "school-systems",
    vocabulary: ["grade retention", "ability grouping", "tracking", "evidence-based policy", "long-term outcomes"],
    commonMisconceptions: [
      "Grade retention is an effective intervention for academically struggling students",
      "Ability grouping reliably improves outcomes for all students across groups"
    ],
    caseArchetypes: [
      "School considering retention for an immature kindergartener",
      "Policy team reviewing research on ability grouping before revising placement practices"
    ],
    lawsFrameworks: [],
  },

  "NEW-5-EBPImportance": {
    skillId: "NEW-5-EBPImportance",
    contentCluster: "school-systems",
    vocabulary: ["evidence-based practice (EBP)", "empirical support", "research base", "What Works Clearinghouse", "intervention effectiveness"],
    commonMisconceptions: [
      "Any widely-used or popular intervention is likely evidence-based",
      "Suspension is an effective consequence for reducing conduct problems"
    ],
    caseArchetypes: [
      "Team selecting a reading intervention from the What Works Clearinghouse database",
      "Questioning a school's continued use of an intervention with no research support"
    ],
    lawsFrameworks: ["ESSA (evidence-based intervention requirement for federal funding)"],
  },

  // ─── Domain 6: Preventive & Responsive Services ───────────────────────────

  "PC-S01": {
    skillId: "PC-S01",
    contentCluster: "crisis-and-safety",
    vocabulary: ["transient threat", "substantive threat", "expressive threat", "instrumental threat", "plan", "intent", "means", "threat assessment"],
    commonMisconceptions: [
      "All student threats must be treated as equally serious regardless of context",
      "A student expressing frustration or anger automatically represents a substantive threat"
    ],
    caseArchetypes: [
      "Student saying 'I'll kill you' in frustration with no plan or history of violence (transient)",
      "Student with a specific plan, identified target, and access to means (substantive)"
    ],
    lawsFrameworks: [],
  },

  "PC-S02": {
    skillId: "PC-S02",
    contentCluster: "crisis-and-safety",
    vocabulary: ["crisis response", "psychological first aid", "triage", "immediate support", "crisis stabilization", "crisis team"],
    commonMisconceptions: [
      "Crisis counseling means providing long-term therapy immediately during a crisis",
      "School psychologists should manage crisis situations alone without a crisis team"
    ],
    caseArchetypes: [
      "Student death in the school community and the psychologist's immediate role",
      "Supporting students after a traumatic community event without providing individual therapy"
    ],
    lawsFrameworks: [],
  },

  "PC-S03": {
    skillId: "PC-S03",
    contentCluster: "crisis-and-safety",
    vocabulary: ["psychological first aid (PFA)", "safety", "calm", "connectedness", "self-efficacy", "hope", "stabilization"],
    commonMisconceptions: [
      "Psychological first aid requires advanced clinical training to deliver",
      "Formal debriefing is the first priority immediately after a crisis event"
    ],
    caseArchetypes: [
      "Providing immediate structured support to students following a community tragedy",
      "Prioritizing reconnection with support systems after a student experiences acute stress"
    ],
    lawsFrameworks: [],
  },

  "PC-S04": {
    skillId: "PC-S04",
    contentCluster: "crisis-and-safety",
    vocabulary: ["crisis drill", "crisis preparedness", "lockdown procedure", "developmentally appropriate", "crisis protocol", "crisis plan"],
    commonMisconceptions: [
      "Frequent crisis drills always cause unnecessary trauma",
      "Crisis plans only need to be reviewed following an actual crisis event"
    ],
    caseArchetypes: [
      "School team reviewing drill frequency and design for different grade levels",
      "Evaluating whether a crisis drill design is developmentally appropriate for elementary students"
    ],
    lawsFrameworks: [],
  },

  "PC-S05": {
    skillId: "PC-S05",
    contentCluster: "crisis-and-safety",
    vocabulary: ["postvention", "suicide contagion", "cluster suicide", "safe messaging guidelines", "at-risk monitoring", "memorial guidelines"],
    commonMisconceptions: [
      "Memorial assemblies and tributes help prevent copycat suicides after a student death",
      "All students need the same level of postvention support after a peer suicide"
    ],
    caseArchetypes: [
      "School planning a response to a student suicide death",
      "Team developing a postvention protocol that avoids glorification while providing support"
    ],
    lawsFrameworks: [],
  },

  "NEW-6-BullyingPrevention": {
    skillId: "NEW-6-BullyingPrevention",
    contentCluster: "crisis-and-safety",
    vocabulary: ["bullying", "harassment", "bystander intervention", "school climate", "zero tolerance policy", "peer mediation"],
    commonMisconceptions: [
      "Peer mediation is appropriate for resolving bullying situations",
      "Zero tolerance policies are effective at reducing bullying behavior"
    ],
    caseArchetypes: [
      "School choosing between zero tolerance and climate-based approaches to bullying",
      "Training bystanders to intervene safely and effectively when witnessing bullying"
    ],
    lawsFrameworks: [],
  },

  "NEW-6-TraumaInformed": {
    skillId: "NEW-6-TraumaInformed",
    contentCluster: "crisis-and-safety",
    vocabulary: ["adverse childhood experiences (ACEs)", "trauma-informed care", "hypervigilance", "trauma response", "safety-focused intervention", "relationship-based approach"],
    commonMisconceptions: [
      "Trauma is only relevant for students with documented major traumatic events",
      "Punitive consequences effectively manage behavior that is rooted in trauma responses"
    ],
    caseArchetypes: [
      "Student with persistent disruptive behavior stemming from unaddressed childhood trauma",
      "School adopting trauma-informed practices school-wide following a community-level crisis"
    ],
    lawsFrameworks: [],
  },

  "NEW-6-SchoolClimateMeasurement": {
    skillId: "NEW-6-SchoolClimateMeasurement",
    contentCluster: "school-systems",
    vocabulary: ["school climate survey", "engagement indicators", "safety indicators", "environment domain", "attendance data", "discipline data"],
    commonMisconceptions: [
      "School climate can be adequately assessed through a single survey measure",
      "Student perception surveys are not valid or objective climate measures"
    ],
    caseArchetypes: [
      "Building-level team reviewing multidimensional climate survey results",
      "Using attendance and discipline data alongside surveys to evaluate safety perceptions"
    ],
    lawsFrameworks: [],
  },

  // ─── Domain 7: Family-School Collaboration ────────────────────────────────

  "FSC-S01": {
    skillId: "FSC-S01",
    contentCluster: "family-systems",
    vocabulary: ["family-school partnership", "shared responsibility", "mutual respect", "student success", "collaborative goals"],
    commonMisconceptions: [
      "Partnership means families carry out what the school recommends",
      "Family-school partnership is only important during IEP or evaluation meetings"
    ],
    caseArchetypes: [
      "Developing a collaboration plan that positions family as equal partners",
      "Meeting with a skeptical family to build shared goals for their child"
    ],
    lawsFrameworks: ["IDEA (parent participation rights in educational decision-making)"],
  },

  "FSC-S03": {
    skillId: "FSC-S03",
    contentCluster: "family-systems",
    vocabulary: ["two-way communication", "jargon-free language", "welcoming environment", "strengths-based approach", "cultural sensitivity"],
    commonMisconceptions: [
      "Written newsletters are sufficient to constitute effective family communication",
      "Families who do not attend meetings are disengaged from their child's education"
    ],
    caseArchetypes: [
      "Meeting with a family that is guarded due to past negative school experiences",
      "Presenting assessment results in accessible, jargon-free language"
    ],
    lawsFrameworks: [],
  },

  "FSC-S04": {
    skillId: "FSC-S04",
    contentCluster: "diversity-and-equity",
    vocabulary: ["collectivist culture", "extended family roles", "cultural values", "cultural humility", "family decision-making styles"],
    commonMisconceptions: [
      "The nuclear family is the universal standard decision-making unit across all cultures",
      "Cultural differences in communication style indicate disinterest or disrespect"
    ],
    caseArchetypes: [
      "Working with a family from a collectivist culture where grandparents are primary decision-makers",
      "Adjusting communication for a family with different expectations around privacy and disclosure"
    ],
    lawsFrameworks: [],
  },

  "NEW-7-BarriersToEngagement": {
    skillId: "NEW-7-BarriersToEngagement",
    contentCluster: "family-systems",
    vocabulary: ["systemic barriers", "logistical barriers", "transportation", "language access", "work schedule conflicts", "institutional distrust"],
    commonMisconceptions: [
      "Families who do not attend school events don't care about their child's education",
      "Removing engagement barriers is the family's responsibility, not the school's"
    ],
    caseArchetypes: [
      "Family not attending IEP meetings due to work schedule and transportation constraints",
      "School adjusting meeting formats to improve access for non-English-speaking families"
    ],
    lawsFrameworks: [],
  },

  "NEW-7-FamilySystems": {
    skillId: "NEW-7-FamilySystems",
    contentCluster: "family-systems",
    vocabulary: ["family systems theory", "circular causality", "homeostasis", "family boundaries", "enmeshment", "triangulation", "subsystem"],
    commonMisconceptions: [
      "Family systems theory only applies in family therapy, not school psychology",
      "One family member's behavior is independent of the rest of the family system"
    ],
    caseArchetypes: [
      "Understanding a child's behavioral presentation within the context of family conflict",
      "Recognizing how changes to one part of the family system affect the whole"
    ],
    lawsFrameworks: [],
  },

  "NEW-7-InteragencyCollaboration": {
    skillId: "NEW-7-InteragencyCollaboration",
    contentCluster: "consultation-and-collaboration",
    vocabulary: ["interagency collaboration", "transition planning", "postsecondary services", "vocational rehabilitation", "service coordination"],
    commonMisconceptions: [
      "Interagency collaboration is only relevant during postsecondary transition planning",
      "School psychologists have no role in coordinating outside agency services for students"
    ],
    caseArchetypes: [
      "IEP team developing a transition plan for a student approaching high school graduation",
      "Coordinating between school and a community mental health agency for a student with complex needs"
    ],
    lawsFrameworks: ["IDEA (transition services requirements)", "Workforce Innovation and Opportunity Act (WIOA)"],
  },

  "NEW-7-ParentingInterventions": {
    skillId: "NEW-7-ParentingInterventions",
    contentCluster: "family-systems",
    vocabulary: ["parent training", "behavior management", "home reinforcement system", "behavior contract", "consistent consequences", "home-school communication"],
    commonMisconceptions: [
      "Parenting interventions are only needed when parents are 'doing something wrong'",
      "School-based interventions alone are sufficient without any home-based component"
    ],
    caseArchetypes: [
      "Teaching parents behavior management strategies for a student with ODD",
      "Developing a home-school communication and reinforcement system for behavioral goals"
    ],
    lawsFrameworks: [],
  },

  // ─── Domain 8: Diversity in Development & Learning ────────────────────────

  "DIV-S01": {
    skillId: "DIV-S01",
    contentCluster: "diversity-and-equity",
    vocabulary: ["implicit bias", "cultural bias", "microaggression", "stereotype", "behavioral misinterpretation", "cultural lens"],
    commonMisconceptions: [
      "Only overtly racist people have implicit biases",
      "Cultural differences in behavior are inherently signs of behavioral or social problems"
    ],
    caseArchetypes: [
      "Psychologist misinterpreting a student's avoidance of eye contact as disrespect",
      "Team attributing cultural communication differences to social skill deficits"
    ],
    lawsFrameworks: [],
  },

  "DIV-S05": {
    skillId: "DIV-S05",
    contentCluster: "diversity-and-equity",
    vocabulary: ["cultural broker", "community liaison", "cultural mediation", "cultural bridge", "cultural advocacy"],
    commonMisconceptions: [
      "Any bilingual staff member can serve as an effective cultural broker",
      "Cultural brokers only translate language rather than cultural meaning and context"
    ],
    caseArchetypes: [
      "Working with a family whose cultural values conflict with standard school practices",
      "Identifying appropriate cultural liaisons for a community with limited English proficiency"
    ],
    lawsFrameworks: [],
  },

  "NEW-8-Acculturation": {
    skillId: "NEW-8-Acculturation",
    contentCluster: "diversity-and-equity",
    vocabulary: ["acculturation", "assimilation", "integration", "separation", "marginalization", "bicultural identity", "acculturation stress"],
    commonMisconceptions: [
      "Assimilation is the healthiest or most successful acculturation strategy",
      "Acculturation stress is temporary and self-resolves without school support"
    ],
    caseArchetypes: [
      "Immigrant student showing academic decline during a period of acculturation stress",
      "Student caught between home cultural expectations and peer group norms"
    ],
    lawsFrameworks: [],
  },

  "NEW-8-SocialJustice": {
    skillId: "NEW-8-SocialJustice",
    contentCluster: "diversity-and-equity",
    vocabulary: ["social justice", "systemic inequity", "advocacy", "marginalized population", "equity", "structural racism", "disproportionality"],
    commonMisconceptions: [
      "Advocacy work is outside the appropriate scope of school psychology practice",
      "Treating all students identically is the same as treating them equitably"
    ],
    caseArchetypes: [
      "School disproportionately identifying Black students for emotional disturbance eligibility",
      "Psychologist advocating for policy changes to address racial disparities in school discipline"
    ],
    lawsFrameworks: ["ESSA (equity provisions)", "IDEA (disproportionality reporting requirements)"],
  },

  "DIV-S02": {
    skillId: "DIV-S02",
    contentCluster: "diversity-and-equity",
    vocabulary: ["nonverbal assessment", "linguistic bias", "ELL (English language learner)", "language demands", "test bias", "reduced-language measures"],
    commonMisconceptions: [
      "Nonverbal tests are always more valid for all ELL students regardless of context",
      "Translating a test into the student's native language removes all cultural bias"
    ],
    caseArchetypes: [
      "Selecting a cognitive assessment for a newly immigrated student with limited English",
      "Reducing linguistic demands during assessment for a student in early English acquisition"
    ],
    lawsFrameworks: ["IDEA (nondiscriminatory evaluation requirements)"],
  },

  "DIV-S03": {
    skillId: "DIV-S03",
    contentCluster: "diversity-and-equity",
    vocabulary: ["language dominance", "language proficiency", "BICS", "CALP", "primary language assessment", "bilingual evaluation"],
    commonMisconceptions: [
      "Conversational English fluency indicates the student is ready for English-only cognitive assessment",
      "A learning disability is confirmed if academic problems persist in both languages"
    ],
    caseArchetypes: [
      "Evaluating whether a student's reading difficulties are due to language acquisition or a learning disability",
      "Assessing language dominance before selecting assessment instruments for an ELL student"
    ],
    lawsFrameworks: ["IDEA (nondiscriminatory evaluation)", "Title III (English language acquisition programs)"],
  },

  "NEW-8-LanguageAcquisition": {
    skillId: "NEW-8-LanguageAcquisition",
    contentCluster: "diversity-and-equity",
    vocabulary: ["BICS (Basic Interpersonal Communication Skills)", "CALP (Cognitive Academic Language Proficiency)", "silent period", "language transfer", "code-switching", "timeline: 2–3 years vs 5–7 years"],
    commonMisconceptions: [
      "Conversational English fluency means a student's academic language is equivalent",
      "Students who are silent in class are being uncooperative rather than in a language acquisition stage"
    ],
    caseArchetypes: [
      "ELL student who communicates well socially but struggles with academic tasks",
      "Team incorrectly interpreting a language acquisition stage as evidence of cognitive deficit"
    ],
    lawsFrameworks: [],
  },

  "DIV-S04": {
    skillId: "DIV-S04",
    contentCluster: "diversity-and-equity",
    vocabulary: ["risk ratio", "disproportionality", "overrepresentation", "underrepresentation", "special education identification", "racial disparity"],
    commonMisconceptions: [
      "Equal numbers of students from each group in special education indicates equity",
      "A risk ratio of 1.0 means no students from that group are in special education"
    ],
    caseArchetypes: [
      "District with a risk ratio of 2.5 for Black students in emotional disturbance identification",
      "Team interpreting disproportionality data to guide systemic intervention"
    ],
    lawsFrameworks: ["IDEA (disproportionality reporting and correction requirements)", "ESSA (equity provisions)"],
  },

  "DIV-S07": {
    skillId: "DIV-S07",
    contentCluster: "diversity-and-equity",
    vocabulary: ["interpreter", "qualified interpreter", "direct communication", "eye contact protocol", "translation vs interpretation"],
    commonMisconceptions: [
      "Any bilingual person can effectively serve as an interpreter in professional educational settings",
      "The psychologist should address the interpreter directly rather than the family member"
    ],
    caseArchetypes: [
      "IEP meeting conducted with an interpreter for a non-English-speaking family",
      "Correcting a school's practice of using a student as an interpreter for their parent"
    ],
    lawsFrameworks: ["Title VI (language access for limited English proficiency individuals)", "IDEA (parent participation rights)"],
  },

  // ─── Domain 9: Research & Program Evaluation ──────────────────────────────

  "RES-S01": {
    skillId: "RES-S01",
    contentCluster: "research-and-evaluation",
    vocabulary: ["A-B-A-B reversal design", "multiple baseline design", "single-subject design", "repeated measurement", "baseline phase", "intervention phase"],
    commonMisconceptions: [
      "Single-subject designs require large participant groups to produce valid results",
      "Returning to baseline in an A-B-A-B design means the intervention has failed"
    ],
    caseArchetypes: [
      "Evaluating an intervention for one student using a withdrawal design",
      "Using a multiple baseline design to avoid withdrawing an effective intervention"
    ],
    lawsFrameworks: [],
  },

  "NEW-9-Variables": {
    skillId: "NEW-9-Variables",
    contentCluster: "research-and-evaluation",
    vocabulary: ["independent variable (IV)", "dependent variable (DV)", "operational definition", "variable manipulation", "outcome measure", "control variable"],
    commonMisconceptions: [
      "The dependent variable is what the researcher controls and manipulates",
      "Any measurable factor in a study is automatically classified as a variable"
    ],
    caseArchetypes: [
      "Identifying the IV and DV in a reading intervention study",
      "Designing a study where the psychologist changes instruction and measures student reading rates"
    ],
    lawsFrameworks: [],
  },

  "NEW-9-ValidityThreats": {
    skillId: "NEW-9-ValidityThreats",
    contentCluster: "research-and-evaluation",
    vocabulary: ["internal validity", "external validity", "history threat", "maturation threat", "attrition", "instrumentation threat", "selection bias", "ecological validity"],
    commonMisconceptions: [
      "A study that is internally valid is automatically externally valid",
      "Maturation only affects very young children and is irrelevant in adolescent research"
    ],
    caseArchetypes: [
      "Reading study where both groups improve due to a new curriculum introduced mid-study (history threat)",
      "Urban school study results being overgeneralized to rural populations (external validity)"
    ],
    lawsFrameworks: [],
  },

  "NEW-9-ImplementationFidelity": {
    skillId: "NEW-9-ImplementationFidelity",
    contentCluster: "research-and-evaluation",
    vocabulary: ["implementation fidelity", "protocol adherence", "fidelity monitoring", "coaching", "drift", "fidelity checklist"],
    commonMisconceptions: [
      "If a program is effective in research, it will automatically be effective in any school",
      "Fidelity monitoring is only necessary in the first year of implementation"
    ],
    caseArchetypes: [
      "School implementing a validated program with declining adherence over time",
      "Using fidelity data to distinguish implementation problems from program ineffectiveness"
    ],
    lawsFrameworks: [],
  },

  "NEW-9-ProgramEvaluation": {
    skillId: "NEW-9-ProgramEvaluation",
    contentCluster: "research-and-evaluation",
    vocabulary: ["program evaluation", "outcome data", "process data", "stakeholder feedback", "formative evaluation", "summative evaluation", "accountability"],
    commonMisconceptions: [
      "Program evaluation only occurs at the end of a program's implementation cycle",
      "Positive stakeholder perception is sufficient evidence of a program's effectiveness"
    ],
    caseArchetypes: [
      "School evaluating whether its PBIS program is reducing office discipline referrals",
      "Collecting both process and outcome data to evaluate a mental health support program"
    ],
    lawsFrameworks: [],
  },

  "RES-S03": {
    skillId: "RES-S03",
    contentCluster: "research-and-evaluation",
    vocabulary: ["effect size", "Cohen's d", "practical significance", "statistical significance", "small/medium/large effect thresholds"],
    commonMisconceptions: [
      "Statistical significance alone means the effect is practically meaningful",
      "An effect size of 0.5 is always considered large in educational contexts"
    ],
    caseArchetypes: [
      "Reviewing reading intervention research and interpreting d = 0.4 for practice decisions",
      "Explaining to a team why a statistically significant result may not be educationally meaningful"
    ],
    lawsFrameworks: [],
  },

  "RES-S05": {
    skillId: "RES-S05",
    contentCluster: "research-and-evaluation",
    vocabulary: ["Type I error (false positive)", "Type II error (false negative)", "alpha level", "null hypothesis", "statistical power", "beta"],
    commonMisconceptions: [
      "Type I and Type II errors are equally problematic in every research situation",
      "Lowering the alpha level simultaneously reduces both types of error"
    ],
    caseArchetypes: [
      "Research team setting alpha level when false negatives would be especially costly for students",
      "Interpreting a null result that may reflect low statistical power rather than no effect"
    ],
    lawsFrameworks: [],
  },

  "RES-S06": {
    skillId: "RES-S06",
    contentCluster: "research-and-evaluation",
    vocabulary: ["correlation coefficient (r)", "positive correlation", "negative correlation", "strength of relationship", "causation vs correlation"],
    commonMisconceptions: [
      "A strong correlation means one variable causes the other",
      "A correlation of -0.8 is weaker than a correlation of +0.6 because it is negative"
    ],
    caseArchetypes: [
      "Report showing a correlation between fall screening scores and end-of-year achievement",
      "Team incorrectly concluding that anxiety causes low test scores based on a correlation"
    ],
    lawsFrameworks: [],
  },

  "NEW-9-StatisticalTests": {
    skillId: "NEW-9-StatisticalTests",
    contentCluster: "research-and-evaluation",
    vocabulary: ["t-test", "ANOVA", "chi-square", "correlation", "regression", "parametric test", "nonparametric test"],
    commonMisconceptions: [
      "The same statistical test can be used regardless of data type or research question",
      "Chi-square is appropriate when comparing means between two or more groups"
    ],
    caseArchetypes: [
      "Selecting a test to compare pre-post scores for two reading groups",
      "Choosing between chi-square and ANOVA based on whether the outcome is categorical or continuous"
    ],
    lawsFrameworks: [],
  },

  "NEW-9-DescriptiveStats": {
    skillId: "NEW-9-DescriptiveStats",
    contentCluster: "research-and-evaluation",
    vocabulary: ["mean", "median", "mode", "range", "standard deviation", "variance", "normal distribution", "skewed distribution"],
    commonMisconceptions: [
      "The mean is always the best measure of central tendency regardless of data distribution",
      "A large standard deviation means the data measurements are inaccurate"
    ],
    caseArchetypes: [
      "Choosing between mean and median to describe a dataset with extreme outliers",
      "Using standard deviation to understand the spread of reading scores across a classroom"
    ],
    lawsFrameworks: [],
  },

  // ─── Domain 10: Legal, Ethical & Professional Practice ────────────────────

  "LEG-S01": {
    skillId: "LEG-S01",
    contentCluster: "legal-and-ethics",
    vocabulary: ["Tarasoff duty to warn", "Larry P. v. Riles", "Board of Education v. Rowley", "FAPE standard", "landmark case"],
    commonMisconceptions: [
      "Tarasoff duty to warn applies to any general expression of risk, not only to specific identifiable targets",
      "The Rowley FAPE standard requires schools to maximize a student's educational potential"
    ],
    caseArchetypes: [
      "Student makes a specific, credible threat against a named peer (Tarasoff application)",
      "IEP team debating how much educational benefit is legally required under FAPE post-Rowley"
    ],
    lawsFrameworks: ["Tarasoff v. Regents of UC (1976)", "Larry P. v. Riles (1984)", "Board of Education v. Rowley (1982)"],
  },

  "LEG-S02": {
    skillId: "LEG-S02",
    contentCluster: "legal-and-ethics",
    vocabulary: ["IDEA", "FAPE", "zero-reject principle", "IEP", "procedural safeguards", "least restrictive environment (LRE)", "related services"],
    commonMisconceptions: [
      "Schools can deny FAPE to students whose disabilities are considered too severe to benefit",
      "Related services like counseling are optional additions rather than IDEA entitlements"
    ],
    caseArchetypes: [
      "School refusing to serve a student with complex medical needs (zero-reject violation)",
      "IEP team determining whether counseling qualifies as a related service under IDEA"
    ],
    lawsFrameworks: ["IDEA 2004", "Section 504 of the Rehabilitation Act"],
  },

  "NEW-10-EducationLaw": {
    skillId: "NEW-10-EducationLaw",
    contentCluster: "legal-and-ethics",
    vocabulary: ["Section 504", "IDEA", "civil rights access", "reasonable accommodation", "specialized instruction", "disability definition"],
    commonMisconceptions: [
      "Section 504 and IDEA provide the same types and levels of services",
      "A student who does not qualify for IDEA cannot receive any school-based accommodations"
    ],
    caseArchetypes: [
      "Student with ADHD who qualifies under Section 504 but not IDEA",
      "Team deciding between a 504 plan and an IEP for a student with an anxiety disorder"
    ],
    lawsFrameworks: ["Section 504 of the Rehabilitation Act", "IDEA 2004", "ADA (Americans with Disabilities Act)"],
  },

  "LEG-S05": {
    skillId: "LEG-S05",
    contentCluster: "legal-and-ethics",
    vocabulary: ["manifestation determination review (MDR)", "disciplinary change of placement", "disability nexus", "IEP relationship to behavior", "10-day rule"],
    commonMisconceptions: [
      "MDR is only required for expulsion, not for suspensions exceeding 10 days",
      "If behavior is found to be a manifestation, the student receives no disciplinary consequences"
    ],
    caseArchetypes: [
      "Student with EBD suspended for 11 cumulative days triggering an MDR requirement",
      "Determining whether a student's aggressive behavior was caused by or substantially related to their disability"
    ],
    lawsFrameworks: ["IDEA 2004 (discipline provisions, Section 615)"],
  },

  "LEG-S03": {
    skillId: "LEG-S03",
    contentCluster: "legal-and-ethics",
    vocabulary: ["confidentiality", "duty to warn", "duty to protect", "imminent danger", "privileged communication", "exceptions to confidentiality"],
    commonMisconceptions: [
      "Confidentiality must always be maintained regardless of safety risk",
      "Everything a student shares in a counseling session is automatically legally privileged"
    ],
    caseArchetypes: [
      "Student disclosing a specific intent to harm a named classmate",
      "Weighing confidentiality obligations against reporting requirements after a student discloses abuse"
    ],
    lawsFrameworks: ["Tarasoff v. Regents of UC", "NASP Principles for Professional Ethics"],
  },

  "LEG-S04": {
    skillId: "LEG-S04",
    contentCluster: "legal-and-ethics",
    vocabulary: ["mandated reporter", "reasonable suspicion", "child protective services (CPS)", "abuse", "neglect", "duty to report"],
    commonMisconceptions: [
      "Mandated reporters must be certain abuse has occurred before filing a report",
      "School psychologists should investigate suspected abuse before reporting"
    ],
    caseArchetypes: [
      "Student revealing signs of physical abuse during a counseling session",
      "Teacher reporting suspicion of neglect to the psychologist who must determine next steps"
    ],
    lawsFrameworks: ["Child Abuse Prevention and Treatment Act (CAPTA)", "State mandated reporting statutes"],
  },

  "LEG-S06": {
    skillId: "LEG-S06",
    contentCluster: "legal-and-ethics",
    vocabulary: ["ethical principles", "beneficence", "nonmaleficence", "autonomy", "justice", "conflict of interest", "professional boundaries"],
    commonMisconceptions: [
      "Ethical dilemmas always have a single clearly correct answer",
      "Consulting with a colleague when facing an ethical dilemma signals professional weakness"
    ],
    caseArchetypes: [
      "Psychologist considering whether to accept a gift from a grateful family",
      "Psychologist asked to perform services outside their documented area of competence"
    ],
    lawsFrameworks: ["NASP Principles for Professional Ethics", "APA Ethical Principles of Psychologists and Code of Conduct"],
  },

  "NEW-10-EthicalProblemSolving": {
    skillId: "NEW-10-EthicalProblemSolving",
    contentCluster: "legal-and-ethics",
    vocabulary: ["ethical problem-solving model", "competing principles", "duty to protect", "dual relationship", "scope of competence", "ethical consultation"],
    commonMisconceptions: [
      "The first step in ethical problem-solving is identifying a solution",
      "Duty to protect never overrides confidentiality under any circumstances"
    ],
    caseArchetypes: [
      "Navigating competing obligations between student confidentiality and parent rights",
      "Deciding how to respond when a colleague is behaving unethically"
    ],
    lawsFrameworks: ["NASP Principles for Professional Ethics"],
  },

  "LEG-S07": {
    skillId: "LEG-S07",
    contentCluster: "legal-and-ethics",
    vocabulary: ["informed consent", "parental consent", "ongoing counseling", "safety assessment", "minor's assent", "brief vs ongoing services"],
    commonMisconceptions: [
      "Any counseling interaction — including a brief safety check — requires formal parental consent",
      "Students under 18 have no rights regarding their own mental health services"
    ],
    caseArchetypes: [
      "Student requesting counseling but not wanting parents notified",
      "Brief safety assessment versus initiating ongoing counseling services without parental consent"
    ],
    lawsFrameworks: ["IDEA (consent requirements for evaluation)", "NASP Principles for Professional Ethics"],
  },

  "NEW-10-RecordKeeping": {
    skillId: "NEW-10-RecordKeeping",
    contentCluster: "legal-and-ethics",
    vocabulary: ["FERPA", "educational records", "record access rights", "amendment rights", "non-custodial parent", "directory information"],
    commonMisconceptions: [
      "Non-custodial parents automatically have no right to access their child's school records",
      "Medical records are automatically included as part of educational records under FERPA"
    ],
    caseArchetypes: [
      "Non-custodial parent requesting access to their child's educational records",
      "Parent requesting that medical records be included in the school educational file"
    ],
    lawsFrameworks: ["FERPA (Family Educational Rights and Privacy Act)", "HIPAA (medical records privacy)"],
  },

  "NEW-10-TestSecurity": {
    skillId: "NEW-10-TestSecurity",
    contentCluster: "legal-and-ethics",
    vocabulary: ["test security", "copyright", "raw protocol", "qualified user", "parent inspection rights", "test publisher guidelines"],
    commonMisconceptions: [
      "Parents are entitled to receive photocopies of all test protocols and scoring sheets",
      "Test security requirements only apply to cognitive ability tests, not behavior rating scales"
    ],
    caseArchetypes: [
      "Parent requesting copies of WISC-V response booklets after an evaluation",
      "Explaining what can and cannot be shared with a parent while protecting test security"
    ],
    lawsFrameworks: ["FERPA (educational records access)", "Copyright law (test material protection)"],
  },

  "NEW-10-Supervision": {
    skillId: "NEW-10-Supervision",
    contentCluster: "legal-and-ethics",
    vocabulary: ["supervision", "internship", "NASP standards", "face-to-face supervision hours", "qualified supervisor", "supervision ratio"],
    commonMisconceptions: [
      "Any licensed psychologist can supervise a school psychology intern",
      "Supervision requirements are uniform across all states and settings"
    ],
    caseArchetypes: [
      "Intern determining whether their current supervision arrangement meets NASP standards",
      "Identifying appropriate supervisor credentials and qualifications for a school psychology internship"
    ],
    lawsFrameworks: ["NASP Standards for Graduate Preparation of School Psychologists", "State licensing and certification requirements"],
  },

  "NEW-10-ProfessionalGrowth": {
    skillId: "NEW-10-ProfessionalGrowth",
    contentCluster: "legal-and-ethics",
    vocabulary: ["continuing education", "professional development", "lifelong learning", "research literacy", "scope of competence", "professional standards"],
    commonMisconceptions: [
      "Professional growth is only necessary early in one's career",
      "Attending any professional development activity is sufficient to maintain competence"
    ],
    caseArchetypes: [
      "Psychologist encountering a new population or context requiring specialized knowledge",
      "Evaluating whether current professional development aligns with actual practice demands"
    ],
    lawsFrameworks: ["NASP Principles for Professional Ethics (competence standard)", "State continuing education requirements"],
  },

};

/**
 * Retrieve v1 metadata for a skill, with safe fallback for unknown skill IDs.
 */
export function getSkillMetadataV1(skillId: string): SkillMetadataV1 | null {
  return skillMetadataV1[skillId] ?? null;
}

/**
 * Get all skill IDs belonging to a given content cluster.
 */
export function getSkillsByCluster(cluster: ContentCluster): string[] {
  return Object.values(skillMetadataV1)
    .filter(m => m.contentCluster === cluster)
    .map(m => m.skillId);
}
