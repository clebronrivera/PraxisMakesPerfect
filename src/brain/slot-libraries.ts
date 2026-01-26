// Slot Value Libraries - Realistic values for template slots
// Organized by category with metadata for appropriate use

export interface SlotValueMetadata {
  gradeAppropriate?: string[]; // Which grades this value is appropriate for
  domainRelevant?: number[]; // Which domains this value is relevant to
  context?: string; // Additional context about when to use this value
}

export interface SlotLibrary {
  [category: string]: {
    values: string[];
    metadata?: Record<string, SlotValueMetadata>;
  };
}

export const SLOT_LIBRARIES: SlotLibrary = {
  // People
  studentNames: {
    values: [
      "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn",
      "Jamie", "Dakota", "Sage", "River", "Phoenix", "Skyler", "Rowan",
      "Marcus", "Sofia", "Ethan", "Olivia", "Noah", "Emma", "Liam", "Ava",
      "Mason", "Isabella", "James", "Sophia", "Benjamin", "Charlotte", "Lucas"
    ],
    metadata: {}
  },

  gradeDescriptions: {
    values: [
      "kindergarten student",
      "first-grade student",
      "second-grade student",
      "third-grade student",
      "fourth-grade student",
      "fifth-grade student",
      "sixth-grade student",
      "seventh-grade student",
      "eighth-grade student",
      "ninth-grade student",
      "tenth-grade student",
      "eleventh-grade student",
      "twelfth-grade student",
      "high school junior",
      "high school senior",
      "elementary school student",
      "middle school student",
      "high school student"
    ],
    metadata: {}
  },

  // Settings
  schoolTypes: {
    values: [
      "elementary school",
      "middle school",
      "high school",
      "K-8 school",
      "K-12 school",
      "preschool",
      "alternative school",
      "charter school"
    ],
    metadata: {}
  },

  locations: {
    values: [
      "classroom",
      "playground",
      "hallway",
      "cafeteria",
      "library",
      "gymnasium",
      "auditorium",
      "office",
      "bathroom",
      "bus",
      "recess area"
    ],
    metadata: {}
  },

  // Problems by Domain
  behaviorProblems: {
    values: [
      "off-task behavior",
      "aggressive behavior",
      "frequent absences",
      "calling out without raising hand",
      "disruptive behavior",
      "defiance",
      "tantrums",
      "bullying behavior",
      "withdrawal",
      "inappropriate language",
      "physical aggression toward peers",
      "refusal to follow directions"
    ],
    metadata: {
      domainRelevant: [4, 5, 6]
    }
  },

  academicProblems: {
    values: [
      "difficulty with reading fluency",
      "struggles with math computation",
      "poor writing skills",
      "reading comprehension difficulties",
      "math problem-solving challenges",
      "spelling difficulties",
      "phonemic awareness deficits",
      "number sense difficulties",
      "written expression problems",
      "decoding difficulties"
    ],
    metadata: {
      domainRelevant: [3]
    }
  },

  readingComponents: {
    values: [
      "reading comprehension",
      "reading fluency",
      "phonemic awareness",
      "phonics",
      "vocabulary",
      "text structure analysis"
    ],
    metadata: {
      domainRelevant: [3]
    }
  },

  academicErrorPatterns: {
    values: [
      "confusing 'b' and 'd'",
      "adding instead of subtracting",
      "missing vowel sounds",
      "inconsistent use of punctuation",
      "reversing word order in sentences",
      "omitting steps in multi-step problems",
      "guessing without reading entire problem",
      "copying numbers from another problem"
    ],
    metadata: {
      domainRelevant: [3]
    }
  },

  accuracyRates: {
    values: ["95", "93", "90", "85", "72", "88"],
    metadata: {
      domainRelevant: [3]
    }
  },

  socialEmotionalProblems: {
    values: [
      "difficulty making friends",
      "seems withdrawn",
      "reports feeling anxious",
      "appears depressed",
      "low self-esteem",
      "social isolation",
      "excessive worry",
      "mood swings",
      "difficulty regulating emotions",
      "trauma symptoms"
    ],
    metadata: {
      domainRelevant: [4, 6]
    }
  },

  behaviorContexts: {
    values: [
      "math worksheets",
      "group work",
      "quiet reading time",
      "transition periods",
      "independent writing time",
      "recess line-ups",
      "arrival/dismissal routines",
      "small-group instruction"
    ],
    metadata: {
      domainRelevant: [4]
    }
  },

  behaviorConsequences: {
    values: [
      "being sent out of class",
      "getting teacher attention",
      "receiving a preferred item",
      "allowed to use a phone",
      "removed from the task",
      "praised by teacher",
      "avoided writing assignments",
      "given a pass to the office"
    ],
    metadata: {
      domainRelevant: [4]
    }
  },

  // Assessments
  cognitiveTests: {
    values: [
      "WISC-V",
      "KABC-II",
      "Stanford-Binet",
      "WJ-IV Cognitive",
      "CAS-2",
      "DAS-II"
    ],
    metadata: {}
  },

  achievementTests: {
    values: [
      "WJ-IV",
      "WIAT-4",
      "KTEA-3",
      "WRAT-5",
      "PIAT-R",
      "TerraNova"
    ],
    metadata: {}
  },

  behaviorRatings: {
    values: [
      "BASC-3",
      "Conners-4",
      "BRIEF-2",
      "CBCL",
      "ABAS-3",
      "Vineland-3"
    ],
    metadata: {}
  },

  screeningTools: {
    values: [
      "DIBELS",
      "AIMSweb",
      "CBM probes",
      "FastBridge",
      "STAR",
      "MAP",
      "universal screening measures"
    ],
    metadata: {}
  },

  // Data Patterns
  trendDescriptions: {
    values: [
      "improving trend",
      "flat trend",
      "declining trend",
      "highly variable",
      "accelerating improvement",
      "plateauing",
      "inconsistent pattern"
    ],
    metadata: {}
  },

  durationValues: {
    values: [
      "two weeks",
      "one month",
      "six weeks",
      "one quarter",
      "one semester",
      "one school year",
      "eight weeks",
      "three months"
    ],
    metadata: {}
  },

  // Professional Roles
  schoolRoles: {
    values: [
      "teacher",
      "principal",
      "school counselor",
      "speech-language pathologist",
      "special education teacher",
      "parent",
      "school nurse",
      "school social worker",
      "reading specialist",
      "math specialist",
      "behavior specialist",
      "district administrator"
    ],
    metadata: {}
  },

  // Additional context-specific values
  roleContexts: {
    values: [
      "has recently been hired at an elementary school",
      "is new to a middle school",
      "is consulting with a high school",
      "is working at a district office",
      "has been at the school for five years",
      "is providing consultation services",
      "is conducting an evaluation"
    ],
    metadata: {}
  },

  variableTypes: {
    values: ["independent variable", "dependent variable"],
    metadata: {
      domainRelevant: [9]
    }
  },

  statisticalTests: {
    values: ["Independent t-test", "ANOVA", "Chi-square", "Correlation", "Regression"],
    metadata: {
      domainRelevant: [9]
    }
  },

  legalCases: {
    values: ["Tarasoff", "Larry P.", "Rowley", "Endrew F.", "Brown v. Board", "Goss v. Lopez"],
    metadata: {
      domainRelevant: [10]
    }
  },

  consultationContexts: {
    values: [
      "a cultural broker to facilitate communication with a family",
      "a teacher to address an individual student's behavior",
      "the principal to implement a school-wide behavior system",
      "both parents and teachers to address home-school collaboration",
      "a student services team to coordinate supports",
      "a district administrator to launch a new initiative",
      "a counselor to debrief a recent crisis response",
      "a coach to support a struggling teacher"
    ],
    metadata: {
      domainRelevant: [2]
    }
  },

  consultationTypes: {
    values: [
      "parent consultation",
      "teacher consultation",
      "organizational consultation",
      "administrative consultation",
      "peer consultation",
      "behavioral consultation"
    ],
    metadata: {
      domainRelevant: [2]
    }
  },

  problemDescriptions: {
    values: [
      "is frequently off-task during math",
      "has difficulty following directions",
      "disrupts class during transitions",
      "avoids group work and collaboration",
      "has frequent conflicts with peers during lunch",
      "struggles to complete homework consistently",
      "focuses on irrelevant topics during small-group instruction"
    ],
    metadata: {
      domainRelevant: [2]
    }
  },

  teacherChallenges: {
    values: [
      "classroom management",
      "student engagement",
      "instructional planning",
      "meeting diverse learners' needs",
      "coordinating behavior supports",
      "managing transitions",
      "communicating with families",
      "building consistency across settings"
    ],
    metadata: {
      domainRelevant: [2]
    }
  },

  threatCharacteristics: {
    values: [
      "an emotional expression with no specific plan",
      "a specific plan with means and intent",
      "a vague statement made in anger",
      "a detailed plan without immediate intent",
      "an online post describing revenge",
      "a comment made in a joking manner"
    ],
    metadata: {
      domainRelevant: [6]
    }
  },

  stakeholders: {
    values: [
      "The principal",
      "A teacher",
      "The special education director",
      "A parent",
      "A school counselor",
      "The school nurse",
      "A district administrator",
      "The school social worker"
    ],
    metadata: {}
  },

  problemDescriptions: {
    values: [
      "behavior referrals have increased",
      "reading scores have declined",
      "more students are being referred for ADHD evaluations",
      "suspension rates have increased",
      "attendance has decreased",
      "students are struggling with math computation",
      "anxiety referrals have increased",
      "special education referrals have increased",
      "bullying incidents have increased",
      "academic performance has declined"
    ],
    metadata: {}
  },

  measurementContexts: {
    values: [
      "a single-subject design",
      "behavioral observation",
      "a standardized cognitive assessment",
      "a teacher rating scale",
      "repeated administrations over time",
      "a curriculum-based measurement",
      "a behavior rating scale",
      "a group-administered screening",
      "an individually-administered test",
      "multiple raters observing the same student",
      "a classroom behavior checklist",
      "a self-report anxiety measure",
      "a projective personality assessment",
      "curriculum-based measurement probes",
      "a structured diagnostic interview",
      "an adaptive behavior rating scale",
      "a social skills observation protocol"
    ],
    metadata: {}
  },

  psychometricProperties: {
    values: [
      "reliability",
      "validity",
      "reliability of measurement",
      "validity of measurement"
    ],
    metadata: {}
  },

  assessmentPurposes: {
    values: [
      "identify students at risk for reading difficulties",
      "determine eligibility for special education services",
      "monitor student progress during an intervention",
      "evaluate the effectiveness of a school-wide reading program",
      "screen for behavioral concerns",
      "assess response to intervention",
      "conduct a comprehensive evaluation"
    ],
    metadata: {}
  }
};

// Helper function to get values for a category
export function getSlotValues(category: string): string[] {
  return SLOT_LIBRARIES[category]?.values || [];
}

// Helper function to get a random value from a category
export function getRandomSlotValue(category: string): string | null {
  const values = getSlotValues(category);
  if (values.length === 0) return null;
  return values[Math.floor(Math.random() * values.length)];
}

// Helper function to check if a value exists in a category
export function isValidSlotValue(category: string, value: string): boolean {
  return getSlotValues(category).includes(value);
}
