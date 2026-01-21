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
    allowedDistractorPatterns: ["design-confusion"],
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
    allowedDistractorPatterns: ["size-confusion"],
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
    allowedDistractorPatterns: ["type-ii-confusion"],
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
    allowedDistractorPatterns: ["direction-confusion", "strength-confusion"],
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
    allowedDistractorPatterns: ["anova-selection"],
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
    allowedDistractorPatterns: ["mean-confusion"],
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
    allowedDistractorPatterns: ["variable-confusion"],
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
    allowedDistractorPatterns: ["external-validity"],
    keyPrinciple: "Internal validity threats = history, maturation, attrition, selection. External validity = generalizability. Link specific factor to threat type.",
    exampleSlotValues: {}
  }
];

export const domain9TemplateMap: Record<string, QuestionTemplate> = {};
domain9Templates.forEach(template => {
  domain9TemplateMap[template.templateId] = template;
});
