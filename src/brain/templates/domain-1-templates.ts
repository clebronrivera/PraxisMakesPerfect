// Domain 1 Templates - Question generation templates for Data-Based Decision Making skills

import { QuestionTemplate } from '../template-schema';

export const domain1Templates: QuestionTemplate[] = [
  // DBDM-S01: Reliability Type Selection
  {
    templateId: "DBDM-T01",
    skillId: "DBDM-S01",
    templateType: "context-matching",
    stem: "Which of the following is a commonly used metric for establishing {psychometric_property} within the context of {measurement_context}?",
    slots: {
      psychometric_property: {
        name: "psychometric_property",
        description: "Whether question asks about reliability or validity",
        possibleValues: ["reliability", "validity"]
      },
      measurement_context: {
        name: "measurement_context",
        description: "The specific measurement context being used",
        possibleValues: [
          "a single-subject design",
          "behavioral observation",
          "a standardized cognitive assessment",
          "a teacher rating scale",
          "repeated administrations over time",
          "a curriculum-based measurement",
          "a behavior rating scale"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { psychometric_property, measurement_context } = slotValues;
        
        if (psychometric_property === "reliability") {
          if (measurement_context === "a single-subject design" || 
              measurement_context === "behavioral observation") {
            return "Interobserver agreement";
          }
          if (measurement_context === "a standardized cognitive assessment" ||
              measurement_context === "a curriculum-based measurement") {
            return "Internal consistency";
          }
          if (measurement_context === "a teacher rating scale" ||
              measurement_context === "a behavior rating scale") {
            return "Interrater reliability";
          }
          if (measurement_context === "repeated administrations over time") {
            return "Test-retest reliability";
          }
        }
        
        // For validity, return appropriate validity type
        if (psychometric_property === "validity") {
          if (measurement_context.includes("expert review") || 
              measurement_context.includes("content coverage")) {
            return "Content validity";
          }
          if (measurement_context.includes("correlation") ||
              measurement_context.includes("criterion")) {
            return "Criterion validity";
          }
          return "Construct validity";
        }
        
        return "Internal consistency"; // Default fallback
      },
      description: "Maps reliability/validity + measurement context to appropriate psychometric metric"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Different measurement contexts require different reliability metrics. Single-subject designs use interobserver agreement, standardized tests use internal consistency, rating scales use interrater reliability, and repeated measures use test-retest.",
    exampleSlotValues: {
      psychometric_property: "reliability",
      measurement_context: "a single-subject design"
    }
  },

  // DBDM-S02: Validity Type Recognition
  {
    templateId: "DBDM-T02",
    skillId: "DBDM-S02",
    templateType: "definition-recognition",
    stem: "A school psychologist is establishing validity for a new assessment by {validity_method}. Which type of validity is being established?",
    slots: {
      validity_method: {
        name: "validity_method",
        description: "How validity is being established",
        possibleValues: [
          "having experts review whether items cover the intended content domain",
          "correlating scores with an established measure administered at the same time",
          "correlating scores with future performance on a criterion measure",
          "examining whether items group together as predicted by theory",
          "determining whether the assessment appears to measure what it claims"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { validity_method } = slotValues;
        
        if (validity_method.includes("experts review") || validity_method.includes("content domain")) {
          return "Content validity";
        }
        if (validity_method.includes("correlating") && validity_method.includes("same time")) {
          return "Concurrent criterion validity";
        }
        if (validity_method.includes("correlating") && validity_method.includes("future")) {
          return "Predictive criterion validity";
        }
        if (validity_method.includes("theory") || validity_method.includes("group together")) {
          return "Construct validity";
        }
        if (validity_method.includes("appears to measure")) {
          return "Face validity";
        }
        
        return "Construct validity"; // Default
      },
      description: "Maps validity establishment method to validity type"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Content validity requires expert review. Criterion validity requires correlation with external measure. Construct validity requires theoretical relationships. Face validity is appearance only and insufficient alone.",
    exampleSlotValues: {
      validity_method: "having experts review whether items cover the intended content domain"
    }
  },

  // DBDM-S03: Score Interpretation
  {
    templateId: "DBDM-T03",
    skillId: "DBDM-S03",
    templateType: "interpretation",
    stem: "A student receives a score of {score_value} on a standardized test with a reliability coefficient of {reliability_value}. The standard error of measurement (SEM) is {sem_value}. Which of the following best interprets this information?",
    slots: {
      score_value: {
        name: "score_value",
        description: "The test score",
        possibleValues: ["85", "100", "115", "130"]
      },
      reliability_value: {
        name: "reliability_value",
        description: "Reliability coefficient",
        possibleValues: [".70", ".85", ".90", ".95"]
      },
      sem_value: {
        name: "sem_value",
        description: "Standard error of measurement",
        possibleValues: ["3", "5", "7", "10"]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        // The correct answer explains that the true score likely falls within SEM range
        // Higher reliability = lower SEM = more precise score
        const reliability = parseFloat(slotValues.reliability_value);
        const sem = parseFloat(slotValues.sem_value);
        
        if (reliability >= 0.90 && sem <= 5) {
          return "The score is highly reliable, and the true score likely falls within a narrow range";
        }
        if (reliability < 0.80 || sem > 7) {
          return "The score has considerable measurement error, and the true score could vary substantially";
        }
        return "The score is reasonably reliable, with moderate measurement error";
      },
      description: "Interprets score reliability and SEM to explain measurement precision"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Higher reliability coefficients indicate more consistent scores. Lower SEM indicates less measurement error. True scores fall within ±SEM of observed score.",
    exampleSlotValues: {
      score_value: "100",
      reliability_value: ".90",
      sem_value: "5"
    }
  },

  // DBDM-S04: Sensitivity/Specificity Distinction
  {
    templateId: "DBDM-T04",
    skillId: "DBDM-S04",
    templateType: "definition-recognition",
    stem: "A screening tool correctly identifies 90% of students who have reading difficulties and correctly identifies 85% of students who do not have reading difficulties. Which of the following best describes these statistics?",
    slots: {
      sensitivity_value: {
        name: "sensitivity_value",
        description: "True positive rate (sensitivity)",
        possibleValues: ["85%", "90%", "92%", "95%"]
      },
      specificity_value: {
        name: "specificity_value",
        description: "True negative rate (specificity)",
        possibleValues: ["80%", "85%", "88%", "90%"]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        // The question describes sensitivity (correctly identifies those WITH condition)
        // and specificity (correctly identifies those WITHOUT condition)
        return `Sensitivity is ${slotValues.sensitivity_value} and specificity is ${slotValues.specificity_value}`;
      },
      description: "Identifies sensitivity (true positive) and specificity (true negative) rates"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "Sensitivity = true positive rate (correctly identifying those WITH condition). Specificity = true negative rate (correctly identifying those WITHOUT condition).",
    exampleSlotValues: {
      sensitivity_value: "90%",
      specificity_value: "85%"
    }
  },

  // DBDM-S05: Assessment-Purpose Matching
  {
    templateId: "DBDM-T05",
    skillId: "DBDM-S05",
    templateType: "best-selection",
    stem: "A school psychologist wants to {assessment_purpose}. Which of the following assessments would be most appropriate?",
    slots: {
      assessment_purpose: {
        name: "assessment_purpose",
        description: "The purpose for assessment",
        possibleValues: [
          "identify students at risk for reading difficulties",
          "determine eligibility for special education services",
          "monitor student progress during an intervention",
          "evaluate the effectiveness of a school-wide reading program"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { assessment_purpose } = slotValues;
        
        if (assessment_purpose.includes("at risk") || assessment_purpose.includes("identify")) {
          return "A brief, group-administered screening tool";
        }
        if (assessment_purpose.includes("eligibility") || assessment_purpose.includes("determine")) {
          return "A comprehensive, individually-administered diagnostic assessment";
        }
        if (assessment_purpose.includes("monitor") || assessment_purpose.includes("progress")) {
          return "Curriculum-based measurement probes";
        }
        if (assessment_purpose.includes("effectiveness") || assessment_purpose.includes("program")) {
          return "Standardized achievement tests administered to all students";
        }
        
        return "A comprehensive diagnostic assessment";
      },
      description: "Maps assessment purpose to appropriate assessment type"
    },
    allowedDistractorPatterns: ["context-mismatch", "similar-concept"],
    keyPrinciple: "Screening = brief, group-administered. Diagnosis = comprehensive, individual. Progress monitoring = frequent, curriculum-aligned. Program evaluation = standardized, group-level.",
    exampleSlotValues: {
      assessment_purpose: "identify students at risk for reading difficulties"
    }
  },

  // DBDM-S06: Norm vs Criterion Reference Distinction
  {
    templateId: "DBDM-T06",
    skillId: "DBDM-S06",
    templateType: "definition-recognition",
    stem: "An assessment that compares a student's performance to a predetermined mastery standard is best described as:",
    slots: {
      assessment_characteristic: {
        name: "assessment_characteristic",
        description: "What the assessment compares to",
        possibleValues: [
          "a predetermined mastery standard",
          "the performance of same-age peers",
          "a national norm group",
          "grade-level expectations"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { assessment_characteristic } = slotValues;
        
        if (assessment_characteristic.includes("mastery standard") ||
            assessment_characteristic.includes("predetermined")) {
          return "Criterion-referenced";
        }
        if (assessment_characteristic.includes("peers") ||
            assessment_characteristic.includes("norm group")) {
          return "Norm-referenced";
        }
        
        return "Criterion-referenced";
      },
      description: "Distinguishes norm-referenced (compares to peers) from criterion-referenced (compares to standard)"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "Norm-referenced compares to peer group (percentiles, standard scores). Criterion-referenced compares to mastery standard (pass/fail, percentage correct).",
    exampleSlotValues: {
      assessment_characteristic: "a predetermined mastery standard"
    }
  },

  // DBDM-S07: Assessment Type Recognition
  {
    templateId: "DBDM-T07",
    skillId: "DBDM-S07",
    templateType: "characteristic-identification",
    stem: "Which of the following best describes {assessment_type}?",
    slots: {
      assessment_type: {
        name: "assessment_type",
        description: "Type of assessment",
        possibleValues: [
          "formative assessment",
          "summative assessment",
          "single-subject assessment",
          "diagnostic assessment"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { assessment_type } = slotValues;
        
        if (assessment_type === "formative assessment") {
          return "Ongoing assessment that guides instruction and provides feedback during learning";
        }
        if (assessment_type === "summative assessment") {
          return "Assessment administered at the end of a learning period to evaluate achievement";
        }
        if (assessment_type === "single-subject assessment") {
          return "Repeated measures of an individual's performance to track change over time";
        }
        if (assessment_type === "diagnostic assessment") {
          return "Comprehensive assessment to identify specific strengths and weaknesses";
        }
        
        return "Assessment used to guide instruction";
      },
      description: "Identifies key characteristics of different assessment types"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Formative = ongoing, guides instruction. Summative = end of period, evaluates learning. Single-subject = repeated measures, tracks individual change.",
    exampleSlotValues: {
      assessment_type: "formative assessment"
    }
  },

  // DBDM-S08: Progress Monitoring Protocol
  {
    templateId: "DBDM-T08",
    skillId: "DBDM-S08",
    templateType: "characteristic-identification",
    stem: "Which of the following is a characteristic of valid progress monitoring?",
    slots: {
      characteristic_type: {
        name: "characteristic_type",
        description: "What aspect of progress monitoring is being asked about",
        possibleValues: [
          "frequency",
          "alignment",
          "sensitivity",
          "administration"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { characteristic_type } = slotValues;
        
        if (characteristic_type === "frequency") {
          return "Measures are administered weekly or biweekly";
        }
        if (characteristic_type === "alignment") {
          return "Measures are aligned with the curriculum being taught";
        }
        if (characteristic_type === "sensitivity") {
          return "Measures are sensitive to small changes in student performance";
        }
        if (characteristic_type === "administration") {
          return "Measures are brief and can be administered quickly";
        }
        
        return "Measures are administered frequently and are curriculum-aligned";
      },
      description: "Identifies key characteristics of valid progress monitoring"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Valid progress monitoring requires frequent measurement, curriculum alignment, sensitivity to change, brief administration, standardized procedures, and graphed data.",
    exampleSlotValues: {
      characteristic_type: "frequency"
    }
  },

  // DBDM-S09: Universal Screening Purpose
  {
    templateId: "DBDM-T09",
    skillId: "DBDM-S09",
    templateType: "definition-recognition",
    stem: "The primary purpose of universal screening is to:",
    slots: {
      screening_aspect: {
        name: "screening_aspect",
        description: "What aspect of screening is being asked about",
        possibleValues: [
          "purpose",
          "timing",
          "administration",
          "interpretation"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        // Always returns that screening identifies risk, not diagnosis
        return "Identify students who are at risk and may need further assessment";
      },
      description: "Clarifies that screening identifies risk, not diagnosis"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Universal screening identifies students at risk. Screening is NOT diagnostic. Positive screen = needs comprehensive evaluation, not immediate intervention.",
    exampleSlotValues: {
      screening_aspect: "purpose"
    }
  },

  // DBDM-S10: Data-First Decision Making
  {
    templateId: "DBDM-T10",
    skillId: "DBDM-S10",
    templateType: "first-step-scenario",
    stem: "A school psychologist {role_context}. {stakeholder} informs the psychologist that {problem_description}. Which of the following steps should the school psychologist take first?",
    slots: {
      role_context: {
        name: "role_context",
        description: "The psychologist's role context",
        possibleValues: [
          "has recently been hired at an elementary school",
          "is new to a middle school",
          "is consulting with a high school",
          "is working at a district office"
        ]
      },
      stakeholder: {
        name: "stakeholder",
        description: "Who is reporting the problem",
        possibleValues: [
          "The principal",
          "A teacher",
          "The special education director",
          "A parent",
          "A school counselor"
        ]
      },
      problem_description: {
        name: "problem_description",
        description: "What problem is being reported",
        possibleValues: [
          "behavior referrals have increased",
          "reading scores have declined",
          "more students are being referred for ADHD evaluations",
          "suspension rates have increased",
          "attendance has decreased",
          "students are struggling with math computation"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        // ALWAYS review/analyze data first - this is the core rule
        return "Review and analyze available data related to the reported concern";
      },
      description: "Always returns 'review data first' - the correct answer always involves examining data before acting"
    },
    allowedDistractorPatterns: ["premature-action", "data-ignorance", "role-confusion"],
    keyPrinciple: "ALWAYS review/analyze existing data before taking action. First step is almost always data collection, review, or analysis. Never skip to intervention without assessment.",
    exampleSlotValues: {
      role_context: "has recently been hired at an elementary school",
      stakeholder: "The principal",
      problem_description: "behavior referrals have increased"
    }
  }
];

// Export as a map for easy lookup
export const domain1TemplateMap: Record<string, QuestionTemplate> = {};
domain1Templates.forEach(template => {
  domain1TemplateMap[template.templateId] = template;
});
