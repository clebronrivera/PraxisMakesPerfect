// Domain 9 Templates - Question generation templates for Research & Program Evaluation skills

import { QuestionTemplate } from '../template-schema';

export const domain9Templates: QuestionTemplate[] = [
  // RES-S01: Single-Subject Design Recognition
  {
    templateId: "RES-T01",
    skillId: "RES-S01",
    templateType: "design-identification",
    stem: "A researcher collects baseline data (A), implements intervention (B), returns to baseline (A), then implements intervention again (B). This describes:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "A-B-A-B Reversal Design";
      },
      description: "A-B-A-B reversal design"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "A-B-A-B = baseline, intervention, return to baseline, intervention again. Multiple baseline = baseline across settings/behaviors, staggered intervention.",
    exampleSlotValues: {}
  },

  // RES-S03: Effect Size Interpretation
  {
    templateId: "RES-T02",
    skillId: "RES-S03",
    templateType: "interpretation",
    stem: "A Cohen's d value of 0.80 indicates:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Large effect size";
      },
      description: "Effect size interpretation"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "Cohen's d: small = 0.2, medium = 0.5, large = 0.8+. Effect size shows practical significance, not just statistical significance.",
    exampleSlotValues: {}
  },

  // RES-S05: Type I & Type II Errors
  {
    templateId: "RES-T03",
    skillId: "RES-S05",
    templateType: "definition-recognition",
    stem: "A Type I error occurs when:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "The null hypothesis is rejected when it is actually true";
      },
      description: "Type I error definition"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "Type I error = false positive, reject null when it's true. Type II error = false negative, fail to reject when null is false.",
    exampleSlotValues: {}
  },

  // RES-S06: Correlation Interpretation
  {
    templateId: "RES-T04",
    skillId: "RES-S06",
    templateType: "interpretation",
    stem: "A correlation coefficient of -0.85 indicates:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Strong negative relationship";
      },
      description: "Correlation interpretation"
    },
    allowedDistractorPatterns: ["similar-concept", "similar-concept"],
    keyPrinciple: "Correlation: -1 to +1. Closer to ±1 = stronger. Positive = variables increase together. Negative = variables move opposite. 0 = no relationship.",
    exampleSlotValues: {}
  },

  // NEW-9-StatisticalTests: Statistical Test Selection
  {
    templateId: "RES-T05",
    skillId: "NEW-9-StatisticalTests",
    templateType: "test-selection",
    stem: "To compare the means of two distinct groups, the appropriate statistical test is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Independent t-test";
      },
      description: "Two groups = t-test"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "2 groups → t-test. 3+ groups → ANOVA. Categorical data → Chi-square. Match test to research question and data type.",
    exampleSlotValues: {}
  },

  // NEW-9-DescriptiveStats: Descriptive Statistics
  {
    templateId: "RES-T06",
    skillId: "NEW-9-DescriptiveStats",
    templateType: "definition-recognition",
    stem: "The statistical measure that describes the spread or variability of scores around the mean is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Standard Deviation";
      },
      description: "Standard deviation measures spread"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "Mean/median/mode = central tendency. Range/variance/standard deviation = dispersion/spread. Know when to use each measure.",
    exampleSlotValues: {}
  },

  // NEW-9-Variables: Variable Identification
  {
    templateId: "RES-T07",
    skillId: "NEW-9-Variables",
    templateType: "variable-identification",
    stem: "In an experiment testing a reading intervention, the {variable_type} is:",
    slots: {
      variable_type: {
        name: "variable_type",
        description: "Which variable is being asked about",
        possibleValues: ["independent variable", "dependent variable"]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { variable_type } = slotValues;
        if (variable_type === "independent variable") return "The reading intervention (manipulated)";
        return "Reading achievement scores (measured outcome)";
      },
      description: "IV = manipulated, DV = measured"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "Independent Variable = manipulated (cause). Dependent Variable = measured outcome (effect). Identify cause-effect relationship.",
    exampleSlotValues: {
      variable_type: "independent variable"
    }
  },

  // NEW-9-ValidityThreats: Research Validity Threats
  {
    templateId: "RES-T08",
    skillId: "NEW-9-ValidityThreats",
    templateType: "threat-identification",
    stem: "A threat to internal validity where participants drop out of the study is called:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Attrition or Mortality";
      },
      description: "Attrition threat"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "Internal validity threats = history, maturation, attrition, selection. External validity = generalizability. Link specific factor to threat type.",
    exampleSlotValues: {}
  },

  // NEW-9-ImplementationFidelity: Implementation Fidelity
  {
    templateId: "RES-T10",
    skillId: "NEW-9-ImplementationFidelity",
    templateType: "best-selection",
    stem: "To ensure fidelity of implementation for a school-wide program, a school psychologist should:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Provide training, coaching, reminders, and ongoing monitoring to ensure consistent implementation";
      },
      description: "Fidelity requires support and monitoring"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Implementation fidelity = consistent, reliable implementation of program/intervention as designed. Fidelity strategies: training, coaching, prompts/reminders, checklists, observation, feedback. Reminders (e.g., emailing teachers) help ensure consistent implementation. Fidelity monitoring = ongoing checks to ensure implementation matches design.",
    exampleSlotValues: {}
  },

  // NEW-9-ProgramEvaluation: Program Evaluation
  {
    templateId: "RES-T11",
    skillId: "NEW-9-ProgramEvaluation",
    templateType: "best-selection",
    stem: "A school psychologist wants to evaluate the effectiveness of a {program_type}. What is the most comprehensive approach?",
    slots: {
      program_type: {
        name: "program_type",
        description: "Type of program",
        possibleValues: [
          "reading intervention program",
          "school-wide behavior program",
          "mental health program",
          "academic support program"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: () => {
        return "Collect outcome data, process data, stakeholder feedback, and compare to baseline or control groups";
      },
      description: "Comprehensive evaluation uses multiple data sources"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Program evaluation = systematic assessment of program effectiveness, outcomes, and impact. Evaluation purposes: determine if program works, identify areas for improvement, inform decision-making, demonstrate accountability. Evaluation methods: outcome data, process data, stakeholder feedback, comparison groups.",
    exampleSlotValues: {
      program_type: "reading intervention program"
    }
  },
  {
    templateId: "RES-T12",
    skillId: "NEW-9-ProgramEvaluation",
    templateType: "best-selection",
    stem: "A school psychologist is evaluating a {program_type}. To determine if the program is achieving its intended outcomes, the psychologist should primarily examine:",
    slots: {
      program_type: {
        name: "program_type",
        description: "Type of program",
        possibleValues: [
          "school-wide positive behavior support program",
          "tier 2 reading intervention",
          "social-emotional learning curriculum",
          "bullying prevention program"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { program_type } = slotValues;
        if (program_type.includes("behavior")) {
          return "Office discipline referrals, suspension rates, and behavior incident data";
        }
        if (program_type.includes("reading")) {
          return "Student reading achievement scores and progress monitoring data";
        }
        if (program_type.includes("social-emotional")) {
          return "Student self-report measures, teacher ratings of social skills, and behavioral observations";
        }
        if (program_type.includes("bullying")) {
          return "Bullying incident reports, student surveys, and school climate data";
        }
        return "Outcome measures that align with program goals and objectives";
      },
      description: "Matches evaluation measures to program outcomes"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch", "data-ignorance"],
    keyPrinciple: "Program evaluation requires measuring outcomes aligned with program goals. Outcome data = student achievement, behavior change, skill acquisition. Process data = implementation fidelity, participation rates. Both are needed for comprehensive evaluation.",
    exampleSlotValues: {
      program_type: "school-wide positive behavior support program"
    }
  },
  {
    templateId: "RES-T13",
    skillId: "NEW-9-ProgramEvaluation",
    templateType: "best-selection",
    stem: "The primary purpose of program evaluation in schools is to:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Determine program effectiveness, inform decision-making, and demonstrate accountability";
      },
      description: "Program evaluation purposes"
    },
    allowedDistractorPatterns: ["similar-concept", "incomplete-response"],
    keyPrinciple: "Program evaluation purposes: determine if program works (effectiveness), identify areas for improvement, inform decision-making (continue, modify, or discontinue), demonstrate accountability to stakeholders. Evaluation is systematic and data-driven.",
    exampleSlotValues: {}
  },
  {
    templateId: "RES-T14",
    skillId: "NEW-9-ProgramEvaluation",
    templateType: "first-step-scenario",
    stem: "Before implementing a program evaluation, a school psychologist should first:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Identify program goals and objectives, and determine what data will measure success";
      },
      description: "First step is defining goals and measures"
    },
    allowedDistractorPatterns: ["premature-action", "data-ignorance", "incomplete-response"],
    keyPrinciple: "Program evaluation steps: 1) Define program goals/objectives, 2) Identify evaluation questions, 3) Determine data sources and measures, 4) Collect baseline data, 5) Implement program, 6) Collect outcome data, 7) Analyze and report findings. Start with clear goals and measures.",
    exampleSlotValues: {}
  }
];

export const domain9TemplateMap: Record<string, QuestionTemplate> = {};
domain9Templates.forEach(template => {
  domain9TemplateMap[template.templateId] = template;
});
