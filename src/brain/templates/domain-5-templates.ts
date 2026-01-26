// Domain 5 Templates - Question generation templates for School-Wide Practices to Promote Learning skills

import { QuestionTemplate } from '../template-schema';

export const domain5Templates: QuestionTemplate[] = [
  // SWP-S01: RTI/MTSS Framework
  {
    templateId: "SWP-T01",
    skillId: "SWP-S01",
    templateType: "definition-recognition",
    stem: "Response to Intervention (RTI) is best described as:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "A multi-tiered system for providing increasingly intensive interventions";
      },
      description: "RTI definition"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "RTI = multi-tiered prevention framework. Tier 1 = universal, Tier 2 = targeted, Tier 3 = intensive. Not special education.",
    exampleSlotValues: {}
  },

  // SWP-S02: PBIS Principles
  {
    templateId: "SWP-T02",
    skillId: "SWP-S02",
    templateType: "principle-identification",
    stem: "The fundamental principle of Positive Behavior Interventions and Supports (PBIS) is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Changing the environment and teaching new skills rather than using punishment";
      },
      description: "PBIS is proactive and teaching-focused"
    },
    allowedDistractorPatterns: ["punishment-focus"],
    keyPrinciple: "PBIS = proactive, teaches expectations, reinforces desired behaviors, changes environment. Focus on teaching, not punishment.",
    exampleSlotValues: {}
  },

  // SWP-S03: Tier 1 Universal Practices
  {
    templateId: "SWP-T03",
    skillId: "SWP-S03",
    templateType: "best-selection",
    stem: "Which of the following is an example of a Tier 1 (universal) intervention?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "School-wide assembly teaching behavioral expectations";
      },
      description: "Tier 1 = universal, all students"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "Tier 1 = school-wide, all students, teaches expectations, acknowledges desired behaviors. Not individual counseling or targeted groups.",
    exampleSlotValues: {}
  },

  // SWP-S04: Implementation Fidelity
  {
    templateId: "SWP-T04",
    skillId: "SWP-S04",
    templateType: "characteristic-identification",
    stem: "What is the best sign of successful Tier 1 PBIS implementation?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Consistent teaching of expectations and regular data collection";
      },
      description: "Fidelity indicators"
    },
    allowedDistractorPatterns: ["context-mismatch"],
    keyPrinciple: "Successful implementation = consistent teaching, regular data collection, clear decision rules, staff buy-in. Fidelity before outcomes.",
    exampleSlotValues: {}
  },

  // NEW-5-SchoolClimate: School Climate Components
  {
    templateId: "SWP-T05",
    skillId: "NEW-5-SchoolClimate",
    templateType: "definition-recognition",
    stem: "According to NASP, the three main components of school climate are:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Engagement, Safety, and Environment";
      },
      description: "Three main components"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "School climate = Engagement (relationships, participation), Safety (physical/emotional), Environment (physical space, resources).",
    exampleSlotValues: {}
  },

  // SWP-T06: Tier Decision Based on Data
  {
    templateId: "SWP-T06",
    skillId: "SWP-S01",
    templateType: "data-interpretation",
    stem: "In an RTI/MTSS system, {data_pattern} of students are responding to Tier 1 interventions. What should happen next?",
    slots: {
      data_pattern: {
        name: "data_pattern",
        description: "Response rate to Tier 1",
        possibleValues: [
          "80%",
          "60%",
          "less than 50%",
          "approximately 75%",
          "approximately 85%",
          "approximately 55%",
          "approximately 45%"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { data_pattern } = slotValues;
        const percent = parseInt(data_pattern);
        if (percent >= 80) {
          return "Continue Tier 1 with fidelity monitoring";
        }
        if (percent >= 60 && percent < 80) {
          return "Review Tier 1 implementation and consider enhancements";
        }
        if (percent < 50) {
          return "Move non-responding students to Tier 2 interventions";
        }
        return "Review data and adjust Tier 1 implementation";
      },
      description: "Tier decisions based on response data"
    },
    allowedDistractorPatterns: ["premature-action", "data-ignorance"],
    keyPrinciple: "RTI decision rules: 80%+ responding = continue Tier 1. 60-80% = review implementation. <60% = move to Tier 2. Data drives decisions.",
    exampleSlotValues: {
      data_pattern: "60%"
    }
  },

  // SWP-T07: Fidelity Problem Identification
  {
    templateId: "SWP-T07",
    skillId: "SWP-S04",
    templateType: "problem-identification",
    stem: "A school's PBIS data shows {data_pattern} of students meeting expectations, but {fidelity_issue} is observed. What is the most likely problem?",
    slots: {
      data_pattern: {
        name: "data_pattern",
        description: "Response rate",
        possibleValues: [
          "80%",
          "60%",
          "less than 50%",
          "approximately 75%",
          "approximately 55%"
        ]
      },
      fidelity_issue: {
        name: "fidelity_issue",
        description: "Fidelity problem observed",
        possibleValues: [
          "inconsistent teaching of expectations",
          "irregular data collection",
          "lack of staff buy-in",
          "inconsistent reinforcement",
          "missing decision rules",
          "incomplete implementation"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { fidelity_issue } = slotValues;
        return `Implementation fidelity issue: ${fidelity_issue}`;
      },
      description: "Fidelity problems affect outcomes"
    },
    allowedDistractorPatterns: ["data-ignorance", "premature-action"],
    keyPrinciple: "Fidelity before outcomes. Check: consistent teaching, regular data collection, clear decision rules, staff buy-in. Low fidelity = poor outcomes regardless of intervention quality.",
    exampleSlotValues: {
      data_pattern: "less than 50%",
      fidelity_issue: "inconsistent teaching of expectations"
    }
  },

  // NEW-5-EducationalPolicies: Educational Policies
  {
    templateId: "SWP-T10",
    skillId: "NEW-5-EducationalPolicies",
    templateType: "best-selection",
    stem: "A school is considering {policy_type} for students who {student_situation}. What should the school psychologist recommend?",
    slots: {
      policy_type: {
        name: "policy_type",
        description: "Type of educational policy",
        possibleValues: [
          "grade retention",
          "ability tracking",
          "grade retention based on immaturity",
          "tracking students into different academic programs"
        ]
      },
      student_situation: {
        name: "student_situation",
        description: "The student situation",
        possibleValues: [
          "are performing below grade level",
          "show different ability levels",
          "are immature for their grade",
          "have varying academic needs"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { policy_type } = slotValues;
        if (policy_type.includes("retention")) {
          return "Question the effectiveness of retention and consider evidence-based alternatives";
        }
        return "Consider the limitations of tracking and ensure equal access to opportunities";
      },
      description: "Recognizes limitations of educational policies"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Educational policies like retention and tracking have limited effectiveness and potential negative effects. Policies should be evidence-based and consider student needs. Research questions retention/tracking effectiveness.",
    exampleSlotValues: {
      policy_type: "grade retention",
      student_situation: "are performing below grade level"
    }
  },

  // NEW-5-EBPImportance: Evidence-Based Practices Importance
  {
    templateId: "SWP-T11",
    skillId: "NEW-5-EBPImportance",
    templateType: "best-selection",
    stem: "Which of the following best describes the importance of evidence-based practices (EBP) in school psychology?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "EBP ensures effectiveness, avoids harmful practices, and promotes best outcomes for students";
      },
      description: "EBP importance"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Evidence-based practice (EBP) = interventions with empirical research support. Importance: ensures effectiveness, avoids harmful practices, promotes best outcomes. Supported EBPs: CBT for internalizing problems, PBIS for behavior, explicit instruction for academics.",
    exampleSlotValues: {}
  }
];

export const domain5TemplateMap: Record<string, QuestionTemplate> = {};
domain5Templates.forEach(template => {
  domain5TemplateMap[template.templateId] = template;
});
