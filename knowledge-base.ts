// The "Brain" - Knowledge Base for Praxis Study App
// This file contains all the structured knowledge the app uses to:
// 1. Understand what each question tests
// 2. Identify why answers are wrong
// 3. Connect concepts to domains
// 4. Provide targeted study guidance

export const NASP_DOMAINS = {
  1: {
    id: 1,
    name: "Data-Based Decision Making & Accountability",
    shortName: "DBDM",
    praxisCategory: "Professional Practices",
    description: "Using data to make decisions about students and programs",
    
    keyConcepts: [
      "reliability", "validity", "progress monitoring", "universal screening",
      "CBM", "RTI data", "assessment interpretation", "psychometrics",
      "norm-referenced tests", "criterion-referenced tests", "single-subject design"
    ],
    
    mustKnowTerms: {
      "interobserver agreement": {
        definition: "Reliability metric comparing two observers' data on same behavior",
        context: "Used in single-subject designs and behavioral observation",
        commonConfusion: "Not the same as test-retest or internal consistency"
      },
      "sensitivity": {
        definition: "True positive rate - correctly identifying those WITH a condition",
        context: "Important for screening tools",
        commonConfusion: "Often confused with specificity (true negative rate)"
      },
      "specificity": {
        definition: "True negative rate - correctly identifying those WITHOUT a condition",
        context: "Important for avoiding over-identification",
        commonConfusion: "Often confused with sensitivity"
      },
      "SEM": {
        definition: "Standard Error of Measurement - expected variability in scores due to measurement error",
        context: "Used to interpret confidence intervals around scores",
        commonConfusion: "Not the same as standard deviation"
      },
      "CBM": {
        definition: "Curriculum-Based Measurement - brief, frequent assessments tied to curriculum",
        context: "Primary tool for progress monitoring in RTI",
        commonConfusion: "Different from comprehensive diagnostic assessment"
      },
      "reliability coefficient": {
        definition: "Statistical measure of score consistency (0-1 scale)",
        context: ".90+ is excellent, .80+ is good for most purposes",
        commonConfusion: "High reliability doesn't mean high validity"
      },
      "confidence interval": {
        definition: "Range within which true score likely falls",
        context: "95% CI means 95% probability true score is in range",
        commonConfusion: "It's about the score, not the percentage correct"
      }
    },
    
    questionPatterns: [
      "Which reliability type for [context]?",
      "What does [score/statistic] mean?",
      "Best assessment approach for [purpose]?"
    ],
    
    commonMistakes: [
      "Confusing reliability types (test-retest vs internal consistency vs interrater)",
      "Mixing up sensitivity and specificity",
      "Thinking high reliability = high validity",
      "Not knowing when to use CBM vs standardized tests"
    ]
  },
  
  2: {
    id: 2,
    name: "Consultation & Collaboration",
    shortName: "C&C",
    praxisCategory: "Professional Practices",
    description: "Working with teachers, families, and systems",
    
    keyConcepts: [
      "consultation models", "collaborative problem-solving", "consultee-centered",
      "behavioral consultation", "conjoint behavioral consultation", "indirect service"
    ],
    
    mustKnowTerms: {
      "consultee-centered consultation": {
        definition: "Focus on improving consultee's skills/knowledge",
        context: "When the issue is consultee's approach, not just student",
        commonConfusion: "Different from client-centered (focus on student)"
      },
      "behavioral consultation": {
        definition: "Systematic problem-solving using behavioral principles",
        context: "Steps: problem ID → analysis → intervention → evaluation",
        commonConfusion: "Not just about behavior problems"
      },
      "conjoint behavioral consultation": {
        definition: "Collaboration between home and school",
        context: "Parents and teachers work together with consultant",
        commonConfusion: "More than just parent involvement"
      },
      "indirect service": {
        definition: "Helping students by working with adults (teachers, parents)",
        context: "Consultation is indirect; direct would be working with student",
        commonConfusion: "Doesn't mean less effective"
      }
    },
    
    commonMistakes: [
      "Confusing consultation models",
      "Not recognizing when to use indirect vs direct services",
      "Thinking school psych should 'take over' rather than consult"
    ]
  },
  
  3: {
    id: 3,
    name: "Academic Interventions & Instructional Support",
    shortName: "Academic",
    praxisCategory: "Student-Level Services",
    description: "Supporting learning and academic achievement",
    
    keyConcepts: [
      "evidence-based interventions", "tier 2", "tier 3", "explicit instruction",
      "learning disabilities", "reading interventions", "math interventions"
    ],
    
    mustKnowTerms: {
      "tier 2 intervention": {
        definition: "Small group, targeted intervention for at-risk students",
        context: "More intensive than universal (Tier 1), less than individualized (Tier 3)",
        commonConfusion: "Not the same as special education"
      },
      "evidence-based practice": {
        definition: "Intervention with rigorous research support",
        context: "Look for RCT studies, peer-reviewed research",
        commonConfusion: "Not just 'commonly used' or 'recommended by experts'"
      },
      "instructional level": {
        definition: "Level where student can learn with support (typically 70-85% accuracy)",
        context: "Used to match instruction to student's current ability",
        commonConfusion: "Different from frustration level (too hard) or independent level"
      }
    },
    
    commonMistakes: [
      "Jumping to Tier 3 without trying Tier 2",
      "Confusing evidence-based with popular or traditional",
      "Not matching intervention to skill deficit"
    ]
  },
  
  4: {
    id: 4,
    name: "Mental & Behavioral Health Services",
    shortName: "MBH",
    praxisCategory: "Student-Level Services",
    description: "Counseling, behavior support, social-emotional learning",
    
    keyConcepts: [
      "FBA", "BIP", "function of behavior", "counseling approaches",
      "CBT", "anxiety", "depression", "suicide risk", "crisis intervention"
    ],
    
    mustKnowTerms: {
      "FBA": {
        definition: "Functional Behavior Assessment - identifies WHY behavior occurs",
        context: "Required before developing behavior intervention plan",
        commonConfusion: "Not just documenting what behavior looks like"
      },
      "function of behavior": {
        definition: "Purpose the behavior serves (escape, attention, tangible, sensory)",
        context: "All behavior serves a function - intervention must address it",
        commonConfusion: "Behavior isn't random or 'just for no reason'"
      },
      "BIP": {
        definition: "Behavior Intervention Plan based on FBA findings",
        context: "Must address the function, teach replacement behaviors",
        commonConfusion: "Not just a punishment plan"
      },
      "CBT": {
        definition: "Cognitive-Behavioral Therapy - changing thoughts to change feelings/behaviors",
        context: "Evidence-based for anxiety, depression",
        commonConfusion: "Different from psychoanalytic or purely behavioral approaches"
      },
      "lethality assessment": {
        definition: "Evaluating how serious/immediate suicide risk is",
        context: "Ask about plan, means, intent, timeline",
        commonConfusion: "Asking doesn't increase risk"
      }
    },
    
    commonMistakes: [
      "Skipping FBA before BIP",
      "Not identifying function of behavior",
      "Jumping to contact parents before assessing suicide risk",
      "Using punishment without teaching replacement behaviors"
    ]
  },
  
  5: {
    id: 5,
    name: "School-Wide Practices to Promote Learning",
    shortName: "School-Wide",
    praxisCategory: "Systems-Level Services",
    description: "MTSS/RTI, school climate, universal prevention",
    
    keyConcepts: [
      "MTSS", "RTI", "PBIS", "universal screening", "tier 1",
      "school climate", "systems-level change"
    ],
    
    mustKnowTerms: {
      "MTSS": {
        definition: "Multi-Tiered System of Supports - framework for all students",
        context: "Integrates academic and behavioral supports",
        commonConfusion: "Broader than just RTI"
      },
      "PBIS": {
        definition: "Positive Behavioral Interventions and Supports - schoolwide behavior framework",
        context: "Teach expectations, reinforce positive behavior",
        commonConfusion: "Not a curriculum - it's a framework"
      },
      "Tier 1": {
        definition: "Universal supports for all students",
        context: "Core instruction, schoolwide expectations",
        commonConfusion: "Should reach ~80% of students effectively"
      },
      "fidelity of implementation": {
        definition: "Extent to which intervention is delivered as designed",
        context: "Critical for knowing if intervention failure is real",
        commonConfusion: "Can't blame intervention if it wasn't implemented correctly"
      }
    },
    
    commonMistakes: [
      "Focusing only on individual students without systems change",
      "Implementing PBIS without fidelity checks",
      "Skipping Tier 1 strengthening before adding Tier 2"
    ]
  },
  
  6: {
    id: 6,
    name: "Preventive & Responsive Services",
    shortName: "Prevention",
    praxisCategory: "Systems-Level Services",
    description: "Crisis response, threat assessment, safety",
    
    keyConcepts: [
      "crisis intervention", "threat assessment", "psychological first aid",
      "prevention", "risk factors", "protective factors"
    ],
    
    mustKnowTerms: {
      "threat assessment": {
        definition: "Systematic evaluation of whether threat is serious",
        context: "Multidisciplinary team approach",
        commonConfusion: "Not just asking 'did they say it?'"
      },
      "psychological first aid": {
        definition: "Immediate support after crisis - safety, calm, connection, hope",
        context: "NOT therapy - it's stabilization",
        commonConfusion: "Different from long-term counseling"
      },
      "postvention": {
        definition: "Support activities after a suicide or traumatic death",
        context: "Prevent contagion, support survivors",
        commonConfusion: "Not the same as prevention"
      }
    },
    
    commonMistakes: [
      "Providing therapy during crisis (should be PFA)",
      "Individual threat assessment without team",
      "Focusing only on response, not prevention"
    ]
  },
  
  7: {
    id: 7,
    name: "Family-School Collaboration Services",
    shortName: "Family",
    praxisCategory: "Systems-Level Services",
    description: "Partnering with families and community",
    
    keyConcepts: [
      "family engagement", "parent-school partnership", "home-school communication",
      "cultural considerations in family work"
    ],
    
    mustKnowTerms: {
      "family-centered practice": {
        definition: "Families as partners in decision-making",
        context: "Respect family expertise about their child",
        commonConfusion: "Not just informing parents of decisions"
      },
      "conjoint": {
        definition: "Joint involvement of home and school",
        context: "Collaboration, not parallel efforts",
        commonConfusion: "More than just 'communication'"
      }
    },
    
    commonMistakes: [
      "Making decisions without family input",
      "Assuming all families have same needs/resources",
      "Only contacting families when there's a problem"
    ]
  },
  
  8: {
    id: 8,
    name: "Diversity in Development & Learning",
    shortName: "Diversity",
    praxisCategory: "Foundations",
    description: "Equity, cultural responsiveness, individual differences",
    
    keyConcepts: [
      "cultural competence", "implicit bias", "disproportionality",
      "ELL", "multicultural assessment", "equity"
    ],
    
    mustKnowTerms: {
      "implicit bias": {
        definition: "Unconscious attitudes affecting behavior",
        context: "Everyone has them - awareness is key",
        commonConfusion: "Not the same as explicit prejudice"
      },
      "disproportionality": {
        definition: "Over/under-representation of groups in special ed or discipline",
        context: "Sign of potential systemic bias",
        commonConfusion: "Not about individual cases - it's a pattern"
      },
      "culturally responsive": {
        definition: "Adapting practice to honor cultural backgrounds",
        context: "Goes beyond just 'being aware' of differences",
        commonConfusion: "Not stereotyping - seeing individuals within culture"
      },
      "ELL": {
        definition: "English Language Learner",
        context: "Consider language development before assuming disability",
        commonConfusion: "Language difference ≠ learning disability"
      }
    },
    
    commonMistakes: [
      "Using assessments normed only on one population",
      "Assuming language difficulties = disability",
      "Ignoring cultural factors in behavior interpretation",
      "Not examining own biases"
    ]
  },
  
  9: {
    id: 9,
    name: "Research & Program Evaluation",
    shortName: "Research",
    praxisCategory: "Foundations",
    description: "Understanding and applying research",
    
    keyConcepts: [
      "research design", "meta-analysis", "effect size", "statistical significance",
      "action research", "program evaluation"
    ],
    
    mustKnowTerms: {
      "meta-analysis": {
        definition: "Statistical synthesis of multiple studies",
        context: "Calculates overall effect size across studies",
        commonConfusion: "Not just a literature review"
      },
      "RCT": {
        definition: "Randomized Controlled Trial - gold standard for causation",
        context: "Random assignment to treatment vs control",
        commonConfusion: "Strongest evidence, but not always feasible"
      },
      "effect size": {
        definition: "Magnitude of difference or relationship",
        context: "Practical significance vs statistical significance",
        commonConfusion: "Small p-value doesn't mean big effect"
      },
      "action research": {
        definition: "Practitioner-led research to improve own practice",
        context: "Done in real settings, focused on local improvement",
        commonConfusion: "Different from formal experimental research"
      },
      "Type I error": {
        definition: "False positive - saying there's an effect when there isn't",
        context: "Rejecting true null hypothesis",
        commonConfusion: "Opposite of Type II (false negative)"
      }
    },
    
    commonMistakes: [
      "Equating statistical significance with practical importance",
      "Not understanding different research designs",
      "Treating correlation as causation"
    ]
  },
  
  10: {
    id: 10,
    name: "Legal, Ethical & Professional Practice",
    shortName: "Legal/Ethics",
    praxisCategory: "Foundations",
    description: "Ethics, law, and professional standards",
    
    keyConcepts: [
      "NASP ethics", "IDEA", "FERPA", "confidentiality", "informed consent",
      "mandated reporting", "professional boundaries"
    ],
    
    mustKnowTerms: {
      "Tarasoff": {
        definition: "Duty to warn and protect when client threatens harm",
        context: "Overrides confidentiality when there's serious threat",
        commonConfusion: "Not about civil rights or special ed law"
      },
      "IDEA": {
        definition: "Individuals with Disabilities Education Act",
        context: "FAPE, LRE, IEP requirements",
        commonConfusion: "Different from Section 504 and ADA"
      },
      "FERPA": {
        definition: "Family Educational Rights and Privacy Act",
        context: "Protects student records, requires consent for release",
        commonConfusion: "Educational records, not all information"
      },
      "LRE": {
        definition: "Least Restrictive Environment",
        context: "Educate with non-disabled peers to maximum extent appropriate",
        commonConfusion: "Doesn't mean always in general ed"
      },
      "manifestation determination": {
        definition: "Review to determine if behavior was caused by disability",
        context: "Required before disciplinary removal >10 days",
        commonConfusion: "Not about whether behavior happened"
      },
      "informed consent": {
        definition: "Parent/guardian agreement after being told about procedures",
        context: "Required before evaluation",
        commonConfusion: "Different from just notifying"
      },
      "mandated reporter": {
        definition: "Person legally required to report suspected abuse",
        context: "Must report suspicion - not investigate",
        commonConfusion: "Don't need to prove abuse to report"
      }
    },
    
    commonMistakes: [
      "Confusing major court cases",
      "Not knowing when confidentiality can be broken",
      "Investigating abuse instead of reporting",
      "Confusing IDEA, 504, and ADA"
    ]
  }
};

// Key court cases that appear frequently
export const KEY_COURT_CASES = {
  "Tarasoff v. Regents": {
    year: 1976,
    domain: 10,
    keyPoint: "Duty to warn and protect",
    details: "Therapist must warn identifiable potential victims of serious threats",
    examTrap: "Often confused with civil rights cases"
  },
  "Larry P. v. Riles": {
    year: 1979,
    domain: [8, 10],
    keyPoint: "IQ tests can't be sole basis for EMR placement of Black students (California)",
    details: "Addressed disproportionate placement based on biased testing",
    examTrap: "Specifically about California and IQ tests"
  },
  "PARC v. Commonwealth": {
    year: 1972,
    domain: 10,
    keyPoint: "Right to education for students with intellectual disabilities",
    details: "Pennsylvania case - led to IDEA",
    examTrap: "Early case that established right to education"
  },
  "Mills v. Board of Education": {
    year: 1972,
    domain: 10,
    keyPoint: "All children with disabilities entitled to education",
    details: "DC case - regardless of cost or severity",
    examTrap: "About right to education, not testing bias"
  },
  "Lau v. Nichols": {
    year: 1974,
    domain: [8, 10],
    keyPoint: "Schools must provide services to ELL students",
    details: "Led to bilingual education requirements",
    examTrap: "About language access, not disability"
  }
};

// Common distractor patterns in Praxis questions
export const DISTRACTOR_PATTERNS = {
  prematureAction: {
    name: "Premature Action",
    description: "Jumping to intervention without proper assessment first",
    redFlags: ["immediately", "refer for special ed", "implement intervention"],
    correctPattern: "First collect data, then analyze, then intervene"
  },
  roleConfusion: {
    name: "Role Confusion",
    description: "Choosing actions that belong to other professionals",
    redFlags: ["take over teaching", "prescribe", "diagnose medically"],
    correctPattern: "School psych consults, collaborates, and assesses"
  },
  extremeLanguage: {
    name: "Extreme Language",
    description: "Options with absolute words are usually wrong",
    redFlags: ["always", "never", "only", "all", "must"],
    correctPattern: "Best practice usually allows for flexibility"
  },
  contextMismatch: {
    name: "Context Mismatch",
    description: "Valid approach but wrong for this specific situation",
    redFlags: ["good intervention, wrong timing", "right concept, wrong population"],
    correctPattern: "Match approach to specific context in the question"
  },
  skipDataCollection: {
    name: "Skip Data Collection",
    description: "Making decisions without reviewing data first",
    redFlags: ["without assessing", "before evaluating"],
    correctPattern: "Data-based decision making comes first"
  }
};

// Question stem patterns and what they test
export const STEM_PATTERNS = {
  "first step": {
    meaning: "What should happen BEFORE other valid actions",
    strategy: "Look for assessment/data collection options",
    trap: "All options might be valid - but one comes first"
  },
  "most appropriate": {
    meaning: "Best match for this specific context",
    strategy: "Consider ALL aspects of the scenario",
    trap: "Options might all be 'good' - pick the BEST for THIS situation"
  },
  "best example": {
    meaning: "Which option most clearly illustrates the concept",
    strategy: "Find the textbook example",
    trap: "Partial examples that miss key features"
  },
  "which of the following": {
    meaning: "Select from these options",
    strategy: "Process of elimination, check each option",
    trap: "Don't stop at first 'good' answer - check all"
  }
};

export default {
  NASP_DOMAINS,
  KEY_COURT_CASES,
  DISTRACTOR_PATTERNS,
  STEM_PATTERNS
};
