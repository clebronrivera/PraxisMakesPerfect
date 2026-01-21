// Domain 7 Templates - Question generation templates for Family-School Collaboration Services skills

import { QuestionTemplate } from '../template-schema';

export const domain7Templates: QuestionTemplate[] = [
  // FSC-S01: Partnership Goals
  {
    templateId: "FSC-T01",
    skillId: "FSC-S01",
    templateType: "goal-identification",
    stem: "The primary goal of family-school partnerships is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Shared responsibility for student learning and success";
      },
      description: "Partnership goal"
    },
    allowedDistractorPatterns: ["one-way-communication"],
    keyPrinciple: "Partnership goal = shared responsibility, collaboration, mutual respect, student success focus. Not one-way communication.",
    exampleSlotValues: {}
  },

  // FSC-S03: Communication Strategies
  {
    templateId: "FSC-T02",
    skillId: "FSC-S03",
    templateType: "best-selection",
    stem: "The best way to present assessment results to parents is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Using jargon-free language and focusing on strengths and needs";
      },
      description: "Effective communication with families"
    },
    allowedDistractorPatterns: ["jargon-heavy", "deficit-focus"],
    keyPrinciple: "Effective communication = welcoming environment, two-way communication, jargon-free language, focus on strengths and needs, cultural sensitivity.",
    exampleSlotValues: {}
  },

  // FSC-S04: Cultural Competence
  {
    templateId: "FSC-T03",
    skillId: "FSC-S04",
    templateType: "best-selection",
    stem: "When working with a family from a collectivist culture, it is important to:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Respect the role of extended family members in decision-making";
      },
      description: "Cultural competence with collectivist cultures"
    },
    allowedDistractorPatterns: ["western-assumptions"],
    keyPrinciple: "Cultural competence = respect extended family roles, collectivist decision-making, cultural values, avoid assumptions.",
    exampleSlotValues: {}
  },

  // NEW-7-BarriersToEngagement: Barriers to Engagement
  {
    templateId: "FSC-T04",
    skillId: "NEW-7-BarriersToEngagement",
    templateType: "barrier-identification",
    stem: "The most significant barrier to parental involvement for low-SES families is typically:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Logistical issues such as transportation and work schedules, not lack of interest";
      },
      description: "Barriers are usually systemic, not attitudinal"
    },
    allowedDistractorPatterns: ["lack-of-care"],
    keyPrinciple: "Barriers to involvement = logistical (transportation, schedules), language, systemic. Not lack of care. Address barriers, don't blame families.",
    exampleSlotValues: {}
  },

  // NEW-7-FamilySystems: Family Systems Theory
  {
    templateId: "FSC-T05",
    skillId: "NEW-7-FamilySystems",
    templateType: "principle-identification",
    stem: "A core concept of Family Systems Theory is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Events affecting one family member affect the whole system";
      },
      description: "Family systems interdependence"
    },
    allowedDistractorPatterns: ["individual-focus"],
    keyPrinciple: "Family systems = interdependence, circular causality, homeostasis, boundaries. Events affect whole system, not just individual.",
    exampleSlotValues: {}
  }
];

export const domain7TemplateMap: Record<string, QuestionTemplate> = {};
domain7Templates.forEach(template => {
  domain7TemplateMap[template.templateId] = template;
});
