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
    allowedDistractorPatterns: ["special-ed-confusion"],
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
    allowedDistractorPatterns: ["tier-confusion"],
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
    allowedDistractorPatterns: ["outcome-focus"],
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
    allowedDistractorPatterns: ["component-confusion"],
    keyPrinciple: "School climate = Engagement (relationships, participation), Safety (physical/emotional), Environment (physical space, resources).",
    exampleSlotValues: {}
  }
];

export const domain5TemplateMap: Record<string, QuestionTemplate> = {};
domain5Templates.forEach(template => {
  domain5TemplateMap[template.templateId] = template;
});
