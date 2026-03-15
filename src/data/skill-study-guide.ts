export interface SkillStudyGuide {
  id: string;
  name: string;
  definition: string;
  decisionRule: string;
  domainId: number;
  domainName: string;
}

export const skillStudyGuide: Record<string, SkillStudyGuide> = {
  "DBDM-S01": {
    "id": "DBDM-S01",
    "name": "Reliability Type Selection",
    "definition": "Matching the appropriate reliability type to the measurement context",
    "decisionRule": "Match reliability type to measurement context. Single-subject/behavioral observation requires interobserver agreement. Consistent scores over time requires test-retest. Internal scale consistency requires Cronbach's alpha. Multiple raters requires interrater reliability. Reliability = consistency or stability in measurement. Low reliability = scores vary across administrations. Test-retest reliability specifically measures stability over time.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "DBDM-S02": {
    "id": "DBDM-S02",
    "name": "Validity Type Recognition",
    "definition": "Matching validity evidence to how validity is established",
    "decisionRule": "Match validity type to how it's established. Content validity = expert review of item coverage. Criterion validity = correlation with external measure. Construct validity = factor analysis/theoretical relationships. Face validity = appears to measure what it claims (not sufficient alone).",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "DBDM-S03": {
    "id": "DBDM-S03",
    "name": "Score Interpretation",
    "definition": "Interpreting confidence intervals, reliability coefficients, SEM, and standard scores",
    "decisionRule": "Confidence intervals show range where true score likely falls. Reliability coefficients (.90+ excellent, .80+ good) indicate consistency. SEM quantifies measurement error. Standard scores (mean=100, SD=15) show relative standing. Higher reliability = smaller SEM. Percentile rank = percentage of scores equal to or lower. Z-score = (score - mean) / SD. Working memory = cognitive ability to attend to information, hold information in immediate awareness, and perform mental operations. Cognitive construct identification requires recognizing which ability is being measured.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "DBDM-S04": {
    "id": "DBDM-S04",
    "name": "Sensitivity/Specificity Distinction",
    "definition": "Distinguishing between true positive rate (sensitivity) and true negative rate (specificity)",
    "decisionRule": "Sensitivity = true positive rate (correctly identifying those WITH condition). Specificity = true negative rate (correctly identifying those WITHOUT condition). High sensitivity = few false negatives. High specificity = few false positives.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "DBDM-S05": {
    "id": "DBDM-S05",
    "name": "Assessment-Purpose Matching",
    "definition": "Selecting the assessment that best matches the stated purpose",
    "decisionRule": "Match assessment type to purpose. Screening = brief, group-administered, identifies risk. Diagnosis = comprehensive, individual, determines eligibility. Progress monitoring = frequent, curriculum-aligned, tracks growth. Program evaluation = standardized, group-level, evaluates effectiveness.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "DBDM-S06": {
    "id": "DBDM-S06",
    "name": "Norm vs Criterion Reference Distinction",
    "definition": "Distinguishing between norm-referenced and criterion-referenced assessments",
    "decisionRule": "Norm-referenced = compares to peer group (percentiles, standard scores). Criterion-referenced = compares to mastery standard (pass/fail, percentage correct). Use norm-referenced for relative standing. Use criterion-referenced for skill mastery.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "DBDM-S07": {
    "id": "DBDM-S07",
    "name": "Assessment Type Recognition",
    "definition": "Recognizing formative, summative, and single-subject assessment types",
    "decisionRule": "Formative = ongoing, guides instruction, low stakes. Summative = end of period, evaluates learning, high stakes. Single-subject = repeated measures, tracks individual change, used for intervention evaluation.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "NEW-1-PerformanceAssessment": {
    "id": "NEW-1-PerformanceAssessment",
    "name": "Performance-Based Assessment Recognition",
    "definition": "Identify assessments that require students to demonstrate skills through authentic tasks (essays, portfolios) rather than selection-based responses.",
    "decisionRule": "Correct answer identifies a task requiring active demonstration of a skill (e.g., essay) vs. passive selection.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "NEW-1-DynamicAssessment": {
    "id": "NEW-1-DynamicAssessment",
    "name": "Dynamic Assessment Application",
    "definition": "Understand the purpose of dynamic assessment (test-teach-retest) to measure learning potential and responsiveness.",
    "decisionRule": "Correct answer links the assessment type to measuring 'learning potential' or 'responsiveness' rather than static achievement.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "NEW-1-IQvsAchievement": {
    "id": "NEW-1-IQvsAchievement",
    "name": "Intelligence vs. Achievement Distinction",
    "definition": "Distinguish between what intelligence tests measure (cognitive ability/potential) and what achievement tests measure (learned knowledge/skills).",
    "decisionRule": "Correct answer differentiates 'reasoning/problem-solving' (IQ) from 'learned knowledge' (Achievement).",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "DBDM-S08": {
    "id": "DBDM-S08",
    "name": "Progress Monitoring Protocol",
    "definition": "Understanding characteristics of valid progress monitoring",
    "decisionRule": "Valid progress monitoring requires: frequent measurement (weekly/biweekly), curriculum-aligned measures, sensitive to small changes, brief administration, standardized procedures, graphed data for visual analysis, decision rules for when to change intervention.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "DBDM-S09": {
    "id": "DBDM-S09",
    "name": "Universal Screening Purpose",
    "definition": "Understanding that screening identifies risk, not diagnosis",
    "decisionRule": "Universal screening identifies students at risk. Screening is NOT diagnostic. Screening is brief, group-administered, and identifies who needs further assessment. Positive screen = needs comprehensive evaluation, not immediate intervention.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "DBDM-S10": {
    "id": "DBDM-S10",
    "name": "Data-First Decision Making",
    "definition": "Reviewing data before recommending action",
    "decisionRule": "ALWAYS review/analyze existing data before taking action. First step is almost always data collection, review, or analysis. Never skip to intervention without assessment. Never make recommendations without examining available information.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "NEW-1-BackgroundInformation": {
    "id": "NEW-1-BackgroundInformation",
    "name": "Background Information Use",
    "definition": "Understand appropriate use of background information including student records, medical records, previous interventions, and developmental history",
    "decisionRule": "Background information = student records, medical records, previous interventions, developmental history. Appropriate use: review before assessment, understand context, identify patterns, inform assessment planning. Medical records with parent authorization appropriate when health issues may affect learning/behavior.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "NEW-1-ProblemSolvingFramework": {
    "id": "NEW-1-ProblemSolvingFramework",
    "name": "Problem-Solving Framework",
    "definition": "Know how to use a problem-solving framework (MTSS/RTI) as the basis for all professional activities",
    "decisionRule": "Problem-solving framework = systematic approach using data to identify problems, analyze causes, implement solutions, and evaluate outcomes. MTSS/RTI = multi-tiered problem-solving framework applied to all professional activities. Framework emphasizes: data-based decisions, prevention, tiered supports, continuous monitoring.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "NEW-1-LowIncidenceExceptionalities": {
    "id": "NEW-1-LowIncidenceExceptionalities",
    "name": "Low-Incidence Exceptionalities Assessment",
    "definition": "Is familiar with assessment of students with low-incidence exceptionalities including chronic health impairments, severe physical disabilities, and sensory impairments",
    "decisionRule": "Low-incidence exceptionalities = chronic health (diabetes, asthma, epilepsy), severe physical disabilities (cerebral palsy, muscular dystrophy), sensory impairments (deaf, blind, deaf-blind). Assessment considerations: adapt procedures, consider medical factors, involve specialists, use appropriate accommodations, understand condition-specific needs.",
    "domainId": 1,
    "domainName": "Data-Based Decision Making & Accountability"
  },
  "CC-S01": {
    "id": "CC-S01",
    "name": "Consultation Type Recognition",
    "definition": "Identify different types of consultation (behavioral, organizational, multicultural, conjoint)",
    "decisionRule": "Behavioral consultation focuses on individual student behavior. Organizational consultation addresses school-wide systems. Multicultural consultation involves cultural brokers. Conjoint consultation includes both home and school.",
    "domainId": 2,
    "domainName": "Consultation & Collaboration"
  },
  "NEW-2-ConsultationProcess": {
    "id": "NEW-2-ConsultationProcess",
    "name": "Consultation Process Knowledge",
    "definition": "Identify and sequence the stages of the consultation process (Entry/Contracting, Problem ID, Analysis, Intervention, Evaluation).",
    "decisionRule": "Correct answer identifies the standard stage or sequence in formal consultation models.",
    "domainId": 2,
    "domainName": "Consultation & Collaboration"
  },
  "NEW-2-ProblemSolvingSteps": {
    "id": "NEW-2-ProblemSolvingSteps",
    "name": "Problem-Solving Model Application",
    "definition": "Apply the data-based problem-solving steps (Define, Analyze, Implement, Evaluate) to consultation scenarios.",
    "decisionRule": "Correct answer prioritizes defining the problem or collecting baseline data before offering solutions.",
    "domainId": 2,
    "domainName": "Consultation & Collaboration"
  },
  "CC-S03": {
    "id": "CC-S03",
    "name": "Collaborative Role & Approach",
    "definition": "Understand the school psychologist's role as facilitator and collaborator, not expert or decision-maker",
    "decisionRule": "Correct answer emphasizes collaboration, facilitation, and shared decision-making rather than expert advice or unilateral action.",
    "domainId": 2,
    "domainName": "Consultation & Collaboration"
  },
  "NEW-2-CommunicationStrategies": {
    "id": "NEW-2-CommunicationStrategies",
    "name": "Communication & Resistance Management",
    "definition": "Select appropriate communication strategies to build rapport, manage resistance, or facilitate consensus.",
    "decisionRule": "Correct answer focuses on active listening, empathy, or collaboration rather than directive/expert stances.",
    "domainId": 2,
    "domainName": "Consultation & Collaboration"
  },
  "NEW-2-FamilyCollaboration": {
    "id": "NEW-2-FamilyCollaboration",
    "name": "Working with Diverse Families",
    "definition": "Know strategies for working with diverse families including building relationships, collaborating on intervention plans, and promoting positive habits",
    "decisionRule": "Correct answer emphasizes building trust, respecting cultural differences, involving families as partners, and promoting home-school collaboration. Strategies include: understanding family values, adapting communication styles, providing culturally responsive support, and recognizing family strengths.",
    "domainId": 2,
    "domainName": "Consultation & Collaboration"
  },
  "NEW-2-CommunityAgencies": {
    "id": "NEW-2-CommunityAgencies",
    "name": "Working with Community Agencies",
    "definition": "Know strategies for working with diverse community agencies/providers to support student success",
    "decisionRule": "Correct answer emphasizes coordination, understanding roles, appropriate referrals, and interagency collaboration. Strategies include: identifying appropriate community resources, coordinating services, understanding agency roles and limitations, and facilitating communication between school and community providers.",
    "domainId": 2,
    "domainName": "Consultation & Collaboration"
  },
  "ACAD-S01": {
    "id": "ACAD-S01",
    "name": "Tier Selection & Intensity",
    "definition": "Match intervention intensity to student need level (Tier 1, 2, or 3)",
    "decisionRule": "Tier 1 = all students, universal. Tier 2 = small group, targeted, below benchmark. Tier 3 = intensive, individual, significantly below benchmark.",
    "domainId": 3,
    "domainName": "Academic Interventions & Instructional Support"
  },
  "ACAD-S02": {
    "id": "ACAD-S02",
    "name": "Reading Intervention Selection",
    "definition": "Select evidence-based reading interventions for specific skill deficits",
    "decisionRule": "Phonemic awareness = sound manipulation. Phonics = letter-sound relationships. Fluency = repeated readings, timed practice. Comprehension = reciprocal teaching, question generation, summarization.",
    "domainId": 3,
    "domainName": "Academic Interventions & Instructional Support"
  },
  "ACAD-S03": {
    "id": "ACAD-S03",
    "name": "Error Pattern Analysis",
    "definition": "Analyze student errors to identify specific skill deficits before planning instruction",
    "decisionRule": "Correct answer identifies the specific error pattern (e.g., vowel confusion, addition errors) that indicates the skill deficit.",
    "domainId": 3,
    "domainName": "Academic Interventions & Instructional Support"
  },
  "ACAD-S04": {
    "id": "ACAD-S04",
    "name": "Fluency Building Strategies",
    "definition": "Select strategies to improve reading or math fluency (speed + accuracy)",
    "decisionRule": "Reading fluency = repeated readings, timed practice, partner reading. Math fluency = timed drills, cover-copy-compare, fact practice.",
    "domainId": 3,
    "domainName": "Academic Interventions & Instructional Support"
  },
  "ACAD-S05": {
    "id": "ACAD-S05",
    "name": "Instructional Level Determination",
    "definition": "Identify the appropriate instructional level based on accuracy rates (independent, instructional, frustration)",
    "decisionRule": "Independent = 95-100% accuracy. Instructional = 93-97% accuracy (or 70-85% for comprehension). Frustration = below 93% (or below 70% for comprehension).",
    "domainId": 3,
    "domainName": "Academic Interventions & Instructional Support"
  },
  "NEW-3-InstructionalHierarchy": {
    "id": "NEW-3-InstructionalHierarchy",
    "name": "Instructional Hierarchy Application",
    "definition": "Match instructional strategies to the student's stage of learning (Acquisition, Proficiency/Fluency, Generalization, Adaptation).",
    "decisionRule": "Correct answer matches: Acquisition → Modeling/Accuracy; Proficiency → Speed/Drill; Generalization → New settings.",
    "domainId": 3,
    "domainName": "Academic Interventions & Instructional Support"
  },
  "NEW-3-MetacognitiveStrategies": {
    "id": "NEW-3-MetacognitiveStrategies",
    "name": "Metacognitive & Study Skills",
    "definition": "Identify strategies that teach students 'learning to learn' (self-regulation, organization, mnemonic devices).",
    "decisionRule": "Correct answer focuses on the student's internal management of learning (thinking about thinking) rather than content mastery.",
    "domainId": 3,
    "domainName": "Academic Interventions & Instructional Support"
  },
  "NEW-3-AccommodationsModifications": {
    "id": "NEW-3-AccommodationsModifications",
    "name": "Accommodations & Modifications",
    "definition": "Know common curricular accommodations and modifications including assistive technology, specially designed instruction, and test format changes",
    "decisionRule": "Accommodation = changes HOW student learns/accesses curriculum (doesn't change content/standards). Modification = changes WHAT student learns (alters content/standards). Assistive technology = tools to support access. Specially designed instruction = individualized teaching methods. Test format accommodations = extended time, read aloud, separate setting.",
    "domainId": 3,
    "domainName": "Academic Interventions & Instructional Support"
  },
  "NEW-3-AcademicProgressFactors": {
    "id": "NEW-3-AcademicProgressFactors",
    "name": "Factors Related to Academic Progress",
    "definition": "Understand factors that influence academic progress including classroom climate, family involvement, and socioeconomic/environmental factors",
    "decisionRule": "Correct answer identifies factors that impact academic achievement: classroom climate (supportive, engaging), family involvement (home-school partnership, parent engagement), socioeconomic factors (resources, stability), environmental factors (home environment, community resources).",
    "domainId": 3,
    "domainName": "Academic Interventions & Instructional Support"
  },
  "NEW-3-BioCulturalInfluences": {
    "id": "NEW-3-BioCulturalInfluences",
    "name": "Biological, Cultural, and Social Influences on Academics",
    "definition": "Understand how biological, cultural, and social factors influence academic performance and learning",
    "decisionRule": "Correct answer recognizes: biological factors (developmental readiness, cognitive development), cultural factors (learning styles, values, communication patterns), social factors (peer relationships, family structure, community context). These factors interact and affect how students learn and perform academically.",
    "domainId": 3,
    "domainName": "Academic Interventions & Instructional Support"
  },
  "MBH-S01": {
    "id": "MBH-S01",
    "name": "FBA Purpose",
    "definition": "Understand FBA purpose and how to measure interfering behaviors quantitatively",
    "decisionRule": "FBA purpose = identify function of behavior through ABC analysis. Measure behavior quantitatively (frequency, duration, intensity). Convert behavior counts to standardized rate (e.g., per week) for quantitative measurement. Antecedent = what happens before behavior. Behavior = observable action. Consequence = what happens after behavior (reinforcement/punishment).",
    "domainId": 4,
    "domainName": "Mental & Behavioral Health Services"
  },
  "MBH-S02": {
    "id": "MBH-S02",
    "name": "Behavior Function Identification",
    "definition": "Identify the function of behavior (attention, escape/avoidance, tangible, sensory)",
    "decisionRule": "Attention = behavior gets attention from others. Escape/Avoidance = behavior removes aversive task/situation. Tangible = behavior gets preferred item. Sensory = behavior provides internal stimulation.",
    "domainId": 4,
    "domainName": "Mental & Behavioral Health Services"
  },
  "MBH-S03": {
    "id": "MBH-S03",
    "name": "Replacement Behavior Selection",
    "definition": "Select replacement behaviors that serve the same function as problem behavior",
    "decisionRule": "Replacement behavior must serve the SAME function as problem behavior. It should be easier, more efficient, and socially acceptable.",
    "domainId": 4,
    "domainName": "Mental & Behavioral Health Services"
  },
  "MBH-S04": {
    "id": "MBH-S04",
    "name": "Suicide Risk Assessment",
    "definition": "Assess suicide risk by evaluating plan, intent, and means",
    "decisionRule": "Immediate priority = assess plan, intent, and means. High risk = specific plan + intent + means. Always assess immediately, never delay.",
    "domainId": 4,
    "domainName": "Mental & Behavioral Health Services"
  },
  "MBH-S05": {
    "id": "MBH-S05",
    "name": "Therapy Model Recognition",
    "definition": "Identify therapy models (CBT, SFBT, etc.) and their key components",
    "decisionRule": "CBT = identify and challenge cognitive distortions. SFBT = miracle question, solution-focused. DBT = mindfulness, emotion regulation. Cognitive-behavioral therapy (CBT) is an evidence-based practice (EBP) for treating internalizing problems (depression, anxiety). EBP recognition requires knowing which interventions have empirical support.",
    "domainId": 4,
    "domainName": "Mental & Behavioral Health Services"
  },
  "MBH-S06": {
    "id": "MBH-S06",
    "name": "Behavioral Principles",
    "definition": "Apply behavioral principles including positive reinforcement and rule-setting",
    "decisionRule": "Positive reinforcement increases behavior. Clear rules + positive reinforcement for compliance increases desired behavior. Punishment alone is less effective. Most effective social skills training = modeling + rehearsal + feedback. Role-play allows practice. Direct instruction teaches skills.",
    "domainId": 4,
    "domainName": "Mental & Behavioral Health Services"
  },
  "NEW-4-Psychopathology": {
    "id": "NEW-4-Psychopathology",
    "name": "Child & Adolescent Psychopathology",
    "definition": "Identify diagnostic criteria and developmental presentations of common childhood disorders (ADHD, Depression, Anxiety, ASD, ODD).",
    "decisionRule": "Correct answer requires knowledge of DSM-5 criteria or developmental variations (e.g., irritability in child depression). Social influences on mental health development include: peer relationships, reactions to success and failure, protective factors. Assessment of social influences requires interviewing about peer relationships and reactions to life events.",
    "domainId": 4,
    "domainName": "Mental & Behavioral Health Services"
  },
  "NEW-4-GroupCounseling": {
    "id": "NEW-4-GroupCounseling",
    "name": "Group Counseling Dynamics",
    "definition": "Understand group formation, member selection (screening), and group stages (forming, storming, norming, performing).",
    "decisionRule": "Correct answer identifies appropriate candidates for groups or recognizes group process stages.",
    "domainId": 4,
    "domainName": "Mental & Behavioral Health Services"
  },
  "NEW-4-DevelopmentalInterventions": {
    "id": "NEW-4-DevelopmentalInterventions",
    "name": "Developmental-Level Interventions",
    "definition": "Understand how to adapt intervention techniques based on developmental level (elementary vs. secondary)",
    "decisionRule": "Correct answer matches intervention approach to developmental stage: elementary (concrete, play-based, visual, shorter sessions) vs. secondary (abstract, discussion-based, longer sessions, peer-focused). Age-appropriate counseling techniques consider cognitive development, attention span, and social-emotional maturity.",
    "domainId": 4,
    "domainName": "Mental & Behavioral Health Services"
  },
  "NEW-4-MentalHealthImpact": {
    "id": "NEW-4-MentalHealthImpact",
    "name": "Mental Health Impact on Education",
    "definition": "Understand how mental health conditions affect academic performance, test-taking, and school engagement",
    "decisionRule": "Correct answer recognizes: depression affects motivation, concentration, and academic performance; anxiety impacts test-taking (worry, physical symptoms), learning (attention, memory), and school engagement; mental health conditions can cause academic decline, attendance issues, and social withdrawal. Relationship between mental health and school engagement is bidirectional.",
    "domainId": 4,
    "domainName": "Mental & Behavioral Health Services"
  },
  "SWP-S01": {
    "id": "SWP-S01",
    "name": "RTI/MTSS Framework",
    "definition": "Understand RTI as multi-tiered system providing increasingly intensive interventions",
    "decisionRule": "RTI = multi-tiered system. Tier 1 = universal, all students. Tier 2 = targeted, small group. Tier 3 = intensive, individual.",
    "domainId": 5,
    "domainName": "School-Wide Practices to Promote Learning"
  },
  "SWP-S04": {
    "id": "SWP-S04",
    "name": "Implementation Fidelity",
    "definition": "Recognize signs of successful Tier 1 implementation (consistent teaching, data collection)",
    "decisionRule": "Successful implementation = consistent teaching of expectations, regular data collection, clear decision rules, staff buy-in. Fidelity = consistent implementation. Reminders/prompts (e.g., emailing teachers) help ensure consistent implementation of program components.",
    "domainId": 5,
    "domainName": "School-Wide Practices to Promote Learning"
  },
  "SWP-S02": {
    "id": "SWP-S02",
    "name": "PBIS Principles",
    "definition": "Understand PBIS focuses on teaching and reinforcing positive behaviors, not punishment",
    "decisionRule": "PBIS = proactive, teaches expectations, reinforces desired behaviors, changes environment. Not punishment-focused. When schoolwide behavior issues increase, examine Tier 1 interventions (SWPBIS, SEL) to provide all students with ongoing supports.",
    "domainId": 5,
    "domainName": "School-Wide Practices to Promote Learning"
  },
  "SWP-S03": {
    "id": "SWP-S03",
    "name": "Tier 1 Universal Practices",
    "definition": "Identify Tier 1 (universal) interventions that teach expectations to all students",
    "decisionRule": "Tier 1 = school-wide, all students, teaches expectations, acknowledges desired behaviors. Not individual counseling.",
    "domainId": 5,
    "domainName": "School-Wide Practices to Promote Learning"
  },
  "NEW-5-SchoolClimate": {
    "id": "NEW-5-SchoolClimate",
    "name": "School Climate Components",
    "definition": "Identify the core domains of school climate (Engagement, Safety, Environment) and the factors that contribute to them.",
    "decisionRule": "Correct answer identifies 'Engagement, Safety, Environment' or specific physical/social/emotional factors.",
    "domainId": 5,
    "domainName": "School-Wide Practices to Promote Learning"
  },
  "NEW-5-EducationalPolicies": {
    "id": "NEW-5-EducationalPolicies",
    "name": "Educational Policies",
    "definition": "Understand educational policies including retention, tracking, and their implications",
    "decisionRule": "Correct answer recognizes: retention (grade retention) research shows limited effectiveness and potential negative effects; tracking (ability grouping) can limit opportunities; policies should be evidence-based and consider student needs. Best practice questions retention/tracking effectiveness.",
    "domainId": 5,
    "domainName": "School-Wide Practices to Promote Learning"
  },
  "NEW-5-EBPImportance": {
    "id": "NEW-5-EBPImportance",
    "name": "Evidence-Based Practices Importance",
    "definition": "Understand the importance of evidence-based practices and recognize supported EBPs",
    "decisionRule": "Evidence-based practice (EBP) = interventions with empirical research support. Importance: ensures effectiveness, avoids harmful practices, promotes best outcomes. Supported EBPs: CBT for internalizing problems, PBIS for behavior, explicit instruction for academics. Unsupported: suspension for conduct problems, retention for immaturity, diet modifications for autism.",
    "domainId": 5,
    "domainName": "School-Wide Practices to Promote Learning"
  },
  "PC-S01": {
    "id": "PC-S01",
    "name": "Threat Assessment",
    "definition": "Distinguish between transient threats (expressive) and substantive threats (instrumental)",
    "decisionRule": "Transient threat = emotional expression, no plan, low risk. Substantive threat = specific plan, means, intent, high risk.",
    "domainId": 6,
    "domainName": "Preventive & Responsive Services"
  },
  "PC-S02": {
    "id": "PC-S02",
    "name": "Crisis Response Role",
    "definition": "Understand school psychologist's role during crisis (support, triage, not long-term therapy)",
    "decisionRule": "Crisis role = immediate support, psychological first aid, triage, connect to resources. Not long-term therapy or individual counseling during crisis.",
    "domainId": 6,
    "domainName": "Preventive & Responsive Services"
  },
  "PC-S03": {
    "id": "PC-S03",
    "name": "Psychological First Aid",
    "definition": "Identify core elements of Psychological First Aid (safety, calm, connectedness, self-efficacy, hope)",
    "decisionRule": "PFA elements = establish safety, promote calm, foster connectedness, enhance self-efficacy, instill hope.",
    "domainId": 6,
    "domainName": "Preventive & Responsive Services"
  },
  "PC-S04": {
    "id": "PC-S04",
    "name": "Crisis Preparedness",
    "definition": "Understand best practices for crisis drills (regular, developmentally appropriate)",
    "decisionRule": "Crisis drills = practiced regularly, developmentally appropriate, not traumatizing, prepare without causing fear.",
    "domainId": 6,
    "domainName": "Preventive & Responsive Services"
  },
  "PC-S05": {
    "id": "PC-S05",
    "name": "Postvention Services",
    "definition": "Understand postvention goals following suicide (prevent contagion/clusters)",
    "decisionRule": "Postvention primary goal = prevent contagion/cluster suicides. Provide support, avoid glorification, monitor at-risk students.",
    "domainId": 6,
    "domainName": "Preventive & Responsive Services"
  },
  "NEW-6-BullyingPrevention": {
    "id": "NEW-6-BullyingPrevention",
    "name": "Bullying & Harassment Prevention",
    "definition": "Identify evidence-based strategies for bullying prevention (climate improvement, bystander training) and recognize ineffective ones (zero tolerance, peer mediation for bullying).",
    "decisionRule": "Correct answer prioritizes systemic prevention or bystander intervention; incorrect answers often involve peer mediation (contraindicated) or zero tolerance.",
    "domainId": 6,
    "domainName": "Preventive & Responsive Services"
  },
  "NEW-6-TraumaInformed": {
    "id": "NEW-6-TraumaInformed",
    "name": "Trauma-Informed Care",
    "definition": "Recognize the impact of adverse childhood experiences (ACEs) on learning and behavior, and identify trauma-informed support strategies.",
    "decisionRule": "Correct answer links behavior/symptoms to trauma history or selects interventions that prioritize safety and relationship over punishment.",
    "domainId": 6,
    "domainName": "Preventive & Responsive Services"
  },
  "NEW-6-SchoolClimateMeasurement": {
    "id": "NEW-6-SchoolClimateMeasurement",
    "name": "School Safety & Climate Measurement",
    "definition": "Understand how to measure school safety and climate including engagement, safety, and environment",
    "decisionRule": "School climate components: Engagement (student-teacher relationships, belonging), Safety (physical and emotional safety), Environment (physical space, resources). Measurement methods: surveys, observations, discipline data, attendance. School safety/climate measurement requires systematic data collection on multiple dimensions.",
    "domainId": 6,
    "domainName": "Preventive & Responsive Services"
  },
  "FSC-S01": {
    "id": "FSC-S01",
    "name": "Partnership Goals",
    "definition": "Understand primary goal of family-school partnerships (shared responsibility for student success)",
    "decisionRule": "Partnership goal = shared responsibility, collaboration, mutual respect, student success focus. Not one-way communication.",
    "domainId": 7,
    "domainName": "Family-School Collaboration Services"
  },
  "FSC-S03": {
    "id": "FSC-S03",
    "name": "Communication Strategies",
    "definition": "Select effective strategies for communicating with families (welcoming environment, jargon-free language)",
    "decisionRule": "Effective communication = welcoming environment, two-way communication, jargon-free language, focus on strengths and needs, cultural sensitivity.",
    "domainId": 7,
    "domainName": "Family-School Collaboration Services"
  },
  "FSC-S04": {
    "id": "FSC-S04",
    "name": "Cultural Competence",
    "definition": "Respect cultural differences in family structure and decision-making (e.g., collectivist cultures, extended family)",
    "decisionRule": "Cultural competence = respect extended family roles, collectivist decision-making, cultural values, avoid assumptions.",
    "domainId": 7,
    "domainName": "Family-School Collaboration Services"
  },
  "NEW-7-BarriersToEngagement": {
    "id": "NEW-7-BarriersToEngagement",
    "name": "Barriers to Engagement",
    "definition": "Identify systemic, practical, and cultural barriers to family involvement (e.g., transportation, language, work schedules) and strategies to overcome them.",
    "decisionRule": "Correct answer recognizes that 'lack of involvement' is usually due to logistical/systemic barriers, not lack of care.",
    "domainId": 7,
    "domainName": "Family-School Collaboration Services"
  },
  "NEW-7-FamilySystems": {
    "id": "NEW-7-FamilySystems",
    "name": "Family Systems Theory",
    "definition": "Apply concepts from systems theory (circular causality, homeostasis, boundaries) to understand family dynamics.",
    "decisionRule": "Correct answer focuses on the interdependence of family members or the function of behavior within the family unit.",
    "domainId": 7,
    "domainName": "Family-School Collaboration Services"
  },
  "NEW-7-InteragencyCollaboration": {
    "id": "NEW-7-InteragencyCollaboration",
    "name": "Interagency Collaboration",
    "definition": "Understand interagency collaboration for students with disabilities, particularly for postsecondary transitions",
    "decisionRule": "Interagency collaboration = coordination between school and community agencies (mental health, vocational, postsecondary). Most useful for: postsecondary transition planning, connecting to employment opportunities, accessing community services. Collaboration facilitates connections beyond high school.",
    "domainId": 7,
    "domainName": "Family-School Collaboration Services"
  },
  "NEW-7-ParentingInterventions": {
    "id": "NEW-7-ParentingInterventions",
    "name": "Parenting & Home Interventions",
    "definition": "Know strategies for parenting interventions and home-based supports to address student needs",
    "decisionRule": "Parenting interventions = teaching parents behavior management strategies, positive reinforcement, clear rules, consistent consequences. Home interventions support school goals. Strategies include: parent training, home-school communication, behavior contracts, home reinforcement systems.",
    "domainId": 7,
    "domainName": "Family-School Collaboration Services"
  },
  "DIV-S01": {
    "id": "DIV-S01",
    "name": "Implicit Bias Recognition",
    "definition": "Recognize when assumptions are based on cultural bias rather than actual behavior",
    "decisionRule": "Correct answer identifies when behavior is misinterpreted due to cultural bias (e.g., eye contact, communication style).",
    "domainId": 8,
    "domainName": "Diversity in Development & Learning"
  },
  "DIV-S05": {
    "id": "DIV-S05",
    "name": "Cultural Broker Role",
    "definition": "Understand the role of cultural brokers as liaisons between school and family",
    "decisionRule": "Cultural broker = community liaison, bridges cultural gap, facilitates communication, understands both cultures.",
    "domainId": 8,
    "domainName": "Diversity in Development & Learning"
  },
  "NEW-8-Acculturation": {
    "id": "NEW-8-Acculturation",
    "name": "Acculturation Dynamics",
    "definition": "Understand the process of acculturation (assimilation, integration, separation, marginalization) and its impact on student adjustment.",
    "decisionRule": "Correct answer identifies the specific mode of adaptation (e.g., Integration = high original + high new culture).",
    "domainId": 8,
    "domainName": "Diversity in Development & Learning"
  },
  "NEW-8-SocialJustice": {
    "id": "NEW-8-SocialJustice",
    "name": "Social Justice & Advocacy",
    "definition": "Identify the psychologist's role in challenging systemic inequities and advocating for fair practices for marginalized populations.",
    "decisionRule": "Correct answer prioritizes active advocacy or systemic change over passive acceptance of discriminatory practices.",
    "domainId": 8,
    "domainName": "Diversity in Development & Learning"
  },
  "DIV-S02": {
    "id": "DIV-S02",
    "name": "Nonverbal Assessment Selection",
    "definition": "Select appropriate assessments to reduce linguistic bias (nonverbal tests for ELL students)",
    "decisionRule": "For ELL students or limited English proficiency = use nonverbal assessments, reduce linguistic demands, consider cultural factors.",
    "domainId": 8,
    "domainName": "Diversity in Development & Learning"
  },
  "DIV-S03": {
    "id": "DIV-S03",
    "name": "ELL Consideration",
    "definition": "Determine language dominance/proficiency before assessing ELL students and ensure assessment in both languages",
    "decisionRule": "Before assessing ELL student = determine language dominance, proficiency in both languages, primary language, English proficiency level. Learning disability must not be explained by contextual factors. Verify learning disability in both student's native language and English to rule out language acquisition as alternative explanation.",
    "domainId": 8,
    "domainName": "Diversity in Development & Learning"
  },
  "NEW-8-LanguageAcquisition": {
    "id": "NEW-8-LanguageAcquisition",
    "name": "Second Language Acquisition",
    "definition": "Distinguish between social (BICS) and academic (CALP) language proficiency and know the typical timelines (2-3 yrs vs 5-7 yrs).",
    "decisionRule": "Correct answer differentiates 'playground English' from the language needed for cognitive academic tasks.",
    "domainId": 8,
    "domainName": "Diversity in Development & Learning"
  },
  "DIV-S04": {
    "id": "DIV-S04",
    "name": "Disproportionality Interpretation",
    "definition": "Interpret risk ratios to identify overrepresentation in special education",
    "decisionRule": "Risk ratio > 1.0 = overrepresentation. Risk ratio 2.5 = group is 2.5x more likely to be identified. Higher ratio = greater disproportionality.",
    "domainId": 8,
    "domainName": "Diversity in Development & Learning"
  },
  "DIV-S07": {
    "id": "DIV-S07",
    "name": "Interpreter Best Practices",
    "definition": "Follow best practices when using interpreters (speak directly to parent, not interpreter)",
    "decisionRule": "Best practice = speak directly to parent/family member, use qualified interpreter, maintain eye contact with parent, allow time for interpretation.",
    "domainId": 8,
    "domainName": "Diversity in Development & Learning"
  },
  "RES-S01": {
    "id": "RES-S01",
    "name": "Single-Subject Design Recognition",
    "definition": "Identify single-subject designs (A-B-A-B reversal, multiple baseline, etc.)",
    "decisionRule": "A-B-A-B = baseline, intervention, return to baseline, intervention again. Multiple baseline = baseline across settings/behaviors, staggered intervention.",
    "domainId": 9,
    "domainName": "Research & Program Evaluation"
  },
  "NEW-9-Variables": {
    "id": "NEW-9-Variables",
    "name": "Variable Identification",
    "definition": "Distinguish between Independent Variables (manipulated) and Dependent Variables (measured outcome) in research scenarios.",
    "decisionRule": "Correct answer identifies the 'cause' (IV) or the 'effect' (DV) correctly.",
    "domainId": 9,
    "domainName": "Research & Program Evaluation"
  },
  "NEW-9-ValidityThreats": {
    "id": "NEW-9-ValidityThreats",
    "name": "Research Validity Threats",
    "definition": "Identify threats to internal validity (history, maturation, attrition) and external validity (generalizability).",
    "decisionRule": "Correct answer links a specific confounding factor (e.g., dropping out) to the correct validity threat (e.g., attrition). Internal validity threats = history, maturation, attrition, instrumentation. External validity = generalizability. Ecological validity = generalization to real-world settings.",
    "domainId": 9,
    "domainName": "Research & Program Evaluation"
  },
  "NEW-9-ImplementationFidelity": {
    "id": "NEW-9-ImplementationFidelity",
    "name": "Implementation Fidelity",
    "definition": "Understand implementing change and ensuring fidelity of implementation",
    "decisionRule": "Implementation fidelity = consistent, reliable implementation of program/intervention as designed. Fidelity strategies: training, coaching, prompts/reminders, checklists, observation, feedback. Reminders (e.g., emailing teachers) help ensure consistent implementation. Fidelity monitoring = ongoing checks to ensure implementation matches design.",
    "domainId": 9,
    "domainName": "Research & Program Evaluation"
  },
  "NEW-9-ProgramEvaluation": {
    "id": "NEW-9-ProgramEvaluation",
    "name": "Program Evaluation",
    "definition": "Understand program evaluation methods and purposes",
    "decisionRule": "Program evaluation = systematic assessment of program effectiveness, outcomes, and impact. Evaluation purposes: determine if program works, identify areas for improvement, inform decision-making, demonstrate accountability. Evaluation methods: outcome data, process data, stakeholder feedback, comparison groups.",
    "domainId": 9,
    "domainName": "Research & Program Evaluation"
  },
  "RES-S03": {
    "id": "RES-S03",
    "name": "Effect Size Interpretation",
    "definition": "Interpret effect sizes (Cohen's d) to determine practical significance",
    "decisionRule": "Cohen's d: small = 0.2, medium = 0.5, large = 0.8+. Effect size shows practical significance, not just statistical significance.",
    "domainId": 9,
    "domainName": "Research & Program Evaluation"
  },
  "RES-S05": {
    "id": "RES-S05",
    "name": "Type I & Type II Errors",
    "definition": "Understand Type I error (rejecting null when true) and Type II error (failing to reject when false)",
    "decisionRule": "Type I error = false positive, reject null when it's true. Type II error = false negative, fail to reject when null is false.",
    "domainId": 9,
    "domainName": "Research & Program Evaluation"
  },
  "RES-S06": {
    "id": "RES-S06",
    "name": "Correlation Interpretation",
    "definition": "Interpret correlation coefficients (strength and direction)",
    "decisionRule": "Correlation: -1 to +1. Closer to ±1 = stronger. Positive = variables increase together. Negative = variables move opposite. 0 = no relationship.",
    "domainId": 9,
    "domainName": "Research & Program Evaluation"
  },
  "NEW-9-StatisticalTests": {
    "id": "NEW-9-StatisticalTests",
    "name": "Statistical Test Selection",
    "definition": "Select the appropriate statistical test (t-test, ANOVA, Chi-square, correlation) based on the research question and data type.",
    "decisionRule": "Correct answer matches 2 groups → t-test, 3+ groups → ANOVA, categorical data → Chi-square.",
    "domainId": 9,
    "domainName": "Research & Program Evaluation"
  },
  "NEW-9-DescriptiveStats": {
    "id": "NEW-9-DescriptiveStats",
    "name": "Descriptive Statistics",
    "definition": "Understand and interpret measures of central tendency (mean, median, mode) and dispersion (range, variance, standard deviation).",
    "decisionRule": "Correct answer identifies the measure that best summarizes the data set's center or spread.",
    "domainId": 9,
    "domainName": "Research & Program Evaluation"
  },
  "LEG-S01": {
    "id": "LEG-S01",
    "name": "Landmark Cases",
    "definition": "Identify key legal cases and their implications (Tarasoff, Larry P., Rowley)",
    "decisionRule": "Tarasoff = duty to warn/protect when specific threat. Larry P. = banned IQ tests for African American placement in CA. Rowley = 'some educational benefit' standard for FAPE.",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "LEG-S02": {
    "id": "LEG-S02",
    "name": "IDEA Requirements",
    "definition": "Understand Free Appropriate Public Education (FAPE) requirements under IDEA and related provisions",
    "decisionRule": "FAPE = special education and related services provided at public expense, meet state standards, provided in conformity with IEP. IDEA = FAPE, zero-reject principle, procedural safeguards, electronic communication allowed, IEP requirements, interagency collaboration for transitions. Zero-reject principle = no child denied FAPE based on disability severity. IEP content includes: specialized instruction based on student needs, related services (e.g., counseling, social work) when needed, modifications/accommodations. IEP services determined by evaluation results and student needs.",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "NEW-10-EducationLaw": {
    "id": "NEW-10-EducationLaw",
    "name": "Section 504 vs. IDEA",
    "definition": "Distinguish between the mandates of Section 504 (Civil Rights/Access) and IDEA (Educational Benefit/Specialized Instruction).",
    "decisionRule": "Correct answer differentiates between 'access' (504) and 'specialized instruction' (IDEA).",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "LEG-S05": {
    "id": "LEG-S05",
    "name": "Manifestation Determination",
    "definition": "Understand purpose of Manifestation Determination Review (decide if conduct caused by disability)",
    "decisionRule": "MDR purpose = determine if conduct was caused by disability. If yes, cannot change placement. If no, can apply same discipline as non-disabled students.",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "LEG-S03": {
    "id": "LEG-S03",
    "name": "Confidentiality Breach",
    "definition": "Know when to breach confidentiality (imminent danger to self or others)",
    "decisionRule": "Breach confidentiality when: imminent danger to self or others, child abuse, court order. Not for general concerns.",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "LEG-S04": {
    "id": "LEG-S04",
    "name": "Mandated Reporting",
    "definition": "Understand legal duty to report child abuse (report to CPS, not investigate)",
    "decisionRule": "Legal duty = report suspected abuse to CPS immediately. Do NOT investigate. Report based on reasonable suspicion, not proof.",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "LEG-S06": {
    "id": "LEG-S06",
    "name": "Ethical Dilemmas",
    "definition": "Apply ethical principles to resolve dilemmas (e.g., gifts, conflicts of interest)",
    "decisionRule": "Ethical resolution = consider cultural context, avoid conflicts of interest, prioritize student welfare, consult when uncertain. Advocacy = work to change discriminatory practices, distinguish professional vs private statements. Competence = practice within bounds, seek training/supervision when needed.",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "NEW-10-EthicalProblemSolving": {
    "id": "NEW-10-EthicalProblemSolving",
    "name": "Ethical Problem-Solving Model",
    "definition": "Apply NASP's ethical problem-solving model to address ethical dilemmas, including identifying competing principles, considering options, and making decisions.",
    "decisionRule": "First step = identify ethical principles in conflict. Then consider options, consult when needed, make decision prioritizing student welfare. Duty to protect overrides confidentiality when imminent threat. Address unethical behavior directly when possible. Avoid dual relationships and practice within scope of competence.",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "LEG-S07": {
    "id": "LEG-S07",
    "name": "Informed Consent Requirements",
    "definition": "Understand requirements for parental consent for ongoing counseling services and balance with student safety",
    "decisionRule": "Ensure student safety first when student requests counseling. Inform student that parental consent is required for ongoing counseling services. Students cannot receive ongoing counseling without parental consent, but safety assessment takes priority. Distinguish between brief safety check (allowed) and ongoing counseling (requires consent).",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "NEW-10-RecordKeeping": {
    "id": "NEW-10-RecordKeeping",
    "name": "FERPA & Record Access",
    "definition": "Apply FERPA regulations regarding parent access to records, amendment of records, and rights of non-custodial parents.",
    "decisionRule": "Correct answer upholds parent rights to access unless specific legal revocation exists. Medical records with parent authorization appropriate when health issues may affect student learning or behavior. Requesting medical records is appropriate when: (1) student reports symptoms not clearly related to health condition, (2) student receives medication during school day that may affect learning/behavior.",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "NEW-10-TestSecurity": {
    "id": "NEW-10-TestSecurity",
    "name": "Test Security & Copyright",
    "definition": "Balance parent rights to inspect records with the duty to maintain test security and copyright laws.",
    "decisionRule": "Correct answer allows viewing/explanation but prohibits copying or releasing raw protocols to unqualified persons.",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "NEW-10-Supervision": {
    "id": "NEW-10-Supervision",
    "name": "Supervision Standards",
    "definition": "Know NASP standards for professional supervision (internship requirements, hours, qualification of supervisor).",
    "decisionRule": "Correct answer matches specific NASP standards (e.g., 2 hours face-to-face).",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  },
  "NEW-10-ProfessionalGrowth": {
    "id": "NEW-10-ProfessionalGrowth",
    "name": "Lifelong Learning & Professional Growth",
    "definition": "Understand the importance of lifelong learning and professional growth including continuing education, staying current with research, and professional development",
    "decisionRule": "Professional growth = ongoing learning, staying current with research, continuing education, professional development activities, reading research literature, attending conferences, seeking supervision/consultation. Lifelong learning ensures competence and best practice. Professional growth is essential for maintaining effectiveness.",
    "domainId": 10,
    "domainName": "Legal, Ethical & Professional Practice"
  }
};
